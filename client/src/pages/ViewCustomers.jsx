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

const calculateDueDate = (startDate, endDate, totalAmount, paid) => {
  if (!paid || paid <= 0) return startDate
  const totalDays = diffDays(startDate, endDate)
  const elapsedDays = Math.floor(totalDays * (paid / totalAmount))
  const due = new Date(startDate)
  due.setDate(due.getDate() + elapsedDays)
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

  // 1️⃣ update end date
  const newEnd = new Date(c.endDate)
  newEnd.setDate(newEnd.getDate() + count)

  // 2️⃣ accumulate holidays
  const totalHolidays = (c.holidays || 0) + count

  // 3️⃣ decide due date
  let newDueDate = c.dueDate || null

  if (c.paid === c.totalAmount) {
    const due = new Date(newEnd)
    due.setDate(due.getDate() + 1)
    newDueDate = due.toISOString().split('T')[0]
  }

  await updateDoc(doc(db, 'customers', c.docId), {
    endDate: newEnd.toISOString().split('T')[0],
    holidays: totalHolidays,
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

      {filteredCustomers.map(c => (
        <div key={c.docId} className="card">
          <p><b>Name:</b> {c.name}</p>
          <p><b>Phone:</b> {c.phone}</p>
          <p><b>Gender:</b> {c.gender}</p>
          <p><b>Mess:</b> {c.messType}</p>
          <p><b>Start:</b> {c.startDate}</p>
          <p>
          <b>End:</b> {c.endDate}
          {c.holidays > 0 && (
            <span style={{ color: '#555' }}> (+{c.holidays} holidays)</span>
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

          <div className="actions">
                <button onClick={() => { cancelForms(); setEditingId(c.docId) }}>✏️ Edit</button>
                <button onClick={() => { cancelForms(); setPaymentId(c.docId) }} disabled={c.remaining === 0}>💰 Add Money</button>
                <button onClick={() => { cancelForms(); setHistoryId(c.docId) }}>📜 History</button>
                <button onClick={() => { cancelForms(); setHolidayId(c.docId) }}>📅 Holidays</button>
                <button onClick={() => initRenew(c)}>🔁 Renew</button>
                <button onClick={() => deleteCustomer(c)}>🗑 Delete</button>
              </div>

          {historyId === c.docId && (
            <div className="inline">
              <div>
              {payments
                .filter(p => p.customerId === c.docId &&
                  p.subscriptionId === c.currentSubscriptionId)
                .map((p, i) => (
                  <p key={i}>
                    ₹{p.amount} - {p.paymentType} - {p.date.toDate().toLocaleDateString()}
                  </p>
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
              <input type="number" placeholder="No. of holidays" value={holidayCount} onChange={e => setHolidayCount(e.target.value)} />
              <button onClick={() => addHolidays(c)}>Apply</button>
              <button onClick={cancelForms}>Cancel</button>
            </div>
          )}
      {renewId === c.docId && (
        <div className="inline">
          <input
            type="date"
            value={renewData.startDate}
            onChange={e =>
              setRenewData({ ...renewData, startDate: e.target.value })
            }
          />

          <input
            type="date"
            value={renewData.endDate}
            onChange={e =>
              setRenewData({ ...renewData, endDate: e.target.value })
            }
          />

          <input
            type="number"
            placeholder="Total Amount"
            value={renewData.totalAmount}
            onChange={e =>
              setRenewData({ ...renewData, totalAmount: e.target.value })
            }
          />

          <input
            type="number"
            placeholder="Paid Amount"
            value={renewData.paid}
            onChange={e =>
              setRenewData({ ...renewData, paid: e.target.value })
            }
          />

          {/* ✅ PAYMENT TYPE */}
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
      ))}
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
    padding: 10px;
    margin-bottom: 8px;
    border-radius: 6px;
    border: 1px solid #ccc;
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
    margin-top: 10px;
  }

  .actions button {
    width: 100%;
  }

  .inline {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 10px;
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
      flex-direction: row;
      flex-wrap: wrap;
    }

    .inline input,
    .inline select {
      width: auto;
      flex: 1;
    }
  }
`}</style>
    </div>
  ) 
}
/*import { useEffect, useState } from 'react'
import {
  collection,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
} from 'firebase/firestore'
import { db } from '../firebase'

// ---------- HELPERS ----------
const diffDays = (start, end) => {
  const s = new Date(start)
  const e = new Date(end)
  return Math.max(1, Math.ceil((e - s) / (1000 * 60 * 60 * 24)))
}

const calculateDueDate = (startDate, endDate, totalAmount, paid) => {
  if (!paid || paid <= 0) return startDate

  const totalDays = diffDays(startDate, endDate)
  const ratio = paid / totalAmount
  const elapsedDays = Math.floor(totalDays * ratio)

  const due = new Date(startDate)
  due.setDate(due.getDate() + elapsedDays)

  return due.toISOString().split('T')[0]
}

const remainingDaysFromToday = (dueDate) => {
  const today = new Date()
  const due = new Date(dueDate)
  return Math.ceil((due - today) / (1000 * 60 * 60 * 24))
}

// ---------- COMPONENT ----------
export default function ViewCustomers({ setPage }) {
  const [customers, setCustomers] = useState([])
  const [search, setSearch] = useState('')

  const [editingId, setEditingId] = useState(null)
  const [paymentId, setPaymentId] = useState(null)
  const [holidayId, setHolidayId] = useState(null)
  const [renewId, setRenewId] = useState(null)
  const [historyId, setHistoryId] = useState(null)

  const [amount, setAmount] = useState('')
  const [paymentType, setPaymentType] = useState('cash')
  const [holidayCount, setHolidayCount] = useState('')

  const [renewData, setRenewData] = useState({
    startDate: '',
    endDate: '',
    messType: 'general',
    totalAmount: 2400,
    paid: '',
    paymentType: 'cash',
  })

  // ---------- FETCH ----------
  const fetchCustomers = async () => {
    const snapshot = await getDocs(collection(db, 'customers'))
    const list = snapshot.docs.map(d => ({
      docId: d.id,
      ...d.data(),
    }))
    setCustomers(list)
  }

  useEffect(() => {
    fetchCustomers()
  }, [])

  const filteredCustomers = customers.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  )

  // ---------- EDIT ----------
  const handleEditChange = (docId, field, value) => {
    setCustomers(prev =>
      prev.map(c => (c.docId === docId ? { ...c, [field]: value } : c))
    )
  }

  const saveEdit = async (c) => {
    if (!window.confirm('Save changes?')) return

    await updateDoc(doc(db, 'customers', c.docId), {
      name: c.name,
      phone: c.phone,
      messType: c.messType,
    })

    setEditingId(null)
    fetchCustomers()
  }

  // ---------- ADD PAYMENT ----------
  const addPayment = async (c) => {
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

    const paymentObj = {
      amount: pay,
      paymentType,
      date: Timestamp.now(),
      subscriptionId: c.currentSubscriptionId,
    }

    await updateDoc(doc(db, 'customers', c.docId), {
      paid: newPaid,
      remaining: c.totalAmount - newPaid,
      dueDate: newDueDate,
      paymentHistory: [...(c.paymentHistory || []), paymentObj],
    })

    setAmount('')
    setPaymentType('cash')
    setPaymentId(null)
    fetchCustomers()
  }

  // ---------- HOLIDAYS ----------
  const addHolidays = async (c) => {
    const count = Number(holidayCount)
    if (!count || count <= 0) return alert('Invalid holiday count')

    const end = new Date(c.endDate)
    end.setDate(end.getDate() + count)

    await updateDoc(doc(db, 'customers', c.docId), {
      endDate: end.toISOString().split('T')[0],
    })

    setHolidayCount('')
    setHolidayId(null)
    fetchCustomers()
  }

  // ---------- RENEW ----------
  const initRenew = (c) => {
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

  const saveRenew = async (c) => {
    const total = Number(renewData.totalAmount)
    const paid = Number(renewData.paid || 0)

    if (paid > total) return alert('Paid cannot exceed total')
    if (new Date(renewData.endDate) <= new Date(renewData.startDate))
      return alert('End date must be after start date')

    const newDueDate = calculateDueDate(
      renewData.startDate,
      renewData.endDate,
      total,
      paid
    )

    const newSubId = crypto.randomUUID()

    const initialPayment = paid > 0 ? [{
      amount: paid,
      paymentType: renewData.paymentType,
      date: Timestamp.now(),
      subscriptionId: newSubId,
    }] : []

    await updateDoc(doc(db, 'customers', c.docId), {
      startDate: renewData.startDate,
      endDate: renewData.endDate,
      messType: renewData.messType,
      totalAmount: total,
      paid,
      remaining: total - paid,
      dueDate: newDueDate,
      currentSubscriptionId: newSubId,
      paymentHistory: [...(c.paymentHistory || []), ...initialPayment],
    })

    setRenewId(null)
    fetchCustomers()
  }

  // ---------- DELETE ----------
  const deleteCustomer = async (c) => {
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

  // ---------- UI ----------
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
      
      {filteredCustomers.map(c => (
        <div key={c.docId} className="card">

          {/* DISPLAY MODE *//*}
          <p><b>Name:</b> {c.name}</p>
          <p><b>Phone:</b> {c.phone}</p>
          <p><b>Gender:</b> {c.gender}</p>
          <p><b>Mess:</b> {c.messType}</p>
          <p><b>Start:</b> {c.startDate}</p>
          <p><b>End:</b> {c.endDate}</p>
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

          {/* ACTIONS *//*}
          <div className="actions">
            <button onClick={() => { cancelForms(); setPaymentId(c.docId) }} disabled={c.remaining === 0}>💰 Add Money</button>
            <button onClick={() => { cancelForms(); setHistoryId(c.docId) }}>📜 History</button>
            <button onClick={() => { cancelForms(); setHolidayId(c.docId) }}>📅 Holidays</button>
            <button onClick={() => initRenew(c)}>🔁 Renew</button>
            <button onClick={() => deleteCustomer(c)}>🗑 Delete</button>
          </div>

        
          {/* PAYMENT *//*}
          {paymentId === c.docId && (
            <div className="inline">
              <input type="number" placeholder="Amount" value={amount} onChange={e => setAmount(e.target.value)} />
              <select value={paymentType} onChange={e => setPaymentType(e.target.value)}>
                <option value="cash">Cash</option>
                <option value="online">Online</option>
              </select>
              <button onClick={() => addPayment(c)}>Add</button>
              <button onClick={cancelForms}>Cancel</button>
            </div>
          )}

          {/* HISTORY *//*}
          {historyId === c.docId && (
            <div className="inline">
              <div>
                {(c.paymentHistory || [])
                  .filter(p => p.subscriptionId === c.currentSubscriptionId)
                  .map((p, i) => (
                    <p key={i}>
                      ₹{p.amount} - {p.paymentType} - {p.date?.toDate().toLocaleDateString()}
                    </p>
                  ))}
              </div>
              <button onClick={cancelForms}>Close</button>
            </div>
          )}

          {/* HOLIDAYS *//*}
          {holidayId === c.docId && (
            <div className="inline">
              <input type="number" placeholder="No. of holidays" value={holidayCount} onChange={e => setHolidayCount(e.target.value)} />
              <button onClick={() => addHolidays(c)}>Apply</button>
              <button onClick={cancelForms}>Cancel</button>
            </div>
          )}

          {/* RENEW *//*}
          {renewId === c.docId && (
            <div className="inline">
              <input type="date" value={renewData.startDate} onChange={e => setRenewData({ ...renewData, startDate: e.target.value })} />
              <input type="date" value={renewData.endDate} onChange={e => setRenewData({ ...renewData, endDate: e.target.value })} />
              <input type="number" placeholder="Total" value={renewData.totalAmount} onChange={e => setRenewData({ ...renewData, totalAmount: e.target.value })} />
              <input type="number" placeholder="Paid" value={renewData.paid} onChange={e => setRenewData({ ...renewData, paid: e.target.value })} />
              <button onClick={() => saveRenew(c)}>Save</button>
              <button onClick={cancelForms}>Cancel</button>
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
        h2 { text-align: center; }
        .top-right {
          position: absolute;
          top: 20px;
          right: 20px;
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
}*/