import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ChatItem from "./ChatItem";
import api from "../../services/api";
import * as signalR from "@microsoft/signalr";

const ChatList = () => {
  const [search, setSearch] = useState("");
  const [conversations, setConversations] = useState([]);
  const [searchUsers, setSearchUsers] = useState([]);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const navigate = useNavigate();
  const { username: selectedUsername } = useParams();


  const API_BASE_URL = "https://localhost:7257";

  const fetchChats = async () => {
    try {
      const res = await api.get("/chat/user-chats");

      const data = Array.isArray(res.data)
        ? res.data
        : res.data?.data || [];

      setConversations(data);
    } catch (err) {
      console.error("Fetch chats failed:", err);
      setConversations([]);
    }
  };

  useEffect(() => {
  const token = localStorage.getItem("token");

  if (!token) return;

  const connection = new signalR.HubConnectionBuilder()
    .withUrl(`${API_BASE_URL}/chathub`, {
      accessTokenFactory: () => localStorage.getItem("token"),
    })
    .withAutomaticReconnect()
    .build();

  connection.on("ReceiveMessage", () => {
    fetchChats();
  });

  connection.on("ReceiveOwnMessage", () => {
    fetchChats();
  });

  connection
    .start()
    .then(() => console.log("ChatList ChatHub connected"))
    .catch((err) => console.error("ChatList ChatHub error:", err));

  return () => {
    connection.stop();
  };
}, []);


  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 350);

    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const fetchChats = async () => {
      if (debouncedSearch) return;

      try {
        const res = await api.get("/chat/user-chats");

        const data = Array.isArray(res.data)
          ? res.data
          : res.data?.data || [];

        setConversations(data);
      } catch (err) {
        console.error("Fetch chats failed:", err);
        setConversations([]);
      }
    };

    fetchChats();
  }, [debouncedSearch]);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!debouncedSearch) {
        setSearchUsers([]);
        return;
      }

      try {
        const res = await api.get(
          `/user/users?query=${encodeURIComponent(debouncedSearch)}`
        );

        const data = Array.isArray(res.data)
          ? res.data
          : res.data?.data || [];

        setSearchUsers(data);
      } catch (err) {
        console.error("Message search failed:", err);
        setSearchUsers([]);
      }
    };

    fetchUsers();
  }, [debouncedSearch]);

  const isSearching = !!debouncedSearch;
  const displayList = isSearching ? searchUsers : conversations;

  const handleSelect = (item) => {
    const targetUsername = isSearching
      ? item.username
      : item.username;

    if (!targetUsername) return;

    navigate(`/messages/${targetUsername}`);
  };

  return (
    <div style={styles.container}>
      <div style={styles.searchWrapper}>
        <input
          type="text"
          placeholder="Search messages"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={styles.input}
        />
      </div>

      <div style={styles.list}>
        {displayList.length > 0 ? (
          displayList.map((item, index) => {
            const targetUsername = item.username;

            return (
              <ChatItem
                key={item.chatId || item.id || targetUsername || index}
                item={item}
                isSearchResult={isSearching}
                isSelected={
                  selectedUsername?.toLowerCase() ===
                  targetUsername?.toLowerCase()
                }
                onSelect={() => handleSelect(item)}
              />
            );
          })
        ) : (
          <p style={styles.noUsers}>
            {isSearching ? "No users found" : "No conversations found"}
          </p>
        )}
      </div>
    </div>
  );
};

export default ChatList;

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    overflow: "hidden",
  },

  searchWrapper: {
    position: "sticky",
    top: 0,
    zIndex: 2,
    backgroundColor: "#f8fafc",
    padding: "12px",
  },

  input: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: "12px",
    border: "1px solid #e5e7eb",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
  },

  list: {
    flex: 1,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    padding: "0 8px 8px",
  },

  noUsers: {
    color: "#9ca3af",
    textAlign: "center",
    marginTop: "24px",
    fontStyle: "italic",
    fontSize: "14px",
  },
};