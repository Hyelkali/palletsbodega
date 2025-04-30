// Proxy API for payment status updates to avoid CSP issues
import { doc, updateDoc, getDoc, serverTimestamp, collection, query, where, getDocs } from "firebase/firestore"
import { db } from "../firebase/config"

// Function to update order payment status through our own domain
export const updatePaymentStatus = async (
  orderId,
  paymentStatus,
  paymentMethod,
  paymentProofUrl,
  paymentDetails = {},
) => {
  try {
    if (!orderId) {
      throw new Error("Order ID is required")
    }

    const orderRef = doc(db, "orders", orderId)

    const updateData = {
      paymentStatus: paymentStatus,
      updatedAt: serverTimestamp(),
    }

    // Only update payment method if it's provided
    if (paymentMethod) {
      updateData.paymentMethod = paymentMethod
    }

    if (paymentProofUrl) {
      updateData.paymentProofUrl = paymentProofUrl
    }

    // Add any additional payment details
    if (paymentDetails && Object.keys(paymentDetails).length > 0) {
      updateData.paymentDetails = paymentDetails
    }

    console.log("Updating order with payment data:", updateData)
    await updateDoc(orderRef, updateData)

    // Also update the transaction if it exists
    try {
      const transactionsRef = collection(db, "transactions")
      const q = query(transactionsRef, where("orderId", "==", orderId))
      const querySnapshot = await getDocs(q)

      if (!querySnapshot.empty) {
        console.log("Found matching transactions:", querySnapshot.size)
        querySnapshot.forEach(async (transactionDoc) => {
          const transactionRef = doc(db, "transactions", transactionDoc.id)
          const transactionUpdateData = {
            status: paymentStatus,
            updatedAt: serverTimestamp(),
          }

          if (paymentMethod) {
            transactionUpdateData.paymentMethod = paymentMethod
          }

          if (paymentDetails && Object.keys(paymentDetails).length > 0) {
            transactionUpdateData.paymentDetails = paymentDetails
          }

          await updateDoc(transactionRef, transactionUpdateData)
          console.log("Transaction updated:", transactionDoc.id)
        })
      } else {
        console.log("No matching transactions found for order:", orderId)
      }
    } catch (transactionErr) {
      console.error("Error updating transaction:", transactionErr)
      // Continue even if transaction update fails
    }

    return { success: true, message: "Payment status updated successfully" }
  } catch (error) {
    console.error("Error updating payment status:", error)
    throw error
  }
}

// Update the getPaymentDetails function to include more comprehensive error handling and logging

export const getPaymentDetails = async (orderId) => {
  try {
    if (!orderId) {
      throw new Error("Order ID is required")
    }

    console.log("Fetching payment details for order:", orderId)
    const orderRef = doc(db, "orders", orderId)
    const orderSnapshot = await getDoc(orderRef)

    if (!orderSnapshot.exists()) {
      console.log("Order not found:", orderId)
      throw new Error("Order not found")
    }

    const orderData = orderSnapshot.data()
    console.log("Order data retrieved:", orderData.id)

    // Check if payment details exist
    if (!orderData.paymentDetails) {
      console.log("No payment details found for order:", orderId)

      // If no payment details but status is details_provided, create a fallback
      if (orderData.paymentStatus === "details_provided") {
        console.log("Creating fallback payment details for order with status details_provided")
        return {
          success: true,
          paymentDetails: {
            paymentMethod: orderData.paymentMethod || "Not specified",
            additionalInstructions: "Please contact customer support for complete payment details.",
          },
        }
      }

      return {
        success: false,
        message: "No payment details available for this order",
      }
    }

    console.log("Payment details found:", Object.keys(orderData.paymentDetails))
    return {
      success: true,
      paymentDetails: orderData.paymentDetails,
      paymentStatus: orderData.paymentStatus,
      paymentMethod: orderData.paymentMethod,
    }
  } catch (error) {
    console.error("Error getting payment details:", error)
    throw error
  }
}
