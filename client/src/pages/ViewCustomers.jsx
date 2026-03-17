import { useEffect, useState } from 'react'
import {
  collection,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  addDoc,
  query,
  where,
  Timestamp,
} from 'firebase/firestore'
import { db } from '../firebase'

const diffDays = (start, end) => {
  const s = new Date(start)
  const e = new Date(end)
  return Math.max(1, Math.ceil((e - s) / (1000 * 60 * 60 * 24)))
}

const calculateDueDate = (startDate, endDate, totalAmount, paidAmount) => {
  if (!startDate) return null

  const start = new Date(startDate)
  const end = new Date(endDate)

  // If nothing paid → due date = start date
  if (!paidAmount || paidAmount <= 0) {
    return start.toISOString().split('T')[0]
  }

  // If fully paid → due date = end date + 1
  if (paidAmount >= totalAmount) {
    const full = new Date(end)
    full.setDate(full.getDate() + 1)
    return full.toISOString().split('T')[0]
  }

  // Partial payment → each ₹100 = 1 day
  const coveredDays = Math.floor(paidAmount / 100)

  const due = new Date(start)
  due.setDate(due.getDate() + coveredDays)

  return due.toISOString().split('T')[0]
}

const remainingDaysFromToday = dueDate => {
  const today = new Date()
  const due = new Date(dueDate)
  return Math.ceil((due - today) / (1000 * 60 * 60 * 24))
}

export default function ViewCustomers({ setPage }) {
  const [customers, setCustomers] = useState([])
  const [payments, setPayments] = useState([])
  const [search, setSearch] = useState('')

  const [editingId, setEditingId] = useState(null)
  const [paymentId, setPaymentId] = useState(null)
  const [holidayId, setHolidayId] = useState(null)
  const [renewId, setRenewId] = useState(null)
  const [historyId, setHistoryId] = useState(null)

  const [amount, setAmount] = useState('')
  const [paymentType, setPaymentType] = useState('cash')
  const [holidayCount, setHolidayCount] = useState('')
  const [holidayType, setHolidayType] = useState('customer')

  const [renewData, setRenewData] = useState({
    startDate: '',
    endDate: '',
    messType: 'general',
    totalAmount: 2400,
    paid: '',
    paymentType: 'cash',
  })

  // 🔁 Auto-update renew end date when start date changes
  useEffect(() => {
    if (renewId && renewData.startDate) {
      const start = new Date(renewData.startDate)
      const end = new Date(start)
      end.setDate(start.getDate() + 29)

      setRenewData(prev => ({
        ...prev,
        endDate: end.toISOString().split('T')[0],
      }))
    }
  }, [renewData.startDate, renewId])

  // 🔄 Fetch customers
  const fetchCustomers = async () => {
    const snap = await getDocs(collection(db, 'customers'))
    setCustomers(snap.docs.map(d => ({ docId: d.id, ...d.data() })))
  }

  // 🔄 Fetch payments
  const fetchPayments = async () => {
    const snap = await getDocs(collection(db, 'payments'))
    setPayments(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  }

  useEffect(() => {
    fetchCustomers()
    fetchPayments()
  }, [])

  const filteredCustomers = customers.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  )

  // ✏️ Edit
  const handleEditChange = (docId, field, value) => {
    setCustomers(prev =>
      prev.map(c => (c.docId === docId ? { ...c, [field]: value } : c))
    )
  }

  const saveEdit = async c => {
    if (!c.name.trim()) return alert('Name required')
    if (!/^\d{10}$/.test(c.phone))
      return alert('Invalid phone number')
    if (!window.confirm('Save changes?')) return
    await updateDoc(doc(db, 'customers', c.docId), {
      name: c.name,
      phone: c.phone,
      messType: c.messType,
    })
    setEditingId(null)
    fetchCustomers()
  }

  // 💰 Add payment (SAFE)
  const addPayment = async c => {
    const pay = Number(amount)
    if (!pay || pay <= 0) return alert('Enter valid amount')
    if (c.paid + pay > c.totalAmount)
      return alert(`Remaining: ₹${c.totalAmount - c.paid}`)

    const newPaid = c.paid + pay
    const newDueDate = calculateDueDate(
      c.startDate,
      c.endDate,
      c.totalAmount,
      newPaid
    )

    // 1️⃣ update customer totals
    await updateDoc(doc(db, 'customers', c.docId), {
      paid: newPaid,
      remaining: c.totalAmount - newPaid,
      dueDate: newDueDate,
    })

    // 2️⃣ save payment separately
    await addDoc(collection(db, 'payments'), {
      customerId: c.docId,
      customerName: c.name,
      subscriptionId: c.currentSubscriptionId,
      amount: pay,
      paymentType,
      date: Timestamp.now(),
    })

    setAmount('')
    setPaymentType('cash')
    setPaymentId(null)
    fetchCustomers()
    fetchPayments()
  }

  // 📅 Holidays
  const addHolidays = async c => {
    const count = Number(holidayCount)
    if (!count || count <= 0) return alert('Invalid holiday count')

    const newEnd = new Date(c.endDate)
    newEnd.setDate(newEnd.getDate() + count)

    let customerHolidays = c.customerHolidays || 0
    let ownerHolidays = c.ownerHolidays || 0

    if (holidayType === 'customer') {
      customerHolidays += count
    } else {
      ownerHolidays += count
    }

    let newDueDate = c.dueDate || null

    if (c.paid === c.totalAmount) {
      const due = new Date(newEnd)
      due.setDate(due.getDate() + 1)
      newDueDate = due.toISOString().split('T')[0]
    }

    await updateDoc(doc(db, 'customers', c.docId), {
      endDate: newEnd.toISOString().split('T')[0],
      customerHolidays,
      ownerHolidays,
      dueDate: newDueDate,
    })

    setHolidayCount('')
    setHolidayId(null)
    fetchCustomers()
  }

  // 🔁 Renew
  const initRenew = c => {
    const start = new Date(c.endDate)
    start.setDate(start.getDate() + 1)
    const end = new Date(start)
    end.setDate(end.getDate() + 30)

    setRenewData({
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      messType: c.messType,
      totalAmount: c.gender === 'female' ? 2000 : 2400,
      paid: '',
      paymentType: 'cash',
    })

    cancelForms()
    setRenewId(c.docId)
  }

  const saveRenew = async c => {
    const total = Number(renewData.totalAmount)
    const paid = Number(renewData.paid || 0)

    // 🔐 VALIDATIONS
    if (!renewData.startDate) return alert('Start date required')
    if (!renewData.endDate) return alert('End date required')

    if (new Date(renewData.endDate) <= new Date(renewData.startDate))
      return alert('End date must be after start date')

    if (!total || total <= 0)
      return alert('Total amount must be greater than 0')

    if (paid < 0) return alert('Paid amount cannot be negative')

    if (paid > total) return alert('Paid amount cannot exceed total')

    if (paid > 0 && !renewData.paymentType)
      return alert('Select payment type')

    // 🔁 subscription safety
    if (new Date(renewData.startDate) <= new Date(c.endDate))
      return alert('Renew start date must be after current end date')

    // 🧾 PROCESS
    // 🔑 subscription id (Mobile Safe)
    const newSubId =
      Date.now().toString() + Math.random().toString(16).slice(2)

    const dueDate = calculateDueDate(
      renewData.startDate,
      renewData.endDate,
      total,
      paid
    )

    await updateDoc(doc(db, 'customers', c.docId), {
      startDate: renewData.startDate,
      endDate: renewData.endDate,
      messType: renewData.messType,
      totalAmount: total,
      paid,
      remaining: total - paid,
      dueDate,
      currentSubscriptionId: newSubId,
      customerHolidays: 0,
      ownerHolidays: 0,
    })

    if (paid > 0) {
      await addDoc(collection(db, 'payments'), {
        customerId: c.docId,
        customerName: c.name,
        subscriptionId: newSubId,
        amount: paid,
        paymentType: renewData.paymentType,
        date: Timestamp.now(),
      })
    }
    alert("Renew successful ✅")
    setRenewId(null)
    fetchCustomers()
    fetchPayments()
  }
  const deleteCustomer = async c => {
    if (!window.confirm(`Delete ${c.name}?`)) return
    await deleteDoc(doc(db, 'customers', c.docId))
    fetchCustomers()
  }

  const cancelForms = () => {
    setEditingId(null)
    setPaymentId(null)
    setHolidayId(null)
    setRenewId(null)
    setHistoryId(null)
    setAmount('')
    setHolidayCount('')
  }

  return (
    <div className="container">
      <button className="top-right" onClick={() => setPage('home')}>
        ⬅ Back to Home
      </button>

      <h2>👀 View Customers</h2>

      <input
        className="search"
        placeholder="Search by Name / Phone"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      {
        filteredCustomers.map(c => {
          const formOpen =
            editingId === c.docId ||
            paymentId === c.docId ||
            holidayId === c.docId ||
            renewId === c.docId ||
            historyId === c.docId;
          return (
            < div key={c.docId} className="card" >
              <p><b>Name:</b> {c.name}</p>
              <p><b>Phone:</b> {c.phone}</p>
              <p><b>Gender:</b> {c.gender}</p>
              <p><b>Mess:</b> {c.messType}</p>
              <p><b>Start:</b> {c.startDate}</p>
              <p>
                <b>End:</b> {c.endDate}
                {(c.customerHolidays > 0 || c.ownerHolidays > 0) && (
                  <span style={{ color: '#555' }}>
                    {' '}
                    (
                    {c.customerHolidays > 0 && `+${c.customerHolidays} by customer`}
                    {c.customerHolidays > 0 && c.ownerHolidays > 0 && ', '}
                    {c.ownerHolidays > 0 && `+${c.ownerHolidays} by owner`}
                    )
                  </span>
                )}
              </p>
              <p><b>Total:</b> ₹{c.totalAmount}</p>
              <p><b>Paid:</b> ₹{c.paid || 0}</p>
              <p><b>Remaining:</b> ₹{c.remaining}</p>

              {c.dueDate && (
                <p>
                  <b>Next Due:</b> {c.dueDate}{' '}
                  <span style={{ color: remainingDaysFromToday(c.dueDate) < 0 ? 'red' : 'green' }}>
                    ({remainingDaysFromToday(c.dueDate)} days)
                  </span>
                </p>
              )}

              {!formOpen && (
                <div className="actions">
                  <button onClick={() => { cancelForms(); setEditingId(c.docId) }}>✏️ Edit</button>
                  <button onClick={() => { cancelForms(); setPaymentId(c.docId) }} disabled={c.remaining === 0}>💰 Add Money</button>
                  <button onClick={() => { cancelForms(); setHistoryId(c.docId) }}>📜 History</button>
                  <button onClick={() => {
                    cancelForms()
                    setHolidayType('customer') // 👈 reset default
                    setHolidayId(c.docId)
                  }}>
                    📅 Holidays
                  </button>
                  <button onClick={() => initRenew(c)}>🔁 Renew</button>
                  <button onClick={() => deleteCustomer(c)}>🗑 Delete</button>
                </div>
              )}

              {historyId === c.docId && (
                <div className="inline">
                  <div>
                    {payments
                      .filter(p => p.customerId === c.docId &&
                        p.subscriptionId === c.currentSubscriptionId)
                      .map((p, i) => (
                        <div className="historyItem" key={i}>
                          <span>₹{p.amount}</span>
                          <span>{p.paymentType}</span>
                          <span>{p.date.toDate().toLocaleDateString()}</span>
                        </div>
                      ))}
                  </div>
                  <button onClick={cancelForms}>⬅ Close</button>
                </div>
              )}

              {paymentId === c.docId && (
                <div className="inline">
                  <input
                    type="number"
                    placeholder="Enter amount"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                  />
                  <select value={paymentType} onChange={e => setPaymentType(e.target.value)}>
                    <option value="cash">Cash</option>
                    <option value="online">Online</option>
                  </select>
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

                  <select
                    value={holidayType}
                    onChange={e => setHolidayType(e.target.value)}
                  >
                    <option value="customer">Customer Holiday</option>
                    <option value="owner">Owner Holiday</option>
                  </select>

                  <button onClick={() => addHolidays(c)}>Apply</button>
                  <button onClick={cancelForms}>Cancel</button>
                </div>
              )}

              {renewId === c.docId && (
                <div className="renew-box">
                  <div className="inline">

                    <label>Start Date</label>
                    <input
                      type="date"
                      value={renewData.startDate}
                      onChange={e =>
                        setRenewData({ ...renewData, startDate: e.target.value })
                      }
                    />

                    <label>End Date</label>
                    <input
                      type="date"
                      value={renewData.endDate}
                      onChange={e =>
                        setRenewData({ ...renewData, endDate: e.target.value })
                      }
                    />

                    <label>Total Amount</label>
                    <input
                      type="number"
                      value={renewData.totalAmount}
                      onChange={e =>
                        setRenewData({ ...renewData, totalAmount: e.target.value })
                      }
                    />

                    <label>Paid Amount</label>
                    <input
                      type="number"
                      value={renewData.paid}
                      onChange={e =>
                        setRenewData({ ...renewData, paid: e.target.value })
                      }
                    />

                    <label>Payment Type</label>
                    <select
                      value={renewData.paymentType}
                      onChange={e =>
                        setRenewData({ ...renewData, paymentType: e.target.value })
                      }
                    >
                      <option value="cash">Cash</option>
                      <option value="online">Online</option>
                    </select>

                    <button onClick={() => saveRenew(c)}>Save</button>
                    <button onClick={cancelForms}>Cancel</button>

                  </div>
                </div>
              )}

              {editingId === c.docId && (
                <>
                  <label>Name</label>
                  <input
                    value={c.name}
                    onChange={e =>
                      handleEditChange(c.docId, 'name', e.target.value)
                    }
                  />

                  <label>Phone</label>
                  <input
                    value={c.phone}
                    onChange={e =>
                      handleEditChange(c.docId, 'phone', e.target.value)
                    }
                  />

                  <label>Mess Type</label>
                  <select
                    value={c.messType}
                    onChange={e =>
                      handleEditChange(c.docId, 'messType', e.target.value)
                    }
                  >
                    <option value="general">General</option>
                    <option value="morning">Only Morning</option>
                    <option value="night">Only Night</option>
                  </select>

                  <div className="inline">
                    <button onClick={() => saveEdit(c)}>💾 Save</button>
                    <button onClick={cancelForms}>⬅ Cancel</button>
                  </div>
                </>
              )}

            </div>
          )
        })
      }
      <style>{`
  .container {
    padding: 15px;
    background: #f4f6f8;
    min-height: 100vh;
  }

  h2 {
    text-align: center;
    margin-bottom: 15px;
  }

  .top-right {
    width: 100%;
    margin-bottom: 15px;
    padding: 12px;
    border-radius: 8px;
    border: none;
    background: #667eea;
    color: white;
    font-size: 16px;
  }

  .search {
    width: 100%;
    padding: 12px;
    margin-bottom: 15px;
    border-radius: 8px;
    border: 1px solid #ccc;
    font-size: 16px;
  }

  .card {
    background: #fff;
    padding: 16px;
    border-radius: 12px;
    margin-bottom: 15px;
    box-shadow: 0 3px 10px rgba(0,0,0,0.08);
  }

 input, select {
  width: 100%;
  padding: 11px;
  margin-bottom: 6px;
  border-radius: 6px;
  border: 1px solid #ccc;
  font-size: 15px;
  box-sizing: border-box;
}

  label {
    font-size: 13px;
    font-weight: 600;
    margin-top: 6px;
  }

  button {
    padding: 8px 12px;
    border-radius: 6px;
    border: none;
    cursor: pointer;
  }

  /* 📱 MOBILE (default) */

  .actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
}

  .actions button {
    width: 100%;
  }

  .inline {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 12px;
  padding: 12px;
  background: #f9fafc;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

  /* ⭐ Renew form box */
 .renew-box {
  margin-top: 14px;
  padding: 14px;
  border-radius: 10px;
  background: #f9fafc;
  border: 1px solid #e0e0e0;
}
  
.historyItem{
  display:flex;
  justify-content:space-between;
  background:white;
  padding:8px 10px;
  border-radius:6px;
  border:1px solid #eee;
  font-size:14px;
}

  /* 💻 DESKTOP (restore old style) */

  @media (min-width: 768px) {
    .container {
      max-width: 1000px;
      margin: auto;
    }

    .top-right {
      position: absolute;
      top: 20px;
      right: 20px;
      width: auto;
    }

    .actions {
      flex-direction: row;
      flex-wrap: wrap;
    }

    .actions button {
      width: auto;
    }

    .inline {
      flex-direction: column;
      flex-wrap: wrap;
    }

    .inline input,
    .inline select {
      width: auto;
      flex: 1;
      min-width: 140px;
    }
  }
`}</style>

    </div >
  )
}
