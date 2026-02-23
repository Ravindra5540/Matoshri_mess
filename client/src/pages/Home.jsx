export default function Home({ setPage }) {
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>🍽 Mess Management System</h1>
        <p style={styles.subtitle}>Choose an option to continue</p>

        <div style={styles.buttons}>
          <button style={styles.btn} onClick={() => setPage('dashboard')}>
            📊 Dashboard
          </button>

          <button style={styles.btn} onClick={() => setPage('addCustomer')}>
            ➕ Add New Customer
          </button>

          <button style={styles.btn} onClick={() => setPage('viewCustomers')}>
            👀 View Customers
          </button>

          <button style={styles.btn} onClick={() => setPage('analysis')}>
            📈 Analysis
          </button>
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
  },
  card: {
    background: '#fff',
    padding: 30,
    borderRadius: 12,
    width: '100%',
    maxWidth: 500,
    textAlign: 'center',
    boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
  },
  title: {
    marginBottom: 10,
  },
  subtitle: {
    color: '#555',
    marginBottom: 25,
  },
  buttons: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 15,
    justifyContent: 'center',
  },
  btn: {
    padding: '12px 18px',
    borderRadius: 8,
    border: 'none',
    cursor: 'pointer',
    background: '#667eea',
    color: '#fff',
    fontSize: 15,
    minWidth: 180,
  },
}