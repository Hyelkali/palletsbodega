import { collection, doc, getDoc, getDocs, addDoc, updateDoc, query, where, orderBy } from "firebase/firestore"
import { db } from "../firebase/config"
import { createOrderTracking } from "./trackingService"

// Orders
export const getOrders = async () => {
  try {
    const ordersSnapshot = await getDocs(collection(db, "orders"))
    const orders = []

    ordersSnapshot.forEach((doc) => {
      orders.push({
        id: doc.id,
        ...doc.data(),
      })
    })

    return orders
  } catch (error) {
    console.error("Error getting orders:", error)
    throw error
  }
}

export const getOrderById = async (orderId) => {
  try {
    console.log("Fetching order with ID:", orderId)
    const orderDoc = await getDoc(doc(db, "orders", orderId))

    if (!orderDoc.exists()) {
      console.error("Order document does not exist")
      throw new Error("Order not found")
    }

    const orderData = orderDoc.data()
    console.log("Raw order data from Firestore:", orderData)

    // Ensure items is always an array
    const items = Array.isArray(orderData.items)
      ? orderData.items
      : typeof orderData.items === "object" && orderData.items !== null
        ? Object.values(orderData.items)
        : []

    console.log("Processed items:", items)

    // Ensure shippingAddress is always an object
    const shippingAddress = orderData.shippingAddress || {}
    console.log("Processed shippingAddress:", shippingAddress)

    // Return the order with properly structured data
    return {
      id: orderDoc.id,
      ...orderData,
      items: items,
      shippingAddress: shippingAddress,
    }
  } catch (error) {
    console.error("Error getting order:", error)
    throw error
  }
}

// Completely rewritten createOrder function to fix permission issues
export const createOrder = async (orderData) => {
  try {
    console.log("Starting order creation process with simplified approach")

    // Create a complete order document in one go to avoid partial updates
    const completeOrderData = {
      customerEmail: orderData.customerEmail || "",
      customerId: orderData.customerId || "guest",
      totalAmount: Number(orderData.totalAmount) || 0,
      status: "pending",
      paymentStatus: orderData.paymentStatus || "pending_payment",
      createdAt: new Date().toISOString(),
      // Ensure items is properly formatted
      items: Array.isArray(orderData.items)
        ? orderData.items.map((item) => ({
            id: item.id || "",
            name: item.name || "Unknown Product",
            price: Number(item.price) || 0,
            quantity: Number(item.quantity) || 1,
            images: Array.isArray(item.images) ? item.images : [],
          }))
        : [],
      // Ensure shipping address is properly formatted
      shippingAddress: {
        firstName: orderData.shippingAddress?.firstName || "",
        lastName: orderData.shippingAddress?.lastName || "",
        address: orderData.shippingAddress?.address || "",
        city: orderData.shippingAddress?.city || "",
        country: orderData.shippingAddress?.country || "",
        postalCode: orderData.shippingAddress?.postalCode || "",
        phone: orderData.shippingAddress?.phone || "",
        email: orderData.shippingAddress?.email || orderData.customerEmail || "",
      },
    }

    console.log("Creating order with complete data:", completeOrderData)

    try {
      const orderRef = await addDoc(collection(db, "orders"), completeOrderData)
      console.log("Order created with ID:", orderRef.id)

      // Create tracking information
      console.log("Creating tracking for order")
      let trackingNumber
      try {
        trackingNumber = await createOrderTracking(orderRef.id, orderData.customerEmail, orderData.shippingAddress)
        console.log("Tracking created with number:", trackingNumber)
      } catch (trackingError) {
        console.error("Error creating tracking, using fallback:", trackingError)
        // Generate a fallback tracking number if tracking creation fails
        trackingNumber = `PB${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 10000)
          .toString()
          .padStart(4, "0")}`
      }

      // Update the order with tracking information
      try {
        await updateDoc(orderRef, {
          trackingId: trackingNumber,
          trackingCode: trackingNumber,
        })
        console.log("Tracking information added to order")
      } catch (updateError) {
        console.error("Error updating order with tracking:", updateError)
        // Continue despite error
      }

      // Create a transaction record
      try {
        console.log("Creating transaction record")
        await addDoc(collection(db, "transactions"), {
          orderId: orderRef.id,
          customerId: orderData.customerId || "guest",
          customerEmail: orderData.customerEmail || "",
          amount: Number(orderData.totalAmount) || 0,
          status: "pending",
          paymentMethod: orderData.paymentMethod || "pending",
          paymentStatus: orderData.paymentStatus || "pending_payment",
          trackingNumber: trackingNumber,
          createdAt: new Date().toISOString(),
        })
        console.log("Transaction record created successfully")
      } catch (transactionError) {
        console.error("Error creating transaction:", transactionError)
        // Continue even if this fails
      }

      // Return the complete order information
      return {
        id: orderRef.id,
        trackingId: trackingNumber,
        trackingCode: trackingNumber,
        ...completeOrderData,
      }
    } catch (firestoreError) {
      console.error("Firestore operation failed:", firestoreError)
      throw new Error(`Database operation failed: ${firestoreError.message}`)
    }
  } catch (error) {
    console.error("Error in createOrder:", error)
    throw new Error(`Failed to create order: ${error.message}`)
  }
}

export const updateOrderStatus = async (orderId, status, userId) => {
  try {
    const orderRef = doc(db, "orders", orderId)

    const updateData = {
      status,
      updatedAt: new Date().toISOString(),
    }

    if (status === "approved") {
      updateData.approvedBy = userId
      updateData.approvedAt = new Date().toISOString()
      updateData.paymentStatus = "paid" // Update payment status when order is approved
    } else if (status === "rejected") {
      updateData.rejectedBy = userId
      updateData.rejectedAt = new Date().toISOString()
      updateData.paymentStatus = "rejected" // Update payment status when order is rejected
    }

    await updateDoc(orderRef, updateData)

    // Update the transaction status if the order status changes
    if (status === "approved" || status === "rejected") {
      const transactionsQuery = query(collection(db, "transactions"), where("orderId", "==", orderId))

      const transactionsSnapshot = await getDocs(transactionsQuery)

      if (!transactionsSnapshot.empty) {
        const transactionDoc = transactionsSnapshot.docs[0]
        await updateDoc(doc(db, "transactions", transactionDoc.id), {
          status: status === "approved" ? "success" : "failed",
          paymentStatus: status === "approved" ? "paid" : "rejected",
          updatedAt: new Date().toISOString(),
        })
      }
    }

    // Get the updated order
    const updatedOrder = await getDoc(orderRef)

    return {
      id: updatedOrder.id,
      ...updatedOrder.data(),
    }
  } catch (error) {
    console.error("Error updating order status:", error)
    throw error
  }
}

// Update shipment tracking information
export const updateShipmentTracking = async (orderId, trackingUpdate) => {
  try {
    const orderRef = doc(db, "orders", orderId)
    const orderDoc = await getDoc(orderRef)

    if (!orderDoc.exists()) {
      throw new Error("Order not found")
    }

    const orderData = orderDoc.data()
    const currentTracking = orderData.tracking || {}
    const currentHistory = currentTracking.statusHistory || []

    // Add new status to history
    const updatedHistory = [
      ...currentHistory,
      {
        ...trackingUpdate,
        timestamp: new Date().toISOString(),
      },
    ]

    // Update tracking information
    const updatedTracking = {
      ...currentTracking,
      status: trackingUpdate.status,
      statusHistory: updatedHistory,
      updatedAt: new Date().toISOString(),
    }

    // Update order document
    await updateDoc(orderRef, {
      tracking: updatedTracking,
      updatedAt: new Date().toISOString(),
    })

    // Also update the public tracking record
    const publicTrackingQuery = query(
      collection(db, "public_tracking"),
      where("trackingNumber", "==", currentTracking.trackingNumber),
    )

    const publicTrackingSnapshot = await getDocs(publicTrackingQuery)

    if (!publicTrackingSnapshot.empty) {
      const publicTrackingDoc = publicTrackingSnapshot.docs[0]
      await updateDoc(doc(db, "public_tracking", publicTrackingDoc.id), {
        status: trackingUpdate.status,
        statusHistory: updatedHistory,
        updatedAt: new Date().toISOString(),
      })
    }

    // Get the updated order
    const updatedOrder = await getDoc(orderRef)

    return {
      id: updatedOrder.id,
      ...updatedOrder.data(),
    }
  } catch (error) {
    console.error("Error updating shipment tracking:", error)
    throw error
  }
}

// Get order by tracking number - using the public_tracking collection directly
export const getOrderByTrackingNumber = async (trackingNumber) => {
  try {
    // This function is no longer needed as we're querying directly in the TrackShipment component
    // Keeping it for backward compatibility
    console.log("Using deprecated getOrderByTrackingNumber function - consider updating your code")

    const trackingQuery = query(collection(db, "public_tracking"), where("trackingNumber", "==", trackingNumber))

    const querySnapshot = await getDocs(trackingQuery)

    if (querySnapshot.empty) {
      throw new Error("No order found with this tracking number")
    }

    const trackingDoc = querySnapshot.docs[0]
    const trackingData = trackingDoc.data()

    // Return a simplified order object with just the tracking info
    return {
      id: trackingData.orderId,
      tracking: {
        trackingNumber: trackingData.trackingNumber,
        carrier: trackingData.carrier,
        status: trackingData.status,
        statusHistory: trackingData.statusHistory || [],
        estimatedDelivery: trackingData.estimatedDelivery,
      },
      createdAt: trackingData.createdAt,
      customerEmail: trackingData.customerEmail,
      shippingAddress: trackingData.shippingAddress,
    }
  } catch (error) {
    console.error("Error getting order by tracking number:", error)
    throw error
  }
}

/**
 * Updates an order with new data
 * @param {string} orderId - The ID of the order to update
 * @param {Object} updateData - The data to update
 * @returns {Promise<void>}
 */
export const updateOrder = async (orderId, updateData) => {
  try {
    const orderRef = doc(db, "orders", orderId)

    // Add timestamp to the update
    const dataWithTimestamp = {
      ...updateData,
      updatedAt: new Date().toISOString(),
    }

    await updateDoc(orderRef, dataWithTimestamp)
    return true
  } catch (error) {
    console.error("Error updating order:", error)
    throw error
  }
}

// Users
export const getUserById = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, "users", userId))

    if (!userDoc.exists()) {
      throw new Error("User not found")
    }

    return {
      uid: userId,
      ...userDoc.data(),
    }
  } catch (error) {
    console.error("Error getting user:", error)
    throw error
  }
}

export const updateUserRole = async (userId, role) => {
  try {
    await updateDoc(doc(db, "users", userId), {
      role,
      updatedAt: new Date().toISOString(),
    })

    return true
  } catch (error) {
    console.error("Error updating user role:", error)
    throw error
  }
}

// Get pending orders for admin dashboard
export const getPendingOrders = async () => {
  try {
    const q = query(collection(db, "orders"), where("status", "==", "pending"), orderBy("createdAt", "desc"))

    const querySnapshot = await getDocs(q)
    const pendingOrders = []

    querySnapshot.forEach((doc) => {
      pendingOrders.push({
        id: doc.id,
        ...doc.data(),
      })
    })

    return pendingOrders
  } catch (error) {
    console.error("Error getting pending orders:", error)
    throw error
  }
}

// Get transactions for a user
export const getUserTransactions = async (userId) => {
  try {
    // First try to get transactions without ordering
    // This query doesn't require a composite index
    const simpleQuery = query(collection(db, "transactions"), where("customerId", "==", userId))

    const querySnapshot = await getDocs(simpleQuery)
    const transactions = []

    querySnapshot.forEach((doc) => {
      const data = doc.data()
      let createdAtDate

      // Handle different timestamp formats
      if (data.createdAt?.toDate) {
        // It's a Firestore timestamp
        createdAtDate = data.createdAt.toDate()
      } else if (data.createdAt) {
        // It's an ISO string or timestamp number
        createdAtDate = new Date(data.createdAt)
      } else {
        // Fallback
        createdAtDate = new Date()
      }

      transactions.push({
        id: doc.id,
        ...data,
        createdAt: createdAtDate,
      })
    })

    // Sort the results client-side instead of using orderBy in the query
    return transactions.sort((a, b) => b.createdAt - a.createdAt)
  } catch (error) {
    console.error("Error getting user transactions:", error)
    throw error
  }
}

// Update transaction status
export const updateTransactionStatus = async (transactionId, status) => {
  try {
    await updateDoc(doc(db, "transactions", transactionId), {
      status,
      updatedAt: new Date().toISOString(),
    })

    return true
  } catch (error) {
    console.error("Error updating transaction status:", error)
    throw error
  }
}
