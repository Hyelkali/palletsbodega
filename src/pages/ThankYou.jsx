"use client"

import { useEffect, useState, useRef } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { getOrderById } from "../services/firebaseServices"
import { useAuth } from "../context/AuthContext"
import { useToast } from "../context/ToastContext"
import OrderTracker from "../components/OrderTracker"
import "./ThankYou.css"
import Payment from "./Payment"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"

const ThankYou = () => {
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { isLoggedIn } = useAuth()
  const { success: showSuccess, error: showError } = useToast()
  const printableAreaRef = useRef(null)

  useEffect(() => {
    const fetchOrderDetails = async () => {
      const params = new URLSearchParams(location.search)
      const orderId = params.get("orderId")
      const paymentSuccess = params.get("paymentSuccess") === "true"

      console.log("ThankYou page loaded with:", { orderId, paymentSuccess })

      if (!orderId) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const orderData = await getOrderById(orderId)
        setOrder(orderData)

        // If payment was successful, show a success message
        if (paymentSuccess) {
          showSuccess({
            title: "Payment Submitted",
            message: "Your payment has been submitted successfully. We'll process it shortly.",
          })
        }

        setLoading(false)
      } catch (err) {
        console.error("Error fetching order:", err)
        setError("Failed to load order details. Please try again.")
        setLoading(false)
      }
    }

    fetchOrderDetails()
  }, [location.search, showSuccess])

  const handlePrint = () => {
    const printContent = printableAreaRef.current.innerHTML
    const printWindow = window.open("", "_blank")

    printWindow.document.write(`
     <html>
       <head>
         <title>Order Confirmation</title>
         <style>
           body {
             font-family: Arial, sans-serif;
             color: #333;
             line-height: 1.5;
             padding: 20px;
           }
           h1, h2, h3 { color: #000; }
           .order-item {
             display: flex;
             justify-content: space-between;
             padding: 8px 0;
             border-bottom: 1px solid #eee;
           }
           .print-header {
             text-align: center;
             margin-bottom: 30px;
             border-bottom: 2px solid #000;
             padding-bottom: 10px;
           }
           .print-footer {
             text-align: center;
             margin-top: 30px;
             border-top: 1px solid #eee;
             padding-top: 10px;
             font-size: 12px;
           }
         </style>
       </head>
       <body>
         <div class="print-header">
           <h1>Pallet Bodega</h1>
           <p>Order Confirmation</p>
         </div>
         ${printContent}
         <div class="print-footer">
           <p>Thank you for your order!</p>
           <p>© ${new Date().getFullYear()} Pallet Bodega. All rights reserved.</p>
         </div>
       </body>
     </html>
   `)

    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 250)
  }

  const handleOpenPaymentModal = () => {
    console.log("Opening payment modal for order:", order.id)
    setShowPaymentModal(true)
  }

  const handleClosePaymentModal = (success = false) => {
    setShowPaymentModal(false)
    if (success) {
      // Refresh the order data if payment was successful
      window.location.reload()
    }
  }

  const isPaid = order?.paymentStatus === "paid"
  const isAwaitingReview = order?.paymentStatus === "proof_submitted"
  const needsPayment = !isPaid && !isAwaitingReview

  const generatePDF = async () => {
    if (!printableAreaRef.current) return

    const element = printableAreaRef.current
    const canvas = await html2canvas(element, {
      useCORS: true, // Enable cross-origin support
      scale: 2, // Increase the scale for better resolution
    })
    const data = canvas.toDataURL("image/png")

    const pdf = new jsPDF("p", "mm", "a4")
    const imgProps = pdf.getImageProperties(data)
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width

    pdf.addImage(data, "PNG", 0, 0, pdfWidth, pdfHeight)
    pdf.save(`order_${order.id}.pdf`)
  }

  if (loading) {
    return (
      <div className="thank-you-page">
        <div className="container">
          <div className="loading-indicator">Loading order details...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="thank-you-page">
        <div className="container">
          <div className="error-message">{error}</div>
          <div className="thank-you-actions">
            <Link to="/" className="back-to-home">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="thank-you-page">
        <div className="container">
          <div className="error-message">Order not found. Please contact support.</div>
          <div className="thank-you-actions">
            <Link to="/" className="back-to-home">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Format order date
  const orderDate = order.createdAt?.toDate
    ? new Date(order.createdAt.toDate()).toLocaleString()
    : order.createdAt instanceof Date
      ? order.createdAt.toLocaleString()
      : new Date(order.createdAt || Date.now()).toLocaleString()

  // Check if items array exists and has items
  const hasItems = Array.isArray(order.items) && order.items.length > 0

  // Check if shipping address exists and has data
  const hasShippingAddress = order.shippingAddress && Object.keys(order.shippingAddress).length > 0

  return (
    <div className="thank-you-page">
      <div className="container">
        <div className="thank-you-content">
          <div className="thank-you-header">
            {isPaid ? (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="64"
                  height="64"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="success-icon"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <h1 className="thank-you-title">Thank You for Your Purchase!</h1>
                <p className="thank-you-message">Your payment has been confirmed and your order is being processed.</p>
                <p className="order-confirmation">Order confirmation #{order.id} has been sent to your email.</p>
              </>
            ) : isAwaitingReview ? (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="64"
                  height="64"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="pending-icon"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                <h1 className="thank-you-title">Payment Under Review</h1>
                <p className="thank-you-message">
                  Your payment proof has been submitted and is being reviewed by our team. We'll process your order once
                  payment is confirmed.
                </p>
                <p className="email-notification">
                  A confirmation email has been sent to your registered email address.
                </p>
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="64"
                  height="64"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="pending-icon"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                <h1 className="thank-you-title">Order Received</h1>
                <p className="thank-you-message">
                  Your order has been received but payment is still pending. Please complete your payment to process
                  your order.
                </p>
                <div className="payment-reminder">
                  <button onClick={handleOpenPaymentModal} className="payment-button">
                    Complete Payment Now
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="order-details" ref={printableAreaRef}>
            <h2 className="section-title">Order Details</h2>
            <div className="order-info">
              <p>
                <strong>Order Number:</strong> {order.id}
              </p>
              <p>
                <strong>Date:</strong> {orderDate}
              </p>
              <p>
                <strong>Status:</strong> {order.status || "Pending"}
              </p>
              <p>
                <strong>Payment Status:</strong>{" "}
                {order.paymentStatus === "paid"
                  ? "Paid"
                  : order.paymentStatus === "proof_submitted"
                    ? "Proof Submitted - Under Review"
                    : "Awaiting Payment"}
              </p>
              <p>
                <strong>Total:</strong> ${order.totalAmount?.toFixed(2) || "0.00"} USD
              </p>
            </div>

            {order.paymentProofUrl && (
              <div className="payment-proof-section">
                <h3>Payment Proof</h3>
                <div className="payment-proof-image">
                  <img src={order.paymentProofUrl || "/placeholder.svg"} alt="Payment proof" />
                </div>
              </div>
            )}

            {order.trackingId && (
              <div className="tracking-code-section">
                <h3>Tracking Information</h3>
                <p>
                  <strong>Tracking Code:</strong> <span className="tracking-code">{order.trackingId}</span>
                </p>
              </div>
            )}

            <h3 className="subsection-title">Items Ordered</h3>
            <div className="order-items">
              {hasItems ? (
                order.items.map((item, index) => (
                  <div key={index} className="order-item">
                    <div className="item-info">
                      <span className="item-name">{item.name || "Product"}</span>
                      <span className="item-quantity">Qty: {item.quantity || 1}</span>
                    </div>
                    <span className="item-price">${((item.price || 0) * (item.quantity || 1)).toFixed(2)}</span>
                  </div>
                ))
              ) : (
                <p>No items found in this order. Please contact support if this is unexpected.</p>
              )}
            </div>

            <h3 className="subsection-title">Shipping Address</h3>
            <div className="shipping-address">
              {hasShippingAddress ? (
                <>
                  <p>
                    <strong>Name:</strong> {order.shippingAddress.firstName || ""}{" "}
                    {order.shippingAddress.lastName || ""}
                  </p>
                  <p>
                    <strong>Address:</strong> {order.shippingAddress.address || ""}
                  </p>
                  <p>
                    <strong>City/Postal:</strong> {order.shippingAddress.city || ""}
                    {order.shippingAddress.city ? ", " : ""} {order.shippingAddress.postalCode || ""}
                  </p>
                  <p>
                    <strong>Country:</strong> {order.shippingAddress.country || ""}
                  </p>
                  <p>
                    <strong>Phone:</strong> {order.shippingAddress.phone || ""}
                  </p>
                  <p>
                    <strong>Email:</strong> {order.shippingAddress.email || order.customerEmail || ""}
                  </p>
                </>
              ) : (
                <p>No shipping address found. Please contact support if this is unexpected.</p>
              )}
            </div>
          </div>

          {order.trackingId && (
            <div className="order-tracking-section">
              <h2 className="section-title">Track Your Order</h2>
              <OrderTracker trackingId={order.trackingId} />
            </div>
          )}

          <div className="thank-you-actions">
            <Link to="/" className="back-to-home">
              Continue Shopping
            </Link>
            <button onClick={handlePrint} className="print-button">
              Print Receipt
            </button>
            <button onClick={generatePDF} className="print-button">
              Download Receipt
            </button>
            {order.trackingId && (
              <Link to={`/track-shipment?tracking=${order.trackingId}`} className="track-button">
                Track Shipment
              </Link>
            )}
            {needsPayment && (
              <div className="payment-reminder">
                <p>Your order requires payment to be processed.</p>
                <button onClick={handleOpenPaymentModal} className="payment-button">
                  Complete Payment Now
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Payment Component */}
        {showPaymentModal && order && (
          <Payment
            isModal={true}
            onClose={handleClosePaymentModal}
            orderId={order.id}
            amount={order.totalAmount}
            customerEmail={order.customerEmail || order.shippingAddress?.email}
          />
        )}
      </div>
    </div>
  )
}

export default ThankYou
