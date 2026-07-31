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
        const wasUnread = isUnread(state.items[index]);
        state.items[index] = {
          ...state.items[index],
          ...incoming,
        };
        const nowUnread = isUnread(state.items[index]);
        if (!wasUnread && nowUnread) state.unreadCount += 1;
        if (wasUnread && !nowUnread) state.unreadCount = Math.max(0, state.unreadCount - 1);
      } else {
        state.items.unshift(incoming);
        if (isUnread(incoming)) state.unreadCount += 1;
      }
    },

    markNotificationRead: (state, action) => {
      const item = state.items.find((notification) => getId(notification) === action.payload);
      if (!item || !isUnread(item)) return;
      item.isRead = true;
      item.IsRead = true;
      state.unreadCount = Math.max(0, state.unreadCount - 1);
    },

    removeNotification: (state, action) => {
      const item = state.items.find((notification) => getId(notification) === action.payload);
      if (item && isUnread(item)) state.unreadCount = Math.max(0, state.unreadCount - 1);
      state.items = state.items.filter((notification) => getId(notification) !== action.payload);
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

export const { setNotifications, addNotification, clearUnread, markNotificationRead, removeNotification } =
  notificationSlice.actions;

export default notificationSlice.reducer;
