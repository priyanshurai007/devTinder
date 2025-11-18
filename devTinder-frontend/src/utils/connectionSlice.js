import { createSlice } from "@reduxjs/toolkit";

const connectionSlice = createSlice({
  name: "connection",
  // store connections as an array; components expect an array
  initialState: [],
  reducers: {
    addConnection: (state, action) => {
      // replace current list with payload (ensure array fallback)
      return Array.isArray(action.payload) ? action.payload : [];
    },
    removeConnection: () => {
      return [];
    },
  },
});

export const { addConnection, removeConnection } = connectionSlice.actions;
export default connectionSlice.reducer;
