/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const { onRequest } = require("firebase-functions/v2/https")
const logger = require("firebase-functions/logger")

const functions = require("firebase-functions")
const nodemailer = require("nodemailer")
const { initializeApp } = require("firebase-admin/app")
const { getFirestore } = require("firebase-admin/firestore")
const Busboy = require("busboy")
const path = require("path")
const os = require("os")
const fs = require("fs")
const { put } = require("@vercel/blob")

// Initialize Firebase Admin
const admin = initializeApp()
const db = getFirestore()

// Set up nodemailer transport (example using Gmail)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
})

// Cloud Function to handle sending email
exports.sendPasswordResetEmail = functions.auth.user().onCreate((user) => {
  const email = user.email // Get the user's email
  const resetLink = `https://pallet-bodega-shop.firebaseapp.com/__/auth/action?mode=action&oobCode=${user.oobCode}`

  const mailOptions = {
    from: "hyelnamunianthan@gmail.com",
    to: email,
    subject: "Password Reset Request for %APP_NAME%",
    html: `
      <html>
        <body>
          <div style="text-align: center;">
            <img src="https://your-image-url.com/animated-avatar.gif" alt="Your %APP_NAME% Avatar" width="150" />
            <h2>Password Reset Request</h2>
            <p>Hello,</p>
            <p>Follow this link to reset your %APP_NAME% password for your ${email} account:</p>
            <a href="${resetLink}" style="display: inline-block; background-color: #1a73e8; color: white; padding: 12px 24px; border-radius: 5px; text-decoration: none;">Reset Password</a>
            <p>If you didn’t ask to reset your password, you can ignore this email.</p>
            <p>Thanks,<br>Your %APP_NAME% team</p>
          </div>
        </body>
      </html>
    `,
  }

  return transporter
    .sendMail(mailOptions)
    .then(() => {
      console.log("Password reset email sent to:", email)
    })
    .catch((error) => {
      console.error("Error sending email:", error)
    })
})

// Function to handle payment proof uploads using Vercel Blob
exports.uploadPaymentProof = functions.https.onRequest(async (req, res) => {
  // Set CORS headers
  res.set("Access-Control-Allow-Origin", "*")
  res.set("Access-Control-Allow-Methods", "POST")
  res.set("Access-Control-Allow-Headers", "Content-Type")

  // Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    res.status(204).send("")
    return
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  const busboy = Busboy({ headers: req.headers })
  const tmpdir = os.tmpdir()

  // This object will accumulate all the fields, keyed by their name
  const fields = {}
  // This object will accumulate all the uploaded files, keyed by their name
  const uploads = {}
  // This is where the file will be temporarily stored
  const fileWrites = []

  // Process each file
  busboy.on("file", (fieldname, file, { filename, encoding, mimeType }) => {
    logger.log(`Processing file: ${filename}, mimetype: ${mimeType}`)

    // Check if it's an image
    if (!mimeType.startsWith("image/")) {
      return res.status(400).json({ error: "Only image files are allowed" })
    }

    // Create a unique filename
    const uniqueFilename = `${Date.now()}_${filename}`
    const filepath = path.join(tmpdir, uniqueFilename)
    uploads[fieldname] = { filepath, mimeType, filename: uniqueFilename }

    // Create a write stream to save the file
    const writeStream = fs.createWriteStream(filepath)
    file.pipe(writeStream)

    // Add the write stream to the array of file writes
    const promise = new Promise((resolve, reject) => {
      writeStream.on("finish", resolve)
      writeStream.on("error", reject)
    })
    fileWrites.push(promise)
  })

  // Process each field
  busboy.on("field", (fieldname, val) => {
    logger.log(`Processed field ${fieldname}: ${val}`)
    fields[fieldname] = val
  })

  // Process when all parts are consumed
  busboy.on("finish", async () => {
    try {
      // Wait for all file writes to complete
      await Promise.all(fileWrites)

      // Check if we have the required fields
      if (!fields.orderId) {
        return res.status(400).json({ error: "Order ID is required" })
      }

      // Upload the file to Vercel Blob
      const file = uploads.file
      if (!file) {
        return res.status(400).json({ error: "No file uploaded" })
      }

      // Read the file from the temporary path
      const body = fs.readFileSync(file.filepath)

      // Upload the file to Vercel Blob
      const { url } = await put(`payment_proofs/${fields.orderId}/${file.filename}`, body, {
        contentType: file.mimeType,
        access: "public",
      })

      // Update the order with the payment proof URL
      const orderRef = db.collection("orders").doc(fields.orderId)
      await orderRef.update({
        paymentProofUrl: url,
        paymentStatus: "proof_submitted",
        paymentMethod: fields.paymentMethod || "unknown",
        updatedAt: new Date().toISOString(),
      })

      // Clean up the temporary files
      for (const file of Object.values(uploads)) {
        fs.unlinkSync(file.filepath)
      }

      // Return success
      return res.status(200).json({
        success: true,
        url,
        message: "Payment proof uploaded successfully",
      })
    } catch (error) {
      logger.error("Error processing upload:", error)
      return res.status(500).json({ error: "Failed to process upload" })
    }
  })

  // Handle errors
  busboy.on("error", (error) => {
    logger.error("Error processing form:", error)
    return res.status(500).json({ error: "Failed to process form" })
  })

  // Start processing the form
  busboy.end(req.rawBody)
})

// Function to update order payment status
exports.updatePaymentStatus = functions.https.onRequest(async (req, res) => {
  // Set CORS headers
  res.set("Access-Control-Allow-Origin", "*")
  res.set("Access-Control-Allow-Methods", "POST")
  res.set("Access-Control-Allow-Headers", "Content-Type")

  // Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    res.status(204).send("")
    return
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    const { orderId, paymentStatus, paymentMethod, paymentProofUrl } = req.body

    if (!orderId || !paymentStatus) {
      return res.status(400).json({ error: "Order ID and payment status are required" })
    }

    const orderRef = db.collection("orders").doc(orderId)
    const orderDoc = await orderRef.get()

    if (!orderDoc.exists) {
      return res.status(404).json({ error: "Order not found" })
    }

    const updateData = {
      paymentStatus,
      updatedAt: new Date().toISOString(),
    }

    if (paymentMethod) {
      updateData.paymentMethod = paymentMethod
    }

    if (paymentProofUrl) {
      updateData.paymentProofUrl = paymentProofUrl
    }

    await orderRef.update(updateData)

    return res.status(200).json({
      success: true,
      message: "Payment status updated successfully",
    })
  } catch (error) {
    logger.error("Error updating payment status:", error)
    return res.status(500).json({ error: "Failed to update payment status" })
  }
})

// Function to add tracking code to an order
exports.addTrackingCode = functions.https.onRequest(async (req, res) => {
  // Set CORS headers
  res.set("Access-Control-Allow-Origin", "*")
  res.set("Access-Control-Allow-Methods", "POST")
  res.set("Access-Control-Allow-Headers", "Content-Type")

  // Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    res.status(204).send("")
    return
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    const { orderId, trackingCode, carrier, estimatedDelivery } = req.body

    if (!orderId || !trackingCode) {
      return res.status(400).json({ error: "Order ID and tracking code are required" })
    }

    const orderRef = db.collection("orders").doc(orderId)
    const orderDoc = await orderRef.get()

    if (!orderDoc.exists) {
      return res.status(404).json({ error: "Order not found" })
    }

    // Update the order with tracking information
    await orderRef.update({
      trackingId: trackingCode,
      trackingCode: trackingCode,
      status: "shipped",
      tracking: {
        trackingNumber: trackingCode,
        carrier: carrier || "Standard Shipping",
        status: "shipped",
        estimatedDelivery: estimatedDelivery || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        statusHistory: [
          {
            status: "shipped",
            location: "Shipping Center",
            timestamp: new Date().toISOString(),
            message: "Your order has been shipped",
          },
        ],
      },
      updatedAt: new Date().toISOString(),
    })

    // Create or update the public tracking record
    const trackingQuery = await db.collection("public_tracking").where("trackingNumber", "==", trackingCode).get()

    if (trackingQuery.empty) {
      // Create new tracking record
      await db.collection("public_tracking").add({
        trackingNumber: trackingCode,
        orderId: orderId,
        carrier: carrier || "Standard Shipping",
        status: "shipped",
        estimatedDelivery: estimatedDelivery || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        statusHistory: [
          {
            status: "shipped",
            location: "Shipping Center",
            timestamp: new Date().toISOString(),
            message: "Your order has been shipped",
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    } else {
      // Update existing tracking record
      const trackingDoc = trackingQuery.docs[0]
      await trackingDoc.ref.update({
        status: "shipped",
        carrier: carrier || trackingDoc.data().carrier,
        estimatedDelivery: estimatedDelivery || trackingDoc.data().estimatedDelivery,
        statusHistory: [
          ...(trackingDoc.data().statusHistory || []),
          {
            status: "shipped",
            location: "Shipping Center",
            timestamp: new Date().toISOString(),
            message: "Your order has been shipped",
          },
        ],
        updatedAt: new Date().toISOString(),
      })
    }

    return res.status(200).json({
      success: true,
      message: "Tracking code added successfully",
    })
  } catch (error) {
    logger.error("Error adding tracking code:", error)
    return res.status(500).json({ error: "Failed to add tracking code" })
  }
})

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
