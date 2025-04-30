"use client"

import { useState, useEffect } from "react"
import { collection, query, where, getDocs, orderBy } from "firebase/firestore"
import { db } from "../../firebase/config"
import { useAuth } from "../../context/AuthContext"
import { useToast } from "../../context/ToastContext"
import "./Dashboard.css"

const Dashboard = () => {
  const [pendingOrders, setPendingOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const { user } = useAuth()
  const { error: showError } = useToast()

  useEffect(() => {
    const fetchPendingData = async () => {
      try {
        setLoading(true)

        // Fetch pending orders
        const ordersQuery = query(
          collection(db, "orders"),
          where("status", "==", "pending"),
          orderBy("createdAt", "desc"),
        )

        const ordersSnapshot = await getDocs(ordersQuery)
        const orders = []

        ordersSnapshot.forEach((doc) => {
          orders.push({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
          })
        })

        setPendingOrders(orders)
      } catch (err) {
        console.error("Error fetching pending data:", err)
        setError("Failed to load pending data")
        showError({
          title: "Data Loading Error",
          message: err.message,
        })
      } finally {
        setLoading(false)
      }
    }

    fetchPendingData()
  }, [showError])

  return (
    <div className="admin-dashboard">
      <div className="container">
        <h1 className="dashboard-title">Admin Dashboard</h1>

        <div className="dashboard-section">
          <h2 className="section-title">Pending Orders</h2>

          {loading ? (
            <div className="loading-indicator">Loading pending orders...</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : pendingOrders.length === 0 ? (
            <div className="empty-state">No pending orders to approve</div>
          ) : (
            <div className="orders-table-container">
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingOrders.map((order) => (
                    <tr key={order.id}>
                      <td>{order.id.substring(0, 8)}...</td>
                      <td>{order.customerEmail}</td>
                      <td>{order.createdAt.toLocaleDateString()}</td>
                      <td>${order.totalAmount.toFixed(2)}</td>
                      <td>
                        <span className="status-badge pending">Pending</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
