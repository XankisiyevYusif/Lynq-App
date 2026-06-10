import React, { useState } from 'react';
import ChatList from './ChatList';
import ChatWindow from './ChatWindow';
import Navbar from '../Layout/Navbar';
import { useParams } from 'react-router-dom';
import { useEffect } from 'react';
const MessagePage = () => {

  const { username } = useParams();
  const [selectedReceiver, setSelectedReceiver] = useState(null);

  useEffect(() => {
    if (username) {
      setSelectedReceiver(username);
      console.log("Receiver set:", username);
    }
  }, [username]);


  return (
    <div style={styles.mainContainer}>
      <Navbar/>
      <div style={styles.container}>
        <div style={styles.sidebar}>
          <ChatList onSelect={setSelectedReceiver} oldSelectedUser={selectedReceiver}  />
        </div>
        <div style={styles.chatWindow}>
          {selectedReceiver ? (  
            <ChatWindow receiver={selectedReceiver} />
          ) : (
            <div style={styles.placeholder}>
              <p>Bir konuşma seçin.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  mainContainer: {
    height: '100vh',
    width: '100vw',
    backgroundColor: '#f3f4f6',
    overflow: 'hidden',
  },

  container: {
    display: 'flex',

    /* 🔥 RESPONSIVE MARGIN */
    margin: 'clamp(8px, 2vw, 24px)',

    /* 🔥 RESPONSIVE HEIGHT */
    height: 'calc(100vh - 68px - clamp(8px, 2vw, 24px) * 2)',
    // 68px = navbar height

    maxWidth: 'clamp(100%, 95vw, 2000px)',

    border: '1.5px solid #e5e7eb',
    borderRadius: '16px',

    backgroundColor: '#ffffff',

    boxShadow: `
      0 4px 12px rgba(0,0,0,0.05),
      0 8px 24px rgba(0,0,0,0.08)
    `,

    overflow: 'hidden',
  },

  sidebar: {
    flex: '0 0 clamp(280px, 28vw, 360px)', // 👈 SOL PANEL RESPONSIVE
    backgroundColor: '#f8fafc',
    borderRight: '1.5px solid #e5e7eb',

    overflowY: 'auto',
    overflowX: 'hidden',
  },

  chatWindow: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },

  placeholder: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',

    color: '#94a3b8',
    fontStyle: 'italic',
    fontSize: '15px',
  },
};


export default MessagePage;
