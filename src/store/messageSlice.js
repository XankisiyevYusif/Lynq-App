import { createSlice } from "@reduxjs/toolkit";

const ACKNOWLEDGED_STORAGE_KEY = "nexora:messages-navbar-acknowledged";

const normalizeUsername = (username) => {
  if (!username) return "";

  return username.toString().trim().toLowerCase();
};

const loadAcknowledgedUnread = () => {
  try {
    const raw = localStorage.getItem(ACKNOWLEDGED_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};

    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed
      : {};
  } catch {
    return {};
  }
};

const getChatUsername = (chat) =>
  normalizeUsername(
    chat?.username ?? chat?.Username ?? chat?.userName ?? chat?.UserName,
  );

const getChatUnreadCount = (chat) => {
  const parsed = Number(chat?.unreadCount ?? chat?.UnreadCount ?? 0);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

const recomputeNavbarUnread = (state) => {
  if (state.isMessagesPageOpen) {
    state.navbarUnreadCount = 0;
    return;
  }

  state.navbarUnreadCount = Object.entries(state.unreadMessages).reduce(
    (total, [username, unreadCount]) => {
      const unread = Number(unreadCount || 0);
      const acknowledged = Number(state.acknowledgedUnread[username] || 0);

      return total + Math.max(0, unread - acknowledged);
    },
    0,
  );
};

const initialState = {
  // Hər user üzrə serverdəki tam oxunmamış mesaj sayı.
  unreadMessages: {},

  // Navbar-da artıq görülmüş sayların bazasıdır.
  // localStorage vasitəsilə refresh-dən sonra da saxlanılır.
  acknowledgedUnread: loadAcknowledgedUnread(),

  // Yalnız Messages səhifəsi son dəfə açılandan sonra gələn yeni mesajlar.
  navbarUnreadCount: 0,

  activeChat: null,
  isMessagesPageOpen: false,
};

const messageSlice = createSlice({
  name: "messages",
  initialState,

  reducers: {
    hydrateUnreadFromChats: (state, action) => {
      const chats = Array.isArray(action.payload) ? action.payload : [];

      const unreadMap = {};

      chats.forEach((chat) => {
        const username = getChatUsername(chat);
        if (!username) return;

        let count = getChatUnreadCount(chat);

        if (normalizeUsername(state.activeChat) === username) {
          count = 0;
        }

        unreadMap[username] = count;

        const acknowledged = Number(state.acknowledgedUnread[username] || 0);

        // Chat seen olduqda server count aşağı düşürsə köhnə baza qalmasın.
        if (count < acknowledged) {
          state.acknowledgedUnread[username] = count;
        }

        // Messages səhifəsi açıqdırsa navbar üçün həmin count artıq görülüb.
        if (state.isMessagesPageOpen) {
          state.acknowledgedUnread[username] = count;
        }
      });

      state.unreadMessages = unreadMap;
      recomputeNavbarUnread(state);
    },

    incrementUnread: (state, action) => {
      const username = normalizeUsername(action.payload);
      if (!username) return;

      // Açıq chatdan gələn mesaj dərhal seen ediləcəyi üçün sayılmır.
      if (normalizeUsername(state.activeChat) === username) {
        return;
      }

      const nextCount = Number(state.unreadMessages[username] || 0) + 1;

      state.unreadMessages[username] = nextCount;

      // Messages page açıqdırsa navbar badge göstərmirik,
      // amma item count qalır və bu mesaj navbar üçün görülmüş sayılır.
      if (state.isMessagesPageOpen) {
        state.acknowledgedUnread[username] = nextCount;
      }

      recomputeNavbarUnread(state);
    },

    clearUnreadForUser: (state, action) => {
      const username = normalizeUsername(action.payload);
      if (!username) return;

      state.unreadMessages[username] = 0;
      state.acknowledgedUnread[username] = 0;

      recomputeNavbarUnread(state);
    },

    setActiveChat: (state, action) => {
      state.activeChat = action.payload
        ? normalizeUsername(action.payload)
        : null;
    },

    setMessagesPageOpen: (state, action) => {
      state.isMessagesPageOpen = Boolean(action.payload);

      if (state.isMessagesPageOpen) {
        Object.entries(state.unreadMessages).forEach(([username, count]) => {
          state.acknowledgedUnread[username] = Number(count || 0);
        });
      }

      recomputeNavbarUnread(state);
    },

    clearNavbarUnread: (state) => {
      Object.entries(state.unreadMessages).forEach(([username, count]) => {
        state.acknowledgedUnread[username] = Number(count || 0);
      });

      state.navbarUnreadCount = 0;
    },

    setUnreadMessages: (state, action) => {
      state.unreadMessages =
        action.payload && typeof action.payload === "object"
          ? action.payload
          : {};

      recomputeNavbarUnread(state);
    },

    clearUnread: (state) => {
      state.unreadMessages = {};
      state.acknowledgedUnread = {};
      state.navbarUnreadCount = 0;
      state.activeChat = null;
      state.isMessagesPageOpen = false;
    },
  },
});

export const {
  hydrateUnreadFromChats,
  incrementUnread,
  clearUnreadForUser,
  setActiveChat,
  setMessagesPageOpen,
  clearNavbarUnread,
  setUnreadMessages,
  clearUnread,
} = messageSlice.actions;

export { ACKNOWLEDGED_STORAGE_KEY };
export default messageSlice.reducer;
