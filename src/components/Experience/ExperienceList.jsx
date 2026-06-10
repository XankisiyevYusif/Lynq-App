import { useState, useEffect } from "react";
import experienceService from "../Experience/services/experienceService";
import AddExperienceForm from "./AddExperienceForm";
import EditExperienceForm from "./EditExperienceForm";
import ExperienceItem from "./ExperienceItem";

export default function ExperienceList() {
  const [experiences, setExperiences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [editingExp, setEditingExp] = useState(null);
  const [deletingExp, setDeletingExp] = useState(null);

 const fetchExperiences = async () => {
      setLoading(true);
      try {
        const result = await experienceService.getAllExperiences();
        if (result.success) {
          setExperiences(result.experiences);
        } else {
          setError(result.message || "Failed to fetch experiences");
        }
      } catch (err) {
        setError("Failed to fetch experiences");
      } finally {
        setLoading(false);
      }
    };

    useEffect(()=> {
      fetchExperiences()
    },[isAdding])


  const handleUpdateExperience = (updatedExp) => {
    setExperiences((prev) =>
      prev.map((exp) => (exp.id === updatedExp.id ? updatedExp : exp))
    );
    setEditingExp(null);
  };
console.log(experiences)
  const handleDeleteExperience = async (id) => {
    debugger;
    const result = await experienceService.deleteExperience(id);
    if (result.success) {
      setExperiences((prev) => prev.filter((exp) => exp.id !== id));
    } else {
      alert(result.message || "Failed to delete");
    }
    setDeletingExp(null);
  };

  return (
    <div style={styles.mainContainer}>
      <div style={styles.header}>
        <p style={styles.title}>Experiences</p>
        <button style={styles.addBtn} onClick={()=> setIsAdding(true)}>
          + Add
        </button>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* Təcrübələr siyahısı */}
      {experiences.map((exp) => (
        <ExperienceItem
          key={exp.id}
          experience={exp}
          onEdit={() => setEditingExp(exp)}
          onDelete={() => setDeletingExp(exp)}
        />
      ))}

      {/* Yeni təcrübə əlavə modal */}
      {isAdding && (
        <div style={modalStyles.overlay}>
          <div style={modalStyles.modal}>
            <AddExperienceForm
              onClose={() => setIsAdding(false)}
            />
          </div>
        </div>
      )}

      {/* Redaktə modal */}
      {editingExp && (
        <div style={modalStyles.overlay}>
          <div style={modalStyles.modal}>
            <EditExperienceForm
              experience={editingExp}
              onUpdate={handleUpdateExperience}
              onClose={() => setEditingExp(null)}
            />
          </div>
        </div>
      )}

      {/* Silmə təsdiqi modal */}
      {deletingExp && (
        <div style={modalStyles.overlay}>
          <div style={modalStyles.confirmModal}>
            <p>“{deletingExp.title}” təcrübəsini silmək istədiyinizə əminsiniz?</p>
            <div style={modalStyles.confirmButtons}>
              <button
                style={{ ...styles.addBtn, backgroundColor: "#dc3545" }}
                onClick={() => handleDeleteExperience(deletingExp.id)}
              >
                Bəli, sil
              </button>
              <button
                style={{ ...styles.addBtn, backgroundColor: "#6c757d" }}
                onClick={() => setDeletingExp(null)}
              >
                Ləğv et
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ====================== Styles ======================

const styles = {
  mainContainer: {
    width: "668px",
    backgroundColor: "#fff",
    borderRadius: "12px",
    padding: "16px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    fontFamily: `"Segoe UI", Roboto, Helvetica, Arial, sans-serif`,
    position: "relative",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  },
  title: {
    fontWeight: 600,
    fontSize: "1.2rem",
  },
  addBtn: {
    padding: "6px 12px",
    backgroundColor: "#007bff",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
};

const modalStyles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modal: {
    backgroundColor: "#fff",
    padding: "20px",
    borderRadius: "12px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
    width: "500px",
    maxHeight: "90vh",
    overflowY: "auto",
  },
  confirmModal: {
    backgroundColor: "#fff",
    padding: "20px",
    borderRadius: "12px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
    textAlign: "center",
  },
  confirmButtons: {
    marginTop: "20px",
    display: "flex",
    justifyContent: "center",
    gap: "10px",
  },
};
