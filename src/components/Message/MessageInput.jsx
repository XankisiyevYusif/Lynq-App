import React, { useState } from 'react';

const MessageInput = ({ onSend }) => {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim() === '') return;

    if (onSend) {
      onSend(message);  
    }

 
    setMessage('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={styles.container}>

      <input
        type="text"
        placeholder="Type a message..."
        style={styles.input}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <button style={styles.button} onClick={handleSend}>
        Gönder
      </button>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    padding: '10px',
    borderTop: '1px solid #eee',
  },
  input: {
    flex: 1,
    padding: '10px 14px',
    fontSize: '14px',
    borderRadius: '20px',
    border: '1px solid #ccc',
    outline: 'none',
    marginRight: '10px',
  },
  button: {
    padding: '8px 16px',
    fontSize: '14px',
    backgroundColor: '#0a66c2',
    color: 'white',
    border: 'none',
    borderRadius: '20px',
    cursor: 'pointer',
    fontWeight: '600',
  },

 
};

export default MessageInput;
