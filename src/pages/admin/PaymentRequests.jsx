"use client"

import { useState, useEffect } from "react"
import { collection, query, where, doc, updateDoc, getDocs, serverTimestamp } from "firebase/firestore"
import { db } from "../../firebase/config"
import { useToast } from "../../context/ToastContext"
import { useAuth } from "../../context/AuthContext"
import "./PaymentRequests.css"

const PaymentRequests = () => {
  const [paymentRequests, setPaymentRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [paymentDetails, setPaymentDetails] = useState({
    bankName: "",
    accountName: "",
    accountNumber: "",
    routingNumber: "",
    swiftCode: "",
    additionalInstructions: "",
    paymentMethod: "",
    paymentLink: "",
    phoneNumber: "",
    emailAddress: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { success, error: showError } = useToast()
  const { user, isAdmin } = useAuth()
  const [debugInfo, setDebugInfo] = useState(null)

  // Debug log to check component mounting
  useEffect(() => {
    console.log("PaymentRequests component mounted", { isAdmin, userId: user?.uid })
    return () => console.log("PaymentRequests component unmounted")
  }, [isAdmin, user])

  useEffect(() => {
    const fetchPaymentRequests = async () => {
      try {
        setLoading(true)
        console.log("Fetching payment requests...")

        if (!user || !user.uid) {
          console.error("User ID not available")
          setLoading(false)
          return
        }

        // Query orders with payment status "details_requested"
        const ordersRef = collection(db, "orders")
        const q = query(ordersRef, where("paymentStatus", "==", "details_requested"))

        // Get the current data
        const querySnapshot = await getDocs(q)
        console.log("Number of documents found:", querySnapshot.size)

        const requests = []
        querySnapshot.forEach((doc) => {
          const data = doc.data()
          // Convert Timestamp objects to JavaScript Date objects
          const updatedAt =
            data.updatedAt && typeof data.updatedAt.toDate === "function"
              ? data.updatedAt.toDate()
              : data.updatedAt || new Date()

          requests.push({
            id: doc.id,
            ...data,
            updatedAt,
          })
        })

        setPaymentRequests(requests)
        console.log("Payment requests set:", requests)

        // Save debug info
        setDebugInfo({
          userId: user.uid,
          email: user.email,
          isAdmin: isAdmin,
          requestsCount: requests.length,
          timestamp: new Date().toISOString(),
        })

        setLoading(false)
      } catch (err) {
        console.error("Error fetching payment requests:", err)
        showError({
          title: "Error",
          message: "Failed to fetch payment requests: " + err.message,
        })
        setLoading(false)
      }
    }

    // Only fetch if user is available and is admin
    if (user && isAdmin) {
      console.log("User is admin, fetching payment requests")
      fetchPaymentRequests()
    } else {
      console.log("User is not admin or not authenticated")
      setLoading(false)
    }
  }, [showError, user, isAdmin])

  const handleSelectRequest = (request) => {
    console.log("Selected request:", request)
    setSelectedRequest(request)
    // Set payment method from the request if available
    const initialPaymentMethod = request.paymentMethod || ""

    // Reset payment details form with the payment method
    setPaymentDetails({
      bankName: "",
      accountName: "",
      accountNumber: "",
      routingNumber: "",
      swiftCode: "",
      additionalInstructions: "",
      paymentMethod: initialPaymentMethod,
      paymentLink: "",
      phoneNumber: "",
      emailAddress: "",
    })
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setPaymentDetails((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleIssuePaymentDetails = async (e) => {
    e.preventDefault()

    if (!selectedRequest) return

    try {
      setIsSubmitting(true)
      console.log("Issuing payment details for order:", selectedRequest.id)

      // Update the order with payment details
      const orderRef = doc(db, "orders", selectedRequest.id)
      await updateDoc(orderRef, {
        paymentStatus: "details_provided",
        paymentDetails: paymentDetails,
        paymentDetailsProvidedAt: serverTimestamp(),
      })

      console.log("Order updated with payment details")

      // Also update the transaction if it exists
      try {
        const transactionsRef = collection(db, "transactions")
        const q = query(transactionsRef, where("orderId", "==", selectedRequest.id))
        const querySnapshot = await getDocs(q)

        if (!querySnapshot.empty) {
          console.log("Found matching transactions:", querySnapshot.size)
          querySnapshot.forEach(async (transactionDoc) => {
            const transactionRef = doc(db, "transactions", transactionDoc.id)
            await updateDoc(transactionRef, {
              paymentDetails: paymentDetails,
              status: "details_provided",
              updatedAt: serverTimestamp(),
            })
            console.log("Transaction updated:", transactionDoc.id)
          })
        } else {
          console.log("No matching transactions found")
        }
      } catch (transactionErr) {
        console.error("Error updating transaction:", transactionErr)
        // Continue even if transaction update fails
      }

      success({
        title: "Success",
        message: "Payment details have been sent to the customer",
      })

      // Refresh the payment requests list
      const updatedRequests = paymentRequests.filter((request) => request.id !== selectedRequest.id)
      setPaymentRequests(updatedRequests)

      // Reset selected request
      setSelectedRequest(null)
    } catch (err) {
      console.error("Error issuing payment details:", err)
      showError({
        title: "Error",
        message: "Failed to issue payment details: " + err.message,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Debug render
  console.log("Rendering PaymentRequests component", {
    requestsCount: paymentRequests.length,
    loading,
    selectedRequest: selectedRequest ? selectedRequest.id : null,
    isAdmin,
  })

  if (!isAdmin) {
    return (
      <div className="payment-requests-page">
        <div className="admin-access-denied">
          <h2>Access Denied</h2>
          <p>You need administrator privileges to access this page.</p>
          <div className="debug-info">
            <p>User ID: {user?.uid || "Not logged in"}</p>
            <p>Admin Status: {isAdmin ? "Yes" : "No"}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="payment-requests-page">
      <h1 className="page-title">Payment Requests</h1>

      {loading ? (
        <div className="loading-indicator">Loading payment requests...</div>
      ) : paymentRequests.length === 0 ? (
        <div className="empty-state">
          <p>No payment requests found</p>
          <p className="debug-info">
            This page shows requests when customers select payment methods that require admin details.
            <br />
            When a customer selects methods like bank transfer or PayPal and clicks "Request Payment Details",
            <br />
            their request will appear here for you to provide the necessary payment information.
          </p>
          {debugInfo && (
            <div className="admin-debug-info">
              <h3>Debug Information</h3>
              <p>User ID: {debugInfo.userId}</p>
              <p>Email: {debugInfo.email}</p>
              <p>Admin Status: {debugInfo.isAdmin ? "Yes" : "No"}</p>
              <p>Last Updated: {new Date(debugInfo.timestamp).toLocaleString()}</p>
              <p>To test this page:</p>
              <ol>
                <li>Create a new order as a customer</li>
                <li>Go to the payment page</li>
                <li>Select a payment method (e.g., Bank Transfer)</li>
                <li>Click "Request Payment Details"</li>
                <li>The request should appear on this page</li>
              </ol>
            </div>
          )}
        </div>
      ) : (
        <div className="requests-table-container">
          <h2 className="section-title">Pending Requests</h2>
          <table className="requests-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Payment Method</th>
                <th>Date Requested</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {paymentRequests.map((request) => (
                <tr key={request.id}>
                  <td>{request.id}</td>
                  <td>{request.customerEmail || "N/A"}</td>
                  <td>${request.totalAmount?.toFixed(2) || "0.00"}</td>
                  <td>{request.paymentMethod || "N/A"}</td>
                  <td>
                    {request.updatedAt
                      ? new Date(request.updatedAt instanceof Date ? request.updatedAt : new Date()).toLocaleString()
                      : "N/A"}
                  </td>
                  <td>
                    <button className="view-button" onClick={() => handleSelectRequest(request)}>
                      Provide Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedRequest && (
        <div className="provide-details-form">
          <h2 className="section-title">Provide Payment Details</h2>
          <div className="request-summary">
            <p>
              <strong>Order ID:</strong> {selectedRequest.id}
            </p>
            <p>
              <strong>Amount:</strong> ${selectedRequest.totalAmount?.toFixed(2) || "0.00"}
            </p>
            <p>
              <strong>Method:</strong> {selectedRequest.paymentMethod || "N/A"}
            </p>
            <p>
              <strong>Customer:</strong> {selectedRequest.customerEmail || "N/A"}
            </p>
          </div>

          <form onSubmit={handleIssuePaymentDetails} className="details-form">
            <div className="form-section">
              <h3>Payment Method Information</h3>
              <div className="form-group">
                <label htmlFor="paymentMethod">Payment Method</label>
                <input
                  type="text"
                  id="paymentMethod"
                  name="paymentMethod"
                  value={paymentDetails.paymentMethod}
                  onChange={handleInputChange}
                  placeholder="e.g., Bank Transfer, PayPal, Zelle"
                  required
                />
              </div>
            </div>

            <div className="form-section">
              <h3>Bank Account Details</h3>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="bankName">Bank Name</label>
                  <input
                    type="text"
                    id="bankName"
                    name="bankName"
                    value={paymentDetails.bankName}
                    onChange={handleInputChange}
                    placeholder="e.g., Chase Bank"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="accountName">Account Name</label>
                  <input
                    type="text"
                    id="accountName"
                    name="accountName"
                    value={paymentDetails.accountName}
                    onChange={handleInputChange}
                    placeholder="e.g., John Doe"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="accountNumber">Account Number</label>
                  <input
                    type="text"
                    id="accountNumber"
                    name="accountNumber"
                    value={paymentDetails.accountNumber}
                    onChange={handleInputChange}
                    placeholder="e.g., 1234567890"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="routingNumber">Routing Number</label>
                  <input
                    type="text"
                    id="routingNumber"
                    name="routingNumber"
                    value={paymentDetails.routingNumber}
                    onChange={handleInputChange}
                    placeholder="e.g., 123456789"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="swiftCode">SWIFT Code (for international transfers)</label>
                <input
                  type="text"
                  id="swiftCode"
                  name="swiftCode"
                  value={paymentDetails.swiftCode}
                  onChange={handleInputChange}
                  placeholder="e.g., CHASUS33"
                />
              </div>
            </div>

            <div className="form-section">
              <h3>Digital Payment Details</h3>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="emailAddress">Email Address (for PayPal, etc.)</label>
                  <input
                    type="email"
                    id="emailAddress"
                    name="emailAddress"
                    value={paymentDetails.emailAddress}
                    onChange={handleInputChange}
                    placeholder="e.g., payments@example.com"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="phoneNumber">Phone Number (for Zelle, etc.)</label>
                  <input
                    type="text"
                    id="phoneNumber"
                    name="phoneNumber"
                    value={paymentDetails.phoneNumber}
                    onChange={handleInputChange}
                    placeholder="e.g., +1 (555) 123-4567"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="paymentLink">Payment Link (if applicable)</label>
                <input
                  type="text"
                  id="paymentLink"
                  name="paymentLink"
                  value={paymentDetails.paymentLink}
                  onChange={handleInputChange}
                  placeholder="e.g., https://paypal.me/example"
                />
              </div>
            </div>

            <div className="form-section">
              <h3>Additional Information</h3>
              <div className="form-group">
                <label htmlFor="additionalInstructions">Additional Instructions</label>
                <textarea
                  id="additionalInstructions"
                  name="additionalInstructions"
                  value={paymentDetails.additionalInstructions}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="Enter any additional payment instructions or notes for the customer..."
                ></textarea>
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="cancel-button" onClick={() => setSelectedRequest(null)}>
                Cancel
              </button>
              <button type="submit" className="approve-button" disabled={isSubmitting}>
                {isSubmitting ? "Sending..." : "Send Payment Details"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default PaymentRequests
