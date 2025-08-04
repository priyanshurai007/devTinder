import axios from "axios";
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

  return (
    <div className="fixed top-0 left-0 z-50 w-full text-white shadow-lg bg-neutral">
      <div className="flex justify-between px-5 navbar">
        {/* Logo */}
        <Link
          to="/"
          className="text-2xl font-bold text-green-300 transition hover:text-white-200"
        >
          DevLinker 🧑‍💻
        </Link>

        {user && (
          <div className="flex items-center gap-4">
            {/* Welcome */}
            <div className="px-4 py-2 font-semibold text-center text-green-400 shadow-md bg-gradient-to-r from-gray-800 to-gray-700 rounded-xl">
              👋 Welcome, {user.firstName}!
            </div>

            {/* Dropdown */}
            <div className="dropdown dropdown-end">
              <div
                tabIndex={0}
                role="button"
                className="transition btn btn-ghost btn-circle avatar hover:bg-gray-700"
              >
                <div className="w-10 border border-gray-500 rounded-full">
                  <img alt="User Photo" src={user.photoURL} />
                </div>
              </div>
              <ul
                tabIndex={0}
                className="right-0 z-50 p-2 mt-3 text-gray-300 bg-gray-900 border border-gray-700 rounded-md shadow-lg menu menu-sm dropdown-content w-52"
              >
                <li>
                  <Link
                    to="/profile"
                    className="justify-between p-2 rounded-md hover:bg-gray-800"
                  >
                    Profile
                    <span className="badge badge-success">👤</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/connections"
                    className="justify-between p-2 rounded-md hover:bg-gray-800"
                  >
                    Connections
                    <span className="badge badge-error">💗</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/requests"
                    className="justify-between p-2 rounded-md hover:bg-gray-800"
                  >
                    Requests
                    <span className="badge badge-warning">👁️</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/referrals"
                    className="justify-between p-2 rounded-md hover:bg-gray-800"
                  >
                    Referrals
                    <span className="badge badge-info">🔥</span>
                  </Link>
                </li>
                <li>
                  <button
                    onClick={handleLogout}
                    className="w-full p-2 text-red-400 rounded-md hover:text-red-300 hover:bg-gray-800"
                  >
                    Logout
                  </button>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Navbar;
