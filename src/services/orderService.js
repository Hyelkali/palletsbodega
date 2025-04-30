// Order service to handle order updates
import axios from "axios"

export const updateOrderPaymentStatus = async (orderId, paymentStatus, transactionId) => {
  try {
    const response = await axios.post("/api/orders/update-payment-status", {
      orderId,
      paymentStatus,
      transactionId,
    })

    return {
      success: true,
      message: "Order payment status updated successfully",
    }
  } catch (error) {
    console.error("Error updating order payment status:", error)
    return {
      success: false,
      message: error.response?.data?.message || "Failed to update order payment status",
    }
  }
}
