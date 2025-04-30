"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import "./TrackingBanner.css"

const TrackingBanner = () => {
  const [trackingNumber, setTrackingNumber] = useState("")
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    if (trackingNumber.trim()) {
      navigate(`/track-shipment?tracking=${encodeURIComponent(trackingNumber.trim())}`)
    }
  }

  return (
    <div className="tracking-banner">
      <div className="tracking-banner-content">
        <div className="tracking-icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="1" y="3" width="15" height="13"></rect>
            <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
            <circle cx="5.5" cy="18.5" r="2.5"></circle>
            <circle cx="18.5" cy="18.5" r="2.5"></circle>
          </svg>
        </div>
        <div className="tracking-form-container">
          <form onSubmit={handleSubmit} className="tracking-mini-form">
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="Enter tracking number"
              className="tracking-mini-input"
            />
            <button type="submit" className="tracking-mini-button">
              Track
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default TrackingBanner
