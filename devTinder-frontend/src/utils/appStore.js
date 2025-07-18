import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./userSlice";
import feedReducer from "./feedSlice";
import connectionReducer from "./connectionSlice";
import requestReducer from "./requestSlice";

const appStore = configureStore({
  reducer: {
    user: userReducer,
    feed: feedReducer,
    connection: connectionReducer,
    request: requestReducer,
  },
});

export default appStore;


//notes.

/*
📘 appStore.js Revision Notes:

1. configureStore (from Redux Toolkit):
   - Simplifies store setup.
   - Automatically combines multiple reducers and includes default middleware.

2. Reducers:
   - user: Handles user-related state (e.g., login, profile info).
   - feed: Manages the feed/posts visible to user.
   - connection: Stores current user’s connections.
   - request: Tracks connection requests sent/received.

3. Purpose of appStore:
   - Central Redux store holding global state for the entire application.
   - Shared across components via <Provider store={appStore}> in App.jsx.

4. Export:
   - Exported as `appStore` to be used by the Provider in your root component.
*/
