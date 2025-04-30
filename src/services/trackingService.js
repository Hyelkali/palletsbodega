import { collection, addDoc, query, where, getDocs, updateDoc, doc } from "firebase/firestore"
import { db } from "../firebase/config"

// Generate a tracking number
export const generateTrackingNumber = () => {
  const prefix = "PB"
  const timestamp = Date.now().toString().slice(-6)
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0")
  return `${prefix}${timestamp}${random}`
}

// Create tracking for an order
export const createOrderTracking = async (orderId, customerEmail, shippingAddress) => {
  try {
    console.log("Creating tracking for order:", orderId)
    const trackingNumber = generateTrackingNumber()
    console.log("Generated tracking number:", trackingNumber)

    // Create a public tracking record with minimal data to avoid permission issues
    const trackingData = {
      trackingNumber,
      orderId,
      status: "order_received",
      statusHistory: [
        {
          status: "order_received",
          location: "Pallet Bodega Warehouse",
          timestamp: new Date().toISOString(),
          message: "Order has been received and is being processed",
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      customerEmail,
      shippingAddress: {
        city: shippingAddress?.city || "Unknown",
        country: shippingAddress?.country || "Unknown",
      },
    }

    console.log("Creating public tracking record with data:", JSON.stringify(trackingData))
    await addDoc(collection(db, "public_tracking"), trackingData)
    console.log("Public tracking record created successfully")

    return trackingNumber
  } catch (error) {
    console.error("Error creating tracking:", error)
    // Return a fallback tracking number even if there's an error
    // This ensures the order creation process can continue
    const fallbackTrackingNumber = generateTrackingNumber()
    console.log("Using fallback tracking number due to error:", fallbackTrackingNumber)
    return fallbackTrackingNumber
  }
}

// Get tracking information by tracking number
export const getTrackingByNumber = async (trackingNumber) => {
  try {
    const trackingQuery = query(collection(db, "public_tracking"), where("trackingNumber", "==", trackingNumber))

    const querySnapshot = await getDocs(trackingQuery)

    if (querySnapshot.empty) {
      throw new Error("No tracking information found")
    }

    const trackingDoc = querySnapshot.docs[0]
    return {
      id: trackingDoc.id,
      ...trackingDoc.data(),
    }
  } catch (error) {
    console.error("Error getting tracking:", error)
    throw error
  }
}

// Update tracking status
export const updateTrackingStatus = async (trackingNumber, statusUpdate) => {
  try {
    const trackingQuery = query(collection(db, "public_tracking"), where("trackingNumber", "==", trackingNumber))

    const querySnapshot = await getDocs(trackingQuery)

    if (querySnapshot.empty) {
      throw new Error("No tracking information found")
    }

    const trackingDoc = querySnapshot.docs[0]
    const trackingData = trackingDoc.data()

    // Add new status to history
    const updatedHistory = [
      ...trackingData.statusHistory,
      {
        ...statusUpdate,
        timestamp: new Date().toISOString(),
      },
    ]

    // Update tracking document
    await updateDoc(doc(db, "public_tracking", trackingDoc.id), {
      status: statusUpdate.status,
      statusHistory: updatedHistory,
      updatedAt: new Date().toISOString(),
    })

    // Also update the order status if needed
    if (trackingData.orderId) {
      await updateDoc(doc(db, "orders", trackingData.orderId), {
        status: statusUpdate.status,
        updatedAt: new Date().toISOString(),
      })
    }

    return {
      trackingNumber,
      status: statusUpdate.status,
      updatedAt: new Date(),
    }
  } catch (error) {
    console.error("Error updating tracking:", error)
    throw error
  }
}
