import { useEffect, useState } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../firebase'

const remainingDays = date => {
  const today = new Date()
  const d = new Date(date)
  return Math.ceil((d - today) / (1000 * 60 * 60 * 24))
}

export default function Upcoming({ setPage }) {
  const [customers, setCustomers] = useState([])
  const [days, setDays] = useState('')
  const [filtered, setFiltered] = useState([])
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 600)

  // Detect screen resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 600)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const fetchCustomers = async () => {
      const snap = await getDocs(collection(db, 'customers'))
      const data = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }))
      setCustomers(data)
    }

    fetchCustomers()
  }, [])

  useEffect(() => {
    const n = Number(days)

    if (!n || n <= 0) {
      setFiltered([])
      return
    }

    const list = customers.filter(c => {
      if (!c.dueDate) return false
      const diff = remainingDays(c.dueDate)
      return diff >= 0 && diff <= n
    })

    setFiltered(list)
  }, [days, customers])

  return (
    <div
      style={{
        padding: isMobile ? 20 : 30,
        background: '#f4f6f8',
        minHeight: '100vh'
      }}
    >
      {/* Back Button */}
      <button
        onClick={() => setPage('analysis')}
        style={{
          marginBottom: 20,
          padding: '8px 12px',
          borderRadius: 6,
          border: 'none',
          background: '#333',
          color: '#fff',
          cursor: 'pointer',
          width: isMobile ? '100%' : 'auto'
        }}
      >
        ⬅ Back
      </button>

      <h2 style={{ textAlign: 'center' }}>
        🟢 Upcoming Due Customers
      </h2>

      {/* Input */}
      <div style={{ margin: '20px 0' }}>
        <input
          type="number"
          placeholder="Enter upcoming days"
          value={days}
          onChange={e => setDays(e.target.value)}
          style={{
            padding: 10,
            width: isMobile ? '100%' : 250,
            borderRadius: 6,
            border: '1px solid #ccc'
          }}
        />
      </div>

      {/* Show only if input entered */}
      {days > 0 && (
        <>
          <h3>Total Customers = {filtered.length}</h3>

          {filtered.map(c => {
            const diff = remainingDays(c.dueDate)

            return (
              <div
                key={c.id}
                style={{
                  background: '#fff',
                  padding: isMobile ? 15 : 20,
                  marginBottom: 15,
                  borderRadius: 8,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                  borderLeft: '6px solid green'
                }}
              >
                <p><b>Name:</b> {c.name}</p>
                <p><b>Phone:</b> {c.phone}</p>
                <p><b>Gender:</b> {c.gender}</p>
                <p><b>Mess Type:</b> {c.messType}</p>
                <p><b>Start Date:</b> {c.startDate}</p>

                <p>
                  <b>End Date:</b> {c.endDate}
                  {c.holidays > 0 && (
                    <span style={{ color: '#555' }}>
                      {' '} (+{c.holidays} holidays)
                    </span>
                  )}
                </p>

                <p><b>Due Date:</b> {c.dueDate}</p>

                <p><b>Total Amount:</b> ₹{c.totalAmount}</p>
                <p><b>Paid:</b> ₹{c.paid || 0}</p>

                <p>
                  <b>Remaining:</b>{' '}
                  <span style={{ color: c.remaining > 0 ? 'red' : 'green' }}>
                    ₹{c.remaining}
                  </span>
                </p>

                <p style={{ color: 'green', fontWeight: 'bold' }}>
                  Due in {diff} days
                </p>
              </div>
            )
          })}

          {filtered.length === 0 && (
            <p>No customers due in next {days} days</p>
          )}
        </>
      )}
    </div>
  )
}