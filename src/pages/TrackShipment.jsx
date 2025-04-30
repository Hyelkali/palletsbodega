"use client"

import { useState, useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { collection, query, where, getDocs, orderBy, doc, getDoc } from "firebase/firestore"
import { db } from "../firebase/config"
import { useAuth } from "../context/AuthContext"
import "./TrackShipment.css"

const TrackShipment = () => {
  const [trackingNumber, setTrackingNumber] = useState("")
  const [orderId, setOrderId] = useState("")
  const [shipmentData, setShipmentData] = useState(null)
  const [orderData, setOrderData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [orderHistory, setOrderHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { isLoggedIn, user } = useAuth()

  // Extract tracking number or order ID from URL if present
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const trackingParam = params.get("tracking")
    const orderIdParam = params.get("orderId")

    if (trackingParam) {
      setTrackingNumber(trackingParam)
      trackShipment(trackingParam)
    }

    if (orderIdParam) {
      setOrderId(orderIdParam)
      fetchOrderById(orderIdParam)
    }
  }, [location.search])

  // Fetch user's order history if logged in
  useEffect(() => {
    if (isLoggedIn && user) {
      fetchOrderHistory()
    }
  }, [isLoggedIn, user])

  const fetchOrderById = async (id) => {
    try {
      setLoading(true)
      setError("")

      const orderDoc = await getDoc(doc(db, "orders", id))

      if (!orderDoc.exists()) {
        setError("Order not found")
        return
      }

      const data = orderDoc.data()
      setOrderData({
        id: orderDoc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
      })

      // If order has tracking info, fetch it
      if (data.tracking?.trackingNumber) {
        trackShipment(data.tracking.trackingNumber)
      }
    } catch (err) {
      console.error("Error fetching order:", err)
      setError("Failed to load order information")
    } finally {
      setLoading(false)
    }
  }

  const fetchOrderHistory = async () => {
    try {
      setLoadingHistory(true)
      console.log("Fetching order history for user:", user.uid)

      // Query orders collection for the current user
      const ordersQuery = query(
        collection(db, "orders"),
        where("customerId", "==", user.uid),
        orderBy("createdAt", "desc"),
      )

      const querySnapshot = await getDocs(ordersQuery)
      console.log(`Found ${querySnapshot.size} orders for user`)

      const orders = []

      querySnapshot.forEach((doc) => {
        const orderData = doc.data()
        console.log("Order data:", { id: doc.id, ...orderData })

        // Include all orders, even if they don't have tracking info yet
        orders.push({
          id: doc.id,
          orderNumber: doc.id.substring(0, 8),
          date: orderData.createdAt?.toDate ? new Date(orderData.createdAt.toDate()) : new Date(),
          status: orderData.status || "pending",
          tracking: orderData.tracking || { trackingNumber: "Not available yet" },
          trackingCode: orderData.trackingCode || orderData.tracking?.trackingNumber || "Not available yet",
          totalAmount: orderData.totalAmount || 0,
        })
      })

      console.log("Processed orders:", orders)
      setOrderHistory(orders)
    } catch (err) {
      console.error("Error fetching order history:", err)
    } finally {
      setLoadingHistory(false)
    }
  }

  const trackShipment = async (tracking) => {
    if (!tracking) {
      setError("Please enter a tracking number")
      return
    }

    try {
      setLoading(true)
      setError("")

      // Query the public_tracking collection directly
      const trackingQuery = query(collection(db, "public_tracking"), where("trackingNumber", "==", tracking))

      const querySnapshot = await getDocs(trackingQuery)

      if (querySnapshot.empty) {
        setError("No shipment found with this tracking number")
        setShipmentData(null)
      } else {
        const trackingDoc = querySnapshot.docs[0]
        const trackingData = trackingDoc.data()

        setShipmentData({
          tracking: {
            trackingNumber: trackingData.trackingNumber,
            carrier: trackingData.carrier,
            status: trackingData.status,
            statusHistory: trackingData.statusHistory || [],
            estimatedDelivery: trackingData.estimatedDelivery,
          },
          orderDate: trackingData.createdAt?.toDate ? new Date(trackingData.createdAt.toDate()) : new Date(),
          orderNumber: trackingData.orderId,
        })
      }
    } catch (err) {
      console.error("Error tracking shipment:", err)
      setError("Error tracking shipment. Please try again later.")
      setShipmentData(null)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    trackShipment(trackingNumber)
  }

  const handleTrackOrder = (trackingNumber) => {
    setTrackingNumber(trackingNumber)
    trackShipment(trackingNumber)

    // Update URL with tracking number for shareable links
    navigate(`/track-shipment?tracking=${encodeURIComponent(trackingNumber)}`)
  }

  // Helper function to get status label
  const getStatusLabel = (status) => {
    const statusMap = {
      processing: "Processing",
      order_received: "Order Received",
      preparing_shipment: "Preparing Shipment",
      shipped: "Shipped",
      in_transit: "In Transit",
      out_for_delivery: "Out for Delivery",
      delivered: "Delivered",
      delayed: "Delayed",
      exception: "Exception",
    }

    return statusMap[status] || status?.replace(/_/g, " ")?.replace(/\b\w/g, (l) => l.toUpperCase()) || "Pending"
  }

  // Helper function to get status color
  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case "processing":
      case "order_received":
      case "pending":
        return "status-pending"
      case "preparing_shipment":
        return "status-processing"
      case "shipped":
      case "in_transit":
        return "status-shipped"
      case "out_for_delivery":
        return "status-out-for-delivery"
      case "delivered":
        return "status-delivered"
      case "delayed":
      case "exception":
      case "cancelled":
        return "status-delayed"
      default:
        return "status-pending"
    }
  }

  return (
    <div className="track-shipment-page">
      <div className="container">
        <div className="track-shipment-content">
          <h1 className="page-title">Track Your Shipment</h1>
          {/* Enhance the tracking form to make it more user-friendly */}
          <div className="tracking-form-container">
            <form onSubmit={handleSubmit} className="tracking-form">
              <div className="form-group">
                <label htmlFor="tracking-number">Enter Your Tracking Code</label>
                <div className="input-group">
                  <input
                    type="text"
                    id="tracking-number"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="e.g. PB1234567890"
                    className="tracking-input"
                    autoFocus
                  />
                  <button type="submit" className="track-button" disabled={loading}>
                    {loading ? "Tracking..." : "Track"}
                  </button>
                </div>
                <p className="tracking-help-text">
                  Your tracking code can be found in your order confirmation email or on your order details page.
                </p>
              </div>
            </form>
          </div>

          {error && <div className="tracking-error">{error}</div>}

          {loading && (
            <div className="tracking-loading">
              <div className="spinner"></div>
              <p>Looking up your shipment...</p>
            </div>
          )}

          {orderData && !shipmentData && (
            <div className="order-status-container">
              <div className="order-status-header">
                <h2>Order Status</h2>
              </div>
              <div className="order-status-content">
                <div className="order-info">
                  <p>
                    <strong>Order ID:</strong> {orderData.id}
                  </p>
                  <p>
                    <strong>Date:</strong> {orderData.createdAt.toLocaleDateString()}
                  </p>
                  <p>
                    <strong>Status:</strong>
                    <span className={`status-badge ${getStatusClass(orderData.status)}`}>
                      {getStatusLabel(orderData.status)}
                    </span>
                  </p>
                  <p>
                    <strong>Payment Status:</strong>
                    <span
                      className={`status-badge ${orderData.paymentStatus === "paid" ? "status-delivered" : "status-pending"}`}
                    >
                      {orderData.paymentStatus || "Pending"}
                    </span>
                  </p>
                  {orderData.trackingCode && (
                    <p>
                      <strong>Tracking Code:</strong> {orderData.trackingCode}
                    </p>
                  )}
                </div>

                <div className="order-status-message">
                  {orderData.status === "pending" && (
                    <div className="status-message pending">
                      <p>Your order has been received and is awaiting payment confirmation.</p>
                    </div>
                  )}
                  {orderData.status === "approved" && (
                    <div className="status-message approved">
                      <p>Your payment has been confirmed and your order is being processed.</p>
                    </div>
                  )}
                  {orderData.status === "processing" && (
                    <div className="status-message processing">
                      <p>Your order is being processed and prepared for shipment.</p>
                    </div>
                  )}
                  {orderData.status === "shipped" && (
                    <div className="status-message shipped">
                      <p>Your order has been shipped and is on its way to you.</p>
                    </div>
                  )}
                  {orderData.status === "delivered" && (
                    <div className="status-message delivered">
                      <p>Your order has been delivered. Thank you for shopping with us!</p>
                    </div>
                  )}
                  {orderData.status === "cancelled" && (
                    <div className="status-message cancelled">
                      <p>Your order has been cancelled. Please contact customer support for more information.</p>
                    </div>
                  )}
                </div>

                {!orderData.tracking?.trackingNumber && (
                  <div className="no-tracking-info">
                    <p>Tracking information will be available once your order ships.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Enhance the shipment details display to make it more informative */}
          {shipmentData && (
            <div className="shipment-details">
              <div className="shipment-header">
                <div className="shipment-info">
                  <h2>Shipment Information</h2>
                  <div className="tracking-code-display">
                    <p>
                      <strong>Tracking Code:</strong>
                      <span className="tracking-code">{shipmentData.tracking.trackingNumber}</span>
                    </p>
                  </div>
                  <p>
                    <strong>Carrier:</strong> {shipmentData.tracking.carrier}
                  </p>
                  <p>
                    <strong>Order Number:</strong> {shipmentData.orderNumber}
                  </p>
                  <p>
                    <strong>Order Date:</strong> {shipmentData.orderDate.toLocaleDateString()}
                  </p>
                  <p>
                    <strong>Estimated Delivery:</strong>{" "}
                    {new Date(shipmentData.tracking.estimatedDelivery).toLocaleDateString()}
                  </p>
                </div>
                <div className="shipment-status">
                  <div className={`status-badge ${getStatusClass(shipmentData.tracking.status)}`}>
                    {getStatusLabel(shipmentData.tracking.status)}
                  </div>
                </div>
              </div>

              <div className="tracking-timeline">
                <h3>Tracking History</h3>
                <div className="timeline">
                  {shipmentData.tracking.statusHistory.map((event, index) => (
                    <div
                      key={index}
                      className={`timeline-item ${event.status === shipmentData.tracking.status ? "active" : ""}`}
                    >
                      <div className="timeline-icon" style={{ color: "var(--color-primary)" }}>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <circle cx="12" cy="12" r="10"></circle>
                          <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                      </div>
                      <div className="timeline-content">
                        <div className="timeline-date">{new Date(event.timestamp).toLocaleString()}</div>
                        <div className="timeline-title">{getStatusLabel(event.status)}</div>
                        <div className="timeline-location">{event.location}</div>
                        <div className="timeline-message">{event.message}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Order History Section */}
          {isLoggedIn && (
            <div className="order-history-section">
              <h2 className="section-title">Your Order History</h2>

              {loadingHistory ? (
                <div className="loading-indicator">Loading your order history...</div>
              ) : orderHistory.length === 0 ? (
                <div className="empty-state">
                  <p>You don't have any orders yet.</p>
                </div>
              ) : (
                <div className="order-history-table-container">
                  <table className="order-history-table">
                    <thead>
                      <tr>
                        <th>Order #</th>
                        <th>Date</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Tracking Code</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderHistory.map((order) => (
                        <tr key={order.id} className={order.id === orderId ? "active-order" : ""}>
                          <td>{order.orderNumber}</td>
                          <td>{order.date.toLocaleDateString()}</td>
                          <td>${order.totalAmount.toFixed(2)}</td>
                          <td>
                            <span className={`status-badge ${getStatusClass(order.status)}`}>
                              {getStatusLabel(order.status)}
                            </span>
                          </td>
                          <td>{order.trackingCode || "Not available yet"}</td>
                          <td>
                            {order.trackingCode && order.trackingCode !== "Not available yet" ? (
                              <button
                                className="track-history-button"
                                onClick={() => handleTrackOrder(order.trackingCode)}
                              >
                                Track
                              </button>
                            ) : (
                              <button
                                className="view-order-button"
                                onClick={() => navigate(`/track-shipment?orderId=${order.id}`)}
                              >
                                View Order
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TrackShipment
