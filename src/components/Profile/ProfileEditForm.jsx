import React, { useState } from "react";
import defaultAvatar from "../../assets/default-avatar.png";
import api from "../../services/api"
import { useLocation } from "react-router-dom";
export default function ProfileEditForm() {

 const location = useLocation();
 const { user } = location.state || {};

 console.log(user)
  const [username, setUsername] = useState(user?.username || '');
  const [email,setEmail]=useState(user?.email || '')
  const [fullname,setFullname]=useState(user?.fullname || '')
  const [skills,setSkills]=useState(user?.skills,'')
  const [experience,setExperience]=useState(user.experience || '')
  const [bio,setBio]=useState(user?.bio,'')
  const [oldPassword,setOldPassword]=useState('')
  const [newPassword,setNewPassword]=useState('')
  const [secret, setSecret] = useState(user?.visibility === "Private");
  const [file,setFile]=useState(null)

const handleSave = async () => {
  try {
    const formData = new FormData();
    formData.append("Username", username);
    formData.append("Email", email);
    formData.append("FullName", fullname);
    formData.append("Skills", skills);
    formData.append("Experience", experience);
    formData.append("Bio", bio);
    formData.append("OldPassword", oldPassword);
    formData.append("NewPassword", newPassword);
    formData.append("Visibility", secret ? 1 : 0);

    if (file) {
      formData.append("File", file); 
    }

    const response = await api.put("/User/profile", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    console.log(response.data);
    alert("Profile updated successfully!");
  } catch (err) {
    console.error(err);
    alert("Error updating profile!");
  }
};


 
  return (
    <div style={styles.mainContainer}>
      <div style={styles.formWrapper}>
        {/* Avatar Section */}
        <div style={styles.avatarSection}>
          <img src={defaultAvatar} alt="Profile" style={styles.avatar} />
          <label style={styles.changePhotoLabel}>
            <input type="file" style={{ display: "none" }}  onChange={(e) => setFile(e.target.files[0])} accept="image/*"/>
            Change Photo
          </label>
        </div>

        {/* Form Fields */}
        <div style={styles.formFields}>
          {/* Username, Email, Full Name */}
          <div style={styles.row}>
            <input style={styles.input} placeholder="Username" value={username} onChange={(e)=> setUsername(e.target.value)} />
            <input style={styles.input} placeholder="Email"  value={email} onChange={(e) => setEmail(e.target.value)}/>
            <input style={styles.input} placeholder="Full Name" value={fullname} onChange={(e)=> setFullname(e.target.value)}/>
          </div>

          {/* Skills, Experience */}
          <div style={styles.row}>
            <input style={styles.input} placeholder="Skills" value={skills} onChange={(e)=> setSkills(e.target.value)} />
            <input style={styles.input} placeholder="Experience" value={experience} onChange={(e)=>setExperience(e.target.value)} />
          </div>
 
          {/* Bio (full width) */}
          <div style={styles.row}>
            <textarea
              style={{
                ...styles.input,
                flex: "1 1 100%",
                height: 150,
                paddingTop: 10, 
                resize: "none",  
                lineHeight: "1.5em", 
                overflowY: "auto",  
              }}
              placeholder="Bio"
              value={bio}
              onChange={(e)=> setBio(e.target.value)}
            />
          </div>

          {/* Passwords */}
          <div style={styles.row}>
            <input
              style={styles.input}
              placeholder="Old Password"
              type="password"
            />
            <input
              style={styles.input}
              placeholder="New Password"
              type="password"
            />
          </div>

          {/* Secret Account */}
          <label style={styles.checkboxLabel}>
            <input type="checkbox" style={styles.checkbox} value={secret} onChange={(e)=>setSecret(e.target.checked)} />
            Secret Account
          </label>

          {/* Save Button */}
          <button style={styles.saveButton} onClick={handleSave}>Save Changes</button>
        </div>

      </div>
    </div>
  );
}

const styles = {
  mainContainer: {
    width: "100%",
    minHeight: "100vh",
    background: "linear-gradient(135deg, #e0f7fa, #f3e5f5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontFamily:
      "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    padding: "20px",
  },

  formWrapper: {
    width: "80%",
    maxWidth: "900px",
    backgroundColor: "#fff",
    borderRadius: "20px",
    boxShadow: "0 15px 30px rgba(0,0,0,0.1)",
    padding: "40px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "40px",
  },

  avatarSection: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "15px",
  },

  avatar: {
    width: "100px",
    height: "100px",
    borderRadius: "50%",
    objectFit: "cover",
    border: "4px solid #4db6ac",
    boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
  },

  changePhotoLabel: {
    cursor: "pointer",
    backgroundColor: "#4db6ac",
    color: "#fff",
    padding: "8px 16px",
    borderRadius: "12px",
    fontWeight: "600",
    boxShadow: "0 3px 8px rgba(0,0,0,0.15)",
    transition: "all 0.3s ease",
  },

  formFields: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: "25px",
  },

  row: {
    display: "flex",
    gap: "20px",
    flexWrap: "wrap",
    justifyContent: "center",
  },

  input: {
    flex: "1 1 250px",
    height: "42px",
    borderRadius: "12px",
    border: "2px solid #bdbdbd",
    padding: "0 15px",
    fontSize: "14px",
    backgroundColor: "#f9f9f9",
    transition: "all 0.3s ease",
    outline: "none",
  },

  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    cursor: "pointer",
    fontWeight: "500",
    color: "#555",
  },

  checkbox: {
    width: "18px",
    height: "18px",
    cursor: "pointer",
  },

  saveButton: {
    backgroundColor: "#4db6ac",
    color: "#fff",
    padding: "12px 30px",
    borderRadius: "12px",
    fontWeight: "600",
    fontSize: "16px",
    border: "none",
    cursor: "pointer",
    alignSelf: "center",
    transition: "all 0.3s ease",
    boxShadow: "0 5px 15px rgba(77,182,172,0.3)",
  },
};
