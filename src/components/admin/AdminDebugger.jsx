"use client"

import { useState, useEffect } from "react"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "../../firebase/config"
import "./AdminDebugger.css"

const AdminDebugger = () => {
  const [debugInfo, setDebugInfo] = useState({
    detailsRequested: 0,
    detailsProvided: 0,
    proofSubmitted: 0,
    pendingPayment: 0,
    paid: 0,
    rejected: 0,
  })
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    const fetchDebugInfo = async () => {
      try {
        setLoading(true)

        // Count orders with different payment statuses
        const statuses = [
          "details_requested",
          "details_provided",
          "proof_submitted",
          "pending_payment",
          "paid",
          "rejected",
        ]

        const counts = {}

        for (const status of statuses) {
          const ordersRef = collection(db, "orders")
          const q = query(ordersRef, where("paymentStatus", "==", status))
          const querySnapshot = await getDocs(q)
          counts[status] = querySnapshot.size
        }

        setDebugInfo({
          detailsRequested: counts["details_requested"] || 0,
          detailsProvided: counts["details_provided"] || 0,
          proofSubmitted: counts["proof_submitted"] || 0,
          pendingPayment: counts["pending_payment"] || 0,
          paid: counts["paid"] || 0,
          rejected: counts["rejected"] || 0,
        })

        setLoading(false)
      } catch (err) {
        console.error("Error fetching debug info:", err)
        setLoading(false)
      }
    }

    fetchDebugInfo()
  }, [])

  return (
    <div className={`admin-debugger ${expanded ? "expanded" : "collapsed"}`}>
      <div className="debugger-header" onClick={() => setExpanded(!expanded)}>
        <h3>Admin Debugger {expanded ? "▼" : "▶"}</h3>
      </div>

      {expanded && (
        <div className="debugger-content">
          {loading ? (
            <p>Loading debug information...</p>
          ) : (
            <div className="debug-stats">
              <h4>Payment Status Counts</h4>
              <ul>
                <li>
                  <span className="status-label">Details Requested:</span>
                  <span className={`status-count ${debugInfo.detailsRequested > 0 ? "highlight" : ""}`}>
                    {debugInfo.detailsRequested}
                  </span>
                </li>
                <li>
                  <span className="status-label">Details Provided:</span>
                  <span className={`status-count ${debugInfo.detailsProvided > 0 ? "highlight" : ""}`}>
                    {debugInfo.detailsProvided}
                  </span>
                </li>
                <li>
                  <span className="status-label">Proof Submitted:</span>
                  <span className={`status-count ${debugInfo.proofSubmitted > 0 ? "highlight" : ""}`}>
                    {debugInfo.proofSubmitted}
                  </span>
                </li>
                <li>
                  <span className="status-label">Pending Payment:</span>
                  <span className={`status-count ${debugInfo.pendingPayment > 0 ? "highlight" : ""}`}>
                    {debugInfo.pendingPayment}
                  </span>
                </li>
                <li>
                  <span className="status-label">Paid:</span>
                  <span className={`status-count ${debugInfo.paid > 0 ? "highlight" : ""}`}>{debugInfo.paid}</span>
                </li>
                <li>
                  <span className="status-label">Rejected:</span>
                  <span className={`status-count ${debugInfo.rejected > 0 ? "highlight" : ""}`}>
                    {debugInfo.rejected}
                  </span>
                </li>
              </ul>

              <div className="debug-help">
                <h4>Troubleshooting</h4>
                <p>If "Details Requested" is 0, no customers have requested payment details yet.</p>
                <p>To test the payment request flow:</p>
                <ol>
                  <li>Create an order</li>
                  <li>Go to the payment page</li>
                  <li>Select a payment method like "Bank Transfer" or "PayPal"</li>
                  <li>Click "Request Payment Details"</li>
                  <li>This should create an entry in the Payment Requests page</li>
                </ol>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default AdminDebugger
