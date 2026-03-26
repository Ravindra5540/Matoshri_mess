import { auth } from "../firebase";
import { signOut } from "firebase/auth";
import { useEffect, useState } from "react";  

export default function Home({ setPage, setUser }) {
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("https://matoshri-mess.onrender.com/api/test")
      .then(res => res.json())
      .then(data => setMessage(data.message))
      .catch(err => {
        console.error(err);
        setMessage("❌ Backend not connected");
      });
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);     // clear user
      setPage("login");  // go back to login page
    } catch (error) {
      alert("Logout failed");
    }
  };

  return (
    <div className="container">

      {/* Logout Button */}
      <button className="logoutBtn" onClick={handleLogout}>
        🚪 Logout
      </button>

      <div className="card">
        <h1>🍽 Matoshri Bhojnalay</h1>
        <p className="subtitle">Choose an option to continue</p>
        {/* ✅ SHOW BACKEND MESSAGE */}
        <p style={{ color: "green", marginBottom: "10px" }}>
          {message}
        </p>

        <div className="buttons">
          <button onClick={() => setPage('dashboard')}>
            📊 Dashboard
          </button>

          <button onClick={() => setPage('addCustomer')}>
            ➕ Add Customer
          </button>

          <button onClick={() => setPage('viewCustomers')}>
            👀 View Customers
          </button>

          <button onClick={() => setPage('analysis')}>
            🔔 Alerts
          </button>
        </div>
      </div>

      <style>{`
        .container{
          min-height:100vh;
          display:flex;
          justify-content:center;
          align-items:center;
          padding:20px;
          background:linear-gradient(135deg,#667eea,#764ba2);
          position:relative;
        }

        .card{
          background:white;
          padding:30px;
          border-radius:14px;
          width:100%;
          max-width:500px;
          text-align:center;
          box-shadow:0 10px 30px rgba(0,0,0,0.2);
        }

        h1{
          margin-bottom:10px;
        }

        .subtitle{
          color:#666;
          margin-bottom:25px;
        }

        .buttons{
          display:grid;
          gap:15px;
          grid-template-columns:1fr;
        }

        .buttons button{
          padding:18px;
          font-size:18px;
          border:none;
          border-radius:10px;
          background:#667eea;
          color:white;
          cursor:pointer;
          transition:0.2s;
        }

        .buttons button:hover{
          background:#5566dd;
          transform:scale(1.03);
        }

        /* Logout Button */
        .logoutBtn{
          position:absolute;
          top:20px;
          right:20px;
          padding:10px 16px;
          font-size:14px;
          border:none;
          border-radius:8px;
          background:#ff4d4d;
          color:white;
          cursor:pointer;
          transition:0.3s;
        }

        .logoutBtn:hover{
          background:#e60000;
          transform:scale(1.05);
        }

        /* Tablet */
        @media(min-width:600px){
          .buttons{
            grid-template-columns:1fr 1fr;
          }

          .logoutBtn{
            font-size:15px;
            padding:12px 18px;
          }
        }

        /* Desktop */
        @media(min-width:1000px){
          .buttons{
            grid-template-columns:1fr 1fr;
          }

          .logoutBtn{
            font-size:16px;
            padding:12px 20px;
          }
        }

      `}</style>
    </div>
  )
}