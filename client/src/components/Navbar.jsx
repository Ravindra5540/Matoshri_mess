export default function Navbar({ setPage }) {
  return (
    <nav style={{ padding: 10, borderBottom: '1px solid #ccc' }}>
      <button onClick={() => setPage('dashboard')}>Dashboard</button>{' '}
      <button onClick={() => setPage('customers')}>Customers</button>{' '}
      <button onClick={() => setPage('holidays')}>Holidays</button>
    </nav>
  )
}