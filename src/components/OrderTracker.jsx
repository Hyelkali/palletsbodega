"use client"

import { useState, useEffect } from "react"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "../firebase/config"
import "./OrderTracker.css"

const OrderTracker = ({ trackingId }) => {
  const [trackingData, setTrackingData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchTrackingData = async () => {
      if (!trackingId) return

      try {
        setLoading(true)
        setError(null)

        const trackingQuery = query(collection(db, "public_tracking"), where("trackingId", "==", trackingId))

        const querySnapshot = await getDocs(trackingQuery)

        if (querySnapshot.empty) {
          setError("No tracking information found for this ID")
          setTrackingData(null)
        } else {
          const trackingDoc = querySnapshot.docs[0]
          const data = trackingDoc.data()

          // Sort status history by timestamp (newest first)
          const sortedHistory = [...data.statusHistory].sort((a, b) => {
            return new Date(b.timestamp) - new Date(a.timestamp)
          })

          setTrackingData({
            ...data,
            id: trackingDoc.id,
            statusHistory: sortedHistory,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          })
        }
      } catch (err) {
        console.error("Error fetching tracking data:", err)
        setError("Failed to load tracking information")
      } finally {
        setLoading(false)
      }
    }

    fetchTrackingData()
  }, [trackingId])

  // Helper function to get status label
  const getStatusLabel = (status) => {
    const statusMap = {
      order_created: "Order Created",
      payment_pending: "Payment Pending",
      payment_confirmed: "Payment Confirmed",
      processing: "Processing",
      preparing_shipment: "Preparing Shipment",
      shipped: "Shipped",
      in_transit: "In Transit",
      out_for_delivery: "Out for Delivery",
      delivered: "Delivered",
      delayed: "Delayed",
      exception: "Exception",
    }

    return statusMap[status] || status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
  }

  // Helper function to get status color
  const getStatusColor = (status) => {
    const colorMap = {
      order_created: "#f59e0b",
      payment_pending: "#f59e0b",
      payment_confirmed: "#3b82f6",
      processing: "#3b82f6",
      preparing_shipment: "#3b82f6",
      shipped: "#3b82f6",
      in_transit: "#3b82f6",
      out_for_delivery: "#10b981",
      delivered: "#10b981",
      delayed: "#ef4444",
      exception: "#ef4444",
    }

    return colorMap[status] || "#6b7280"
  }

  if (loading) {
    return (
      <div className="order-tracker-loading">
        <div className="loading-spinner"></div>
        <p>Loading tracking information...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="order-tracker-error">
        <p>{error}</p>
      </div>
    )
  }

  if (!trackingData) {
    return (
      <div className="order-tracker-empty">
        <p>No tracking information available</p>
      </div>
    )
  }

  return (
    <div className="order-tracker">
      <div className="tracker-header">
        <div className="tracking-info">
          <h3>Tracking Information</h3>
          <p>
            <strong>Tracking ID:</strong> {trackingData.trackingId}
          </p>
          <p>
            <strong>Order ID:</strong> {trackingData.orderId}
          </p>
          <p>
            <strong>Last Updated:</strong> {trackingData.updatedAt.toLocaleString()}
          </p>
        </div>
        <div className="tracking-status">
          <div className="status-badge" style={{ backgroundColor: getStatusColor(trackingData.status) }}>
            {getStatusLabel(trackingData.status)}
          </div>
        </div>
      </div>

      <div className="tracking-timeline">
        <h3>Status History</h3>
        <div className="timeline">
          {trackingData.statusHistory.map((event, index) => (
            <div key={index} className={`timeline-item ${event.status === trackingData.status ? "active" : ""}`}>
              <div className="timeline-icon" style={{ color: getStatusColor(event.status) }}>
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
  )
}

export default OrderTracker
