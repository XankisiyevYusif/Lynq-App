import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useDispatch } from "react-redux";

import ChatList from "./ChatList";
import ChatWindow from "./ChatWindow";
import Navbar from "../Layout/Navbar";

import { setMessagesPageOpen } from "../../store/messageSlice";
import "./MessageTheme.css";

const MessagePage = () => {
  const dispatch = useDispatch();
  const { username } = useParams();
  const [selectedReceiver, setSelectedReceiver] = useState(null);

  useEffect(() => {
    if (username) {
      setSelectedReceiver(username);
      console.log("Receiver set:", username);
    }
  }, [username]);

  useEffect(() => {
    dispatch(setMessagesPageOpen(true));

    return () => {
      dispatch(setMessagesPageOpen(false));
    };
  }, [dispatch]);

  return (
    <div className="messages-page" style={styles.mainContainer}>
      <Navbar />
      <div className="messages-shell" style={styles.container}>
        <div className="messages-sidebar" style={styles.sidebar}>
          <ChatList
            onSelect={setSelectedReceiver}
            oldSelectedUser={selectedReceiver}
          />
        </div>
        <div className="messages-window" style={styles.chatWindow}>
          {selectedReceiver ? (
            <ChatWindow receiver={selectedReceiver} />
          ) : (
            <div className="messages-placeholder" style={styles.placeholder}>
              <p>Select a conversation.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  mainContainer: {
    height: "100vh",
    width: "100vw",
    backgroundColor: "var(--app-bg)",
    overflow: "hidden",
  },

  container: {
    display: "flex",

    /* 🔥 RESPONSIVE MARGIN */
    margin: "clamp(8px, 2vw, 24px)",

    /* 🔥 RESPONSIVE HEIGHT */
    height: "calc(100vh - 68px - clamp(8px, 2vw, 24px) * 2)",
    // 68px = navbar height

    maxWidth: "clamp(100%, 95vw, 2000px)",

    border: "1.5px solid var(--app-border)",
    borderRadius: "16px",

    backgroundColor: "var(--app-surface)",

    boxShadow: `
      0 4px 12px rgba(0,0,0,0.05),
      0 8px 24px rgba(0,0,0,0.08)
    `,

    overflow: "hidden",
  },

  sidebar: {
    flex: "0 0 clamp(280px, 28vw, 360px)", // 👈 SOL PANEL RESPONSIVE
    backgroundColor: "var(--app-surface-2)",
    borderRight: "1.5px solid var(--app-border)",

    overflowY: "auto",
    overflowX: "hidden",
  },

  chatWindow: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    backgroundColor: "var(--app-surface)",
    overflow: "hidden",
  },

  placeholder: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",

    color: "var(--app-muted)",
    fontStyle: "italic",
    fontSize: "15px",
  },
};

export default MessagePage;
