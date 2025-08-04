import { useState } from "react";
import { BASE_URL } from "../utils/constants";
import axios from "axios";

const ReferralModal = ({ toUser, onClose }) => {
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [message, setMessage] = useState("");

  const handleSend = async () => {
    try {
      await axios.post(`${BASE_URL}/referral/send`, {
        toUserId: toUser._id,
        company,
        role,
        message,
      }, { withCredentials: true });

      alert("Referral request sent!");
      onClose();
    } catch (err) {
      alert(err.response?.data || "Failed to send referral");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="p-6 bg-white rounded shadow-md w-96">
        <h2 className="text-xl font-bold">Request Referral</h2>
        <p className="mb-2 text-gray-500">{toUser.firstName} {toUser.lastName}</p>

        <input className="w-full my-2 input input-bordered" placeholder="Company" value={company} onChange={(e) => setCompany(e.target.value)} />
        <input className="w-full my-2 input input-bordered" placeholder="Role" value={role} onChange={(e) => setRole(e.target.value)} />
        <textarea className="w-full my-2 textarea textarea-bordered" placeholder="Message (optional)" value={message} onChange={(e) => setMessage(e.target.value)} />

        <div className="flex justify-end gap-2 mt-4">
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSend}>Send</button>
        </div>
      </div>
    </div>
  );
};

export default ReferralModal;
