import { useState } from "react";

export default function ContactInfoForm({ user, setUser }) {

  const [phone, setPhone] = useState(user.phone || "");
  const [phoneType, setPhoneType] = useState(user.phoneType || "Ev");
  const [address, setAddress] = useState(user.address || "");

  const [birthMonth, setBirthMonth] = useState(user.birthMonth || "");
  const [birthDay, setBirthDay] = useState(user.birthDay || "");

  const save = () => {

    setUser(prev => ({
      ...prev,
      phone,
      phoneType,
      address,
      birthMonth,
      birthDay
    }));

  };

  return (
    <div>

      <div style={styles.title}>İletişim bilgilerini düzenleyin</div>

 

      {/* Email */}
      <div style={styles.field}>

        <label style={styles.label}>E-posta</label>

        <a
          href={`mailto:${user.email}`}
          style={styles.link}
        >
          {user.email}
        </a>

      </div>

      {/* Phone */}
      <div style={styles.field}>

        <label style={styles.label}>Telefon numarası</label>

        <input
          style={styles.input}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

      </div>

      {/* Phone type */}
      <div style={styles.field}>

        <label style={styles.label}>Telefon türü</label>

        <select
          style={styles.select}
          value={phoneType}
          onChange={(e) => setPhoneType(e.target.value)}
        >
          <option>Ev</option>
          <option>Mobil</option>
          <option>İş</option>
        </select>

      </div>

      {/* Address */}
      <div style={styles.field}>

        <label style={styles.label}>Adres*</label>

        <textarea
          style={styles.textarea}
          maxLength={220}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />

        <div style={styles.counter}>
          {address.length}/220
        </div>

      </div>

      {/* Birth */}
      <div style={styles.field}>

        <label style={styles.label}>Doğum günü</label>

        <div style={styles.birthRow}>

          <select
            style={styles.select}
            value={birthMonth}
            onChange={(e) => setBirthMonth(e.target.value)}
          >
            <option>Ay</option>
            <option>Ocak</option>
            <option>Şubat</option>
            <option>Mart</option>
            <option>Nisan</option>
            <option>Mayıs</option>
            <option>Haziran</option>
            <option>Temmuz</option>
            <option>Ağustos</option>
            <option>Eylül</option>
            <option>Ekim</option>
            <option>Kasım</option>
            <option>Aralık</option>
          </select>

          <select
            style={styles.select}
            value={birthDay}
            onChange={(e) => setBirthDay(e.target.value)}
          >
            <option>Gün</option>
            {[...Array(31)].map((_, i) => (
              <option key={i}>{i + 1}</option>
            ))}
          </select>

        </div>

      </div>

      <div style={styles.actions}>

        <button style={styles.saveBtn} onClick={save}>
          Kaydet
        </button>

      </div>

    </div>
  );
}

const styles = {

  title:{
    fontSize:18,
    fontWeight:700,
    marginBottom:20
  },

  field:{
    marginBottom:20
  },

  label:{
    fontSize:13,
    fontWeight:600,
    marginBottom:6,
    display:"block"
  },

  input:{
    width:"100%",
    height:40,
    borderRadius:8,
    border:"1px solid rgba(0,0,0,0.25)",
    padding:"0 12px",
    fontSize:14
  },

  select:{
    width:"100%",
    height:40,
    borderRadius:8,
    border:"1px solid rgba(0,0,0,0.25)",
    padding:"0 10px"
  },

  textarea:{
    width:"100%",
    height:90,
    borderRadius:8,
    border:"1px solid rgba(0,0,0,0.25)",
    padding:"10px"
  },

  counter:{
    textAlign:"right",
    fontSize:11,
    color:"#777"
  },

  birthRow:{
    display:"flex",
    gap:10
  },

  link:{
    color:"#0a66c2",
    textDecoration:"none",
    fontSize:14
  },

  actions:{
    display:"flex",
    justifyContent:"flex-end",
    marginTop:20
  },

  saveBtn:{
    background:"#0073b1",
    color:"#fff",
    border:"none",
    borderRadius:20,
    padding:"8px 16px",
    cursor:"pointer",
    fontWeight:600
  }

};