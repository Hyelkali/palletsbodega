"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useCart } from "../context/CartContext"
import { useAuth } from "../context/AuthContext"
import { useToast } from "../context/ToastContext"
import { createOrder } from "../services/firebaseServices"
// import { sendOrderConfirmationEmail } from "../services/emailServices"
import "./Checkout.css"

const Checkout = () => {
  const { cartItems, clearCart } = useCart()
  const { isLoggedIn, user } = useAuth()
  const navigate = useNavigate()
  const { success, error: showError } = useToast()

  const [shouldRedirect, setShouldRedirect] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [orderSummary, setOrderSummary] = useState(null)

  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    country: "",
    postalCode: "",
    phone: "",
  })

  const [showLoginPrompt, setShowLoginPrompt] = useState(false)

  // If cart is empty, don't render anything while the redirect happens
  const [shippingInfo, setShippingInfo] = useState({
    email: "",
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    country: "",
    postalCode: "",
    phone: "",
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  // Check if cart is empty and set redirect flag
  useEffect(() => {
    if (cartItems.length === 0) {
      setShouldRedirect(true)
    }
  }, [cartItems])

  // Handle redirect if cart is empty
  useEffect(() => {
    if (shouldRedirect) {
      navigate("/cart")
    }
  }, [shouldRedirect, navigate])

  // Pre-fill email if user is logged in
  useEffect(() => {
    if (isLoggedIn && user?.email) {
      setFormData((prev) => ({
        ...prev,
        email: user.email,
      }))
    }
  }, [isLoggedIn, user])

  // Load saved checkout data from session storage
  useEffect(() => {
    const savedCheckoutData = sessionStorage.getItem("checkoutData")
    if (savedCheckoutData) {
      try {
        const checkoutData = JSON.parse(savedCheckoutData)
        setFormData((prev) => ({
          ...prev,
          ...checkoutData,
        }))
      } catch (error) {
        console.error("Error parsing checkout data:", error)
      }
    }
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    // Save to session storage as user types
    const updatedData = { ...formData, [name]: value }
    sessionStorage.setItem("checkoutData", JSON.stringify(updatedData))
  }

  const validatePhone = (phone) => {
    // Basic validation for international phone format with country code
    const phoneRegex = /^\+[1-9]\d{0,2}[ -]?\d{1,14}$/
    return phoneRegex.test(phone)
  }

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!isLoggedIn) {
      setShowLoginPrompt(true)
      return
    }

    // Validate form data
    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.address ||
      !formData.city ||
      !formData.country ||
      !formData.postalCode ||
      !formData.phone
    ) {
      showError({
        title: "Form Error",
        message: "Please fill in all required fields",
      })
      return
    }

    // Validate phone number
    if (!validatePhone(formData.phone)) {
      showError({
        title: "Invalid Phone Number",
        message: "Please enter a valid phone number with country code (e.g., +1 for US)",
      })
      return
    }

    // Set order summary for review
    setOrderSummary({
      items: cartItems,
      totalAmount: calculateTotal(),
      shippingAddress: {
        ...formData,
      },
    })

    // Show review modal
    setShowReviewModal(true)
  }

  const handleReviewConfirm = async () => {
    if (isProcessing) return // Prevent double submission

    try {
      setIsProcessing(true)
      setShowReviewModal(false)

      // Create a simplified order object to avoid permission issues
      const orderData = {
        items: cartItems.map((item) => ({
          id: item.id || "",
          name: item.name || "Unknown Product",
          price: item.price || 0,
          quantity: item.quantity || 1,
          images: item.images || [],
        })),
        totalAmount: calculateTotal(),
        shippingAddress: {
          firstName: formData.firstName || "",
          lastName: formData.lastName || "",
          address: formData.address || "",
          city: formData.city || "",
          country: formData.country || "",
          postalCode: formData.postalCode || "",
          phone: formData.phone || "",
          email: formData.email || "",
        },
        customerEmail: user?.email || formData.email || "palletsbodega@gmail.com",
        customerId: user?.uid || "guest",
        status: "pending",
        paymentStatus: "pending_payment",
        paymentMethod: "pending",
        createdAt: new Date(),
      }

      console.log("Creating order with data:", JSON.stringify(orderData))
      const order = await createOrder(orderData)
      console.log("Order created successfully:", order)

      // Send order confirmation email
      try {
        // Commented out for now as it might not be implemented yet
        // await sendOrderConfirmationEmail(order)
      } catch (emailError) {
        console.error("Error sending order confirmation email:", emailError)
        // Continue even if email fails
      }

      // Clear cart after successful order creation
      clearCart()

      // Store order ID in session storage for payment page
      sessionStorage.setItem("pendingOrderId", order.id)
      sessionStorage.setItem("pendingOrderAmount", calculateTotal())
      sessionStorage.setItem("pendingOrderEmail", formData.email || user?.email)

      success({
        title: "Order Created",
        message: "Your order has been created successfully. Proceeding to payment.",
      })

      // Navigate to payment page
      navigate("/payment")
    } catch (err) {
      console.error("Error creating order:", err)
      showError({
        title: "Order Error",
        message: err.message || "Failed to create your order. Please try again.",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleLoginRedirect = () => {
    // Store checkout data in session storage
    sessionStorage.setItem("checkoutData", JSON.stringify(formData))
    navigate("/login?redirect=checkout")
  }

  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  // If cart is empty, don't render anything while the redirect happens
  if (shouldRedirect) {
    return null
  }

  const cartTotal = calculateTotal()

  useEffect(() => {
    if (isLoggedIn && user?.email) {
      setShippingInfo((prev) => ({
        ...prev,
        email: user.email,
      }))
    }
  }, [isLoggedIn, user])

  const handleShippingChange = (e) => {
    const { name, value } = e.target
    setShippingInfo((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const validateForm = () => {
    if (
      !shippingInfo.firstName ||
      !shippingInfo.lastName ||
      !shippingInfo.address ||
      !shippingInfo.city ||
      !shippingInfo.country ||
      !shippingInfo.postalCode ||
      !shippingInfo.phone ||
      !shippingInfo.email
    ) {
      showError({
        title: "Form Error",
        message: "Please fill in all required fields",
      })
      return false
    }

    if (!validatePhone(shippingInfo.phone)) {
      showError({
        title: "Invalid Phone Number",
        message: "Please enter a valid phone number with country code (e.g., +1 for US)",
      })
      return false
    }

    return true
  }

  const handlePlaceOrder = async () => {
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      // Create the order
      const orderData = {
        customerEmail: user?.email || shippingInfo.email,
        customerId: user?.uid || "guest",
        totalAmount: cartTotal,
        items: cartItems.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          images: item.images || [],
        })),
        shippingAddress: {
          firstName: shippingInfo.firstName,
          lastName: shippingInfo.lastName,
          address: shippingInfo.address,
          city: shippingInfo.city,
          country: shippingInfo.country,
          postalCode: shippingInfo.postalCode,
          phone: shippingInfo.phone,
          email: shippingInfo.email,
        },
        paymentStatus: "pending_payment",
        createdAt: new Date().toISOString(),
      }

      console.log("Creating order with data:", orderData)
      const order = await createOrder(orderData)
      console.log("Order created:", order)

      // Store order info in session storage for the payment page
      sessionStorage.setItem("pendingOrderId", order.id)
      sessionStorage.setItem("pendingOrderAmount", cartTotal.toString())
      sessionStorage.setItem("pendingOrderEmail", shippingInfo.email)

      // Clear cart after successful order
      clearCart()

      // Show success message
      success({
        title: "Order Placed",
        message: "Your order has been placed successfully!",
      })

      // Navigate to payment page
      console.log("Navigating to payment page for order:", order.id)
      navigate("/payment")
    } catch (err) {
      console.error("Error placing order:", err)
      showError({
        title: "Order Failed",
        message: err.message || "There was an error placing your order. Please try again.",
      })
      setIsSubmitting(false)
    }
  }

  return (
    <div className="checkout-page">
      <div className="container">
        <h1 className="page-title">Checkout</h1>

        <div className="checkout-container">
          <div className="checkout-form-container">
            <form className="checkout-form" onSubmit={handleSubmit}>
              <div className="form-section">
                <h2 className="section-title">Contact information</h2>

                <div className="form-group">
                  <label htmlFor="email" className="form-label">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="form-input"
                    disabled={isLoggedIn}
                  />
                </div>

                {!isLoggedIn && (
                  <div className="login-prompt">
                    <p>
                      Already have an account?{" "}
                      <button type="button" onClick={handleLoginRedirect} className="login-link">
                        Log in
                      </button>
                    </p>
                  </div>
                )}
              </div>

              <div className="form-section">
                <h2 className="section-title">Shipping information</h2>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="firstName" className="form-label">
                      First name
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="lastName" className="form-label">
                      Last name
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="address" className="form-label">
                    Address
                  </label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    required
                    className="form-input"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="city" className="form-label">
                      City
                    </label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      required
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="country" className="form-label">
                      Country
                    </label>
                    <select
                      id="country"
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      required
                      className="form-select"
                    >
                      <option value="">Select country</option>
                      <option value="US">United States</option>
                      <option value="CA">Canada</option>
                      <option value="UK">United Kingdom</option>
                      <option value="AU">Australia</option>
                      <option value="NZ">New Zealand</option>
                      <option value="IN">India</option>
                      <option value="JP">Japan</option>
                      <option value="CN">China</option>
                      <option value="BR">Brazil</option>
                      <option value="MX">Mexico</option>
                      <option value="PH">Philippines</option>
                      <option value="ID">Indonesia</option>
                      <option value="TH">Thailand</option>
                      <option value="SG">Singapore</option>
                      <option value="MY">Malaysia</option>
                      <option value="VN">Vietnam</option>
                      <option value="PK">Pakistan</option>
                      <option value="BD">Bangladesh</option>
                      <option value="EG">Egypt</option>
                      <option value="AE">United Arab Emirates</option>
                      <option value="SA">Saudi Arabia</option>
                      <option value="GH">Ghana</option>
                      <option value="KE">Kenya</option>
                      <option value="ZA">South Africa</option>
                      <option value="DE">Germany</option>
                      <option value="FR">France</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="postalCode" className="form-label">
                      Postal code
                    </label>
                    <input
                      type="text"
                      id="postalCode"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleChange}
                      required
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="phone" className="form-label">
                      Phone (include country code)
                    </label>
                    <div className="phone-input-container">
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                        className="form-input"
                        placeholder="+1 (555) 555-5555"
                      />
                    </div>
                    <small className="form-hint">Include country code (e.g., +1 for US, +44 for UK)</small>
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="checkout-button" disabled={isProcessing}>
                  {isProcessing ? "Processing..." : isLoggedIn ? "Review Order" : "Log in to Complete Order"}
                </button>
              </div>
            </form>
          </div>

          <div className="order-summary">
            <h2 className="summary-title">Order summary</h2>

            <div className="summary-items">
              {cartItems.map((item) => (
                <div key={item.id} className="summary-item">
                  <div className="item-info">
                    <span className="item-quantity">{item.quantity} ×</span>
                    <span className="item-name">{item.name}</span>
                  </div>
                  <span className="item-price">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="summary-totals">
              <div className="summary-row">
                <span>Subtotal</span>
                <span>${calculateSubtotal().toFixed(2)}</span>
              </div>

              <div className="summary-row">
                <span>Shipping</span>
                <span>Calculated at next step</span>
              </div>

              <div className="summary-total">
                <span>Total</span>
                <span>${calculateTotal().toFixed(2)} USD</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Review Order Modal */}
      {showReviewModal && orderSummary && (
        <div className="review-order-modal">
          <div className="review-order-content">
            <div className="review-order-header">
              <h2>Review Your Order</h2>
              <button className="close-button" onClick={() => setShowReviewModal(false)}>
                ×
              </button>
            </div>

            <div className="review-order-details">
              <div className="review-section">
                <h3>Shipping Information</h3>
                <div className="shipping-details">
                  <p>
                    <strong>Name:</strong> {formData.firstName} {formData.lastName}
                  </p>
                  <p>
                    <strong>Address:</strong> {formData.address}
                  </p>
                  <p>
                    <strong>City:</strong> {formData.city}
                  </p>
                  <p>
                    <strong>Country:</strong> {formData.country}
                  </p>
                  <p>
                    <strong>Postal Code:</strong> {formData.postalCode}
                  </p>
                  <p>
                    <strong>Phone:</strong> {formData.phone}
                  </p>
                  <p>
                    <strong>Email:</strong> {formData.email}
                  </p>
                </div>
              </div>

              <div className="review-section">
                <h3>Order Items</h3>
                <div className="order-items">
                  {orderSummary.items.map((item) => (
                    <div key={item.id} className="review-item">
                      <div className="item-info">
                        <span className="item-quantity">{item.quantity} ×</span>
                        <span className="item-name">{item.name}</span>
                      </div>
                      <span className="item-price">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="review-section">
                <h3>Order Total</h3>
                <div className="order-total">
                  <p>
                    <strong>Total:</strong> ${orderSummary.totalAmount.toFixed(2)} USD
                  </p>
                </div>
              </div>

              <div className="review-section">
                <h3>Payment Information</h3>
                <div className="payment-info">
                  <p>
                    After confirming your order, you'll be redirected to our secure payment page to complete your
                    purchase.
                  </p>
                </div>
              </div>
            </div>

            <div className="review-actions">
              <button className="confirm-button" onClick={handleReviewConfirm} disabled={isProcessing}>
                {isProcessing ? "Processing..." : "Proceed to Payment"}
              </button>
              <button className="edit-button" onClick={() => setShowReviewModal(false)} disabled={isProcessing}>
                Edit Order
              </button>
            </div>
          </div>
        </div>
      )}

      {showLoginPrompt && (
        <div className="login-modal">
          <div className="login-modal-content">
            <h2>Login Required</h2>
            <p>You need to be logged in to complete your purchase.</p>
            <div className="login-modal-actions">
              <button onClick={handleLoginRedirect} className="login-button">
                Go to Login
              </button>
              <button onClick={() => setShowLoginPrompt(false)} className="cancel-button">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Checkout
