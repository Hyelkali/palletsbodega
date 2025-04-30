"use client"

import { useState } from "react"
import { doc, updateDoc, serverTimestamp, collection, query, where, getDocs, addDoc } from "firebase/firestore"
import { db } from "../../firebase/config"
import { useToast } from "../../context/ToastContext"
import "./OrderStatusUpdater.css"

const OrderStatusUpdater = ({ order, onStatusUpdate }) => {
  const [newStatus, setNewStatus] = useState(order.status || "pending")
  const [statusMessage, setStatusMessage] = useState("")
  const [statusLocation, setStatusLocation] = useState("Pallet Bodega Warehouse")
  const [isUpdating, setIsUpdating] = useState(false)
  const { success, error: showError } = useToast()

  const handleStatusChange = (e) => {
    setNewStatus(e.target.value)
  }

  const handleUpdateStatus = async (e) => {
    e.preventDefault()

    if (!statusMessage) {
      showError({
        title: "Missing Information",
        message: "Please provide a status message",
      })
      return
    }

    try {
      setIsUpdating(true)

      // Update the order status
      await updateDoc(doc(db, "orders", order.id), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      })

      // Update the tracking information
      const trackingQuery = query(collection(db, "public_tracking"), where("orderId", "==", order.id))

      const trackingSnapshot = await getDocs(trackingQuery)

      if (!trackingSnapshot.empty) {
        const trackingDoc = trackingSnapshot.docs[0]
        const trackingData = trackingDoc.data()

        // Add new status to history
        const updatedHistory = [
          ...trackingData.statusHistory,
          {
            status: newStatus,
            timestamp: new Date().toISOString(),
            message: statusMessage,
            location: statusLocation,
          },
        ]

        await updateDoc(doc(db, "public_tracking", trackingDoc.id), {
          status: newStatus,
          statusHistory: updatedHistory,
          updatedAt: serverTimestamp(),
        })
      } else {
        // If no tracking record exists, create one
        const trackingId =
          order.trackingId ||
          `PB${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 10000)
            .toString()
            .padStart(4, "0")}`

        await addDoc(collection(db, "public_tracking"), {
          trackingId: trackingId,
          orderId: order.id,
          status: newStatus,
          statusHistory: [
            {
              status: newStatus,
              timestamp: new Date().toISOString(),
              message: statusMessage,
              location: statusLocation,
            },
          ],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })

        // Update the order with the tracking ID
        await updateDoc(doc(db, "orders", order.id), {
          trackingId: trackingId,
        })
      }

      // Update the corresponding transaction record
      const transactionsQuery = query(collection(db, "transactions"), where("orderId", "==", order.id))
      const transactionSnapshot = await getDocs(transactionsQuery)

      if (!transactionSnapshot.empty) {
        // Update the transaction status based on the order status
        const transactionDoc = transactionSnapshot.docs[0]
        await updateDoc(doc(db, "transactions", transactionDoc.id), {
          orderStatus: newStatus, // Add order status to transaction
          status:
            newStatus === "payment_confirmed"
              ? "success"
              : newStatus === "canceled"
                ? "failed"
                : newStatus === "delivered"
                  ? "completed"
                  : "pending",
          updatedAt: serverTimestamp(),
        })

        console.log(`Transaction ${transactionDoc.id} updated with order status: ${newStatus}`)
      } else {
        console.warn(`No transaction found for order ${order.id}`)
      }

      success({
        title: "Status Updated",
        message: `Order status has been updated to ${newStatus}`,
      })

      // Reset form
      setStatusMessage("")

      // Notify parent component
      if (onStatusUpdate) {
        onStatusUpdate()
      }
    } catch (err) {
      console.error("Error updating status:", err)
      showError({
        title: "Update Error",
        message: err.message,
      })
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="order-status-updater">
      <h3>Update Order Status</h3>

      <form onSubmit={handleUpdateStatus}>
        <div className="form-group">
          <label htmlFor="status">Status</label>
          <select id="status" value={newStatus} onChange={handleStatusChange} className="status-select">
            <option value="pending">Pending</option>
            <option value="payment_confirmed">Payment Confirmed</option>
            <option value="processing">Processing</option>
            <option value="preparing_shipment">Preparing Shipment</option>
            <option value="shipped">Shipped</option>
            <option value="in_transit">In Transit</option>
            <option value="out_for_delivery">Out for Delivery</option>
            <option value="delivered">Delivered</option>
            <option value="delayed">Delayed</option>
            <option value="canceled">Canceled</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="location">Location</label>
          <input
            type="text"
            id="location"
            value={statusLocation}
            onChange={(e) => setStatusLocation(e.target.value)}
            className="status-input"
            placeholder="e.g. Pallet Bodega Warehouse"
          />
        </div>

        <div className="form-group">
          <label htmlFor="message">Status Message</label>
          <textarea
            id="message"
            value={statusMessage}
            onChange={(e) => setStatusMessage(e.target.value)}
            className="status-textarea"
            placeholder="e.g. Your order has been shipped and is on its way"
            rows={3}
            required
          ></textarea>
        </div>

        <div className="form-actions">
          <button type="submit" className="update-button" disabled={isUpdating}>
            {isUpdating ? "Updating..." : "Update Status"}
          </button>
        </div>
      </form>
    </div>
  )
}

export default OrderStatusUpdater
