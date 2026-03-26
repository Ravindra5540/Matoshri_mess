import { useState, useEffect } from 'react'
import Home from './pages/Home'
import AddCustomer from './pages/AddCustomer'
import ViewCustomers from './pages/ViewCustomers'
import Analysis from './pages/Analysis'
import Dashboard from './pages/Dashboard'
import Upcoming from './pages/Upcoming'
import Overdue from './pages/Overdue'
import Expired from './pages/Expired'
import Login from './pages/Login'

import { initialCustomers } from './data'

// 🔐 Firebase Auth
import { auth } from './firebase'
import { onAuthStateChanged, signOut } from 'firebase/auth'

export default function App() {
  const [page, setPage] = useState('home')

  // 🔐 USER STATE
  const [user, setUser] = useState(null)

  const [customers, setCustomers] = useState(() => {
    const saved = localStorage.getItem('customers')
    return saved ? JSON.parse(saved) : initialCustomers
  })

  // 💾 Save customers to localStorage
  useEffect(() => {
    localStorage.setItem('customers', JSON.stringify(customers))
  }, [customers])

  // 🔐 AUTH LISTENER + REDIRECTION
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)

      if (u) {
        setPage('home')
      } else {
        setPage('login')
      }
    })
    return () => unsub()
  }, [])

  // 🔥 AUTO LOGOUT AFTER 30s INACTIVITY
  useEffect(() => {
    if (!user) return

    let timer

    const logoutUser = () => {
      signOut(auth)
      setUser(null)
      setPage('login')
      alert("Logged out due to inactivity")
    }

    const resetTimer = () => {
      clearTimeout(timer)
      timer = setTimeout(logoutUser, 30000) // 30 sec
    }

    // Activity listeners
    window.addEventListener("mousemove", resetTimer)
    window.addEventListener("keydown", resetTimer)
    window.addEventListener("click", resetTimer)
    window.addEventListener("touchstart", resetTimer)

    // Start timer
    resetTimer()

    return () => {
      clearTimeout(timer)
      window.removeEventListener("mousemove", resetTimer)
      window.removeEventListener("keydown", resetTimer)
      window.removeEventListener("click", resetTimer)
      window.removeEventListener("touchstart", resetTimer)
    }
  }, [user])

  // 📱 BACK BUTTON HANDLING
  useEffect(() => {
    const handleBack = () => {
      if (page === 'home') {
        const confirmExit = window.confirm("Are you sure you want to exit?")
        
        if (confirmExit) {
          window.history.back()
        } else {
          window.history.pushState({}, '')
        }

      } else {
        setPage('home')
        window.history.pushState({}, '')
      }
    }

    window.history.pushState({}, '')
    window.addEventListener('popstate', handleBack)

    return () => window.removeEventListener('popstate', handleBack)
  }, [page])

  // ❌ NOT LOGGED IN → SHOW LOGIN
  if (!user) return <Login setUser={setUser} />

  // ❌ ONLY YOUR EMAIL CAN ACCESS
  if (user.email !== "ravindrarajhans03@gmail.com") {
    return (
      <div style={{ textAlign: "center", marginTop: "50px" }}>
        <h2>Access Denied ❌</h2>
        
        <button onClick={() => {
          signOut(auth)
          setUser(null)
        }}>
          Logout
        </button>
      </div>
    )
  }

  // ✅ YOUR APP
  return (
    <>
      {page === 'home' && (
        <Home setPage={setPage} setUser={setUser} />
      )}

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