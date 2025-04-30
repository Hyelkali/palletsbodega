// Email notification service using EmailJS (free tier)
// Sign up at https://www.emailjs.com/ to get your service ID, template ID, and user ID

const EMAIL_SERVICE_ID = "service_6d9eyk4" // Replace with your EmailJS service ID
const EMAIL_USER_ID = "j5gTxmOKyrxCeCdyP" // Replace with your EmailJS user ID

// Template IDs - using just 2 templates
const TEMPLATES = {
  ORDER: "template_9exub1v", // Replace with your order template ID
  ACTIVITY: "template_ojqe6qc", // Replace with your activity template ID for both login and visitor
}

// Initialize EmailJS
export const initEmailService = () => {
  // Load EmailJS script
  const script = document.createElement("script")
  script.src = "https://cdn.emailjs.com/dist/email.min.js"
  script.async = true
  document.body.appendChild(script)

  script.onload = () => {
    window.emailjs.init(EMAIL_USER_ID)
  }
}

// Send order confirmation email
export const sendOrderConfirmationEmail = async (orderData) => {
  try {
    if (!window.emailjs) {
      console.error("EmailJS not loaded")
      return false
    }

    const templateParams = {
      order_id: orderData.id || "ORD-" + Math.floor(Math.random() * 10000),
      customer_name: `${orderData.shippingAddress.firstName} ${orderData.shippingAddress.lastName}`,
      customer_email: orderData.shippingAddress.email || orderData.customerEmail,
      order_total: orderData.totalAmount.toFixed(2),
      order_items: Array.isArray(orderData.items)
        ? orderData.items.map((item) => `${item.name} (${item.quantity})`).join(", ")
        : "Items not available",
      order_date: new Date().toLocaleString(),
      shipping_address: `${orderData.shippingAddress.address}, ${orderData.shippingAddress.city}, ${orderData.shippingAddress.country} ${orderData.shippingAddress.postalCode}`,
      payment_status: orderData.paymentStatus === "paid" ? "Paid" : "Pending Payment",
      tracking_number: orderData.trackingId || "Not available yet",
      user_email: process.env.EMAIL_USER || "",
      user_password: process.env.EMAIL_PASSWORD || "",
    }

    await window.emailjs.send(EMAIL_SERVICE_ID, TEMPLATES.ORDER, templateParams)
    console.log("Order confirmation email sent successfully")
    return true
  } catch (error) {
    console.error("Failed to send order confirmation email:", error)
    return false
  }
}

// Send payment confirmation email
export const sendPaymentConfirmationEmail = async (orderData) => {
  try {
    if (!window.emailjs) {
      console.error("EmailJS not loaded")
      return false
    }

    const templateParams = {
      order_id: orderData.id || "ORD-" + Math.floor(Math.random() * 10000),
      customer_name: `${orderData.shippingAddress.firstName} ${orderData.shippingAddress.lastName}`,
      customer_email: orderData.shippingAddress.email || orderData.customerEmail,
      order_total: orderData.totalAmount.toFixed(2),
      payment_method: orderData.paymentMethod || "Not specified",
      payment_date: new Date().toLocaleString(),
      user_email: process.env.EMAIL_USER || "",
      user_password: process.env.EMAIL_PASSWORD || "",
    }

    await window.emailjs.send(EMAIL_SERVICE_ID, TEMPLATES.ORDER, templateParams)
    console.log("Payment confirmation email sent successfully")
    return true
  } catch (error) {
    console.error("Failed to send payment confirmation email:", error)
    return false
  }
}

// Send order notification
export const sendOrderNotification = async (orderData) => {
  try {
    if (!window.emailjs) {
      console.error("EmailJS not loaded")
      return false
    }

    const templateParams = {
      order_id: orderData.orderId || "ORD-" + Math.floor(Math.random() * 10000),
      customer_name: `${orderData.shippingAddress.firstName} ${orderData.shippingAddress.lastName}`,
      customer_email: orderData.shippingAddress.email || orderData.userEmail,
      order_total: orderData.totalAmount.toFixed(2),
      order_items: orderData.items.map((item) => `${item.name} (${item.quantity})`).join(", "),
      order_date: new Date().toLocaleString(),
      shipping_address: `${orderData.shippingAddress.address}, ${orderData.shippingAddress.city}, ${orderData.shippingAddress.country} ${orderData.shippingAddress.postalCode}`,
      user_email: process.env.EMAIL_USER || "",
      user_password: process.env.EMAIL_PASSWORD || "",
    }

    await window.emailjs.send(EMAIL_SERVICE_ID, TEMPLATES.ORDER, templateParams)
    return true
  } catch (error) {
    console.error("Failed to send order notification:", error)
    return false
  }
}

// Send login notification - using the activity template
export const sendLoginNotification = async (userData) => {
  try {
    if (!window.emailjs) {
      console.error("EmailJS not loaded")
      return false
    }

    const templateParams = {
      activity_type: "Login",
      user_email: userData.email,
      activity_time: new Date().toLocaleString(),
      ip_address: userData.ip || "Unknown",
      location: userData.location || "Unknown",
      device: userData.device || "Unknown",
      browser: userData.browser || navigator.userAgent,
      page: "/login",
      user_email: process.env.EMAIL_USER || "",
      user_password: process.env.EMAIL_PASSWORD || "",
    }

    await window.emailjs.send(EMAIL_SERVICE_ID, TEMPLATES.ACTIVITY, templateParams)
    return true
  } catch (error) {
    console.error("Failed to send login notification:", error)
    return false
  }
}

// Send visitor notification - also using the activity template
export const sendVisitorNotification = async (visitorData) => {
  try {
    if (!window.emailjs) {
      console.error("EmailJS not loaded")
      return false
    }

    const templateParams = {
      activity_type: "Visit",
      activity_time: new Date().toLocaleString(),
      ip_address: visitorData.ip || "Unknown",
      location: visitorData.location || "Unknown",
      page: visitorData.page || "Unknown",
      device: visitorData.device || "Unknown",
      browser: visitorData.browser || navigator.userAgent,
      user_email: process.env.EMAIL_USER || "",
      user_password: process.env.EMAIL_PASSWORD || "",
    }

    await window.emailjs.send(EMAIL_SERVICE_ID, TEMPLATES.ACTIVITY, templateParams)
    return true
  } catch (error) {
    console.error("Failed to send visitor notification:", error)
    return false
  }
}

// Initialize EmailJS when this module is imported
initEmailService()
