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
    <div className="fixed top-0 left-0 z-50 w-full text-white shadow-md bg-gray-900 border-b border-gray-800">
      <div className="flex justify-between items-center px-4 py-3 navbar md:px-6">
        {/* Logo - Clean professional look */}
        <Link
          to="/"
          className="relative group text-xl md:text-2xl font-bold tracking-tight"
          title="Go to Feed"
        >
          <span className="text-white hover:text-blue-400 transition-colors duration-200">
            DevTinder
          </span>
          {/* Subtle underline on hover */}
          <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-500 group-hover:w-full transition-all duration-300"></div>
        </Link>

        {user && (
          <>
            {/* Desktop Navigation Links */}
            <div className="hidden md:flex gap-1 lg:gap-2">
              <Link
                to="/"
                className="px-4 py-2 text-sm lg:text-base rounded-md hover:bg-gray-800 transition-all font-medium text-gray-300 hover:text-white border border-transparent hover:border-gray-700"
                title="Browse profiles and send requests"
              >
                Feed
              </Link>
              <Link
                to="/search"
                className="px-4 py-2 text-sm lg:text-base rounded-md hover:bg-gray-800 transition-all font-medium text-gray-300 hover:text-white border border-transparent hover:border-gray-700"
                title="Search users by name or skills"
              >
                Search
              </Link>
              <Link
                to="/requests"
                className="px-4 py-2 text-sm lg:text-base rounded-md hover:bg-gray-800 transition-all font-medium text-gray-300 hover:text-white border border-transparent hover:border-gray-700"
                title="View connection requests"
              >
                Requests
              </Link>
              <Link
                to="/connections"
                className="px-4 py-2 text-sm lg:text-base rounded-md hover:bg-gray-800 transition-all font-medium text-gray-300 hover:text-white border border-transparent hover:border-gray-700"
                title="View your connections"
              >
                Connections
              </Link>
              <Link
                to="/referrals"
                className="px-4 py-2 text-sm lg:text-base rounded-md hover:bg-gray-800 transition-all font-medium text-gray-300 hover:text-white border border-transparent hover:border-gray-700"
                title="View referral requests"
              >
                Referrals
              </Link>
            </div>

            {/* Right Section: User Info + Dropdown */}
            <div className="flex items-center gap-3 md:gap-4">
              {/* Welcome (Hidden on small screens) */}
              <div className="hidden sm:block px-4 py-2 text-sm font-medium text-gray-300 bg-gray-800 rounded-md border border-gray-700 whitespace-nowrap">
                Welcome, {user.firstName}
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
