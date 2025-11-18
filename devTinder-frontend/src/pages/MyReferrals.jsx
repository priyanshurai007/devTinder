import { useEffect, useState } from "react";
import axios from "../utils/axiosInstance";
import { BASE_URL } from "../utils/constants";
import { socket } from "../utils/socket";
import { useSelector } from "react-redux";

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
      setSent(res.data?.sent || []);
      setReceived(res.data?.received || []);
    } catch (err) {
      console.error("Failed to fetch referrals:", err);
      setError("Failed to load referrals. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const currentUser = useSelector((store) => store.user) || {};

  useEffect(() => {
    fetchReferrals();

    // subscribe to real-time referral events
    const createdHandler = ({ referral }) => {
      // if current user is the receiver, add to received (avoid duplicates)
      if (referral.toUserId && referral.toUserId._id && String(referral.toUserId._id) === String(currentUser._id)) {
        setReceived((r) => {
          const exists = (r || []).some((it) => it._id === referral._id);
          return exists ? r : [referral, ...(r || [])];
        });
      }
    };

    const updatedHandler = ({ referral }) => {
      // update sent and received lists if present
      setSent((s) => (s || []).map((it) => (it._id === referral._id ? referral : it)));
      setReceived((r) => (r || []).map((it) => (it._id === referral._id ? referral : it)));
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
      await axios.post(`${BASE_URL}/referral/review/${id}/${action}`, {}, { withCredentials: true });
      await fetchReferrals();
    } catch (err) {
      console.error("Failed to review referral:", err);
      setError("Unable to update referral. Try again.");
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
              <p>To: {r.toUserId?.firstName ?? 'Unknown'} {r.toUserId?.lastName ? ` ${r.toUserId.lastName}` : ''} | <b>{r.company}</b> - {r.role}</p>
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
              <p>From: {r.fromUserId?.firstName ?? 'Unknown'} {r.fromUserId?.lastName ? ` ${r.fromUserId.lastName}` : ''} | <b>{r.company}</b> - {r.role}</p>
              <p>Status: <span className="font-bold">{r.status}</span></p>
              {r.status === "pending" && (
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
