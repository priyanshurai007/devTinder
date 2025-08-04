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

function App() {
  return (
    <>
      <Provider store={appStore}>
        <BrowserRouter basename="/">
          <Routes>
            <Route path="/" element={<Body />}>
              <Route path="/" element={<Feed />} />
              <Route path="/login" element={<Login />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/connections" element={<Connections />} />
              <Route path="/requests" element={<Requests />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/referrals" element={<MyReferrals />} />
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
📘 App.jsx Revision Notes:

1. Provider (from react-redux):
   - Makes the Redux store (`appStore`) available to all components.
   - Required for using Redux state and dispatch throughout the app.

2. BrowserRouter (from react-router-dom):
   - Enables client-side routing using URL paths.
   - `basename="/"` defines the base URL (default root).

3. Routes:
   - Container for all the individual route definitions.

4. Route:
   - path="/" element={<Body />}: Acts as the layout or parent wrapper for nested routes.
   - Nested routes:
     - "/" → Feed (home page/feed)
     - "/login" → Login page
     - "/profile" → User profile page
     - "/connections" → User's connections list
     - "/requests" → Incoming connection requests

5. Component Structure:
   - App → Provider → BrowserRouter → Routes → Body (Layout)
                                                  ↳ Feed, Login, Profile, Connections, Requests
*/

