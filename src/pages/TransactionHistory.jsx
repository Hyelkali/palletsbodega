"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { useToast } from "../context/ToastContext"
import { collection, query, where, getDocs, orderBy } from "firebase/firestore"
import { db } from "../firebase/config"
import "./TransactionHistory.css"
import Payment from "./Payment"

const TransactionHistory = () => {
  const { user, isLoggedIn } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [hasTransactions, setHasTransactions] = useState(false)
  const [debugInfo, setDebugInfo] = useState(null)
  const navigate = useNavigate()

  const [selectedTransaction, setSelectedTransaction] = useState(null)
  const [showActionModal, setShowActionModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [cancellingOrder, setCancellingOrder] = useState(false)
  const { success, error: showError } = useToast()

  // Debug log to check component mounting
  useEffect(() => {
    console.log("TransactionHistory component mounted", { isLoggedIn, userId: user?.uid })
    return () => console.log("TransactionHistory component unmounted")
  }, [isLoggedIn, user])

  useEffect(() => {
    // Redirect if not logged in
    if (!isLoggedIn) {
      console.log("User not logged in, redirecting to login")
      navigate("/login")
      return
    }

    const fetchTransactions = async () => {
      try {
        setLoading(true)
        console.log("Fetching transactions for user:", user?.uid)

        if (!user || !user.uid) {
          console.error("User ID not available")
          setError("User information not available. Please log out and log in again.")
          setLoading(false)
          return
        }

        // Create a query for this user's transactions
        const transactionsRef = collection(db, "transactions")
        let transactionsQuery

        try {
          // Try with orderBy first
          transactionsQuery = query(transactionsRef, where("customerId", "==", user.uid), orderBy("createdAt", "desc"))

          const snapshot = await getDocs(transactionsQuery)
          processTransactions(snapshot)
        } catch (orderByError) {
          console.error("Error with orderBy query:", orderByError)

          // If orderBy fails (likely due to missing index), try without it
          console.log("Trying query without orderBy...")
          transactionsQuery = query(transactionsRef, where("customerId", "==", user.uid))

          const snapshot = await getDocs(transactionsQuery)
          processTransactions(snapshot)
        }
      } catch (err) {
        console.error("Error fetching transactions:", err)
        setError(`Failed to load your transaction history: ${err.message}`)
        setDebugInfo({
          error: err.message,
          userId: user?.uid,
          email: user?.email,
        })
        setLoading(false)
      }
    }

    const processTransactions = (snapshot) => {
      const transactionsData = []

      snapshot.forEach((doc) => {
        const data = doc.data()
        transactionsData.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate
            ? data.createdAt.toDate()
            : data.createdAt
              ? new Date(data.createdAt)
              : new Date(),
          updatedAt: data.updatedAt?.toDate
            ? data.updatedAt.toDate()
            : data.updatedAt
              ? new Date(data.updatedAt)
              : null,
        })
      })

      console.log("Transactions found:", transactionsData.length)

      // Save debug info
      setDebugInfo({
        userId: user.uid,
        email: user.email,
        transactionCount: transactionsData.length,
        firstTransaction: transactionsData.length > 0 ? transactionsData[0] : null,
        lastUpdated: new Date().toLocaleString(),
      })

      setTransactions(transactionsData)
      setHasTransactions(transactionsData.length > 0)
      setLoading(false)
    }

    if (user && user.uid) {
      fetchTransactions()
    }
  }, [isLoggedIn, user, navigate, showError])

  const getStatusClass = (status) => {
    if (!status) return ""

    status = status.toLowerCase()

    switch (status) {
      case "success":
      case "approved":
      case "paid":
      case "completed":
        return "status-success"
      case "pending":
      case "awaiting_payment":
      case "processing":
      case "details_requested":
      case "details_provided":
        return "status-pending"
      case "failed":
      case "rejected":
      case "cancelled":
        return "status-failed"
      case "shipped":
      case "in_transit":
        return "status-shipped"
      case "delivered":
        return "status-delivered"
      default:
        return "status-pending"
    }
  }

  const formatDate = (date) => {
    if (!date) return "N/A"
    try {
      // Handle Firestore timestamps
      if (date && typeof date === "object" && date.toDate) {
        return date.toDate().toLocaleString()
      }
      // Handle Date objects and ISO strings
      return new Date(date).toLocaleString()
    } catch (e) {
      console.error("Date formatting error:", e)
      return "Invalid Date"
    }
  }

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return "N/A"
    return `$${Number.parseFloat(amount).toFixed(2)} USD`
  }

  const handleRetryPayment = (transaction) => {
    // Store the order details in session storage for the payment page
    sessionStorage.setItem("pendingOrderId", transaction.orderId)
    sessionStorage.setItem("pendingOrderAmount", transaction.amount || 0)
    sessionStorage.setItem("pendingOrderEmail", transaction.customerEmail || user?.email)

    // Navigate to payment page
    navigate("/payment")
  }

  const handleContactSupport = (transaction) => {
    // Navigate to support page with transaction details
    navigate(`/support?orderId=${transaction.orderId}`)
  }

  const handleCancelOrder = async (transaction) => {
    try {
      setCancellingOrder(true)

      // Import necessary functions
      const { doc, updateDoc, serverTimestamp } = await import("firebase/firestore")
      const { db } = await import("../firebase/config")

      // Update the order status to cancelled
      const orderRef = doc(db, "orders", transaction.orderId)
      await updateDoc(orderRef, {
        status: "cancelled",
        updatedAt: serverTimestamp(),
      })

      // Also update the transaction record
      if (transaction.id) {
        const transactionRef = doc(db, "transactions", transaction.id)
        await updateDoc(transactionRef, {
          orderStatus: "cancelled",
          updatedAt: serverTimestamp(),
        })
      }

      success({
        title: "Order Cancelled",
        message: "Your order has been cancelled successfully.",
      })

      // Close the modal
      setShowActionModal(false)
      setSelectedTransaction(null)
    } catch (err) {
      console.error("Error cancelling order:", err)
      showError({
        title: "Cancellation Failed",
        message: err.message || "Failed to cancel your order. Please try again or contact support.",
      })
    } finally {
      setCancellingOrder(false)
    }
  }

  const openActionModal = (transaction) => {
    setSelectedTransaction(transaction)
    setShowActionModal(true)
  }

  const handleCompletePayment = (transaction) => {
    setSelectedTransaction(transaction)
    setShowPaymentModal(true)
  }

  const closePaymentModal = (success = false) => {
    setShowPaymentModal(false)
    if (success) {
      // Refresh the page to show updated transaction status
      window.location.reload()
    }
  }

  // Function to check if transaction has payment details
  const hasPaymentDetails = (transaction) => {
    return (
      transaction &&
      transaction.paymentDetails &&
      Object.keys(transaction.paymentDetails).some(
        (key) => transaction.paymentDetails[key] && transaction.paymentDetails[key].toString().trim() !== "",
      )
    )
  }

  // Function to format payment detail keys for display
  const formatDetailKey = (key) => {
    return key
      .replace(/([A-Z])/g, " $1") // Add space before capital letters
      .replace(/^./, (str) => str.toUpperCase()) // Capitalize first letter
  }

  // Debug render
  console.log("Rendering TransactionHistory component", {
    isLoggedIn,
    userId: user?.uid,
    transactionsCount: transactions.length,
    loading,
    error,
  })

  if (loading) {
    return (
      <div className="transaction-history-page">
        <div className="container">
          <div className="loading-indicator">Loading your transaction history...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="transaction-history-page">
        <div className="container">
          <div className="error-message">
            <p>{error}</p>
            {error.includes("requires an index") && (
              <div className="index-instructions">
                <p>This error occurs because Firebase needs an index for this query.</p>
                <p>To fix it:</p>
                <ol>
                  <li>Go to your Firebase console</li>
                  <li>Navigate to Firestore Database → Indexes</li>
                  <li>Click "Add Index"</li>
                  <li>
                    Create an index with:
                    <ul>
                      <li>Collection: transactions</li>
                      <li>Fields: customerId (Ascending), createdAt (Descending)</li>
                    </ul>
                  </li>
                  <li>Click "Create"</li>
                </ol>
              </div>
            )}
            {debugInfo && (
              <div className="debug-info">
                <p>User ID: {debugInfo.userId}</p>
                <p>Email: {debugInfo.email}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="transaction-history-page">
      <div className="container">
        <h1 className="page-title">My Transactions</h1>

        {debugInfo && debugInfo.lastUpdated && (
          <div className="real-time-indicator">
            <span className="pulse-dot"></span>
            <span className="update-text">Real-time updates active</span>
            <span className="last-updated">Last updated: {debugInfo.lastUpdated}</span>
          </div>
        )}

        {!hasTransactions ? (
          <div className="no-transactions">
            <p>You haven't made any purchases yet.</p>
            <button onClick={() => navigate("/catalog")} className="shop-now-btn">
              Shop Now
            </button>
          </div>
        ) : (
          <div className="transactions-container">
            <div className="transactions-table-container">
              <table className="transactions-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Order ID</th>
                    <th>Amount</th>
                    <th>Payment Method</th>
                    <th>Payment Status</th>
                    <th>Order Status</th>
                    <th>Tracking</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr
                      key={transaction.id}
                      className={
                        transaction.updatedAt && new Date(transaction.updatedAt) > new Date(transaction.createdAt)
                          ? "recently-updated"
                          : ""
                      }
                    >
                      <td>{formatDate(transaction.createdAt)}</td>
                      <td>
                        {transaction.orderId || "N/A"}
                        {transaction.updatedAt && transaction.updatedAt > transaction.createdAt && (
                          <span className="update-indicator" title={`Updated: ${formatDate(transaction.updatedAt)}`}>
                            ●
                          </span>
                        )}
                      </td>
                      <td>{formatCurrency(transaction.amount)}</td>
                      <td>{transaction.paymentMethod || "Manual"}</td>
                      <td>
                        <span
                          className={`status-badge ${getStatusClass(transaction.paymentStatus || transaction.status)}`}
                        >
                          {transaction.paymentStatus === "details_provided"
                            ? "Details Available"
                            : transaction.paymentStatus || transaction.status}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge ${getStatusClass(transaction.orderStatus)}`}>
                          {transaction.orderStatus
                            ? transaction.orderStatus.charAt(0).toUpperCase() +
                              transaction.orderStatus.slice(1).replace(/_/g, " ")
                            : "Pending"}
                        </span>
                      </td>
                      <td>
                        {transaction.trackingNumber || transaction.trackingCode ? (
                          <button
                            className="tracking-link-btn"
                            onClick={() =>
                              navigate(
                                `/track-shipment?tracking=${transaction.trackingNumber || transaction.trackingCode}`,
                              )
                            }
                          >
                            {transaction.trackingNumber || transaction.trackingCode}
                          </button>
                        ) : (
                          <span className="no-tracking">Not available yet</span>
                        )}
                      </td>
                      <td>
                        <button className="view-details-btn" onClick={() => openActionModal(transaction)}>
                          View Details
                        </button>
                        {(transaction.paymentStatus === "pending" ||
                          transaction.paymentStatus === "failed" ||
                          transaction.paymentStatus === "details_requested" ||
                          transaction.status === "pending") && (
                          <button
                            className="action-btn retry-payment"
                            onClick={() => handleCompletePayment(transaction)}
                          >
                            Complete Payment
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      {showActionModal && selectedTransaction && (
        <div className="action-modal-overlay">
          <div className="action-modal">
            <div className="action-modal-header gradient-header">
              <h3>Transaction Details</h3>
              <button
                className="close-modal-btn"
                onClick={() => {
                  setShowActionModal(false)
                  setSelectedTransaction(null)
                }}
              >
                ×
              </button>
            </div>

            <div className="action-modal-content">
              <div className="transaction-details-grid">
                <div className="detail-row">
                  <span className="detail-label">Order ID:</span>
                  <span className="detail-value">{selectedTransaction.orderId}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Date:</span>
                  <span className="detail-value">{formatDate(selectedTransaction.createdAt)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Amount:</span>
                  <span className="detail-value">{formatCurrency(selectedTransaction.amount)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Payment Method:</span>
                  <span className="detail-value">{selectedTransaction.paymentMethod || "Not specified"}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Payment Status:</span>
                  <span
                    className={`status-badge ${getStatusClass(selectedTransaction.paymentStatus || selectedTransaction.status)}`}
                  >
                    {selectedTransaction.paymentStatus || selectedTransaction.status}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Order Status:</span>
                  <span className={`status-badge ${getStatusClass(selectedTransaction.orderStatus)}`}>
                    {selectedTransaction.orderStatus
                      ? selectedTransaction.orderStatus.charAt(0).toUpperCase() +
                        selectedTransaction.orderStatus.slice(1).replace(/_/g, " ")
                      : "Pending"}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Tracking Code:</span>
                  <span className="detail-value">
                    {selectedTransaction.trackingNumber || selectedTransaction.trackingCode ? (
                      <button
                        className="tracking-link-btn"
                        onClick={() =>
                          navigate(
                            `/track-shipment?tracking=${selectedTransaction.trackingNumber || selectedTransaction.trackingCode}`,
                          )
                        }
                      >
                        {selectedTransaction.trackingNumber || selectedTransaction.trackingCode}
                      </button>
                    ) : (
                      "Not available yet"
                    )}
                  </span>
                </div>
              </div>

              {/* Display payment details if available */}
              {hasPaymentDetails(selectedTransaction) && (
                <div className="payment-details-section">
                  <h4>Payment Details</h4>
                  <div className="payment-details-box">
                    {Object.entries(selectedTransaction.paymentDetails).map(([key, value]) => {
                      // Only show non-empty values
                      if (value && value.toString().trim() !== "") {
                        return (
                          <div className="detail-row" key={key}>
                            <span className="detail-label">{formatDetailKey(key)}:</span>
                            <span className="detail-value">
                              {key === "paymentLink" ? (
                                <a href={value} target="_blank" rel="noopener noreferrer" className="payment-link">
                                  {value}
                                </a>
                              ) : (
                                value
                              )}
                            </span>
                          </div>
                        )
                      }
                      return null
                    })}
                  </div>
                  <p className="payment-reference-note">
                    Please include your Order ID <strong>{selectedTransaction.orderId}</strong> as the payment reference
                    when making your payment.
                  </p>
                </div>
              )}

              {selectedTransaction.paymentProofUrl && (
                <div className="payment-proof-section">
                  <h4>Payment Proof</h4>
                  <div className="proof-image">
                    <img src={selectedTransaction.paymentProofUrl || "/placeholder.svg"} alt="Payment proof" />
                  </div>
                </div>
              )}

              <div className="action-buttons">
                <button
                  className="view-order-btn"
                  onClick={() => navigate(`/thank-you?orderId=${selectedTransaction.orderId}`)}
                >
                  View Order Details
                </button>

                {(selectedTransaction.paymentStatus === "pending" ||
                  selectedTransaction.paymentStatus === "failed" ||
                  selectedTransaction.paymentStatus === "details_requested" ||
                  selectedTransaction.status === "pending") && (
                  <button className="retry-payment-btn" onClick={() => handleCompletePayment(selectedTransaction)}>
                    Complete Payment
                  </button>
                )}

                {selectedTransaction.paymentStatus === "details_provided" && (
                  <button className="upload-proof-btn" onClick={() => handleCompletePayment(selectedTransaction)}>
                    Upload Payment Proof
                  </button>
                )}

                {(selectedTransaction.paymentStatus === "pending" || selectedTransaction.status === "pending") && (
                  <button
                    className="cancel-order-btn"
                    onClick={() => handleCancelOrder(selectedTransaction)}
                    disabled={cancellingOrder}
                  >
                    {cancellingOrder ? "Cancelling..." : "Cancel Order"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showPaymentModal && selectedTransaction && (
        <Payment
          isModal={true}
          onClose={closePaymentModal}
          orderId={selectedTransaction.orderId}
          amount={selectedTransaction.amount}
          customerEmail={selectedTransaction.customerEmail || user?.email}
        />
      )}
    </div>
  )
}

export default TransactionHistory
