import { useState, useEffect } from 'react'
import Home from './pages/Home'
import AddCustomer from './pages/AddCustomer'
import ViewCustomers from './pages/ViewCustomers'
import Analysis from './pages/Analysis'
import Dashboard from './pages/Dashboard'
import Upcoming from './pages/Upcoming'
import Overdue from './pages/Overdue'
import Expired from './pages/Expired'
import { initialCustomers } from './data'

export default function App() {
  const [page, setPage] = useState('home')

  const [customers, setCustomers] = useState(() => {
    const saved = localStorage.getItem('customers')
    return saved ? JSON.parse(saved) : initialCustomers
  })

  // Save customers to localStorage
  useEffect(() => {
    localStorage.setItem('customers', JSON.stringify(customers))
  }, [customers])

  return (
    <>
      {page === 'home' && <Home setPage={setPage} />}

      {page === 'addCustomer' && (
        <AddCustomer
          setPage={setPage}
          customers={customers}
          setCustomers={setCustomers}
        />
      )}

      {page === 'viewCustomers' && (
        <ViewCustomers
          setPage={setPage}
          customers={customers}
          setCustomers={setCustomers}
        />
      )}

      {page === 'analysis' && <Analysis setPage={setPage} />}

      {page === 'dashboard' && <Dashboard setPage={setPage} />}
      {page === 'upcoming' && <Upcoming setPage={setPage} />}
{page === 'overdue' && <Overdue setPage={setPage} />}
{page === 'expired' && <Expired setPage={setPage} />}
    </>
  )
}