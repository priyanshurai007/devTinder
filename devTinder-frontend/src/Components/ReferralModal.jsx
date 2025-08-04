import { useState } from "react";
import { BASE_URL } from "../utils/constants";
import axios from "axios";

// Helper: API call to generate message
const generateMessage = async ({ company, role }) => {
  const res = await axios.post(
    `${BASE_URL}/referral/generate-message`,
    { company, role },
    { withCredentials: true }
  );
  return res.data.message;
};

const ReferralModal = ({ toUser, onClose }) => {
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [message, setMessage] = useState("");
  const [autoLoading, setAutoLoading] = useState(false);

  const handleGenerate = async () => {
    setAutoLoading(true);
    try {
      const msg = await generateMessage({ company, role });
      setMessage(msg);
    } catch (err) {
      alert("⚠️ Failed to generate message");
    } finally {
      setAutoLoading(false);
    }
  };

  const handleSend = async () => {
    try {
      await axios.post(
        `${BASE_URL}/referral/send`,
        {
          toUserId: toUser._id,
          company,
          role,
          message,
        },
        { withCredentials: true }
      );
      alert("✅ Referral request sent!");
      onClose();
    } catch (err) {
      alert(err.response?.data || "❌ Failed to send referral");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="p-6 bg-white rounded-lg shadow-lg w-96">
        <h2 className="mb-1 text-xl font-bold">Request Referral</h2>
        <p className="mb-4 text-sm text-gray-600">
          Sending to <strong>{toUser.firstName} {toUser.lastName}</strong>
        </p>

        <input
          className="w-full mb-3 input input-bordered"
          placeholder="Company (e.g. Amazon)"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
        />

        <input
          className="w-full mb-3 input input-bordered"
          placeholder="Role (e.g. SDE Intern)"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        />

        <div className="flex items-center justify-between mb-1">
          <label className="text-sm font-medium text-gray-700">Message</label>
          <button
            type="button"
            className="text-xs btn btn-sm btn-info"
            onClick={handleGenerate}
            disabled={!company || !role || autoLoading}
          >
            {autoLoading ? "Generating..." : "Generate Message"}
          </button>
        </div>

        <textarea
          className="w-full mb-3 textarea textarea-bordered"
          rows={5}
          placeholder="Include a short, polite referral message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        <div className="flex justify-end gap-2 mt-2">
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={handleSend}
            disabled={!company || !role}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReferralModal;
