import axios from "../utils/axiosInstance";
import React, { useState, useEffect } from "react";
import { BASE_URL } from "../utils/constants";
import { useDispatch, useSelector } from "react-redux";
import { addRequests, removeRequest } from "../utils/requestSlice";
import { useNavigate } from "react-router-dom";

const Requests = () => {
  const dispatch = useDispatch();
  const requests = useSelector((store) => store.request) || [];
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [tab, setTab] = useState("received"); // 'received' or 'sent'
  const [sentRequests, setSentRequests] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const reviewRequest = async (status, _id) => {
    setProcessingId(_id);
    setActionType(status);
    try {
      await axios.post(`/request/review/${status}/${_id}`);
      dispatch(removeRequest(_id));
      // refresh sent list in case of status change
      fetchSentRequests(1);
    } catch (err) {
      const errorMsg = err?.response?.data?.message || err.message || "Failed to review request";
      console.error("Review request error:", errorMsg);
      setError(errorMsg);
      setTimeout(() => setError(""), 3000);
    } finally {
      setProcessingId(null);
      setActionType(null);
    }
  };

  const cancelSentRequest = async (requestId) => {
    setProcessingId(requestId);
    setActionType("cancel");
    try {
      await axios.post(`/request/cancel/${requestId}`);
      setSentRequests((s) => s.filter((r) => r._id !== requestId));
    } catch (err) {
      const errorMsg = err?.response?.data?.message || "Failed to cancel request";
      setError(errorMsg);
      setTimeout(() => setError(""), 3000);
    } finally {
      setProcessingId(null);
      setActionType(null);
    }
  };

  const fetchRequests = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`/user/requests/recieved?page=${page}&limit=${limit}`);
      const items = res.data?.connectionRequests || [];
      if (page === 1) dispatch(addRequests(items));
      else dispatch(addRequests([...(requests || []), ...items]));
      setTotalPages(res.data.pages || 1);
    } catch (err) {
      const errorMsg = err?.response?.data?.message || "Failed to load requests";
      console.error("Fetch requests error:", err);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const fetchSentRequests = async (pageNum = 1) => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`/user/requests/sent?page=${pageNum}&limit=${limit}`);
      const items = res.data?.sentRequests || [];
      if (pageNum === 1) setSentRequests(items);
      else setSentRequests((s) => [...(s || []), ...items]);
      setTotalPages(res.data.pages || 1);
    } catch (err) {
      console.error("Fetch sent requests error:", err);
      setError(err?.response?.data?.message || "Failed to load sent requests");
    } finally {
      setLoading(false);
    }
  };

  const navigate = useNavigate();

  useEffect(() => {
    if (tab === "received") fetchRequests();
    else fetchSentRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    // when tab changes, reset page and reload
    setPage(1);
    if (tab === "received") fetchRequests();
    else fetchSentRequests(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const loadMoreButton = page < totalPages && (
    <div className="flex justify-center my-6">
      <button className="btn btn-outline" onClick={() => setPage((p) => p + 1)}>Load More</button>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="mb-4 loading loading-spinner loading-lg text-primary"></div>
          <p className="text-gray-400">Loading requests...</p>
        </div>
      </div>
    );
  }

  if (error && !loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="p-6 text-center rounded-lg shadow-lg bg-base-200">
          <h2 className="mb-2 text-xl font-bold text-red-500">❌ Error</h2>
          <p className="mb-4 text-gray-300">{error}</p>
          <button onClick={fetchRequests} className="btn btn-primary">Try Again</button>
        </div>
      </div>
    );
  }

  if ((tab === "received" && (!requests || requests.length === 0)) || (tab === "sent" && (!sentRequests || sentRequests.length === 0))) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="max-w-2xl p-8 text-center rounded-lg shadow-lg bg-base-200">
          <div className="mb-6">
            <button className={`btn ${tab === 'received' ? 'btn-primary' : 'btn-ghost'} mr-2`} onClick={() => setTab('received')}>Received</button>
            <button className={`btn ${tab === 'sent' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab('sent')}>Sent</button>
          </div>
          <h2 className="mb-2 text-2xl font-bold text-gray-300">No {tab === 'received' ? 'Incoming' : 'Sent'} Requests</h2>
          <p className="mb-6 text-gray-400">{tab === 'received' ? "Requests sent to you will appear here." : "Requests you sent will appear here."}</p>
          <div className="flex justify-center gap-2">
            <button onClick={() => { if (tab === 'received') fetchRequests(); else fetchSentRequests(); }} className="btn btn-outline">Refresh</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="my-10">
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-4xl font-bold text-white">Connection Requests</h1>
        <div className="mt-2">
          <button className={`btn ${tab === 'received' ? 'btn-primary' : 'btn-ghost'} mr-2`} onClick={() => setTab('received')}>Received ({requests.length})</button>
          <button className={`btn ${tab === 'sent' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab('sent')}>Sent ({sentRequests.length})</button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 px-4 mx-auto md:grid-cols-2 lg:grid-cols-3 max-w-7xl">
        {(tab === 'received' ? (requests || []) : sentRequests).map((request) => {
          const isReceived = tab === 'received';
          const item = isReceived ? request.fromUserId || {} : (request.toUserId || {});
          const isProcessing = processingId === request._id;

          return (
            <div key={request._id} className="p-4 transition rounded-lg shadow-lg card bg-base-300 hover:shadow-xl">
              <div className="flex justify-center mb-3">
                <img alt="profile" className="object-cover w-20 h-20 border-2 rounded-full border-primary" src={item.photoURL} />
              </div>

              <div className="mb-4 text-center">
                <h2 className="text-lg font-bold text-white">{item.firstName} {item.lastName}</h2>
                {item.age && item.gender && <p className="text-sm text-gray-400">{item.age} • {item.gender}</p>}
                {item.about && <p className="mt-2 text-sm text-gray-300 line-clamp-2">{item.about}</p>}
              </div>

              <div className="flex gap-2">
                <button className="btn btn-sm btn-ghost" onClick={() => navigate(`/profile/${item._id}`)}>View</button>
                {isReceived ? (
                  (request.status && (request.status === "pending" || request.status === "intrested")) ? (
                    <>
                      <button className={`btn btn-sm btn-ghost flex-1 ${isProcessing && actionType === "declined" ? "btn-disabled" : ""}`} onClick={() => reviewRequest("declined", request._id)} disabled={isProcessing}>
                        {isProcessing && actionType === "declined" ? <span className="loading loading-spinner loading-xs"></span> : "Decline"}
                      </button>
                      <button className={`btn btn-sm btn-primary flex-1 ${isProcessing && actionType === "accepted" ? "btn-disabled" : ""}`} onClick={() => reviewRequest("accepted", request._id)} disabled={isProcessing}>
                        {isProcessing && actionType === "accepted" ? <span className="loading loading-spinner loading-xs"></span> : "Accept"}
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center justify-center w-full"><span className="badge badge-lg">{request.status ? request.status.charAt(0).toUpperCase() + request.status.slice(1) : 'Unknown'}</span></div>
                  )
                ) : (
                  <>
                    <div className="flex-1"><span className="badge">{request.status ? request.status.charAt(0).toUpperCase() + request.status.slice(1) : 'Pending'}</span></div>
                    {(request.status && (request.status === 'pending' || request.status === 'intrested')) && (
                      <button className="btn btn-sm btn-ghost" onClick={() => cancelSentRequest(request._id)} disabled={isProcessing}>{isProcessing && actionType === 'cancel' ? <span className="loading loading-spinner loading-xs"></span> : 'Cancel'}</button>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {loadMoreButton}
    </div>
  );
};

export default Requests;
