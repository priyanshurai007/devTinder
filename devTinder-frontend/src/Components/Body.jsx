import { Outlet, useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
// Chatbot feature removed — component import intentionally omitted
import axios from "../utils/axiosInstance";
import { BASE_URL } from "../utils/constants";
import { useDispatch, useSelector } from "react-redux";
import { addUser } from "../utils/userSlice";
import { useEffect } from "react";
import { socket } from "../utils/socket";


const Body = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((store) => store.user);

  const fetchUser = async () => {
    try {
      const response = await axios.get(BASE_URL + "/profile/view", {
        withCredentials: true,
      });
      dispatch(addUser(response.data));
      socket.connect();
    } catch (err) {
      if (err.response?.status === 401) {
        navigate("/login");
      } else {
        console.log("Error fetching user:", err.message);
      }
      
    }
  };

  useEffect(() => {
    if (!user || !user._id) {
      fetchUser();
    }
  }, []);

  return (
    <div>
      <Navbar />
      <div className="pt-20">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
};

export default Body;

//notes.

/*
📘 Body.jsx Revision Notes:

1. Acts as the main layout wrapper — includes Navbar, Outlet (page), and Footer.

2. fetchUser():
   - Calls backend API to get current user profile.
   - If unauthorized, redirects to /login.
   - Dispatches user data to Redux store using addUser.

3. useEffect():
   - Runs fetchUser on initial mount if user not already in Redux.

4. Outlet:
   - Renders nested route components dynamically based on URL.
   - Example: /profile → <Profile />, /feed → <Feed />

5. useSelector:
   - Reads user data from Redux store (global state).

6. useNavigate:
   - Redirects user programmatically if needed.
*/

