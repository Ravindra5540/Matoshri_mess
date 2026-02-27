import { useEffect, useState } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../firebase'
import { Pie } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend)

export default function Dashboard({ setPage }) {
  const [customers, setCustomers] = useState([])
  const [payments, setPayments] = useState([])
  const [days, setDays] = useState(7)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 600)

  // Detect screen resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 600)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const fetchData = async () => {
    const customerSnap = await getDocs(collection(db, 'customers'))
    const paymentSnap = await getDocs(collection(db, 'payments'))

    setCustomers(
      customerSnap.docs.map(d => ({
        docId: d.id,
        ...d.data(),
      }))
    )

    setPayments(
      paymentSnap.docs.map(d => ({
        id: d.id,
        ...d.data(),
      }))
    )
  }

  useEffect(() => {
    fetchData()
  }, [])

  const today = new Date()

  // Active & expired customers
  const activeCustomers = customers.filter(
    c => c.endDate && new Date(c.endDate) >= today
  )

  const expiredCustomers = customers.filter(
    c => c.endDate && new Date(c.endDate) < today
  ).length

  // Basic stats
  const totalCustomers = activeCustomers.length

  const totalCollected = activeCustomers.reduce(
    (a, c) => a + Number(c.paid || 0),
    0
  )

  const totalRemaining = activeCustomers.reduce(
    (a, c) => a + Number(c.remaining || 0),
    0
  )

  // Ending soon (≤ 5 days)
  const endingSoon = activeCustomers.filter(c => {
    const diff = Math.ceil(
      (new Date(c.endDate) - today) / (1000 * 60 * 60 * 24)
    )
    return diff <= 5 && diff >= 0
  }).length

  // Pending payments
  const pendingPayments = activeCustomers.filter(
    c => Number(c.remaining || 0) > 0
  ).length

  // Gender count
  const maleCount = activeCustomers.filter(c => c.gender === 'male').length
  const femaleCount = activeCustomers.filter(c => c.gender === 'female').length

  // Payment calculations
  let cashTotal = 0
  let onlineTotal = 0
  let recentCollection = 0

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const fromDate = new Date(todayStart)
  fromDate.setDate(fromDate.getDate() - Number(days))

  payments.forEach(p => {
    const payDate = p?.date?.toDate?.()

    if (p.paymentType === 'cash') {
      cashTotal += Number(p.amount || 0)
    }

    if (p.paymentType === 'online') {
      onlineTotal += Number(p.amount || 0)
    }

    if (!payDate) return

    const paymentDateOnly = new Date(payDate)
    paymentDateOnly.setHours(0, 0, 0, 0)

    if (paymentDateOnly >= fromDate) {
      recentCollection += Number(p.amount || 0)
    }
  })

  // Pie chart (mess type)
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
      },
    ],
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>📊 Dashboard</h1>
        <button
          style={{
            ...styles.backBtn,
            width: isMobile ? '100%' : 'auto',
          }}
          onClick={() => setPage('home')}
        >
          ⬅ Back
        </button>
      </div>

      <div style={styles.cards}>
        {[
          { title: 'Total Active Customers', value: totalCustomers },
          { title: 'Total Collected', value: `₹${totalCollected}` },
          { title: 'Total Remaining', value: `₹${totalRemaining}` },
          { title: 'Ending in ≤ 5 days', value: endingSoon },
          { title: 'Pending Payments', value: pendingPayments },
          { title: 'Male Customers', value: maleCount },
          { title: 'Female Customers', value: femaleCount },
          { title: 'Expired Customers', value: expiredCustomers },
          { title: 'Paid by Cash', value: `₹${cashTotal}` },
          { title: 'Paid by Online', value: `₹${onlineTotal}` },
        ].map((item, index) => (
          <div
            key={index}
            style={{
              ...styles.card,
              flex: isMobile ? '1 1 100%' : '1 1 200px',
            }}
          >
            <h3>{item.title}</h3>
            <p>{item.value}</p>
          </div>
        ))}

        <div
          style={{
            ...styles.card,
            flex: isMobile ? '1 1 100%' : '1 1 200px',
          }}
        >
          <h3>Money in Last {days} Days</h3>
          <input
            type="number"
            value={days}
            onChange={e => setDays(e.target.value)}
            style={{
              width: '100%',
              padding: 8,
              marginBottom: 10,
            }}
          />
          <p>₹{recentCollection}</p>
        </div>
      </div>

      <div
        style={{
          marginTop: 30,
          maxWidth: isMobile ? '100%' : 500,
          marginLeft: 'auto',
          marginRight: 'auto',
          padding: isMobile ? '0 10px' : 0,
        }}
      >
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
    flexWrap: 'wrap',
    gap: 10,
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
    padding: 20,
    background: '#fff',
    borderRadius: 10,
    boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
    textAlign: 'center',
  },
}