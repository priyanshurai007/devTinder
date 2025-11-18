import { useState } from "react";
import { BASE_URL } from "../utils/constants";
import axios from "../utils/axiosInstance";

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
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleGenerate = async () => {
    setError("");
    if (!company.trim() || !role.trim()) {
      setError("Please provide both company and role to generate a message.");
      return;
    }
    setAutoLoading(true);
    try {
      const msg = await generateMessage({ company: company.trim(), role: role.trim() });
      setMessage(msg || "");
    } catch (err) {
      const errorMsg = err?.response?.data?.message || "Failed to generate message. Try again.";
      setError(errorMsg);
    } finally {
      setAutoLoading(false);
    }
  };

  const handleSend = async () => {
    setError("");
    if (!company.trim() || !role.trim()) {
      setError("Company and role are required.");
      return;
    }
    setSending(true);
    try {
      await axios.post(
        `${BASE_URL}/referral/send`,
        {
          toUserId: toUser._id,
          company: company.trim(),
          role: role.trim(),
          message: message.trim(),
        },
        { withCredentials: true }
      );
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 2000);
    } catch (err) {
      const errorMsg = err?.response?.data?.message || "Failed to send referral request.";
      setError(errorMsg);
    } finally {
      setSending(false);
    }
  };

  // Close when clicking on backdrop
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={handleBackdropClick}
      aria-modal="true"
      role="dialog"
    >
      <div className="p-6 bg-base-200 rounded-lg shadow-2xl w-96" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-1 text-2xl font-bold text-green-400">🔗 Request Referral</h2>
        <p className="mb-4 text-sm text-gray-400">
          Ask <strong className="text-white">{toUser?.firstName} {toUser?.lastName}</strong> for a referral
        </p>

        {/* Success Message */}
        {success && (
          <div className="p-3 mb-4 bg-green-900 border border-green-600 rounded">
            <p className="text-green-300">✅ Referral request sent successfully!</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="p-3 mb-4 bg-red-900 border border-red-600 rounded">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* Company Input */}
        <div className="mb-3 form-control">
          <label className="label">
            <span className="label-text text-sm font-medium">Company</span>
          </label>
          <input
            className="w-full input input-bordered input-sm"
            placeholder="e.g., Amazon"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            disabled={sending || autoLoading}
            aria-label="Company"
          />
        </div>

        {/* Role Input */}
        <div className="mb-3 form-control">
          <label className="label">
            <span className="label-text text-sm font-medium">Position</span>
          </label>
          <input
            className="w-full input input-bordered input-sm"
            placeholder="e.g., SDE Intern"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            disabled={sending || autoLoading}
            aria-label="Role"
          />
        </div>

        {/* Message Input */}
        <div className="mb-3 form-control">
          <div className="flex items-center justify-between mb-2">
            <label className="label">
              <span className="label-text text-sm font-medium">Message</span>
            </label>
            <button
              type="button"
              className="text-xs btn btn-sm btn-outline btn-info"
              onClick={handleGenerate}
              disabled={!company.trim() || !role.trim() || autoLoading || sending}
              aria-disabled={!company.trim() || !role.trim() || autoLoading || sending}
              title="Generate a message using AI"
            >
              {autoLoading ? (
                <>
                  <span className="loading loading-spinner loading-xs"></span>
                  Generating...
                </>
              ) : (
                "✨ Auto-Generate"
              )}
            </button>
          </div>
          <textarea
            className="w-full textarea textarea-bordered textarea-sm"
            rows={4}
            placeholder="Write a polite referral message (optional)"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={sending || autoLoading}
            aria-label="Message"
          />
          <label className="label">
            <span className="label-text-alt text-gray-400">{message.length}/500 characters</span>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 mt-4">
          <button
            className="btn btn-outline btn-sm"
            onClick={onClose}
            disabled={sending}
          >
            Cancel
          </button>
          <button
            className="btn btn-success btn-sm"
            onClick={handleSend}
            disabled={!company.trim() || !role.trim() || sending}
          >
            {sending ? (
              <>
                <span className="loading loading-spinner loading-xs"></span>
                Sending...
              </>
            ) : (
              "Send Request"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReferralModal;
