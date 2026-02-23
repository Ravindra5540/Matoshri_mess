import { useState, useEffect } from 'react'
import { collection, addDoc } from 'firebase/firestore'
import { db } from '../firebase'

export default function AddCustomer({ setPage }) {
  const [form, setForm] = useState({
    customerId: '',
    name: '',
    phone: '',
    startDate: '',
    endDate: '',
    totalAmount: 2400,
    paidAmount: 0,
    messType: 'general',
  })

  // 🔹 Recalculate end date when start date changes
  useEffect(() => {
    if (form.startDate) {
      const start = new Date(form.startDate)
      const end = new Date(start)
      end.setDate(start.getDate() + 30)

      setForm(prev => ({
        ...prev,
        endDate: end.toISOString().split('T')[0],
      }))
    }
  }, [form.startDate])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm({ ...form, [name]: value })
  }

  const validateForm = () => {
    if (!form.customerId.trim()) return alert('Customer ID is required')
    if (!form.name.trim()) return alert('Customer name is required')
    if (!/^\d{10}$/.test(form.phone)) return alert('Enter valid 10-digit phone number')
    if (!form.startDate) return alert('Start date is required')
    if (!form.endDate) return alert('End date is required')
    if (new Date(form.endDate) < new Date(form.startDate))
      return alert('End date cannot be before start date')
    if (+form.paidAmount > +form.totalAmount)
      return alert('Paid amount cannot exceed total amount')
    return true
  }

  // 🔥 SAVE TO FIREBASE
  const handleSubmit = async () => {
    if (!validateForm()) return

    const customerData = {
      customerId: form.customerId, // manual ID
      name: form.name,
      phone: form.phone,
      startDate: form.startDate,
      endDate: form.endDate,
      messType: form.messType,
      totalAmount: Number(form.totalAmount),
      paid: Number(form.paidAmount),
      remaining: Number(form.totalAmount) - Number(form.paidAmount),
      createdAt: new Date(),
    }

    try {
      await addDoc(collection(db, 'customers'), customerData)
      alert('Customer saved to Firebase ✅')
      setPage('home')
    } catch (error) {
      console.error(error)
      alert('Failed to save customer ❌')
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
      `}</style>

      <div className="page">
        <div className="card">
          <h2>Add New Customer</h2>

          <div className="field">
            <label>Customer ID</label>
            <input name="customerId" value={form.customerId} onChange={handleChange} />
          </div>

          <div className="field">
            <label>Name</label>
            <input name="name" value={form.name} onChange={handleChange} />
          </div>

          <div className="field">
            <label>Phone</label>
            <input name="phone" value={form.phone} onChange={handleChange} />
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

/*import { useState, useEffect } from 'react'

export default function AddCustomer({ setPage, customers, setCustomers }) {
  const [form, setForm] = useState({
    customerId: '',
    name: '',
    phone: '',
    startDate: '',
    endDate: '',
    totalAmount: 2400,
    paidAmount: 0,
    messType: 'general',
  })

  // 🔹 Always recalculate end date when start date changes
  useEffect(() => {
    if (form.startDate) {
      const start = new Date(form.startDate)
      const end = new Date(start)
      end.setDate(start.getDate() + 30)

      setForm(prev => ({
        ...prev,
        endDate: end.toISOString().split('T')[0],
      }))
    }
  }, [form.startDate])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm({ ...form, [name]: value })
  }

  const validateForm = () => {
    if (!form.customerId.trim()) return alert('Customer ID is required')
    if (!form.name.trim()) return alert('Customer name is required')
    if (!/^\d{10}$/.test(form.phone)) return alert('Enter valid 10-digit phone number')
    if (!form.startDate) return alert('Start date is required')
    if (!form.endDate) return alert('End date is required')
    if (new Date(form.endDate) < new Date(form.startDate))
      return alert('End date cannot be before start date')
    if (+form.paidAmount > +form.totalAmount)
      return alert('Paid amount cannot exceed total amount')
    return true
  }

  const handleSubmit = () => {
    if (!validateForm()) return

    const newCustomer = {
      id: form.customerId,
      name: form.name,
      phone: form.phone,
      startDate: form.startDate,
      endDate: form.endDate,
      messType: form.messType,
      totalAmount: Number(form.totalAmount),
      paid: Number(form.paidAmount),
      remaining: Number(form.totalAmount) - Number(form.paidAmount),
    }

    setCustomers([...customers, newCustomer])
    alert('Customer added successfully')
    setPage('home')
  }

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }

        body {
          margin: 0;
          font-family: Arial, sans-serif;
        }

        .page {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea, #764ba2);
          display: flex;
          align-items: center;
          justify-content: center;
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
          color: #333;
        }

        .field {
          display: flex;
          flex-direction: column;
          margin-bottom: 14px;
        }

        .field label {
          font-size: 14px;
          margin-bottom: 5px;
          color: #555;
        }

        .field input,
        .field select {
          padding: 10px;
          border-radius: 6px;
          border: 1px solid #ccc;
          font-size: 14px;
        }

        .field input:focus,
        .field select:focus {
          border-color: #667eea;
          outline: none;
        }

        .actions {
          display: flex;
          justify-content: space-between;
          margin-top: 20px;
        }

        .actions button {
          padding: 10px 18px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
        }

        .save {
          background: #667eea;
          color: white;
        }

        .save:hover {
          background: #5563d6;
        }

        .cancel {
          background: #ddd;
        }

        .cancel:hover {
          background: #ccc;
        }
      `}</style>

      <div className="page">
        <div className="card">
          <h2>Add New Customer</h2>

          <div className="field">
            <label>Customer ID</label>
            <input
              name="customerId"
              value={form.customerId}
              onChange={handleChange}
              placeholder="Enter customer ID"
            />
          </div>

          <div className="field">
            <label>Customer Name</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
            />
          </div>

          <div className="field">
            <label>Phone Number</label>
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="10-digit number"
            />
          </div>

          <div className="field">
            <label>Start Date</label>
            <input
              type="date"
              name="startDate"
              value={form.startDate}
              onChange={handleChange}
            />
          </div>

          <div className="field">
            <label>End Date</label>
            <input
              type="date"
              name="endDate"
              value={form.endDate}
              onChange={handleChange}
            />
          </div>

          <div className="field">
            <label>Total Amount (₹)</label>
            <input
              type="number"
              name="totalAmount"
              value={form.totalAmount}
              onChange={handleChange}
            />
          </div>

          <div className="field">
            <label>Initial Paid Amount (₹)</label>
            <input
              type="number"
              name="paidAmount"
              value={form.paidAmount}
              onChange={handleChange}
            />
          </div>

          <div className="field">
            <label>Mess Type</label>
            <select
              name="messType"
              value={form.messType}
              onChange={handleChange}
            >
              <option value="general">General</option>
              <option value="morning">Only Morning</option>
              <option value="night">Only Night</option>
            </select>
          </div>

          <div className="actions">
            <button className="save" onClick={handleSubmit}>Save</button>
            <button className="cancel" onClick={() => setPage('home')}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </>
  )
}*/