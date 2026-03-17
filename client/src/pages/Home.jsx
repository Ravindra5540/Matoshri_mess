export default function Home({ setPage }) {
  return (
    <div className="container">
      <div className="card">
        <h1>🍽 Matoshri Bhojnalay</h1>
        <p className="subtitle">Choose an option to continue</p>

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

        /* Tablet */
        @media(min-width:600px){
          .buttons{
            grid-template-columns:1fr 1fr;
          }
        }

        /* Desktop */
        @media(min-width:1000px){
          .buttons{
            grid-template-columns:1fr 1fr;
          }
        }

      `}</style>
    </div>
  )
}