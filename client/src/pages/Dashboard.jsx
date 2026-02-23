import { useEffect, useState } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../firebase'
import { Pie } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend)

export default function Dashboard({ setPage }) {
  const [customers, setCustomers] = useState([])

  const fetchCustomers = async () => {
    const snapshot = await getDocs(collection(db, 'customers'))
    const list = snapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }))
    setCustomers(list)
  }

  useEffect(() => {
    fetchCustomers()
  }, [])

  // Only active customers (endDate >= today)
  const today = new Date()
  const activeCustomers = customers.filter(c => new Date(c.endDate) >= today)

  // Stats
  const totalCustomers = activeCustomers.length
  const totalCollected = activeCustomers.reduce((acc, c) => acc + (Number(c.paid) || 0), 0)
  const totalRemaining = activeCustomers.reduce((acc, c) => acc + (Number(c.remaining) || 0), 0)

  // Customers ending soon (≤ 5 days)
  const endingSoon = activeCustomers.filter(c => {
    const end = new Date(c.endDate)
    const diffDays = Math.ceil((end - today) / (1000 * 60 * 60 * 24))
    return diffDays <= 5 && diffDays >= 0
  }).length

  // Customers with pending payments
  const pendingPayments = activeCustomers.filter(c => Number(c.remaining) > 0).length

  // Pie chart data (customers by mess type)
  const messCounts = activeCustomers.reduce(
    (acc, c) => {
      acc[c.messType] = (acc[c.messType] || 0) + 1
      return acc
    },
    { general: 0, morning: 0, night: 0 }
  )

  const pieData = {
    labels: ['General', 'Only Morning', 'Only Night'],
    datasets: [
      {
        data: [messCounts.general, messCounts.morning, messCounts.night],
        backgroundColor: ['#667eea', '#f6ad55', '#48bb78'],
        hoverOffset: 4,
      },
    ],
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>📊 Dashboard</h1>
        <button style={styles.backBtn} onClick={() => setPage('home')}>
          ⬅ Back
        </button>
      </div>

      <div style={styles.cards}>
        <div style={styles.card}>
          <h3>Total Customers</h3>
          <p>{totalCustomers}</p>
        </div>
        <div style={styles.card}>
          <h3>Total Collected</h3>
          <p>₹{totalCollected}</p>
        </div>
        <div style={styles.card}>
          <h3>Total Remaining</h3>
          <p>₹{totalRemaining}</p>
        </div>
        <div style={styles.card}>
          <h3>Ending in ≤ 5 days</h3>
          <p>{endingSoon}</p>
        </div>
        <div style={styles.card}>
          <h3>Pending Payments</h3>
          <p>{pendingPayments}</p>
        </div>
      </div>

      <div style={{ marginTop: 30, maxWidth: 500, marginLeft: 'auto', marginRight: 'auto' }}>
        <h3 style={{ textAlign: 'center' }}>Customers by Mess Type</h3>
        <Pie data={pieData} />
      </div>
    </div>
  )
}

const styles = {
  container: {
    padding: 20,
    background: '#f4f6f8',
    minHeight: '100vh',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backBtn: {
    padding: '8px 12px',
    border: 'none',
    borderRadius: 6,
    background: '#667eea',
    color: '#fff',
    cursor: 'pointer',
  },
  cards: {
    display: 'flex',
    gap: 15,
    marginTop: 20,
    flexWrap: 'wrap',
  },
  card: {
    flex: '1 1 200px',
    padding: 20,
    background: '#fff',
    borderRadius: 10,
    boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
    textAlign: 'center',
  },
}