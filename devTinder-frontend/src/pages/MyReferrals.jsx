import { useEffect, useState } from "react";
import axios from "../utils/axiosInstance";
import { BASE_URL } from "../utils/constants";
import { socket } from "../utils/socket";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

const MyReferrals = () => {
  const [sent, setSent] = useState([]);
  const [received, setReceived] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState(null);

  const fetchReferrals = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${BASE_URL}/referral/my-requests`, { withCredentials: true });
      // enforce one-directional visibility: only keep referrals where the
      // current user is actually the sender (for sent) or the receiver (for received)
      const myId = String(currentUser._id || "");
      let sentList = res.data?.sent || [];
      let receivedList = res.data?.received || [];

      const normalizeId = (val) => (val && val._id ? String(val._id) : String(val || ""));

      sentList = (sentList || []).filter((it) => normalizeId(it.fromUserId) === myId);
      receivedList = (receivedList || []).filter((it) => normalizeId(it.toUserId) === myId);

      setSent(sentList);
      setReceived(receivedList);
    } catch (err) {
      console.error("Failed to fetch referrals:", err);
      setError("Failed to load referrals. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const currentUser = useSelector((store) => store.user) || {};
  const navigate = useNavigate();

  const getPersonId = (person) => {
    if (!person) return null;
    return person._id ? String(person._id) : String(person);
  };

  const getPersonDisplayName = (person) => {
    if (!person) return "Unknown";
    if (typeof person === "string") return `User ${person.slice(0, 6)}`;
    const first = person.firstName || "";
    const last = person.lastName || "";
    const name = `${first} ${last}`.trim();
    return name || (person.email ? person.email : "Unknown");
  };

  useEffect(() => {
    fetchReferrals();

    // subscribe to real-time referral events
    const createdHandler = ({ referral }) => {
      const normalizeId = (val) => (val && val._id ? String(val._id) : String(val || ""));
      const toId = normalizeId(referral.toUserId);
      const fromId = normalizeId(referral.fromUserId);
      const myId = String(currentUser._id || "");

      // If current user is the receiver, add to received
      if (toId === myId) {
        setReceived((r) => {
          const exists = (r || []).some((it) => String(it._id) === String(referral._id));
          return exists ? r : [referral, ...(r || [])];
        });
      }

      // If current user is the sender, add to sent
      if (fromId === myId) {
        setSent((s) => {
          const exists = (s || []).some((it) => String(it._id) === String(referral._id));
          return exists ? s : [referral, ...(s || [])];
        });
      }
    };

    const updatedHandler = ({ referral }) => {
      const normalizeId = (val) => (val && val._id ? String(val._id) : String(val || ""));
      const toId = normalizeId(referral.toUserId);
      const fromId = normalizeId(referral.fromUserId);
      const myId = String(currentUser._id || "");

      // update sent if we're the sender
      if (fromId === myId) {
        setSent((s) => (s || []).map((it) => (String(it._id) === String(referral._id) ? referral : it)));
      }

      // update received if we're the receiver
      if (toId === myId) {
        setReceived((r) => (r || []).map((it) => (String(it._id) === String(referral._id) ? referral : it)));
      }
    };

    try {
      socket.on('referralCreated', createdHandler);
      socket.on('referralUpdated', updatedHandler);
    } catch (e) {}

    return () => {
      try {
        socket.off('referralCreated', createdHandler);
        socket.off('referralUpdated', updatedHandler);
      } catch (e) {}
    };
  }, [currentUser._id]);

  const handleReview = async (id, action) => {
    setProcessingId(id);
    setError("");
    try {
      // ensure current user is still the recipient locally before sending request
      const findLocal = (received || []).find((it) => String(it._id) === String(id));
      const normalizeId = (val) => (val && val._id ? String(val._id) : String(val || ""));
      const recipientId = findLocal ? normalizeId(findLocal.toUserId) : null;
      const myId = String(currentUser._id || "");
      if (!recipientId || recipientId !== myId) {
        setError("You are not authorized to review this referral (not the recipient)");
        setProcessingId(null);
        return;
      }

      await axios.post(`${BASE_URL}/referral/review/${id}/${action}`, {}, { withCredentials: true });
      await fetchReferrals();
    } catch (err) {
      console.error("Failed to review referral:", err);
      const respMsg = err?.response?.data?.message;
      if (err?.response?.status === 403) {
        setError(respMsg || "Forbidden: you cannot review this referral");
      } else {
        setError(respMsg || "Unable to update referral. Try again.");
      }
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-bold text-center text-green-400">Referral Dashboard</h1>

      {loading && <div className="text-center text-sm text-muted">Loading referrals...</div>}
      {error && <div className="text-center text-sm text-error mb-4">{error}</div>}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Sent Referrals */}
        <div>
          <h2 className="mb-2 text-xl font-semibold text-blue-500">Sent Referrals</h2>
          {sent.length === 0 && <p className="text-sm text-muted">You haven't sent any referrals yet.</p>}
          {sent.map((r) => (
            <div key={r._id} className="p-4 mb-2 border rounded bg-base-200">
              <p>
                To: <button className="link" onClick={() => navigate(`/profile/${getPersonId(r.toUserId)}`)}>{getPersonDisplayName(r.toUserId)}</button>
                {" "}| <b>{r.company}</b> - {r.role}
              </p>
              <p>Status: <span className="font-bold">{r.status}</span></p>
              {r.message && <p className="text-sm italic">"{r.message}"</p>}
            </div>
          ))}
        </div>

        {/* Received Referrals */}
        <div>
          <h2 className="mb-2 text-xl font-semibold text-purple-500">Received Referrals</h2>
          {received.length === 0 && <p className="text-sm text-muted">No referral requests received.</p>}
          {received.map((r) => (
            <div key={r._id} className="p-4 mb-2 border rounded bg-base-200">
              <p>
                From: <button className="link" onClick={() => navigate(`/profile/${getPersonId(r.fromUserId)}`)}>{getPersonDisplayName(r.fromUserId)}</button>
                {" "}| <b>{r.company}</b> - {r.role}
              </p>
              <p>Status: <span className="font-bold">{r.status}</span></p>
              {r.status === "pending" && String(currentUser._id) === String(r.toUserId?._id || r.toUserId) && (
                <div className="flex gap-2 mt-2">
                  <button
                    className="btn btn-sm btn-success"
                    onClick={() => handleReview(r._id, "accepted")}
                    disabled={processingId === r._id}
                    aria-disabled={processingId === r._id}
                  >
                    {processingId === r._id ? 'Processing...' : 'Accept'}
                  </button>
                  <button
                    className="btn btn-sm btn-error"
                    onClick={() => handleReview(r._id, "rejected")}
                    disabled={processingId === r._id}
                    aria-disabled={processingId === r._id}
                  >
                    {processingId === r._id ? 'Processing...' : 'Reject'}
                  </button>
                </div>
              )}
              {r.message && <p className="text-sm italic">"{r.message}"</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MyReferrals;
