// src/pages/Payment.jsx
"use client"

import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { useToast } from "../context/ToastContext"
import { useAuth } from "../context/AuthContext" // Import the auth context
import { DollarSign, Euro, X, Upload, Copy, Check, Building, Gift, Bitcoin } from "lucide-react"
import { uploadToBlob } from "../services/blobService"
import { updatePaymentStatus } from "../api/paymentProxy"
import { getOrderById } from "../services/firebaseServices"
import "./Payment.css"

const Payment = ({
  isModal = false,
  onClose,
  orderId: propOrderId,
  amount: propAmount,
  customerEmail: propCustomerEmail,
}) => {
  const [orderId, setOrderId] = useState(propOrderId || null)
  const [amount, setAmount] = useState(propAmount || 0)
  const [customerEmail, setCustomerEmail] = useState(propCustomerEmail || "")
  const [selectedMethod, setSelectedMethod] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [processing, setProcessing] = useState(false)
  const [paymentProof, setPaymentProof] = useState(null)
  const [uploadingProof, setUploadingProof] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [copiedAddress, setCopiedAddress] = useState(null)
  const [giftCardType, setGiftCardType] = useState(null) // "code" or "image"
  const [giftCardCode, setGiftCardCode] = useState("")
  const fileInputRef = useRef(null)
  const modalRef = useRef(null)

  const navigate = useNavigate()
  const { success, error: showError } = useToast() // Only get toast functions
  const { user, isLoggedIn } = useAuth() // Get auth state from AuthContext

  // Handle click outside to close modal if in modal mode
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isModal && modalRef.current && !modalRef.current.contains(event.target)) {
        handleClose()
      }
    }

    if (isModal) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isModal, onClose])

  // Control body scroll if in modal mode
  useEffect(() => {
    if (isModal) {
      document.body.style.overflow = "hidden"
    }

    return () => {
      document.body.style.overflow = "auto"
    }
  }, [isModal])

  useEffect(() => {
    // If props are provided, use them
    if (propOrderId) setOrderId(propOrderId)
    if (propAmount) setAmount(propAmount)
    if (propCustomerEmail) setCustomerEmail(propCustomerEmail)

    // If no props, get order details from session storage (standalone page mode)
    if (!propOrderId && !isModal) {
      const storedOrderId = sessionStorage.getItem("pendingOrderId")
      const storedAmount = sessionStorage.getItem("pendingOrderAmount")
      const storedEmail = sessionStorage.getItem("pendingOrderEmail")

      if (!storedOrderId) {
        // No pending order, redirect to home
        navigate("/")
        return
      }

      setOrderId(storedOrderId)
      setAmount(Number.parseFloat(storedAmount) || 0)
      setCustomerEmail(storedEmail || "")
    }
  }, [propOrderId, propAmount, propCustomerEmail, isModal, navigate])

  // Reset copied address after 3 seconds
  useEffect(() => {
    if (copiedAddress) {
      const timer = setTimeout(() => {
        setCopiedAddress(null)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [copiedAddress])

  // Clean up preview URL when component unmounts
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  // Debug auth state
  useEffect(() => {
    console.log("Auth state in Payment component:", { isLoggedIn, user })
  }, [isLoggedIn, user])

  const handleSelectMethod = (methodId) => {
    setSelectedMethod(methodId)
    setError("")
    setPaymentProof(null)
    setPreviewUrl(null)
    setGiftCardType(null)
    setGiftCardCode("")
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Check file type
    if (!file.type.startsWith("image/")) {
      showError({
        title: "Invalid File",
        message: "Please upload an image file (JPEG, PNG, etc.)",
      })
      return
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showError({
        title: "File Too Large",
        message: "Please upload an image smaller than 5MB",
      })
      return
    }

    setPaymentProof(file)

    // Create preview URL
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setPreviewUrl(URL.createObjectURL(file))
  }

  const uploadPaymentProof = async () => {
    // Check authentication first - allow guest payments if needed
    const allowGuestPayment = true // Set to false if you want to require login

    if (!isLoggedIn && !allowGuestPayment) {
      showError({
        title: "Authentication Required",
        message: "You must be logged in to submit payment proof.",
      })
      return false
    }

    if (selectedMethod === "gift_card" && giftCardType === "code" && !giftCardCode) {
      showError({
        title: "Missing Gift Card Code",
        message: "Please enter your gift card code",
      })
      return false
    }

    if (
      (selectedMethod === "gift_card" && giftCardType === "image" && !paymentProof) ||
      (selectedMethod !== "gift_card" && selectedMethod !== "cryptocurrency" && !paymentProof)
    ) {
      showError({
        title: "Missing Proof",
        message: "Please upload a screenshot of your payment confirmation",
      })
      return false
    }

    try {
      setUploadingProof(true)
      let blobUrl = null
      let paymentDetails = {}

      // Handle gift card code
      if (selectedMethod === "gift_card" && giftCardType === "code") {
        paymentDetails = {
          giftCardCode: giftCardCode,
        }
      }
      // Handle gift card image or other payment proof
      else if (paymentProof) {
        // Upload to Vercel Blob
        blobUrl = await uploadToBlob(paymentProof, `payment-proofs/${orderId}`)
        console.log("Payment proof uploaded to Vercel Blob:", blobUrl)

        if (selectedMethod === "gift_card") {
          paymentDetails = {
            giftCardType: "image",
            giftCardImageUrl: blobUrl,
          }
        }
      }

      // Update order with payment proof URL using our proxy API
      // Allow guest payments by passing customer email if user is not logged in
      const userId = user?.uid || null
      const userEmail = user?.email || customerEmail

      console.log("Updating payment status with:", {
        orderId,
        status: "proof_submitted",
        method: selectedMethod,
        proofUrl: blobUrl,
        details: paymentDetails,
        userId,
        userEmail,
      })

      await updatePaymentStatus(orderId, "proof_submitted", selectedMethod, blobUrl, paymentDetails)

      // Get the updated order to send in the email
      const orderData = await getOrderById(orderId)

      success({
        title: "Payment Submitted",
        message: "Your payment proof has been submitted. We'll review it shortly.",
      })

      return true
    } catch (err) {
      console.error("Error uploading payment proof:", err)
      setError(err.message || "Failed to upload payment proof")
      showError({
        title: "Upload Failed",
        message: err.message || "There was an error uploading your payment proof",
      })
      return false
    } finally {
      setUploadingProof(false)
    }
  }

  const handlePaymentConfirmation = async () => {
    try {
      setProcessing(true)
      const result = await uploadPaymentProof()

      if (result) {
        // Add a small delay before navigating
        setTimeout(() => {
          // Navigate to thank you page on success
          if (isModal && onClose) {
            onClose(true) // Pass true to indicate successful payment
          } else {
            navigate(`/thank-you?orderId=${orderId}&paymentSuccess=true`)
          }
        }, 1000)
      } else {
        setProcessing(false)
      }
    } catch (err) {
      console.error("Error confirming payment:", err)
      setError(err.message || "Failed to confirm payment")
      showError({
        title: "Payment Failed",
        message: err.message || "There was an error processing your payment. Please try again or contact support.",
      })
      setProcessing(false)
    }
  }

  const handleRequestPaymentDetails = async () => {
    // Check authentication first - allow guest payments if needed
    const allowGuestPayment = true // Set to false if you want to require login

    if (!isLoggedIn && !allowGuestPayment) {
      showError({
        title: "Authentication Required",
        message: "You must be logged in to request payment details.",
      })
      return
    }

    try {
      setProcessing(true)

      // Update order with payment method request using our proxy API
      // Allow guest requests by passing customer email if user is not logged in
      const userId = user?.uid || null
      const userEmail = user?.email || customerEmail

      console.log("Requesting payment details with:", {
        orderId,
        status: "details_requested",
        method: selectedMethod,
        userId,
        userEmail,
      })

      // Make sure we're passing the payment method to the update
      await updatePaymentStatus(orderId, "details_requested", selectedMethod)

      success({
        title: "Request Sent",
        message: "Payment details request sent to admin. You will be notified when details are available.",
      })

      // Add a small delay before navigating
      setTimeout(() => {
        // Navigate to thank you page on success
        if (isModal && onClose) {
          onClose(true) // Pass true to indicate successful request
        } else {
          navigate(`/thank-you?orderId=${orderId}`)
        }
      }, 1000)
    } catch (err) {
      console.error("Error requesting payment details:", err)
      setError(err.message || "Failed to request payment details")
      showError({
        title: "Request Failed",
        message: err.message || "There was an error requesting payment details",
      })
      setProcessing(false)
    }
  }

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text).then(
      () => {
        setCopiedAddress(type)
        success({
          title: "Copied!",
          message: `${type} address copied to clipboard`,
        })
      },
      (err) => {
        console.error("Could not copy text: ", err)
        showError({
          title: "Copy Failed",
          message: "Failed to copy address to clipboard",
        })
      },
    )
  }

  const handleClose = () => {
    // Reset all states
    setSelectedMethod(null)
    setError("")
    setProcessing(false)
    setCopiedAddress(null)
    setPaymentProof(null)
    setUploadingProof(false)
    setGiftCardType(null)
    setGiftCardCode("")

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }

    // If a parent-provided close handler exists, call it
    if (isModal && onClose) {
      onClose()
      return
    }

    // Otherwise, navigate to the thank-you page
    navigate(`/thank-you?orderId=${orderId}`)
  }

  const selectGiftCardType = (type) => {
    setGiftCardType(type)
    if (type === "code") {
      setPaymentProof(null)
      setPreviewUrl(null)
    } else {
      setGiftCardCode("")
    }
  }

  // List of payment methods to display
  const paymentMethods = [
    {
      id: "chime",
      name: "Chime",
      icon: <Building size={32} />,
      available: true,
    },
    {
      id: "apple_pay",
      name: "Apple Pay",
      icon: <DollarSign size={32} />,
      available: true,
    },
    {
      id: "zelle",
      name: "Zelle",
      icon: <DollarSign size={32} />,
      available: true,
    },
    {
      id: "venmo",
      name: "Venmo",
      icon: <DollarSign size={32} />,
      available: true,
    },
    {
      id: "paypal",
      name: "PayPal",
      icon: <DollarSign size={32} />,
      available: true,
    },
    {
      id: "bank_transfer",
      name: "Bank Transfer",
      icon: <Building size={32} />,
      available: true,
    },
    {
      id: "uk_eu_payment",
      name: "UK/EU Payment",
      icon: <Euro size={32} />,
      available: true,
    },
    {
      id: "ach_transfer",
      name: "ACH Transfer",
      icon: <DollarSign size={32} />,
      available: true,
    },
    {
      id: "gift_card",
      name: "Gift Card",
      icon: <Gift size={32} />,
      available: true,
    },
    {
      id: "cryptocurrency",
      name: "Cryptocurrency",
      icon: <Bitcoin size={32} />,
      available: true,
    },
  ]

  // Cryptocurrency addresses
  const cryptoAddresses = {
    btc: "bc1qjshl98302vrxps85ley4f07f0mfyclnaxlplnz",
    eth: "0x0B45F9d452a9F1a44Ec39e978aB3cd32E73b6548",
    usdt: "0x0B45F9d452a9F1a44Ec39e978aB3cd32E73b6548", // Same as ETH since it's an ERC20 token
  }

  console.log("Payment render state:", { selectedMethod, loading, error, processing, isLoggedIn, user })

  const containerClass = isModal ? "payment-modal-overlay" : "payment-page professional-payment"
  const contentClass = isModal ? "payment-modal theme-dark" : "payment-container"

  return (
    <div className={containerClass}>
      <div className={isModal ? "" : "container payment-container-wrapper"}>
        <div className={contentClass} ref={modalRef}>
          <div className="payment-header gradient-header">
            <h2>Complete Your Payment</h2>
            <button className="close-button" onClick={handleClose} aria-label="Close payment page">
              <X size={24} />
            </button>
          </div>

          <div className="payment-amount">
            <h3>Order Total: ${Number.parseFloat(amount).toFixed(2)} USD</h3>
            <p className="order-reference">Order #: {orderId}</p>
          </div>

          <div className="payment-content">
            {loading ? (
              <div style={{ textAlign: "center", padding: "20px" }}>
                <p>Loading payment options...</p>
              </div>
            ) : error && !selectedMethod ? (
              <div className="payment-error" role="alert">
                <p>{error}</p>
              </div>
            ) : (
              <>
                {!selectedMethod ? (
                  <>
                    <h4>Select Payment Method</h4>
                    <p className="payment-instruction">
                      Please select your preferred payment method to complete your purchase.
                    </p>
                    <div className="payment-methods-grid">
                      {paymentMethods.map((method) => (
                        <button
                          key={method.id}
                          className={`payment-method-button ${!method.available ? "disabled" : ""}`}
                          onClick={() => handleSelectMethod(method.id)}
                          disabled={!method.available || processing}
                          aria-label={`Pay with ${method.name}`}
                        >
                          <div className="payment-method-icon">{method.icon}</div>
                          <div className="payment-method-name">{method.name}</div>
                        </button>
                      ))}
                    </div>
                  </>
                ) : selectedMethod === "gift_card" ? (
                  <div className="payment-details-container">
                    <button
                      className="back-button"
                      onClick={() => handleSelectMethod(null)}
                      disabled={processing || uploadingProof}
                    >
                      ← Back to payment methods
                    </button>

                    <h3>Gift Card Payment</h3>

                    {!giftCardType ? (
                      <div className="gift-card-type-selection">
                        <p>Do you have a gift card code or a gift card image?</p>
                        <div className="gift-card-options">
                          <button className="gift-card-option-button" onClick={() => selectGiftCardType("code")}>
                            I have a gift card code
                          </button>
                          <button className="gift-card-option-button" onClick={() => selectGiftCardType("image")}>
                            I have a gift card image
                          </button>
                        </div>
                      </div>
                    ) : giftCardType === "code" ? (
                      <div className="gift-card-code-container">
                        <button
                          className="back-button secondary"
                          onClick={() => setGiftCardType(null)}
                          disabled={processing}
                        >
                          ← Back to gift card options
                        </button>

                        <div className="gift-card-code-input">
                          <h4>Enter Gift Card Code</h4>
                          <p>Please enter your gift card code below</p>
                          <input
                            type="text"
                            value={giftCardCode}
                            onChange={(e) => setGiftCardCode(e.target.value)}
                            placeholder="Enter gift card code"
                            className="gift-card-input"
                            disabled={processing}
                          />
                        </div>

                        <button
                          className="payment-submit-button"
                          onClick={handlePaymentConfirmation}
                          disabled={processing || !giftCardCode.trim()}
                        >
                          {processing ? "Processing..." : "Submit Gift Card Code"}
                        </button>
                      </div>
                    ) : (
                      <div className="gift-card-image-container">
                        <button
                          className="back-button secondary"
                          onClick={() => setGiftCardType(null)}
                          disabled={processing || uploadingProof}
                        >
                          ← Back to gift card options
                        </button>

                        <div className="payment-proof-upload">
                          <h4>Upload Gift Card Image</h4>
                          <p className="upload-instructions">
                            Please upload a clear image of your gift card showing the code
                          </p>

                          {previewUrl && (
                            <div className="proof-preview">
                              <img src={previewUrl || "/placeholder.svg"} alt="Gift card preview" />
                            </div>
                          )}

                          <div className="upload-controls">
                            <input
                              type="file"
                              ref={fileInputRef}
                              onChange={handleFileChange}
                              accept="image/*"
                              className="file-input"
                              id="gift-card-image"
                            />
                            <button
                              className="upload-button"
                              onClick={() => fileInputRef.current.click()}
                              disabled={processing || uploadingProof}
                            >
                              <Upload size={16} />
                              Select Gift Card Image
                            </button>
                            {paymentProof && <span className="file-name">{paymentProof.name}</span>}
                          </div>
                        </div>

                        <button
                          className="payment-submit-button"
                          onClick={handlePaymentConfirmation}
                          disabled={processing || uploadingProof || !paymentProof}
                        >
                          {processing || uploadingProof ? "Processing..." : "Submit Gift Card Image"}
                        </button>
                      </div>
                    )}
                  </div>
                ) : selectedMethod === "cryptocurrency" ? (
                  <div className="payment-details-container">
                    <button
                      className="back-button"
                      onClick={() => handleSelectMethod(null)}
                      disabled={processing || uploadingProof}
                    >
                      ← Back to payment methods
                    </button>

                    <h3>Cryptocurrency Payment</h3>
                    <div className="crypto-instructions">
                      <p>
                        Please send the equivalent of <strong>${Number.parseFloat(amount).toFixed(2)} USD</strong> in
                        any of the cryptocurrencies below.
                      </p>
                      <p>
                        Include your Order ID <strong>{orderId}</strong> in the transaction memo/description if
                        possible.
                      </p>
                    </div>

                    <div className="crypto-options">
                      <div className="crypto-option">
                        <h4>Bitcoin (BTC)</h4>
                        <div className="crypto-qr">
                          <img src="/images/crypto/bitcoin.png" alt="Bitcoin QR Code" className="crypto-qr-image" />
                        </div>
                        <div className="crypto-address-container">
                          <div className="crypto-address">{cryptoAddresses.btc}</div>
                          <button
                            className="copy-button"
                            onClick={() => copyToClipboard(cryptoAddresses.btc, "BTC")}
                            aria-label="Copy Bitcoin address"
                          >
                            {copiedAddress === "BTC" ? <Check size={16} /> : <Copy size={16} />}
                          </button>
                        </div>
                      </div>

                      <div className="crypto-option">
                        <h4>Ethereum (ETH)</h4>
                        <div className="crypto-qr">
                          <img src="/images/crypto/ethereum.png" alt="Ethereum QR Code" className="crypto-qr-image" />
                        </div>
                        <div className="crypto-address-container">
                          <div className="crypto-address">{cryptoAddresses.eth}</div>
                          <button
                            className="copy-button"
                            onClick={() => copyToClipboard(cryptoAddresses.eth, "ETH")}
                            aria-label="Copy Ethereum address"
                          >
                            {copiedAddress === "ETH" ? <Check size={16} /> : <Copy size={16} />}
                          </button>
                        </div>
                      </div>

                      <div className="crypto-option">
                        <h4>USDT (ERC20)</h4>
                        <div className="crypto-qr">
                          <img src="/images/crypto/usdt.png" alt="USDT QR Code" className="crypto-qr-image" />
                        </div>
                        <div className="crypto-address-container">
                          <div className="crypto-address">{cryptoAddresses.usdt}</div>
                          <button
                            className="copy-button"
                            onClick={() => copyToClipboard(cryptoAddresses.usdt, "USDT")}
                            aria-label="Copy USDT address"
                          >
                            {copiedAddress === "USDT" ? <Check size={16} /> : <Copy size={16} />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="payment-warning">
                      <p>
                        <strong>Important:</strong> Please ensure you're sending the correct cryptocurrency to the
                        corresponding address. Sending the wrong type of cryptocurrency may result in permanent loss of
                        funds.
                      </p>
                    </div>

                    <div className="payment-proof-upload">
                      <h4>Upload Payment Proof</h4>
                      <p className="upload-instructions">
                        Please upload a screenshot showing your transaction confirmation
                      </p>

                      {previewUrl && (
                        <div className="proof-preview">
                          <img src={previewUrl || "/placeholder.svg"} alt="Payment proof preview" />
                        </div>
                      )}

                      <div className="upload-controls">
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          accept="image/*"
                          className="file-input"
                          id="payment-proof"
                        />
                        <button
                          className="upload-button"
                          onClick={() => fileInputRef.current.click()}
                          disabled={processing || uploadingProof}
                        >
                          <Upload size={16} />
                          Select Screenshot
                        </button>
                        {paymentProof && <span className="file-name">{paymentProof.name}</span>}
                      </div>
                    </div>

                    <button
                      className="payment-submit-button"
                      onClick={handlePaymentConfirmation}
                      disabled={processing || uploadingProof || !paymentProof}
                    >
                      {processing || uploadingProof ? "Processing..." : "Submit Payment Proof"}
                    </button>
                  </div>
                ) : selectedMethod === "bank_transfer" ? (
                  <div className="payment-details-container">
                    <button
                      className="back-button"
                      onClick={() => handleSelectMethod(null)}
                      disabled={processing || uploadingProof}
                    >
                      ← Back to payment methods
                    </button>

                    <h3>Bank Transfer Details</h3>
                    <div className="merchant-notice">
                      <p>This is a secure merchant bank account for business transactions.</p>
                    </div>
                    <div className="bank-details">
                      <div className="bank-detail-row">
                        <span className="detail-label">Account Name:</span>
                        <span className="detail-value">Jonah Bumie Fortune</span>
                      </div>
                      <div className="bank-detail-row">
                        <span className="detail-label">Account Number:</span>
                        <span className="detail-value">214277952564</span>
                      </div>
                      <div className="bank-detail-row">
                        <span className="detail-label">Wire Routing:</span>
                        <span className="detail-value">101019644</span>
                      </div>
                      <div className="bank-detail-row">
                        <span className="detail-label">ACH Routing:</span>
                        <span className="detail-value">101019644</span>
                      </div>
                      <div className="bank-detail-row">
                        <span className="detail-label">Account Type:</span>
                        <span className="detail-value">Checking</span>
                      </div>
                      <div className="bank-detail-row">
                        <span className="detail-label">Bank Name:</span>
                        <span className="detail-value">Lead Bank</span>
                      </div>
                    </div>

                    <div className="payment-instructions">
                      <p>
                        Please include your Order ID <strong>{orderId}</strong> as the payment reference.
                      </p>
                      <p>After completing the transfer, upload a screenshot of your payment confirmation below.</p>
                    </div>

                    <div className="payment-proof-upload">
                      <h4>Upload Payment Proof</h4>
                      <p className="upload-instructions">
                        Please upload a screenshot showing your payment confirmation
                      </p>

                      {previewUrl && (
                        <div className="proof-preview">
                          <img src={previewUrl || "/placeholder.svg"} alt="Payment proof preview" />
                        </div>
                      )}

                      <div className="upload-controls">
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          accept="image/*"
                          className="file-input"
                          id="payment-proof"
                        />
                        <button
                          className="upload-button"
                          onClick={() => fileInputRef.current.click()}
                          disabled={processing || uploadingProof}
                        >
                          <Upload size={16} />
                          Select Screenshot
                        </button>
                        {paymentProof && <span className="file-name">{paymentProof.name}</span>}
                      </div>
                    </div>

                    <button
                      className="payment-submit-button"
                      onClick={handlePaymentConfirmation}
                      disabled={processing || uploadingProof || !paymentProof}
                    >
                      {processing || uploadingProof ? "Processing..." : "Submit Payment Proof"}
                    </button>
                  </div>
                ) : (
                  <div className="payment-details-container">
                    <button
                      className="back-button"
                      onClick={() => handleSelectMethod(null)}
                      disabled={processing || uploadingProof}
                    >
                      ← Back to payment methods
                    </button>

                    <h3>Request Payment Details</h3>
                    <div className="payment-instructions">
                      <p>To proceed with this payment method, you need to request payment details from the admin.</p>
                      <p>
                        Click the button below to send a request. You will be notified when the details are available.
                      </p>
                    </div>

                    <button
                      className="payment-submit-button"
                      onClick={handleRequestPaymentDetails}
                      disabled={processing}
                    >
                      {processing ? "Processing..." : "Request Payment Details"}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="payment-footer">
            <p>Powered by</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Payment
