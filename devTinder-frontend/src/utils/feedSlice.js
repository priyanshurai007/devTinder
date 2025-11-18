import { createSlice } from "@reduxjs/toolkit";

const feedSlice = createSlice({
  name: "feed",
  // feed is expected to be an array of user objects
  initialState: [],
  reducers: {
    addFeed: (state, action) => {
      // Merge incoming feed items with current state while deduplicating by _id
      const incoming = Array.isArray(action.payload) ? action.payload : [];
      if (!incoming.length) return state || [];

      const map = new Map();
      // preserve existing order: first add existing items
      (state || []).forEach((u) => {
        if (u && u._id) map.set(u._id.toString(), u);
      });
      // then add/overwrite with incoming (newer items appended)
      incoming.forEach((u) => {
        if (u && u._id) map.set(u._id.toString(), u);
      });

      return Array.from(map.values());
    },
    removeUserFromFeed: (state, action) => {
      // guard in case state is unexpectedly falsy
      const current = Array.isArray(state) ? state : [];
      return current.filter((user) => user._id !== action.payload);
    },
    removeFeed: () => {
      return [];
    },
  },
});

export const { addFeed, removeUserFromFeed ,removeFeed } = feedSlice.actions;
export default feedSlice.reducer;
