import { createSlice } from "@reduxjs/toolkit";

const getId = (n) => n?.id ?? n?.Id;

const isUnread = (n) => {
  const value = n?.isRead ?? n?.IsRead;
  return value === false || value === undefined || value === null;
};

const notificationSlice = createSlice({
  name: "notification",

  initialState: {
    items: [],
    unreadCount: 0,
  },

  reducers: {
    setNotifications: (state, action) => {
      const list = Array.isArray(action.payload) ? action.payload : [];

      state.items = list;

      state.unreadCount = list.filter(isUnread).length;
    },

    addNotification: (state, action) => {
      const incoming = action.payload;
      if (!incoming) return;

      const incomingId = getId(incoming);

      const index = state.items.findIndex((item) => getId(item) === incomingId);

      if (index !== -1) {
        state.items[index] = {
          ...state.items[index],
          ...incoming,
        };
      } else {
        state.items.unshift(incoming);
      }

      state.unreadCount += 1;
    },

    clearUnread: (state) => {
      state.unreadCount = 0;

      state.items = state.items.map((item) => ({
        ...item,
        isRead: true,
        IsRead: true,
      }));
    },
  },
});

export const { setNotifications, addNotification, clearUnread } =
  notificationSlice.actions;

export default notificationSlice.reducer;