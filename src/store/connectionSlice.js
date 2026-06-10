import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  pendingReceivedCount: 0,
  connectionUpdateCount: 0,
};

const connectionSlice = createSlice({
  name: "connections",
  initialState,
  reducers: {
    setPendingReceivedCount: (state, action) => {
      state.pendingReceivedCount = Math.max(0, action.payload || 0);
    },

    incrementPendingReceivedCount: (state) => {
      state.pendingReceivedCount += 1;
    },

    decrementPendingReceivedCount: (state) => {
      state.pendingReceivedCount = Math.max(0, state.pendingReceivedCount - 1);
    },

    incrementConnectionUpdateCount: (state) => {
      state.connectionUpdateCount += 1;
    },

    clearConnectionUpdateCount: (state) => {
      state.connectionUpdateCount = 0;
    },
  },
});

export const {
  setPendingReceivedCount,
  incrementPendingReceivedCount,
  decrementPendingReceivedCount,
  incrementConnectionUpdateCount,
  clearConnectionUpdateCount,
} = connectionSlice.actions;

export default connectionSlice.reducer;