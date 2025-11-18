import { useSelector } from "react-redux";
import EditProfile from "./EditProfile";
import UserCard from "./UserCard";
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "../utils/axiosInstance";
import { BASE_URL } from "../utils/constants";

const Profile = () => {
  // Support both shapes: state.user may be the user object or { user }
  const raw = useSelector((store) => store.user);
  const currentUser = raw && (raw._id ? raw : raw.user ? raw.user : null);

  const { userId } = useParams();
  const [otherUser, setOtherUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // If userId param exists and is different from current user's id, fetch that user
  useEffect(() => {
    const fetchUser = async () => {
      if (!userId) return;
      // If asking for own profile, no need to fetch
      if (currentUser && (currentUser._id === userId || currentUser.user?._id === userId)) {
        setOtherUser(null);
        return;
      }

      setLoading(true);
      setError("");
      try {
        // Public endpoint: don't require credentials so anonymous viewers can see profiles
        const res = await axios.get(`${BASE_URL}/user/${userId}`);
        setOtherUser(res.data.data);
      } catch (err) {
        setError(err?.response?.data?.message || "Unable to load user");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId, currentUser]);

  // If not logged in
  if (!currentUser) {
    return (
      <div className="flex items-center justify-center pt-20">
        <div className="text-center">
          <h2 className="text-xl font-semibold">No profile available</h2>
          <p className="text-sm text-muted">Please login to view and edit your profile.</p>
        </div>
      </div>
    );
  }

  // If viewing another user's profile
  if (userId && otherUser) {
    return (
      <div className="px-4 pt-20">
        <UserCard user={otherUser} />
      </div>
    );
  }

  if (userId && loading) {
    return (
      <div className="flex items-center justify-center pt-20">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg text-primary mb-4"></div>
          <p className="text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (userId && error) {
    return (
      <div className="flex items-center justify-center pt-20">
        <div className="text-center">
          <h2 className="text-xl font-semibold">{error}</h2>
        </div>
      </div>
    );
  }

  // Otherwise show current user's editable profile
  return (
    <div className="px-4 pt-20">
      <EditProfile user={currentUser} />
    </div>
  );
};

export default Profile;
