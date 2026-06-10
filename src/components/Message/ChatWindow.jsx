import React, { useEffect, useRef, useState } from "react";
import * as signalR from "@microsoft/signalr";
import MessageInput from "./MessageInput";
import api from "../../services/api";
import { jwtDecode } from "jwt-decode";
import { useDispatch } from "react-redux";
import { setActiveChat, clearUnreadForUser } from "../../store/messageSlice";
import defaultAvatar from "../../assets/default-avatar.png";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = "https://localhost:7257";

const ChatWindow = ({ receiver }) => {
  const [messages, setMessages] = useState([]);
  const [userData, setUserData] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const connectionRef = useRef(null);
  const messagesEndRef = useRef(null);
  const receivedIdsRef = useRef(new Set());

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  let currentUsername = null;

  if (token) {
    try {
      const decoded = jwtDecode(token);

      currentUsername =
        decoded["unique_name"] ||
        decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] ||
        decoded["name"];
    } catch {
      currentUsername = null;
    }
  }

  const normalizeUsername = (value) => {
    if (!value) return "";
    return value.toString().toLowerCase();
  };

  const unwrapResponse = (res) => {
    return res?.data?.data || res?.data || null;
  };

  const getImageUrl = (path) => {
    if (!path) return defaultAvatar;

    if (path.startsWith("http://") || path.startsWith("https://")) {
      return path;
    }

    return `${API_BASE_URL}/${path.replace(/^\/+/, "")}`;
  };

  const normalizeMessage = (message) => {
    return {
      id: message.id ?? message.Id ?? null,
      chatId: message.chatId ?? message.ChatId ?? null,

      sender:
        message.sender ??
        message.Sender ??
        message.senderUsername ??
        message.SenderUsername,

      senderId: message.senderId ?? message.SenderId,

      senderProfileImage:
        message.senderProfileImage ??
        message.SenderProfileImage ??
        message.userPhoto ??
        message.UserPhoto ??
        message.profileImage ??
        message.ProfileImage,

      receiver:
        message.receiver ??
        message.Receiver ??
        message.receiverUsername ??
        message.ReceiverUsername ??
        receiver,

      receiverId: message.receiverId ?? message.ReceiverId,

      content: message.content ?? message.Content ?? "",
      isImage: message.isImage ?? message.IsImage ?? false,

      dateTime:
        message.dateTime ??
        message.DateTime ??
        message.timestamp ??
        message.Timestamp ??
        new Date().toISOString(),

      hasSeen: message.hasSeen ?? message.HasSeen ?? false,
    };
  };

  const getMessageKey = (message) => {
    return (
      message.id ||
      `${message.sender}-${message.receiver}-${message.content}-${message.dateTime}`
    );
  };

  const addMessageSafely = (message) => {
    const normalized = normalizeMessage(message);
    const key = getMessageKey(normalized);

    if (receivedIdsRef.current.has(key)) return;

    receivedIdsRef.current.add(key);
    setMessages((prev) => [...prev, normalized]);
  };

  const getReceiverImageFromMessages = () => {
    const receiverMessage = messages.find(
      (m) => normalizeUsername(m.sender) === normalizeUsername(receiver)
    );

    return receiverMessage?.senderProfileImage || null;
  };

  const getUserImage = () => {
    const imagePath =
      userData?.profileImage ||
      userData?.ProfileImage ||
      userData?.profilePhoto ||
      userData?.ProfilePhoto ||
      userData?.userPhoto ||
      userData?.UserPhoto ||
      userData?.basicInfo?.profileImage ||
      userData?.BasicInfo?.ProfileImage ||
      userData?.basicInfo?.profilePhoto ||
      userData?.companyInfo?.logoUrl ||
      userData?.CompanyInfo?.LogoUrl ||
      userData?.logoUrl ||
      userData?.LogoUrl ||
      userData?.companyLogo ||
      userData?.CompanyLogo ||
      getReceiverImageFromMessages();

    return getImageUrl(imagePath);
  };

  const getDisplayName = () => {
    return (
      userData?.fullName ||
      userData?.FullName ||
      userData?.basicInfo?.fullName ||
      userData?.BasicInfo?.FullName ||
      userData?.companyName ||
      userData?.CompanyName ||
      userData?.companyInfo?.name ||
      userData?.CompanyInfo?.Name ||
      userData?.userName ||
      userData?.UserName ||
      userData?.username ||
      userData?.Username ||
      userData?.basicInfo?.username ||
      receiver
    );
  };

  const getSubInfo = () => {
    return (
      userData?.currentPosition ||
      userData?.CurrentPosition ||
      userData?.basicInfo?.currentPosition ||
      userData?.BasicInfo?.CurrentPosition ||
      userData?.companyInfo?.industry ||
      userData?.CompanyInfo?.Industry ||
      userData?.bio ||
      userData?.Bio ||
      userData?.about?.bio ||
      ""
    );
  };

  const markChatAsSeen = async () => {
    if (!receiver) return;

    try {
      await api.post(`/chat/mark-as-seen/${receiver}`);
      dispatch(clearUnreadForUser(receiver));
    } catch (err) {
      console.error("Mark as seen failed:", err);
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return "";

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) return "";

    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleClickProfile = () => {
    if (!receiver) return;
    navigate(`/profile/${receiver}`);
  };

  useEffect(() => {
    const fetchUserData = async () => {
      if (!receiver) return;

      try {
        const res = await api.get(`/user/otheruser/${receiver}`);
        const data = unwrapResponse(res);

        console.log("CHAT USER DATA:", data);

        setUserData(data);
      } catch (err) {
        console.error("User fetch error:", err);
        setUserData(null);
      }
    };

    fetchUserData();
  }, [receiver]);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!receiver) return;

      try {
        receivedIdsRef.current = new Set();

        const res = await api.get(`/chat/messages/${receiver}`);

        const rawMessages = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.data)
          ? res.data.data
          : [];

        const normalizedMessages = rawMessages.map(normalizeMessage);

        normalizedMessages.forEach((message) => {
          receivedIdsRef.current.add(getMessageKey(message));
        });

        setMessages(normalizedMessages);

        await markChatAsSeen();
      } catch (err) {
        console.error("Messages fetch error:", err);
        setMessages([]);
      }
    };

    fetchMessages();
  }, [receiver]);

  useEffect(() => {
    let connection;

    const connect = async () => {
      if (!receiver) return;

      connection = new signalR.HubConnectionBuilder()
        .withUrl(`${API_BASE_URL}/chathub`, {
          accessTokenFactory: () => localStorage.getItem("token"),
        })
        .withAutomaticReconnect()
        .build();

      connection.on("ReceiveMessage", async (message) => {
        const normalized = normalizeMessage(message);

        const senderMatches =
          normalizeUsername(normalized.sender) === normalizeUsername(receiver);

        const receiverMatches =
          normalizeUsername(normalized.receiver) ===
          normalizeUsername(currentUsername);

        if (senderMatches && receiverMatches) {
          addMessageSafely(normalized);
          await markChatAsSeen();
        }
      });

      connection.on("ReceiveOwnMessage", (message) => {
        const normalized = normalizeMessage(message);

        const senderMatches =
          normalizeUsername(normalized.sender) ===
          normalizeUsername(currentUsername);

        const receiverMatches =
          normalizeUsername(normalized.receiver) === normalizeUsername(receiver);

        if (senderMatches && receiverMatches) {
          addMessageSafely(normalized);
        }
      });

      connection.on("MessageError", (message) => {
        setErrorMessage(message || "Message could not be sent.");

        setTimeout(() => {
          setErrorMessage("");
        }, 3500);
      });

      try {
        await connection.start();
        connectionRef.current = connection;
        console.log("ChatWindow ChatHub connected");
      } catch (err) {
        console.error("ChatWindow SignalR connection error:", err);
      }
    };

    dispatch(setActiveChat(receiver));
    dispatch(clearUnreadForUser(receiver));

    connect();

    return () => {
      dispatch(setActiveChat(null));
      connection?.stop();
      connectionRef.current = null;
    };
  }, [receiver, currentUsername, dispatch]);

  const handleSend = async (text) => {
    if (!text.trim() || !connectionRef.current || !receiver) return;

    try {
      setErrorMessage("");
      await connectionRef.current.invoke("SendMessage", receiver, text.trim());
    } catch (err) {
      console.error("Send message failed:", err);
      setErrorMessage("Message could not be sent.");
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <img src={getUserImage()} alt="avatar" style={styles.avatar} />

        <div style={styles.headerInfo}>
          <div style={styles.username} onClick={handleClickProfile}>
            {getDisplayName()}
          </div>

          <div style={styles.subInfo}>{getSubInfo()}</div>
        </div>
      </div>

      {errorMessage && <div style={styles.errorBox}>{errorMessage}</div>}

      <div style={styles.messages}>
        {messages.map((msg, index) => {
          const isMe =
            normalizeUsername(msg.sender) === normalizeUsername(currentUsername);

          return (
            <div
              key={msg.id || `${msg.sender}-${msg.dateTime}-${index}`}
              style={{
                ...styles.messageBubble,
                alignSelf: isMe ? "flex-end" : "flex-start",
                backgroundColor: isMe ? "#dbeafe" : "#f1f5f9",
              }}
            >
              <div style={styles.messageText}>{msg.content}</div>
              <div style={styles.messageTime}>{formatTime(msg.dateTime)}</div>
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      <MessageInput onSend={handleSend} />
    </div>
  );
};

export default ChatWindow;

const styles = {
  wrapper: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    backgroundColor: "#ffffff",
  },

  header: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 16px",
    borderBottom: "1px solid #e5e7eb",
    backgroundColor: "#ffffff",
  },

  avatar: {
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    objectFit: "cover",
    flexShrink: 0,
  },

  headerInfo: {
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },

  username: {
    fontSize: "15px",
    fontWeight: 600,
    color: "#111827",
    cursor: "pointer",
  },

  subInfo: {
    fontSize: "12px",
    color: "#6b7280",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  errorBox: {
    margin: "10px 16px 0",
    padding: "10px 12px",
    borderRadius: "10px",
    backgroundColor: "#fee2e2",
    color: "#991b1b",
    fontSize: "13px",
    fontWeight: 500,
  },

  messages: {
    flex: 1,
    padding: "20px",
    backgroundColor: "#f8fafc",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    overflowY: "auto",
  },

  messageBubble: {
    display: "flex",
    flexDirection: "column",
    padding: "12px 16px",
    borderRadius: "18px",
    maxWidth: "70%",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
    wordBreak: "break-word",
  },

  messageText: {
    fontSize: "15px",
    lineHeight: "1.5",
    color: "#111827",
    whiteSpace: "pre-wrap",
  },

  messageTime: {
    alignSelf: "flex-end",
    marginTop: "4px",
    fontSize: "11px",
    opacity: 0.55,
  },
};