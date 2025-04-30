"use client"

import { useState, useEffect } from "react"
import { collection, query, orderBy, getDocs, doc, updateDoc, serverTimestamp, addDoc, where } from "firebase/firestore"
import { db } from "../../firebase/config"
import { useAuth } from "../../context/AuthContext"
import { useToast } from "../../context/ToastContext"
import OrderStatusUpdater from "../../components/admin/OrderStatusUpdater"
import "./Orders.css"

const Orders = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [isPaymentProofModalOpen, setIsPaymentProofModalOpen] = useState(false)
  const [isAddTrackingModalOpen, setIsAddTrackingModalOpen] = useState(false)
  const [isFullScreenImageOpen, setIsFullScreenImageOpen] = useState(false)
  const [fullScreenImageUrl, setFullScreenImageUrl] = useState("")
  const { user } = useAuth()
  const { success, error: showError } = useToast()
  const [debugInfo, setDebugInfo] = useState(null)
  const [newTrackingCode, setNewTrackingCode] = useState("")
  const [newCarrier, setNewCarrier] = useState("")
  const [newEstimatedDelivery, setNewEstimatedDelivery] = useState("")

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      console.log("Fetching orders...")

      // Add debugging info about the current user
      console.log("Current user:", user)

      const ordersQuery = query(collection(db, "orders"), orderBy("createdAt", "desc"))

      const querySnapshot = await getDocs(ordersQuery)
      console.log(`Found ${querySnapshot.docs.length} orders`)

      const ordersData = []

      querySnapshot.forEach((doc) => {
        const data = doc.data()
        ordersData.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
        })
      })

      setDebugInfo({
        userEmail: user?.email,
        isAdmin: user?.role === "admin",
        ordersCount: ordersData.length,
        timestamp: new Date().toISOString(),
      })

      setOrders(ordersData)
    } catch (err) {
      console.error("Error fetching orders:", err)
      setError(`Failed to load orders: ${err.message}`)
      setDebugInfo({
        error: err.message,
        userEmail: user?.email,
        isAdmin: user?.role === "admin",
        timestamp: new Date().toISOString(),
      })
      showError({
        title: "Error",
        message: `Failed to load orders: ${err.message}`,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleViewOrder = (order) => {
    setSelectedOrder(order)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedOrder(null)
  }

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      // Update order status
      await updateDoc(doc(db, "orders", orderId), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      })

      // Update local state
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderId ? { ...order, status: newStatus, updatedAt: new Date() } : order,
        ),
      )

      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev) => ({
          ...prev,
          status: newStatus,
          updatedAt: new Date(),
        }))
      }

      // Find and update the corresponding transaction record
      const transactionsQuery = query(collection(db, "transactions"), where("orderId", "==", orderId))
      const transactionSnapshot = await getDocs(transactionsQuery)

      if (!transactionSnapshot.empty) {
        // Update the transaction status based on the order status
        const transactionDoc = transactionSnapshot.docs[0]
        await updateDoc(doc(db, "transactions", transactionDoc.id), {
          orderStatus: newStatus, // Add order status to transaction
          status:
            newStatus === "approved"
              ? "success"
              : newStatus === "cancelled"
                ? "failed"
                : newStatus === "delivered"
                  ? "completed"
                  : "pending",
          updatedAt: serverTimestamp(),
        })

        console.log(`Transaction ${transactionDoc.id} updated with order status: ${newStatus}`)
      } else {
        console.warn(`No transaction found for order ${orderId}`)
      }

      success({
        title: "Status Updated",
        message: `Order status has been updated to ${newStatus}`,
      })

      // Create a transaction record if status is approved
      if (newStatus === "approved") {
        await createTransactionRecord(orderId)
      }
    } catch (err) {
      console.error("Error updating order status:", err)
      setError("Failed to update order status")
      showError({
        title: "Update Error",
        message: err.message,
      })
    }
  }

  const createTransactionRecord = async (orderId) => {
    try {
      // Get the order details
      const order = orders.find((o) => o.id === orderId)
      if (!order) return

      // Check if transaction already exists
      const transactionsQuery = query(collection(db, "transactions"), orderBy("createdAt", "desc"))

      const querySnapshot = await getDocs(transactionsQuery)
      const existingTransaction = querySnapshot.docs.find((doc) => doc.data().orderId === orderId)

      if (existingTransaction) {
        // Update existing transaction
        await updateDoc(doc(db, "transactions", existingTransaction.id), {
          status: "approved",
          updatedAt: serverTimestamp(),
        })
      } else {
        // Create new transaction
        await addDoc(collection(db, "transactions"), {
          orderId: orderId,
          customerId: order.customerId,
          customerEmail: order.customerEmail,
          amount: Number(order.totalAmount) || 0,
          status: "approved",
          paymentMethod: order.paymentMethod || "Credit Card",
          paymentProofUrl: order.paymentProofUrl || null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
      }

      success({
        title: "Transaction Created",
        message: "Payment record has been created successfully",
      })
    } catch (err) {
      console.error("Error creating transaction:", err)
      showError({
        title: "Transaction Error",
        message: "Failed to create payment record",
      })
    }
  }

  const handleConfirmPayment = (order) => {
    setSelectedOrder(order)
    setIsPaymentModalOpen(true)
  }

  const closePaymentModal = () => {
    setIsPaymentModalOpen(false)
    setSelectedOrder(null)
  }

  const handleViewPaymentProof = (order) => {
    setSelectedOrder(order)
    setIsPaymentProofModalOpen(true)
  }

  const closePaymentProofModal = () => {
    setIsPaymentProofModalOpen(false)
    setSelectedOrder(null)
  }

  const openFullScreenImage = (imageUrl) => {
    setFullScreenImageUrl(imageUrl)
    setIsFullScreenImageOpen(true)
  }

  const closeFullScreenImage = () => {
    setIsFullScreenImageOpen(false)
    setFullScreenImageUrl("")
  }

  const processPayment = async () => {
    if (!selectedOrder) return

    try {
      // Update order status
      await updateDoc(doc(db, "orders", selectedOrder.id), {
        status: "approved",
        paymentStatus: "paid",
        updatedAt: serverTimestamp(),
      })

      // Create transaction record
      await createTransactionRecord(selectedOrder.id)

      // Update local state
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === selectedOrder.id
            ? {
                ...order,
                status: "approved",
                paymentStatus: "paid",
                updatedAt: new Date(),
              }
            : order,
        ),
      )

      success({
        title: "Payment Confirmed",
        message: "Payment has been confirmed successfully",
      })

      closePaymentModal()
      fetchOrders() // Refresh the orders list
    } catch (err) {
      console.error("Error confirming payment:", err)
      showError({
        title: "Payment Error",
        message: "Failed to confirm payment",
      })
    }
  }

  const getStatusClass = (status) => {
    switch (status) {
      case "pending":
        return "status-pending"
      case "approved":
        return "status-approved"
      case "rejected":
        return "status-rejected"
      case "shipped":
        return "status-shipped"
      case "delivered":
        return "status-delivered"
      default:
        return ""
    }
  }

  const handleOpenAddTrackingModal = (order) => {
    setSelectedOrder(order)
    setNewTrackingCode(order.trackingId || "")
    setIsAddTrackingModalOpen(true)
  }

  const closeAddTrackingModal = () => {
    setIsAddTrackingModalOpen(false)
    setSelectedOrder(null)
    setNewTrackingCode("")
    setNewCarrier("")
    setNewEstimatedDelivery("")
  }

  const handleAddTrackingCode = async () => {
    if (!selectedOrder) return

    try {
      setLoading(true)

      // Use Firebase function URL
      const functionUrl = "https://us-central1-YOUR_FIREBASE_PROJECT_ID.cloudfunctions.net/addTrackingCode"

      const response = await fetch(functionUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: selectedOrder.id,
          trackingCode: newTrackingCode,
          carrier: newCarrier,
          estimatedDelivery: newEstimatedDelivery,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to add tracking code")
      }

      success({
        title: "Tracking Added",
        message: "Tracking code has been added to the order",
      })

      closeAddTrackingModal()
      fetchOrders() // Refresh the orders list
    } catch (err) {
      console.error("Error adding tracking code:", err)
      showError({
        title: "Tracking Error",
        message: "Failed to add tracking code",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-orders">
      <div className="container">
        <h1 className="page-title">Manage Orders</h1>

        {error && <div className="error-message">{error}</div>}

        {loading ? (
          <div className="loading-indicator">
            <div className="spinner"></div>
            <p>Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="empty-state">No orders found</div>
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
                  <th>Payment</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>{order.id.substring(0, 8)}...</td>
                    <td>{order.customerEmail}</td>
                    <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td>${order.totalAmount.toFixed(2)}</td>
                    <td>
                      <span className={`status-badge ${getStatusClass(order.status)}`}>{order.status}</span>
                    </td>
                    <td>
                      <span
                        className={`status-badge ${
                          order.paymentStatus === "paid"
                            ? "status-approved"
                            : order.paymentStatus === "proof_submitted"
                              ? "status-proof"
                              : "status-pending"
                        }`}
                      >
                        {order.paymentStatus === "proof_submitted"
                          ? "Proof Submitted"
                          : order.paymentStatus || "pending"}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="view-button" onClick={() => handleViewOrder(order)}>
                          View Details
                        </button>
                        {order.paymentStatus === "proof_submitted" && (
                          <button className="proof-button" onClick={() => handleViewPaymentProof(order)}>
                            View Proof
                          </button>
                        )}
                        {(order.status === "pending" || order.paymentStatus === "proof_submitted") && (
                          <button className="confirm-button" onClick={() => handleConfirmPayment(order)}>
                            Confirm Payment
                          </button>
                        )}
                        {(order.status === "shipped" || order.status === "delivered") && (
                          <button className="confirm-button" onClick={() => handleOpenAddTrackingModal(order)}>
                            Add Tracking
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {isModalOpen && selectedOrder && (
          <div className="modal-overlay">
            <div className="modal-content order-modal">
              <div className="modal-header">
                <h2>Order Details</h2>
                <button className="close-modal" onClick={closeModal}>
                  ×
                </button>
              </div>

              <div className="order-details">
                <div className="order-info">
                  <div className="info-group">
                    <h3>Order Information</h3>
                    <p>
                      <strong>Order ID:</strong> {selectedOrder.id}
                    </p>
                    <p>
                      <strong>Date:</strong> {new Date(selectedOrder.createdAt).toLocaleString()}
                    </p>
                    <p>
                      <strong>Status:</strong>
                      <span className={`status-badge ${getStatusClass(selectedOrder.status)}`}>
                        {selectedOrder.status}
                      </span>
                    </p>
                    <p>
                      <strong>Total Amount:</strong> ${selectedOrder.totalAmount.toFixed(2)}
                    </p>
                  </div>

                  <div className="info-group">
                    <h3>Payment Information</h3>
                    <p>
                      <strong>Payment Method:</strong> {selectedOrder.paymentMethod || "Credit Card"}
                    </p>
                    <p>
                      <strong>Payment Status:</strong>
                      <span
                        className={`status-badge ${
                          selectedOrder.paymentStatus === "paid"
                            ? "status-approved"
                            : selectedOrder.paymentStatus === "proof_submitted"
                              ? "status-proof"
                              : "status-pending"
                        }`}
                      >
                        {selectedOrder.paymentStatus === "proof_submitted"
                          ? "Proof Submitted"
                          : selectedOrder.paymentStatus || "pending"}
                      </span>
                    </p>
                    {selectedOrder.transactionId && (
                      <p>
                        <strong>Transaction ID:</strong> {selectedOrder.transactionId}
                      </p>
                    )}
                    {selectedOrder.paymentProofUrl && (
                      <div className="payment-proof-preview">
                        <p>
                          <strong>Payment Proof:</strong>
                        </p>
                        <img
                          src={selectedOrder.paymentProofUrl || "/placeholder.svg"}
                          alt="Payment proof"
                          className="proof-thumbnail"
                          onClick={() => openFullScreenImage(selectedOrder.paymentProofUrl)}
                        />
                      </div>
                    )}
                  </div>

                  <div className="info-group">
                    <h3>Customer Information</h3>
                    <p>
                      <strong>Email:</strong> {selectedOrder.customerEmail}
                    </p>
                    <p>
                      <strong>Name:</strong> {selectedOrder.shippingAddress?.firstName}{" "}
                      {selectedOrder.shippingAddress?.lastName}
                    </p>
                    <p>
                      <strong>Phone:</strong> {selectedOrder.shippingAddress?.phone}
                    </p>
                  </div>

                  <div className="info-group">
                    <h3>Shipping Address</h3>
                    <p>{selectedOrder.shippingAddress?.address}</p>
                    <p>
                      {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.postalCode}
                    </p>
                    <p>{selectedOrder.shippingAddress?.country}</p>
                  </div>
                </div>

                <div className="order-items">
                  <h3>Order Items</h3>
                  <table className="items-table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Price</th>
                        <th>Quantity</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder &&
                        selectedOrder.items &&
                        selectedOrder.items.map((item, index) => (
                          <tr key={index}>
                            <td>{item.name}</td>
                            <td>${item.price.toFixed(2)}</td>
                            <td>{item.quantity}</td>
                            <td>${(item.price * item.quantity).toFixed(2)}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                <div className="order-actions">
                  <h3>Update Order Status</h3>
                  <div className="status-buttons">
                    <button
                      className={`status-button ${selectedOrder.status === "pending" ? "active" : ""}`}
                      onClick={() => handleUpdateStatus(selectedOrder.id, "pending")}
                      disabled={selectedOrder.status === "pending"}
                    >
                      Pending
                    </button>
                    <button
                      className={`status-button ${selectedOrder.status === "approved" ? "active" : ""}`}
                      onClick={() => handleUpdateStatus(selectedOrder.id, "approved")}
                      disabled={selectedOrder.status === "approved"}
                    >
                      Approved
                    </button>
                    <button
                      className={`status-button ${selectedOrder.status === "processing" ? "active" : ""}`}
                      onClick={() => handleUpdateStatus(selectedOrder.id, "processing")}
                      disabled={selectedOrder.status === "processing"}
                    >
                      Processing
                    </button>
                    <button
                      className={`status-button ${selectedOrder.status === "shipped" ? "active" : ""}`}
                      onClick={() => handleUpdateStatus(selectedOrder.id, "shipped")}
                      disabled={selectedOrder.status === "shipped"}
                    >
                      Shipped
                    </button>
                    <button
                      className={`status-button ${selectedOrder.status === "delivered" ? "active" : ""}`}
                      onClick={() => handleUpdateStatus(selectedOrder.id, "delivered")}
                      disabled={selectedOrder.status === "delivered"}
                    >
                      Delivered
                    </button>
                    <button
                      className={`status-button ${selectedOrder.status === "cancelled" ? "active" : ""}`}
                      onClick={() => handleUpdateStatus(selectedOrder.id, "cancelled")}
                      disabled={selectedOrder.status === "cancelled"}
                    >
                      Cancelled
                    </button>
                  </div>
                </div>

                <OrderStatusUpdater order={selectedOrder} onStatusUpdate={fetchOrders} />
              </div>
            </div>
          </div>
        )}

        {isPaymentModalOpen && selectedOrder && (
          <div className="modal-overlay">
            <div className="modal-content payment-modal">
              <div className="modal-header">
                <h2>Confirm Payment</h2>
                <button className="close-modal" onClick={closePaymentModal}>
                  ×
                </button>
              </div>

              <div className="payment-confirmation">
                <div className="payment-details">
                  <h3>Order Information</h3>
                  <p>
                    <strong>Order ID:</strong> {selectedOrder.id}
                  </p>
                  <p>
                    <strong>Customer:</strong> {selectedOrder.customerEmail}
                  </p>
                  <p>
                    <strong>Amount:</strong> ${selectedOrder.totalAmount.toFixed(2)}
                  </p>
                  <p>
                    <strong>Date:</strong> {new Date(selectedOrder.createdAt).toLocaleString()}
                  </p>
                </div>

                {selectedOrder.paymentProofUrl && (
                  <div className="payment-proof-preview">
                    <h3>Payment Proof</h3>
                    <div className="proof-image-container">
                      <img
                        src={selectedOrder.paymentProofUrl || "/placeholder.svg"}
                        alt="Payment proof"
                        className="proof-image"
                        onClick={() => openFullScreenImage(selectedOrder.paymentProofUrl)}
                      />
                    </div>
                  </div>
                )}

                <div className="payment-warning">
                  <p>Are you sure you want to confirm payment for this order? This will:</p>
                  <ul>
                    <li>Mark the order as "approved"</li>
                    <li>Create a transaction record</li>
                    <li>Update the payment status to "paid"</li>
                  </ul>
                </div>

                <div className="payment-actions">
                  <button className="confirm-payment-button" onClick={processPayment}>
                    Confirm Payment
                  </button>
                  <button className="cancel-button" onClick={closePaymentModal}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {isPaymentProofModalOpen && selectedOrder && selectedOrder.paymentProofUrl && (
          <div className="modal-overlay">
            <div className="modal-content proof-modal">
              <div className="modal-header">
                <h2>Payment Proof</h2>
                <button className="close-modal" onClick={closePaymentProofModal}>
                  ×
                </button>
              </div>

              <div className="proof-content">
                <div className="proof-info">
                  <p>
                    <strong>Order ID:</strong> {selectedOrder.id}
                  </p>
                  <p>
                    <strong>Customer:</strong> {selectedOrder.customerEmail}
                  </p>
                  <p>
                    <strong>Payment Method:</strong> {selectedOrder.paymentMethod || "Not specified"}
                  </p>
                </div>

                <div className="proof-image-container">
                  <img
                    src={selectedOrder.paymentProofUrl || "/placeholder.svg"}
                    alt="Payment proof"
                    className="full-proof-image"
                    onClick={() => openFullScreenImage(selectedOrder.paymentProofUrl)}
                  />
                </div>

                <div className="proof-actions">
                  <button className="confirm-payment-button" onClick={processPayment}>
                    Approve Payment
                  </button>
                  <button className="cancel-button" onClick={closePaymentProofModal}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {isFullScreenImageOpen && fullScreenImageUrl && (
          <div className="fullscreen-image-overlay" onClick={closeFullScreenImage}>
            <div className="fullscreen-image-container">
              <img
                src={fullScreenImageUrl || "/placeholder.svg"}
                alt="Full size payment proof"
                className="fullscreen-image"
              />
              <button className="close-fullscreen-button" onClick={closeFullScreenImage}>
                ×
              </button>
            </div>
          </div>
        )}

        {isAddTrackingModalOpen && selectedOrder && (
          <div className="modal-overlay">
            <div className="modal-content add-tracking-modal">
              <div className="modal-header">
                <h2>Add Tracking Information</h2>
                <button className="close-modal" onClick={closeAddTrackingModal}>
                  ×
                </button>
              </div>
              <div className="add-tracking-form">
                <div className="form-group">
                  <label htmlFor="trackingCode">Tracking Code</label>
                  <input
                    type="text"
                    id="trackingCode"
                    value={newTrackingCode}
                    onChange={(e) => setNewTrackingCode(e.target.value)}
                    placeholder="Enter tracking code"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="carrier">Carrier</label>
                  <input
                    type="text"
                    id="carrier"
                    value={newCarrier}
                    onChange={(e) => setNewCarrier(e.target.value)}
                    placeholder="Enter carrier name"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="estimatedDelivery">Estimated Delivery Date</label>
                  <input
                    type="date"
                    id="estimatedDelivery"
                    value={newEstimatedDelivery}
                    onChange={(e) => setNewEstimatedDelivery(e.target.value)}
                    className="form-input"
                  />
                </div>
                <div className="form-actions">
                  <button className="cancel-button" onClick={closeAddTrackingModal}>
                    Cancel
                  </button>
                  <button className="confirm-button" onClick={handleAddTrackingCode} disabled={loading}>
                    {loading ? "Adding..." : "Add Tracking"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Orders
