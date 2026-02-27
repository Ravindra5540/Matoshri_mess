import { useEffect, useState } from 'react'

export default function Analysis({ setPage }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 600)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 600)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const cardStyle = color => ({
    background: '#fff',
    padding: isMobile ? 20 : 25,
    borderRadius: 12,
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    cursor: 'pointer',
    transition: '0.3s',
    borderLeft: `6px solid ${color}`,
  })

  const containerStyle = {
    display: 'grid',
    gridTemplateColumns: isMobile
      ? '1fr'
      : 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: 20,
    marginTop: 30,
  }

  return (
    <div
      style={{
        padding: isMobile ? 20 : 30,
        background: '#f4f6f8',
        minHeight: '100vh',
      }}
    >
      {/* Back Button */}
      <button
        onClick={() => setPage('home')}
        style={{
          marginBottom: 20,
          padding: '6px 12px',
          borderRadius: 6,
          border: 'none',
          background: '#333',
          color: '#fff',
          cursor: 'pointer',
          width: isMobile ? '100%' : 'auto',
        }}
      >
        ⬅ Back
      </button>

      {/* Title */}
      <h2 style={{ textAlign: 'center' }}>
        📊 Analysis Dashboard
      </h2>

      {/* Cards */}
      <div style={containerStyle}>
        {/* Upcoming */}
        <div
          style={cardStyle('green')}
          onClick={() => setPage('upcoming')}
        >
          <h3 style={{ color: 'green' }}>🟢 Upcoming Due</h3>
          <p>View customers whose due date is approaching.</p>
        </div>

        {/* Overdue */}
        <div
          style={cardStyle('red')}
          onClick={() => setPage('overdue')}
        >
          <h3 style={{ color: 'red' }}>🔴 Overdue Customers</h3>
          <p>View customers who have crossed their due date.</p>
        </div>

        {/* Expired */}
        <div
          style={cardStyle('#444')}
          onClick={() => setPage('expired')}
        >
          <h3 style={{ color: '#444' }}>⚫ Expired Customers</h3>
          <p>View customers whose subscription has ended.</p>
        </div>
      </div>
    </div>
  )
}