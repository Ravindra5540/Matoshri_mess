import { useState, useEffect } from 'react'
import { collection, addDoc, Timestamp } from 'firebase/firestore'
import { db } from '../firebase'

export default function AddCustomer({ setPage }) {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    gender: 'male',
    startDate: '',
    endDate: '',
    totalAmount: 2400,
    paidAmount: 0,
    paymentType: 'cash',
    messType: 'general',
  })

  useEffect(() => {
  const today = new Date()
  const end = new Date(today)
  end.setDate(today.getDate() + 29)

  setForm(prev => ({
    ...prev,
    startDate: today.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  }))
}, [])

  // 🔹 Auto total amount by gender
  useEffect(() => {
    setForm(prev => ({
      ...prev,
      totalAmount:
        prev.totalAmount === 2400 || prev.totalAmount === 2000
          ? prev.gender === 'male'
            ? 2400
            : 2000
          : prev.totalAmount,
    }))
  }, [form.gender])

  // 🔹 Auto end date (+30 days) — ALWAYS sync with start date
useEffect(() => {
  if (form.startDate) {
    const start = new Date(form.startDate)
    const end = new Date(start)
    end.setDate(start.getDate() + 29)

    setForm(prev => ({
      ...prev,
      endDate: end.toISOString().split('T')[0],
    }))
  }
}, [form.startDate])

  const handleChange = e => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  // ✅ Validations
  const validateForm = () => {
    if (!form.name.trim()) return alert('Customer name is required')
    if (!/^\d{10}$/.test(form.phone))
      return alert('Enter valid 10-digit phone number')

    if (!form.startDate) return alert('Start date is required')
    if (!form.endDate) return alert('End date is required')

    if (new Date(form.endDate) <= new Date(form.startDate))
      return alert('End date must be after start date')

    if (+form.totalAmount <= 0)
      return alert('Total amount must be greater than 0')

    if (+form.paidAmount < 0)
      return alert('Paid amount cannot be negative')

    if (+form.paidAmount > +form.totalAmount)
      return alert('Paid amount cannot exceed total amount')

    return true
  }

  // 📅 Due date calculation
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

  // 🔥 SAVE CUSTOMER + INITIAL PAYMENT (SAFE DESIGN)
  // 🔥 SAVE CUSTOMER + INITIAL PAYMENT (SAFE DESIGN)
const handleSubmit = async () => {
  try {
    if (!validateForm()) return

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (new Date(form.startDate) < today) {
      const ok = window.confirm(
        'Start date is in the past. Do you want to continue?'
      )
      if (!ok) return
    }

    if (!window.confirm('Are you sure you want to save this customer?')) return

    // 🔑 subscription id
    // 🔑 subscription id (Mobile Safe)
const subscriptionId =
  Date.now().toString() + Math.random().toString(16).slice(2)

    const dueDate = calculateDueDate(
      form.startDate,
      form.endDate,
      Number(form.totalAmount),
      Number(form.paidAmount)
    )

    // ✅ CUSTOMER DATA
    const customerData = {
      name: form.name,
      phone: form.phone,
      gender: form.gender,
      startDate: form.startDate,
      endDate: form.endDate,
      messType: form.messType,
      totalAmount: Number(form.totalAmount),
      paid: Number(form.paidAmount),
      remaining: Number(form.totalAmount) - Number(form.paidAmount),
      dueDate,
      createdAt: Timestamp.now(),
      currentSubscriptionId: subscriptionId,
    }

    // 1️⃣ Save customer
    const customerRef = await addDoc(
      collection(db, 'customers'),
      customerData
    )

    // 2️⃣ Save initial payment
    if (Number(form.paidAmount) > 0) {
      await addDoc(collection(db, 'payments'), {
        customerId: customerRef.id,
        customerName: form.name,
        subscriptionId,
        amount: Number(form.paidAmount),
        paymentType: form.paymentType,
        date: Timestamp.now(),
      })
    }

    alert('Customer saved successfully ✅')
    setPage('home')

  } catch (error) {
    console.error("FULL ERROR:", error)
    alert(
      "❌ Error Saving Customer:\n\n" +
      (error?.message || JSON.stringify(error))
    )
  }
}

  return (
    <>
      <style>{`
  * { box-sizing: border-box; }
  body { margin: 0; font-family: Arial, sans-serif; }

  .page {
    min-height: 100vh;
    background: linear-gradient(135deg, #667eea, #764ba2);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 15px;
  }

  .card {
    background: #fff;
    padding: 30px;
    width: 100%;
    max-width: 420px;
    border-radius: 12px;
    box-shadow: 0 15px 30px rgba(0,0,0,0.2);
  }

  .card h2 {
    text-align: center;
    margin-bottom: 20px;
  }

  .field {
    display: flex;
    flex-direction: column;
    margin-bottom: 14px;
  }

  .field label {
    font-size: 14px;
    margin-bottom: 5px;
  }

  .field input,
  .field select {
    padding: 10px;
    border-radius: 6px;
    border: 1px solid #ccc;
    font-size: 14px;
  }

  .actions {
    display: flex;
    justify-content: space-between;
    margin-top: 20px;
  }

  .save {
    background: #667eea;
    color: white;
    border: none;
    padding: 10px 18px;
    border-radius: 6px;
    cursor: pointer;
  }

  .cancel {
    background: #ddd;
    border: none;
    padding: 10px 18px;
    border-radius: 6px;
    cursor: pointer;
  }

  /* ✅ MOBILE IMPROVEMENT ONLY */
  @media (max-width: 480px) {
    .page {
      align-items: flex-start;
      padding-top: 20px;
    }

    .card {
      padding: 20px;
      border-radius: 10px;
    }

    .actions {
      flex-direction: column;
      gap: 10px;
    }

    .save, .cancel {
      width: 100%;
    }
  }
`}</style>

      <div className="page">
        <div className="card">
          <h2>Add New Customer</h2>

          <div className="field">
            <label>Name</label>
            <input name="name" value={form.name} onChange={handleChange} />
          </div>

          <div className="field">
            <label>Phone</label>
            <input name="phone" value={form.phone} onChange={handleChange} />
          </div>

          <div className="field">
            <label>Gender</label>
            <div style={{ display: 'flex', gap: '15px' }}>
              <label>
                <input
                  type="radio"
                  name="gender"
                  value="male"
                  checked={form.gender === 'male'}
                  onChange={handleChange}
                /> Male
              </label>
              <label>
                <input
                  type="radio"
                  name="gender"
                  value="female"
                  checked={form.gender === 'female'}
                  onChange={handleChange}
                /> Female
              </label>
            </div>
          </div>

          <div className="field">
            <label>Start Date</label>
            <input type="date" name="startDate" value={form.startDate} onChange={handleChange} />
          </div>

          <div className="field">
            <label>End Date</label>
            <input type="date" name="endDate" value={form.endDate} onChange={handleChange} />
          </div>

          <div className="field">
            <label>Total Amount</label>
            <input type="number" name="totalAmount" value={form.totalAmount} onChange={handleChange} />
          </div>

          <div className="field">
            <label>Paid Amount</label>
            <input type="number" name="paidAmount" value={form.paidAmount} onChange={handleChange} />
          </div>

          <div className="field">
            <label>Payment Type</label>
            <select name="paymentType" value={form.paymentType} onChange={handleChange}>
              <option value="cash">Cash</option>
              <option value="online">Online</option>
            </select>
          </div>

          <div className="field">
            <label>Mess Type</label>
            <select name="messType" value={form.messType} onChange={handleChange}>
              <option value="general">General</option>
              <option value="morning">Morning</option>
              <option value="night">Night</option>
            </select>
          </div>

          <div className="actions">
            <button className="save" onClick={handleSubmit}>Save</button>
            <button className="cancel" onClick={() => setPage('home')}>Cancel</button>
          </div>
        </div>
      </div>
    </>
  )
}