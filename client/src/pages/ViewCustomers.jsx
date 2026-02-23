import { useEffect, useState } from 'react'
import {
  collection,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore'
import { db } from '../firebase'

export default function ViewCustomers({ setPage }) {
  const [customers, setCustomers] = useState([])
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [paymentId, setPaymentId] = useState(null)
  const [holidayId, setHolidayId] = useState(null)
  const [renewId, setRenewId] = useState(null)

  const [amount, setAmount] = useState('')
  const [holidayCount, setHolidayCount] = useState('')

  const [renewData, setRenewData] = useState({
    startDate: '',
    endDate: '',
    messType: 'general',
    totalAmount: 2400,
    paid: '',
  })

  // 🔹 Fetch customers
  const fetchCustomers = async () => {
    const snapshot = await getDocs(collection(db, 'customers'))
    const list = snapshot.docs.map(docu => ({
      docId: docu.id,
      ...docu.data(),
    }))
    setCustomers(list)
  }

  useEffect(() => {
    fetchCustomers()
  }, [])

  // 🔍 Search
  const filteredCustomers = customers.filter(c => {
    const name = c?.name?.toLowerCase() || ''
    const phone = c?.phone || ''
    const id = c?.customerId || ''

    return (
      name.includes(search.toLowerCase()) ||
      phone.includes(search) ||
      id.includes(search)
    )
  })

  // ✏️ Edit local
  const handleEditChange = (docId, field, value) => {
    setCustomers(prev =>
      prev.map(c =>
        c.docId === docId ? { ...c, [field]: value } : c
      )
    )
  }

  // 💾 Save edit with confirmation
  const saveEdit = async (c) => {
    if (!window.confirm('Are you sure you want to save changes for this customer?')) return

    await updateDoc(doc(db, 'customers', c.docId), {
      name: c.name,
      phone: c.phone,
      startDate: c.startDate,
      endDate: c.endDate,
      messType: c.messType,
    })

    alert('Customer updated')
    setEditingId(null)
    fetchCustomers()
  }

  // 💰 Add payment with confirmation
  const addPayment = async (c) => {
    const pay = Number(amount)
    const alreadyPaid = Number(c.paid || 0)
    const total = Number(c.totalAmount)

    if (!pay || pay <= 0) {
      alert('Enter valid amount')
      return
    }

    if (alreadyPaid + pay > total) {
      alert(`Payment exceeds total amount. Remaining: ₹${total - alreadyPaid}`)
      return
    }

    if (!window.confirm(`Are you sure you want to add ₹${pay} to this customer?`)) return

    const paid = alreadyPaid + pay
    const remaining = total - paid

    await updateDoc(doc(db, 'customers', c.docId), {
      paid,
      remaining,
    })

    setAmount('')
    setPaymentId(null)
    fetchCustomers()
  }

  // 📅 Add holidays with confirmation
  const addHolidays = async (c) => {
    const count = Number(holidayCount)
    if (!count || count <= 0) {
      alert('Enter valid holiday count')
      return
    }

    if (!window.confirm(`Are you sure you want to add ${count} holidays?`)) return

    const end = new Date(c.endDate)
    end.setDate(end.getDate() + count)
    const newEndDate = end.toISOString().split('T')[0]

    await updateDoc(doc(db, 'customers', c.docId), {
      endDate: newEndDate,
    })

    alert(`End date extended by ${count} days`)
    setHolidayCount('')
    setHolidayId(null)
    fetchCustomers()
  }

  // 🔁 Init Renew
  const initRenew = (c) => {
    const prevEnd = new Date(c.endDate)
    prevEnd.setDate(prevEnd.getDate() + 1)
    const startDate = prevEnd.toISOString().split('T')[0]

    const end = new Date(startDate)
    end.setDate(end.getDate() + 30)
    const endDate = end.toISOString().split('T')[0]

    setRenewData({
      startDate,
      endDate,
      messType: 'general',
      totalAmount: 2400,
      paid: '',
    })

    // ❌ Reset other forms so only renew visible
    setEditingId(null)
    setPaymentId(null)
    setHolidayId(null)
    setRenewId(c.docId)
  }

  // 🔁 Save Renew with confirmation
  const saveRenew = async (c) => {
    const total = Number(renewData.totalAmount)
    const paid = Number(renewData.paid)

    if (!total || total <= 0) {
      alert('Enter valid total amount')
      return
    }

    if (paid < 0 || paid > total) {
      alert('Paid amount must be less than or equal to total')
      return
    }

    if (!window.confirm('Are you sure you want to renew this customer?')) return

    await updateDoc(doc(db, 'customers', c.docId), {
      startDate: renewData.startDate,
      endDate: renewData.endDate,
      messType: renewData.messType,
      totalAmount: total,
      paid,
      remaining: total - paid,
    })

    alert('Customer renewed successfully')
    setRenewId(null)
    fetchCustomers()
  }

  // 🗑 Delete
  const deleteCustomer = async (c) => {
    if (!window.confirm(`Are you sure you want to delete ${c.name}?`)) return
    await deleteDoc(doc(db, 'customers', c.docId))
    alert('Customer deleted')
    fetchCustomers()
  }

  // 🔹 Cancel forms
  const cancelForms = () => {
    setEditingId(null)
    setPaymentId(null)
    setHolidayId(null)
    setRenewId(null)
    setAmount('')
    setHolidayCount('')
  }

  return (
    <div className="container">
      {/* ✅ Back to home top right */}
      <button className="top-right" onClick={() => setPage('home')}>
        ⬅ Back to Home
      </button>

      <h2>👀 View Customers</h2>

      <input
        className="search"
        placeholder="Search by Name / Phone / ID"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      {filteredCustomers.length === 0 && (
        <p style={{ textAlign: 'center' }}>No customers found</p>
      )}

      {filteredCustomers.map(c => (
        <div key={c.docId} className="card">

          {editingId === c.docId ? (
            <>
              <label>Name</label>
              <input value={c.name} onChange={e => handleEditChange(c.docId, 'name', e.target.value)} />

              <label>Phone</label>
              <input value={c.phone} onChange={e => handleEditChange(c.docId, 'phone', e.target.value)} />

              <label>Start Date</label>
              <input type="date" value={c.startDate} onChange={e => handleEditChange(c.docId, 'startDate', e.target.value)} />

              <label>End Date</label>
              <input type="date" value={c.endDate} onChange={e => handleEditChange(c.docId, 'endDate', e.target.value)} />

              <label>Mess Type</label>
              <select value={c.messType} onChange={e => handleEditChange(c.docId, 'messType', e.target.value)}>
                <option value="general">General</option>
                <option value="morning">Only Morning</option>
                <option value="night">Only Night</option>
              </select>

              <div className="inline">
                <button onClick={() => saveEdit(c)}>💾 Save</button>
                <button onClick={cancelForms}>⬅ Cancel</button>
              </div>
            </>
          ) : (
            <>
              <p><b>ID:</b> {c.customerId}</p>
              <p><b>Name:</b> {c.name}</p>
              <p><b>Phone:</b> {c.phone}</p>
              <p><b>Mess:</b> {c.messType}</p>
              <p><b>Start:</b> {c.startDate}</p>
              <p><b>End:</b> {c.endDate}</p>
              <p><b>Total:</b> ₹{c.totalAmount}</p>
              <p><b>Paid:</b> ₹{c.paid || 0}</p>
              <p><b>Remaining:</b> ₹{c.remaining}</p>

              <div className="actions">
                <button onClick={() => { cancelForms(); setEditingId(c.docId) }}>✏️ Edit</button>
                <button onClick={() => { cancelForms(); setPaymentId(c.docId) }} disabled={c.remaining === 0}>💰 Add Money</button>
                <button onClick={() => { cancelForms(); setHolidayId(c.docId) }}>📅 Holidays</button>
                <button onClick={() => initRenew(c)}>🔁 Renew</button>
                <button onClick={() => deleteCustomer(c)}>🗑 Delete</button>
              </div>
            </>
          )}

          {paymentId === c.docId && (
            <div className="inline">
              <input
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={e => setAmount(e.target.value)}
              />
              <button onClick={() => addPayment(c)}>Add</button>
              <button onClick={cancelForms}>⬅ Cancel</button>
            </div>
          )}

          {holidayId === c.docId && (
            <div className="inline">
              <input
                type="number"
                placeholder="No. of holidays"
                value={holidayCount}
                onChange={e => setHolidayCount(e.target.value)}
              />
              <button onClick={() => addHolidays(c)}>Apply</button>
              <button onClick={cancelForms}>⬅ Cancel</button>
            </div>
          )}

          {renewId === c.docId && (
            <div className="inline">
              <input
                type="date"
                value={renewData.startDate}
                onChange={e => setRenewData({ ...renewData, startDate: e.target.value })}
              />
              <input
                type="date"
                value={renewData.endDate}
                onChange={e => setRenewData({ ...renewData, endDate: e.target.value })}
              />
              <select
                value={renewData.messType}
                onChange={e => setRenewData({ ...renewData, messType: e.target.value })}
              >
                <option value="general">General</option>
                <option value="morning">Only Morning</option>
                <option value="night">Only Night</option>
              </select>
              <input
                type="number"
                placeholder="Total Amount"
                value={renewData.totalAmount}
                onChange={e => setRenewData({ ...renewData, totalAmount: e.target.value })}
              />
              <input
                type="number"
                placeholder="Initial Paid"
                value={renewData.paid}
                onChange={e => setRenewData({ ...renewData, paid: e.target.value })}
              />
              <button onClick={() => saveRenew(c)}>Save</button>
              <button onClick={cancelForms}>⬅ Cancel</button>
            </div>
          )}
        </div>
      ))}

      <style>{`
        .container {
          padding: 20px;
          background: #f4f6f8;
          min-height: 100vh;
          position: relative;
        }
        h2 {
          text-align: center;
        }
        .top-right {
          position: absolute;
          top: 20px;
          right: 20px;
          padding: 6px 10px;
          cursor: pointer;
        }
        .search {
          width: 100%;
          padding: 10px;
          margin-bottom: 15px;
        }
        .card {
          background: #fff;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 15px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.1);
        }
        input, select {
          width: 100%;
          padding: 6px;
          margin-bottom: 8px;
        }
        .actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 10px;
        }
        .inline {
          display: flex;
          gap: 8px;
          margin-top: 10px;
        }
        button {
          padding: 6px 10px;
          cursor: pointer;
        }
        button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  )
}