import axios from "../utils/axiosInstance";
import { BASE_URL } from "../utils/constants";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addConnection, removeConnection } from "../utils/connectionSlice";
import ChatWindow from "./ChatWindow";
import ReferralModal from "./ReferralModal";

const Connections = () => {
  const connections = useSelector((store) => store.connection);
  const currentUser = useSelector((store) => store.user) || {};
  const dispatch = useDispatch();

  const [selectedUser, setSelectedUser] = useState(null);
  const [referralUser, setReferralUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(12);
  const [totalPages, setTotalPages] = useState(1);

  const fetchConnections = async () => {
    setLoading(true);
    setError("");

    try {
      if (page === 1) dispatch(removeConnection());

      const response = await axios.get(
        `${BASE_URL}/user/connections?page=${page}&limit=${limit}`,
        { withCredentials: true }
      );

      const items = response.data.data || [];
      const pagesFromApi = response.data.pages || 1;

      // Merge and dedupe by _id; also defensively filter out logged-in user
      const myId = String(currentUser._id || "");
      const combined = page === 1 ? items : [...(connections || []), ...items];
      const map = new Map();
      for (const it of combined) {
        if (!it) continue;
        const id = String(it._id || it.id || "");
        if (!id) continue;
        // skip self
        if (myId && id === myId) continue;
        if (!map.has(id)) map.set(id, it);
      }
      const merged = Array.from(map.values());
      dispatch(addConnection(merged));

      setTotalPages(pagesFromApi);
    } catch (error) {
      const errorMsg =
        error?.response?.data?.message || "Failed to load connections";
      console.error("Fetch connections error:", error);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnections();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // Loading State
  if (loading && (!connections || connections.length === 0)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="mb-4 loading loading-spinner loading-lg text-primary"></div>
          <p className="text-gray-400">Loading your connections...</p>
       </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="p-6 text-center rounded-lg shadow-lg bg-base-200">
          <h2 className="mb-2 text-xl font-bold text-red-500">❌ Error</h2>
          <p className="mb-4 text-gray-300">{error}</p>
          <button onClick={fetchConnections} className="btn btn-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Empty State
  if (!connections || connections.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="p-8 text-center rounded-lg shadow-lg bg-base-200">
          <h2 className="mb-2 text-2xl font-bold text-gray-300">
            No Connections Yet
          </h2>
          <p className="mb-6 text-gray-400">
            Accept connection requests to build your network and start messaging.
          </p>
          <a href="/requests" className="btn btn-primary">
            View Requests
          </a>
        </div>
      </div>
    );
  }

  const hasMore = page < totalPages;

  return (
    <div className="my-10">
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-4xl font-bold text-white">
          Your Connections
        </h1>
        <p className="text-gray-400">{connections.length} connection{connections.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 px-4 mx-auto md:grid-cols-2 lg:grid-cols-3 max-w-7xl">
        {connections.map((connection) => {
          const { _id, firstName, lastName, photoURL, age, gender, about } =
            connection;

          return (
            <div
              key={_id}
              className="p-4 overflow-hidden transition rounded-lg shadow-lg card bg-base-300 hover:shadow-xl"
            >
              {/* Profile Image */}
              <div className="flex justify-center mb-3">
                <img
                  alt="profile"
                  className="object-cover w-24 h-24 border-2 rounded-full border-primary"
                  src={photoURL}
                />
              </div>

              {/* Profile Info */}
              <div className="flex-1 mb-4 text-center">
                <h2 className="text-lg font-bold text-white">
                  {firstName} {lastName}
                </h2>
                {age && gender && (
                  <p className="text-sm text-gray-400">
                    {age} • {gender}
                  </p>
                )}
                {about && (
                  <p className="mt-2 text-sm text-gray-300 line-clamp-3">
                    {about}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedUser(connection)}
                  className="flex-1 btn btn-primary btn-sm"
                >
                  Message
                </button>
                <button
                  onClick={() => setReferralUser(connection)}
                  className="flex-1 btn btn-outline btn-sm"
                  title="Ask for job referral"
                >
                  Request Referral
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {hasMore && (
        <div className="flex justify-center my-6">
          <button
            className="btn btn-outline"
            onClick={() => setPage((p) => p + 1)}
            disabled={loading}
          >
            {loading ? "Loading..." : "Load More"}
          </button>
        </div>
      )}

      {/* Chat Window Popup */}
      {selectedUser && (
        <ChatWindow
          selectedUser={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}

      {/* Referral Modal Popup */}
      {referralUser && (
        <ReferralModal
          toUser={referralUser}
          onClose={() => setReferralUser(null)}
        />
      )}
    </div>
  );
};

export default Connections;
