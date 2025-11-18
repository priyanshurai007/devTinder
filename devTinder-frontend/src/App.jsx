import { BrowserRouter, Route, Routes } from "react-router-dom";
import Body from "./Components/Body";
import Login from "./Components/Login";
import Profile from "./Components/Profile";
import { Provider } from "react-redux";
import appStore from "./utils/appStore";
import Feed from "./Components/Feed";
import Connections from "./Components/Connections";
import Requests from "./Components/Requests";
import ChatPage from "./Components/ChatPage";
import MyReferrals from "./pages/MyReferrals";
import ProtectedRoute from "./Components/ProtectedRoute";
import Search from "./Components/Search";

function App() {
  return (
    <>
      <Provider store={appStore}>
        <BrowserRouter basename="/">
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />

            {/* Protected Routes - Only accessible when authenticated */}
            <Route path="/" element={<Body />}>
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Feed />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile/:userId"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/connections"
                element={
                  <ProtectedRoute>
                    <Connections />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/requests"
                element={
                  <ProtectedRoute>
                    <Requests />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/chat"
                element={
                  <ProtectedRoute>
                    <ChatPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/referrals"
                element={
                  <ProtectedRoute>
                    <MyReferrals />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/search"
                element={
                  <ProtectedRoute>
                    <Search />
                  </ProtectedRoute>
                }
              />
            </Route>
          </Routes>
        </BrowserRouter>
      </Provider>
    </>
  );
}

export default App;

//notes

/*
📘 App.jsx Revision Notes (Updated with Security):

1. ProtectedRoute Component:
   - Custom wrapper for routes that require authentication.
   - Checks if user exists in Redux store (user._id must be present).
   - If not authenticated: redirects to /login
   - If authenticated: renders the component

2. Public Routes:
   - /login: Anyone can access (login page)

3. Protected Routes (all nested under Body):
   - /: Feed (requires authentication)
   - /profile: Profile (requires authentication)
   - /connections: User connections (requires authentication)
   - /requests: Connection requests (requires authentication)
   - /chat: Chat page (requires authentication)
   - /referrals: Referral dashboard (requires authentication)

4. Security Benefits:
   - Users cannot access feed by directly going to "/"
   - Users cannot access any protected route without login
   - Browser back button won't bypass authentication
   - Frontend security layer added (backend also has JWT verification)

5. User Flow:
   - Unauthenticated user visits "/" → redirected to "/login"
   - Unauthenticated user clicks logo → redirected to "/login"
   - Authenticated user visits "/" → sees Feed
   - Authenticated user clicks logo → stays on Feed
*/
