"use client"

import { useState } from "react"
import { addDoc, collection, query, where, getDocs, serverTimestamp } from "firebase/firestore"
import { db } from "../firebase/config"
import FeedbackMessage from "./FeedbackMessage"
import "./NewsletterSubscription.css"

const NewsletterSubscription = () => {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!email || !email.includes("@")) {
      setFeedback({
        type: "error",
        message: "Please enter a valid email address.",
      })
      return
    }

    setLoading(true)

    try {
      // Check if email already exists
      const q = query(collection(db, "subscribers"), where("email", "==", email))
      const querySnapshot = await getDocs(q)

      if (!querySnapshot.empty) {
        setFeedback({
          type: "info",
          message: "You're already subscribed to our newsletter!",
        })
        setLoading(false)
        return
      }

      // Add new subscriber
      await addDoc(collection(db, "subscribers"), {
        email,
        subscribedAt: serverTimestamp(),
      })

      setFeedback({
        type: "success",
        message: "Thank you for subscribing to our newsletter!",
      })
      setEmail("")
    } catch (error) {
      console.error("Error subscribing to newsletter:", error)
      setFeedback({
        type: "error",
        message: "Failed to subscribe. Please try again later.",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="newsletter-subscription">
      <div className="newsletter-content">
        <h2>Subscribe to Our Newsletter</h2>
        <p>Get the latest deals and updates delivered to your inbox.</p>

        <form onSubmit={handleSubmit} className="subscription-form">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email address"
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? "Subscribing..." : "Subscribe"}
          </button>
        </form>
      </div>

      {feedback && (
        <FeedbackMessage type={feedback.type} message={feedback.message} onClose={() => setFeedback(null)} />
      )}
    </div>
  )
}

export default NewsletterSubscription
