import { useEffect, useState } from "react";
import axios from "axios";
import { BASE_URL } from "../utils/constants";

const MyReferrals = () => {
  const [sent, setSent] = useState([]);
  const [received, setReceived] = useState([]);

  const fetchReferrals = async () => {
    const res = await axios.get(`${BASE_URL}/referral/my-requests`, { withCredentials: true });
    setSent(res.data.sent || []);
    setReceived(res.data.received || []);
  };

  useEffect(() => {
    fetchReferrals();
  }, []);

  const handleReview = async (id, action) => {
    await axios.post(`${BASE_URL}/referral/review/${id}/${action}`, {}, { withCredentials: true });
    fetchReferrals();
  };

  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-bold text-center text-green-400">Referral Dashboard</h1>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Sent Referrals */}
        <div>
          <h2 className="mb-2 text-xl font-semibold text-blue-500">Sent Referrals</h2>
          {sent.map((r) => (
            <div key={r._id} className="p-4 mb-2 border rounded bg-base-200">
              <p>To: {r.toUserId.firstName} | <b>{r.company}</b> - {r.role}</p>
              <p>Status: <span className="font-bold">{r.status}</span></p>
              {r.message && <p className="text-sm italic">"{r.message}"</p>}
            </div>
          ))}
        </div>

        {/* Received Referrals */}
        <div>
          <h2 className="mb-2 text-xl font-semibold text-purple-500">Received Referrals</h2>
          {received.map((r) => (
            <div key={r._id} className="p-4 mb-2 border rounded bg-base-200">
              <p>From: {r.fromUserId.firstName} | <b>{r.company}</b> - {r.role}</p>
              <p>Status: <span className="font-bold">{r.status}</span></p>
              {r.status === "pending" && (
                <div className="flex gap-2 mt-2">
                  <button className="btn btn-sm btn-success" onClick={() => handleReview(r._id, "accepted")}>Accept</button>
                  <button className="btn btn-sm btn-error" onClick={() => handleReview(r._id, "rejected")}>Reject</button>
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
