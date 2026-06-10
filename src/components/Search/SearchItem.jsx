import React from "react";
import { useNavigate } from "react-router-dom";
import defaultAvatar from "../../assets/default-avatar.png";
import bioavatar from "../../assets/bio.png";
import { current } from "@reduxjs/toolkit";
import api from "../../services/api";
import { useState } from "react";
import { RefreshContext } from "../../context/RefreshContext";

const SearchItem = ({ user }) => {
  const navigate = useNavigate();
  const [showUnfollowModal, setShowUnfollowModal] = useState(false);
  const { refreshData, setRefreshData } = React.useContext(RefreshContext);
  const [isFollowing, setIsFollowing] = useState(user.isFollowing);
  const handleClick = () => {
    debugger;
    navigate(`/profile/${user.username}`);
  };

 
  console.log("User in SearchItem:", user);
  
    const handleFollow = async () => {
    if (!user) return;
    debugger;
    if (user.isFollowing) {
      setShowUnfollowModal(true);
    } else {
      try {
        if (user.visibility === 1) {
          await api.post(`/Follow/follow/${user.username}`);
          setRefreshData(!refreshData);
          setIsFollowing(true);

          await api.post(`/FollowRequest/send/${user.username}`);
          alert('Follow request sent!');
        }
      } catch (err) {
        console.error('Follow error:', err);
      }
    }
  };
  

  const confirmUnfollow = async () => {
    try {
      await api.post(`/Follow/unfollow/${user.username}`);
      setShowUnfollowModal(false);
      setRefreshData(!refreshData);
      setIsFollowing(false);
    } catch (err) {
      console.error('Failed to unfollow user:', err);
    }
  };
 

  return (
    <div style={styles.container}>
      <div style={styles.itemContainer}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img
            src={user.profileImage || defaultAvatar}
            alt=""
            style={styles.avatar}
          />
          <div style={styles.textContainer}  onClick={handleClick}>
            <span style={styles.name}>{user.username}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <img src={bioavatar} alt="" style={styles.bioAvatar} />
              <span style={styles.bio}>{user.bio}</span>
            </div>
          </div>
        </div>
       <button style={ isFollowing ? styles.unfollowButton: styles.button } onClick={handleFollow}>{isFollowing ? "Unfollow": "Follow"}</button>

      {showUnfollowModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
           <p>Do you want to unfollow this user?</p>
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button style={styles.cancelButton} onClick={() => setShowUnfollowModal(false)}>Cancel</button>
            <button style={styles.confirmButton} onClick={confirmUnfollow}>Unfollow</button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

const styles = {
  avatar: {
    width: 50,
    height: 50,
    borderRadius: "50%",
  },
  itemContainer: {
    display: "flex",
    padding: "10px",
    cursor: "pointer",
    borderBottom: "1px solid #eee",
    gap: 10,
    justifyContent: "space-between",
  },
  textContainer: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    gap: 5,
  },
  name: {
    fontWeight: "bold",
    fontSize: 18,
  },
  bio: {
    fontSize: 14,
    color: "#474747ff",
  },
  bioAvatar: {
    width: 20,
  },

  button: {
  backgroundColor: "#0073b1",
  color: "white",
  borderRadius: 10,
  width: "80px",    
  height: 30,
  border: "none",
  marginTop: 10,
  cursor: "pointer",  
  },

  unfollowButton: {
    backgroundColor: "#ffffffff",
    color: "black",
    borderRadius: 10,
    width: "80px",    
    height: 30,
    border: "solid 2px #464646ff",
    marginTop: 10,
    cursor: "pointer",  

  },

  modalOverlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999
  },
  modal: {
    backgroundColor: '#fff',
    padding: '25px',
    borderRadius: '12px',
    width: '300px',
    textAlign: 'center',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
  },
  cancelButton: {
    padding: '8px 12px',
    backgroundColor: '#ddd',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer'
  },
  confirmButton: {
    padding: '8px 12px',
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer'
  }
}
 

export default SearchItem;
