import axios from "../utils/axiosInstance";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { BASE_URL } from "../utils/constants";
import { removeUser } from "../utils/userSlice";
import { removeFeed } from "../utils/feedSlice";

const Navbar = () => {
  const user = useSelector((store) => store.user);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLogout = async () => {
    try {
      await axios.post(BASE_URL + "/logout", {}, { withCredentials: true });
      dispatch(removeUser());
      dispatch(removeFeed());
      navigate("/login");
    } catch (err) {
      console.log(err);
    }
  };

  // Only show navbar navigation if user is authenticated
  if (!user || !user._id) {
    return (
      <div className="fixed top-0 left-0 z-50 w-full text-white shadow-lg bg-neutral">
        <div className="flex justify-center items-center px-4 py-3 md:px-6 min-h-16">
          <div className="text-center">
            <p className="text-sm text-gray-400 mb-2">Please log in to continue</p>
            <Link
              to="/login"
              className="btn btn-primary btn-sm"
            >
              🔐 Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed top-0 left-0 z-50 w-full text-white shadow-lg bg-neutral">
      <div className="flex justify-between items-center px-4 py-3 navbar md:px-6">
        {/* Logo - Animated with gradient and hover effects */}
        <Link
          to="/"
          className="relative group text-xl md:text-2xl font-bold"
          title="Go to Feed"
        >
          <span className="bg-gradient-to-r from-green-300 via-blue-300 to-green-300 bg-clip-text text-transparent animate-pulse">
            DevLinker
          </span>
          <span className="ml-2 inline-block text-2xl group-hover:animate-bounce transition-transform">
            🧑‍💻
          </span>
          {/* Animated underline on hover */}
          <div className="absolute bottom-0 left-0 w-0 h-1 bg-gradient-to-r from-green-400 to-blue-400 group-hover:w-full transition-all duration-300 rounded-full"></div>
        </Link>

        {user && (
          <>
            {/* Desktop Navigation Links */}
            <div className="hidden md:flex gap-2 lg:gap-4">
              <Link
                to="/"
                className="px-3 py-2 text-sm lg:text-base rounded-lg hover:bg-gray-700 transition font-medium hover:text-green-300"
                title="Browse profiles and send requests"
              >
                🔥 Feed
              </Link>
              <Link
                to="/search"
                className="px-3 py-2 text-sm lg:text-base rounded-lg hover:bg-gray-700 transition font-medium hover:text-cyan-300"
                title="Search users by name or skills"
              >
                🔍 Search
              </Link>
              <Link
                to="/requests"
                className="px-3 py-2 text-sm lg:text-base rounded-lg hover:bg-gray-700 transition font-medium hover:text-yellow-300"
                title="View connection requests"
              >
                👁️ Requests
              </Link>
              <Link
                to="/connections"
                className="px-3 py-2 text-sm lg:text-base rounded-lg hover:bg-gray-700 transition font-medium hover:text-pink-300"
                title="View your connections"
              >
                💗 Connections
              </Link>
              <Link
                to="/referrals"
                className="px-3 py-2 text-sm lg:text-base rounded-lg hover:bg-gray-700 transition font-medium hover:text-blue-300"
                title="View referral requests"
              >
                🔗 Referrals
              </Link>
            </div>

            {/* Right Section: User Info + Dropdown */}
            <div className="flex items-center gap-3 md:gap-4">
              {/* Welcome (Hidden on small screens) */}
              <div className="hidden sm:block px-3 py-2 text-sm font-semibold text-green-400 bg-gradient-to-r from-gray-800 to-gray-700 rounded-xl whitespace-nowrap">
                👋 {user.firstName}
              </div>

              {/* Dropdown Menu */}
              <div className="dropdown dropdown-end">
                <div
                  tabIndex={0}
                  role="button"
                  className="transition btn btn-ghost btn-circle avatar hover:bg-gray-700 border border-green-400"
                >
                  <div className="w-10 rounded-full">
                    <img alt="User Photo" src={user.photoURL} />
                  </div>
                </div>
                <ul
                  tabIndex={0}
                  className="right-0 z-50 p-2 mt-3 text-gray-300 bg-gray-900 border border-gray-700 rounded-md shadow-lg menu menu-sm dropdown-content w-52"
                >
                  {/* Mobile Navigation (shown only in dropdown on small screens) */}
                  <li className="md:hidden">
                    <Link
                      to="/"
                      className="justify-between p-2 rounded-md hover:bg-gray-800"
                    >
                      Feed
                      <span className="badge badge-success">🔥</span>
                    </Link>
                  </li>
                  <li className="md:hidden">
                    <Link
                      to="/search"
                      className="justify-between p-2 rounded-md hover:bg-gray-800"
                    >
                      Search
                      <span className="badge badge-info">🔍</span>
                    </Link>
                  </li>
                  <li className="md:hidden">
                    <Link
                      to="/requests"
                      className="justify-between p-2 rounded-md hover:bg-gray-800"
                    >
                      Requests
                      <span className="badge badge-warning">👁️</span>
                    </Link>
                  </li>
                  <li className="md:hidden">
                    <Link
                      to="/connections"
                      className="justify-between p-2 rounded-md hover:bg-gray-800"
                    >
                      Connections
                      <span className="badge badge-error">💗</span>
                    </Link>
                  </li>
                  <li className="md:hidden">
                    <Link
                      to="/referrals"
                      className="justify-between p-2 rounded-md hover:bg-gray-800"
                    >
                      Referrals
                      <span className="badge badge-info">�</span>
                    </Link>
                  </li>
                  <li className="md:hidden">
                    <hr className="my-2 border-gray-700" />
                  </li>

                  {/* Profile (always visible) */}
                  <li>
                    <Link
                      to="/profile"
                      className="justify-between p-2 rounded-md hover:bg-gray-800"
                    >
                      Profile
                      <span className="badge badge-success">�</span>
                    </Link>
                  </li>

                  {/* Logout */}
                  <li>
                    <button
                      onClick={handleLogout}
                      className="w-full p-2 text-red-400 rounded-md hover:text-red-300 hover:bg-gray-800 font-semibold"
                    >
                      Logout 🚪
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Navbar;
