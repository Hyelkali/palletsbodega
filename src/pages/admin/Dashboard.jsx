"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { collection, query, where, getDocs, orderBy } from "firebase/firestore"
import { db } from "../../firebase/config"
import { useAuth } from "../../context/AuthContext"
import { useToast } from "../../context/ToastContext"
import "./Dashboard.css"

const Dashboard = () => {
  const [pendingOrders, setPendingOrders] = useState([])
  const [productsCount, setProductsCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const { user } = useAuth()
  const { error: showError } = useToast()
  const navigate = useNavigate()

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

        // Fetch total products count for dashboard summary
        const productsSnapshot = await getDocs(collection(db, "products"))
        setProductsCount(productsSnapshot.size)
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

        <div className="dashboard-cards">
          <div className="stat-card">
            <span className="stat-label">Pending Orders</span>
            <strong className="stat-value">{pendingOrders.length}</strong>
          </div>
          <div className="stat-card">
            <span className="stat-label">Total Products</span>
            <strong className="stat-value">{productsCount}</strong>
          </div>
          <div className="stat-card">
            <span className="stat-label">Account</span>
            <strong className="stat-value">{user?.email || "Unknown"}</strong>
          </div>
          <button className="manage-btn" onClick={() => navigate("/admin/products")}>Manage Products</button>
        </div>

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

              <div className="orders-card-list">
                {pendingOrders.map((order) => (
                  <div key={order.id} className="order-card">
                    <div className="order-header">
                      <span>#{order.id.substring(0, 8)}</span>
                      <span className="status-badge pending">Pending</span>
                    </div>
                    <div className="order-detail">Customer: {order.customerEmail}</div>
                    <div className="order-detail">Date: {order.createdAt.toLocaleDateString()}</div>
                    <div className="order-detail">Amount: ${order.totalAmount.toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
