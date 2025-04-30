"use client"

import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { useNavigate } from "react-router-dom"
import { useToast } from "../context/ToastContext"
// Import the Globe icon for Nigeria Payment
import { DollarSign, Euro, Copy, Check, Upload, X, Building, Gift } from "lucide-react"
import { uploadToBlob } from "../services/blobService"
import { updatePaymentStatus } from "../api/paymentProxy"
import "./PaymentModal.css"

const PaymentModal = ({ isOpen, onClose, orderId, amount, customerEmail }) => {
  console.log("PaymentModal rendering with props:", { isOpen, orderId, amount, customerEmail })
  const [selectedMethod, setSelectedMethod] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [processing, setProcessing] = useState(false)
  const [copiedAddress, setCopiedAddress] = useState(null)
  const [paymentProof, setPaymentProof] = useState(null)
  const [uploadingProof, setUploadingProof] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(null)
  const fileInputRef = useRef(null)
  const modalRef = useRef(null)
  const { success, error: showError } = useToast()
  const navigate = useNavigate()

  // Handle click outside to close modal
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen, onClose])

  // Control body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "auto"
    }

    return () => {
      document.body.style.overflow = "auto"
    }
  }, [isOpen])

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

  const handleSelectMethod = (methodId) => {
    setSelectedMethod(methodId)
    setError("")
    setPaymentProof(null)
    setPreviewUrl(null)
  }

  const handleRequestPaymentDetails = async () => {
    try {
      setProcessing(true)

      // Simulate API call to request payment details from admin
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Update order with payment method request using our proxy API
      await updatePaymentStatus(orderId, "details_requested", selectedMethod)

      success({
        title: "Request Sent",
        message: "Payment details request sent to admin. You will be notified when details are available.",
      })

      // Navigate to thank you page
      navigate(`/thank-you?orderId=${orderId}`)
    } catch (err) {
      console.error("Error requesting payment details:", err)
      setError(err.message || "Failed to request payment details")
      showError({
        title: "Request Failed",
        message: err.message || "There was an error requesting payment details",
      })
    } finally {
      setProcessing(false)
    }
  }

  const handleFileChange = async (e) => {
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

  // Update the handlePaymentConfirmation function to properly handle the processing state
  const handlePaymentConfirmation = async () => {
    if (!paymentProof) {
      showError({
        title: "Missing Proof",
        message: "Please upload a screenshot of your payment confirmation",
      })
      return
    }

    try {
      setProcessing(true)

      // Add a timeout to ensure the processing state is visible
      setTimeout(async () => {
        try {
          await uploadPaymentProof()

          // Navigate to thank you page on success
          navigate(`/thank-you?orderId=${orderId}`)
        } catch (err) {
          console.error("Error confirming payment:", err)
          setError(err.message || "Failed to confirm payment")
          setProcessing(false)
        }
      }, 1500)
    } catch (err) {
      console.error("Error confirming payment:", err)
      setError(err.message || "Failed to confirm payment")
      setProcessing(false)
    }
  }

  // Update the uploadPaymentProof function to handle errors better
  const uploadPaymentProof = async () => {
    if (!paymentProof) {
      showError({
        title: "Missing Proof",
        message: "Please upload a screenshot of your payment confirmation",
      })
      return
    }

    try {
      setUploadingProof(true)

      // Upload to Vercel Blob
      const blobUrl = await uploadToBlob(paymentProof, `payment-proofs/${orderId}`)

      console.log("Payment proof uploaded to Vercel Blob:", blobUrl)

      // Update order with payment proof URL using our proxy API
      await updatePaymentStatus(orderId, "proof_submitted", selectedMethod, blobUrl)

      success({
        title: "Proof Submitted",
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
      throw err
    } finally {
      setUploadingProof(false)
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
    navigate(`/thank-you?orderId=${orderId}`)
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
  ]

  // Cryptocurrency addresses
  const cryptoAddresses = {
    btc: "bc1qjshl98302vrxps85ley4f07f0mfyclnaxlplnz",
    eth: "0x0B45F9d452a9F1a44Ec39e978aB3cd32E73b6548",
    usdt: "0x0B45F9d452a9F1a44Ec39e978aB3cd32E73b6548", // Same as ETH since it's an ERC20 token
  }

  console.log("PaymentModal render state:", { selectedMethod, loading, error, processing })

  return createPortal(
    <div className="payment-modal-overlay">
      <div className="payment-modal theme-dark" ref={modalRef}>
        <div className="payment-modal-header gradient-header">
          <h2>Payment Confirmation</h2>
          <button className="close-button" onClick={handleClose} aria-label="Close payment page">
            <X size={24} />
          </button>
        </div>

        <div className="payment-modal-amount">
          <h3>Amount: ${Number.parseFloat(amount).toFixed(2)} USD</h3>
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
                    <p className="upload-instructions">Please upload a screenshot showing your payment confirmation</p>

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
                      Please send the equivalent of <strong>${Number.parseFloat(amount).toFixed(2)} USD</strong> in any
                      of the cryptocurrencies below.
                    </p>
                    <p>
                      Include your Order ID <strong>{orderId}</strong> in the transaction memo/description if possible.
                    </p>
                  </div>

                  <div className="crypto-options">
                    <div className="crypto-option">
                      <h4>Bitcoin (BTC)</h4>
                      <div className="crypto-qr">
                        <img
                          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/6005955024481536391.jpg-UVYzJW5HmZEWVxLyN9Lz1rRPy96fR7.jpeg"
                          alt="Bitcoin QR Code"
                        />
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
                        <img
                          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/6005955024481536392.jpg-lBVDAdUn9wlNSi0QnnLfxpsft4DyA9.jpeg"
                          alt="Ethereum QR Code"
                        />
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
                        <img
                          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/6005955024481536393.jpg-2F5pfnPPtDC0RAqoqYpBprzfglSORO.jpeg"
                          alt="USDT QR Code"
                        />
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

                  <button className="payment-submit-button" onClick={handleRequestPaymentDetails} disabled={processing}>
                    {processing ? "Processing..." : "Request Payment Details"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        <div className="payment-modal-footer">
          <p>Powered by</p>
        </div>
      </div>
    </div>,
    document.body,
  )
}

export default PaymentModal
