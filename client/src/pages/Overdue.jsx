import { useEffect, useState } from 'react'
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore'
import { db } from '../firebase'

const remainingDays = date => {
  const today = new Date()
  const d = new Date(date)
  return Math.ceil((d - today) / (1000 * 60 * 60 * 24))
}

export default function Overdue({ setPage }) {
  const [customers, setCustomers] = useState([])
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 600)

  // Detect screen resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 600)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const fetchCustomers = async () => {
    const snap = await getDocs(collection(db, 'customers'))

    const list = snap.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(c => c.dueDate && remainingDays(c.dueDate) < 0)

    setCustomers(list)
  }

  useEffect(() => {
    fetchCustomers()
  }, [])

  const handleDelete = async id => {
    const confirmDelete = window.confirm(
      'Are you sure you want to delete this customer?'
    )
    if (!confirmDelete) return

    await deleteDoc(doc(db, 'customers', id))
    fetchCustomers()
  }

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

      <h2 style={{ textAlign: 'center', color: 'red' }}>
        🔴 Overdue Customers
      </h2>

      <h3>Total Customers = {customers.length}</h3>

      {customers.map(c => {
        const overdueDays = Math.abs(remainingDays(c.dueDate))

        return (
          <div
            key={c.id}
            style={{
              background: '#fff',
              padding: isMobile ? 15 : 20,
              marginBottom: 15,
              borderRadius: 8,
              boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
              borderLeft: '6px solid red'
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

            <p style={{ color: 'red', fontWeight: 'bold' }}>
              Overdue by {overdueDays} days
            </p>

            <button
              onClick={() => handleDelete(c.id)}
              style={{
                marginTop: 10,
                padding: '8px 12px',
                background: 'red',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                width: isMobile ? '100%' : 'auto'
              }}
            >
              ❌ Delete
            </button>
          </div>
        )
      })}

      {customers.length === 0 && (
        <p>No overdue customers 🎉</p>
      )}
    </div>
  )
}