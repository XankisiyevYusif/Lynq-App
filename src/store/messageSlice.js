import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  unreadMessages: {},
  activeChat: null,
};

const normalizeUsername = (username) => {
  if (!username) return "";
  return username.toLowerCase();
};

const messageSlice = createSlice({
  name: "messages",
  initialState,
  reducers: {
    incrementUnread: (state, action) => {
      const username = normalizeUsername(action.payload);

      if (!username) return;

      if (normalizeUsername(state.activeChat) === username) {
        return;
      }

      state.unreadMessages[username] =
        (state.unreadMessages[username] || 0) + 1;
    },

    clearUnreadForUser: (state, action) => {
      const username = normalizeUsername(action.payload);

      if (!username) return;

      delete state.unreadMessages[username];
    },

    setActiveChat: (state, action) => {
      state.activeChat = action.payload || null;
    },

    setUnreadMessages: (state, action) => {
      state.unreadMessages = action.payload || {};
    },

    clearUnread: (state) => {
      state.unreadMessages = {};
    },
  },
});

export const {
  incrementUnread,
  clearUnreadForUser,
  setActiveChat,
  setUnreadMessages,
  clearUnread,
} = messageSlice.actions;

export default messageSlice.reducer;