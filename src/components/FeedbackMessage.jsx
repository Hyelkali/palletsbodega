"use client"

import { useState, useEffect } from "react"
import "./FeedbackMessage.css"

const FeedbackMessage = ({ type, message, duration = 5000, onClose }) => {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (duration) {
      const timer = setTimeout(() => {
        setVisible(false)
        if (onClose) onClose()
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [duration, onClose])

  const handleClose = () => {
    setVisible(false)
    if (onClose) onClose()
  }

  if (!visible) return null

  return (
    <div className={`feedback-message ${type}`}>
      <div className="feedback-content">
        <p>{message}</p>
        <button className="feedback-close" onClick={handleClose}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    </div>
  )
}

export default FeedbackMessage
