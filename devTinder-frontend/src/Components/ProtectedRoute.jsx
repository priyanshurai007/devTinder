import { useSelector, useDispatch } from "react-redux";
import { Navigate, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "../utils/axiosInstance";
import { BASE_URL } from "../utils/constants";
import { addUser } from "../utils/userSlice";
import { socket } from "../utils/socket";

/**
 * ProtectedRoute Component
 * Wraps routes that require authentication
 * 
 * If user is logged in: renders the component
 * If user is NOT logged in: redirects to /login
 */
const ProtectedRoute = ({ children }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((store) => store.user);
  const [loading, setLoading] = useState(false);

  // If user not present in store, try to fetch current user from server.
  useEffect(() => {
    let mounted = true;
    const fetchUser = async () => {
      if (user && user._id) return;
      setLoading(true);
      try {
        const res = await axios.get(BASE_URL + "/profile/view", { withCredentials: true });
        if (!mounted) return;
        const payload = res.data?.user || res.data;
        if (payload) {
          dispatch(addUser(payload));
          try { socket.connect(); } catch (e) {}
        }
      } catch (err) {
        // If unauthorized, redirect to login
        if (err?.response?.status === 401) {
          navigate("/login");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchUser();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    // While we are verifying auth, don't redirect — show nothing (or a spinner)
    return null;
  }

  if (!user || !user._id) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
