import axios from "../utils/axiosInstance";
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addUser } from "../utils/userSlice";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "../utils/constants";
import { socket } from "../utils/socket";


const Login = () => {
  const [emailId, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [about, setAbout] = useState("");
  const [skills, setSkills] = useState("");
  const [isLoginForm, setIsLoginForm] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((store) => store.user);

  // Check if user is already logged in on mount
  useEffect(() => {
    let mounted = true;
    const checkAuth = async () => {
      // If user already in Redux store, redirect to feed
      if (user && user._id) {
        navigate("/");
        return;
      }

      // Try to fetch user from backend (check if cookie is valid)
      try {
        const res = await axios.get(BASE_URL + "/profile/view", { withCredentials: true });
        if (mounted && res.data) {
          const userData = res.data.user || res.data;
          dispatch(addUser(userData));
          try { socket.connect(); } catch (e) {}
          navigate("/");
        }
      } catch (err) {
        // Not authenticated - stay on login page
        if (mounted) setLoading(false);
      }
    };

    checkAuth();
    return () => { mounted = false; };
  }, [user, navigate, dispatch]);

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePassword = (pwd) =>
    pwd.length >= 8 &&
    /[A-Z]/.test(pwd) &&
    /[a-z]/.test(pwd) &&
    /[0-9]/.test(pwd) &&
    /[^A-Za-z0-9]/.test(pwd);

  const validateSignup = () => {
    if (!firstName || firstName.length < 3) return "First name must be at least 3 characters.";
    if (!lastName) return "Last name is required.";
    if (!validateEmail(emailId)) return "Invalid email address.";
    if (!validatePassword(password)) return "Password must be at least 8 characters, include upper/lowercase, number, and symbol.";
    if (!age || isNaN(Number(age)) || Number(age) < 18) return "Age must be a number and at least 18.";
    if (!["Male", "Female", "Others"].includes(gender)) return "Gender must be Male, Female, or Others.";
    if (!about) return "About is required.";
    const skillsArr = skills.split(",").map(s => s.trim()).filter(Boolean);
    if (skillsArr.length === 0) return "At least one skill is required.";
    return "";
  };

  const handleLogin = async () => {
    setError("");
    if (!validateEmail(emailId)) {
      setError("Invalid email address.");
      return;
    }
    if (!password) {
      setError("Password is required.");
      return;
    }
    try {
      const res = await axios.post(
        BASE_URL + "/login",
        {
          emailId,
          password,
        },
        { withCredentials: true }
      );
      socket.connect();
      dispatch(addUser(res.data.user));
      navigate("/");
    } catch (err) {
      setError(err.response?.data || "Login failed");
    }
  };

  const handleSignUp = async () => {
    setError("");
    const validationError = validateSignup();
    if (validationError) {
      setError(validationError);
      return;
    }
    try {
      const res = await axios.post(
        BASE_URL + "/signup",
        {
          firstName,
          lastName,
          emailId,
          password,
          age,
          gender,
          about,
          skills: skills.split(",").map((s) => s.trim()).filter(Boolean),
        },
        {
          withCredentials: true,
        }
      );

      dispatch(addUser(res.data.data));
      navigate("/profile");
    } catch (error) {
      setError(error.response?.data || "Signup failed");
    }
  };

  // Show nothing while checking authentication
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="flex justify-center my-10">
      <div className="shadow-xl card bg-base-300 w-96">
        <div className="card-body">
          <h2 className="justify-center card-title">
            {isLoginForm ? "Login" : "Signup"}
          </h2>

          {!isLoginForm && (
            <>
              <label className="w-full max-w-xs my-2 form-control">
                <span className="label-text">First Name</span>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full input input-bordered"
                />
              </label>
              <label className="w-full max-w-xs my-2 form-control">
                <span className="label-text">Last Name</span>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full input input-bordered"
                />
              </label>
              <label className="w-full max-w-xs my-2 form-control">
                <span className="label-text">Age</span>
                <input
                  type="number"
                  min="18"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full input input-bordered"
                />
              </label>
              <label className="w-full max-w-xs my-2 form-control">
                <span className="label-text">Gender</span>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full select select-bordered"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Others">Others</option>
                </select>
              </label>
              <label className="w-full max-w-xs my-2 form-control">
                <span className="label-text">About</span>
                <textarea
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  className="w-full textarea textarea-bordered"
                  placeholder="Tell us about yourself"
                ></textarea>
              </label>
              <label className="w-full max-w-xs my-2 form-control">
                <span className="label-text">Skills (comma-separated)</span>
                <input
                  type="text"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  className="w-full input input-bordered"
                />
              </label>
            </>
          )}

          {/* Email and password fields for both login/signup */}
          <label className="w-full max-w-xs my-2 form-control">
            <span className="label-text">Email</span>
            <input
              type="email"
              value={emailId}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full input input-bordered"
            />
          </label>
          <label className="w-full max-w-xs my-2 form-control">
            <span className="label-text">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full input input-bordered"
            />
          </label>

          <p className="text-center text-red-500">{error}</p>

          <div className="justify-center mt-2 card-actions">
            <button
              className="btn btn-primary"
              onClick={isLoginForm ? handleLogin : handleSignUp}
            >
              {isLoginForm ? "Login" : "Signup"}
            </button>
          </div>

          <p
            className="py-2 text-center cursor-pointer"
            onClick={() => setIsLoginForm((val) => !val)}
          >
            {isLoginForm
              ? "New user? Signup here"
              : "Existing user? Login here"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
