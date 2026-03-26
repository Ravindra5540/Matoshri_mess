import { auth, provider } from "../firebase";
import { signInWithPopup } from "firebase/auth";

export default function Login({ setUser }) {

  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      setUser(result.user);
    } catch (err) {
      alert("Login failed");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Welcome Back 👋</h2>
        <p style={styles.subtitle}>Sign in to continue</p>

        <button onClick={handleLogin} style={styles.button}>
          <img
            src="https://cdn-icons-png.flaticon.com/512/2991/2991148.png"
            alt="google"
            style={styles.icon}
          />
          Sign in with Google
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    padding: "20px",
  },

  card: {
    background: "#fff",
    padding: "40px 30px",
    borderRadius: "15px",
    textAlign: "center",
    width: "100%",
    maxWidth: "350px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
  },

  title: {
    marginBottom: "10px",
    fontSize: "24px",
    fontWeight: "bold",
  },

  subtitle: {
    marginBottom: "25px",
    color: "#666",
    fontSize: "14px",
  },

  button: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    width: "100%",
    padding: "12px",
    fontSize: "16px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    background: "#4285F4",
    color: "#fff",
    fontWeight: "bold",
    transition: "0.3s",
  },

  icon: {
    width: "20px",
    height: "20px",
  },
};