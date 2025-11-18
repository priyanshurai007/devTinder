import axios from "../utils/axiosInstance";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { removeUserFromFeed } from "../utils/feedSlice";
import ReferralModal from "./ReferralModal";

const UserCard = ({ user }) => {
  const dispatch = useDispatch();
  // Support both shapes: state.user may be the user object or { user: user }
  const currentUserId = useSelector((store) => store.user?._id || store.user?.user?._id);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [actionType, setActionType] = useState(null); // Track which button is loading
  const [error, setError] = useState("");

  const { _id, firstName, lastName, age, gender, about, photoURL, skills = [] } = user;

  const isSelf = currentUserId === _id;
  const [relationship, setRelationship] = useState(null);
  const [relLoading, setRelLoading] = useState(false);

  const handleSendRequest = async (status, userId) => {
    setActionType(status);
    setError("");
    setRequesting(true);
    try {
      // Normalize action: use 'pending' for interest
      const sendStatus = status === 'intrested' ? 'pending' : status;
      // use relative path so axiosInstance.baseURL and withCredentials are used
      await axios.post(`/request/send/${sendStatus}/${userId}`);

      // Remove from feed after action (whether ignored or interested)
      dispatch(removeUserFromFeed(userId));
      // refresh relationship
      fetchRelationship();
    } catch (error) {
      const errorMsg = error?.response?.data?.message || error.message || "Failed to process request";
      setError(errorMsg);
      console.error("Request failed:", errorMsg);
    } finally {
      setRequesting(false);
      setActionType(null);
    }
  };

  // Fetch existing relationship/request status between current user and this user
  const fetchRelationship = async () => {
    if (isSelf) return;
    setRelLoading(true);
    try {
      const res = await axios.get(`/request/status/${_id}`);
      setRelationship(res.data.data || null);
    } catch (err) {
      // treat auth or other errors as no relationship
      setRelationship(null);
    } finally {
      setRelLoading(false);
    }
  };

  React.useEffect(() => {
    fetchRelationship();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_id]);

  return (
    <div className="p-3 shadow-xl card bg-base-300 w-96">
      <figure>
        <img
          src={photoURL || "https://via.placeholder.com/300x300?text=No+Image"}
          alt={firstName + " " + lastName}
          className="object-cover h-64 rounded-lg"
        />
      </figure>
      <div className="card-body">
        <h2 className="card-title text-lg font-bold">{firstName + " " + lastName}</h2>
        {age && gender && <p className="text-sm text-gray-400">{`${age} • ${gender}`}</p>}
        {about && <p className="text-sm">{about}</p>}

        {/* Contact info: show email when viewing own profile or when connected */}
        {(isSelf || (relationship && relationship.status === 'accepted')) && user.emailId && (
          <div className="mt-3">
            <h3 className="font-semibold text-xs text-gray-300">Contact</h3>
            <p className="text-sm text-gray-200">{user.emailId}</p>
          </div>
        )}

        {skills.length > 0 && (
          <div>
            <h3 className="font-semibold text-xs text-gray-300 mt-2">Skills:</h3>
            <div className="flex flex-wrap gap-2 mt-2">
              {skills.map((skill, index) => (
                <span
                  key={index}
                  className="px-2 py-1 text-xs text-blue-300 bg-blue-900 rounded-lg"
                >
                  {skill.trim()}
                </span>
              ))}
            </div>
          </div>
        )}

        {error && <p className="text-xs text-red-500 mt-2">{error}</p>}

        <div className="justify-center my-4 card-actions flex gap-2">
          <div className="flex-1 flex items-center justify-center">
            {relLoading ? (
              <span className="loading loading-spinner loading-xs"></span>
            ) : relationship ? (
              <span className="badge badge-lg">
                {relationship.status ? relationship.status.charAt(0).toUpperCase() + relationship.status.slice(1) : 'Connected'}
              </span>
            ) : (
              <>
                <button
                  className={`btn btn-sm ${actionType === "ignored" ? "btn-neutral" : "btn-outline btn-accent"}`}
                  onClick={() => handleSendRequest("ignored", _id)}
                  disabled={requesting}
                  title="Skip this user"
                >
                  {actionType === "ignored" ? (
                    <>
                      <span className="loading loading-spinner loading-xs"></span>
                    </>
                  ) : (
                    "👎 Pass"
                  )}
                </button>

                <button
                  className={`ml-2 btn btn-sm ${actionType === "intrested" ? "btn-neutral" : "btn-primary"}`}
                  onClick={() => handleSendRequest("intrested", _id)}
                  disabled={requesting}
                  title="Show interest in connecting"
                >
                  {actionType === "intrested" ? (
                    <>
                      <span className="loading loading-spinner loading-xs"></span>
                    </>
                  ) : (
                    "❤️ Interested"
                  )}
                </button>

                {/* Show referral button only if users are connected (accepted) */}
                {!isSelf && relationship && relationship.status === 'accepted' && (
                  <button
                    className={`ml-2 btn btn-sm ${actionType === "referral" ? "btn-neutral" : "btn-success"}`}
                    onClick={() => setShowReferralModal(true)}
                    disabled={requesting}
                    title="Request a referral from this user"
                  >
                    {actionType === "referral" ? (
                      <>
                        <span className="loading loading-spinner loading-xs"></span>
                      </>
                    ) : (
                      "🔗 Refer"
                    )}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Referral Modal */}
      {showReferralModal && (
        <ReferralModal
          toUser={user}
          onClose={() => setShowReferralModal(false)}
        />
      )}
    </div>
  );
};

export default UserCard;
