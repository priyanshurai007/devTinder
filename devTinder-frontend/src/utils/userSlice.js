import { createSlice } from "@reduxjs/toolkit";

const userSlice = createSlice({
  name: "user",
  initialState: null,
  reducers: {
    addUser: (state, action) => {
      return action.payload;
    },
    removeUser: (state, action) => {
      return null;
    },
  },
});

export const { addUser, removeUser } = userSlice.actions;
export default userSlice.reducer;

// Selectors: use these from components to centralize the user-shape handling
export const selectCurrentUser = (state) => state.user || null;
export const selectCurrentUserId = (state) => {
  const u = state.user;
  if (!u) return null;
  // support either a direct user object or { user }
  return u._id || u?.user?._id || null;
};
