"use client"

import { useEffect, Suspense, lazy, useState } from "react"
import { SpeedInsights } from "@vercel/speed-insights/react"
import { Outlet } from "react-router-dom"
import Header from "./Header"
import Footer from "./Footer"
import Announcement from "./Announcement"
import { useSearch } from "../hooks/useSearch"
import { initVisitorTracking } from "../services/visitorService"
import "./Layout.css"

// Lazy load the SearchOverlay component
const SearchOverlay = lazy(() => import("./SearchOverlay"))

const Layout = () => {
  const { isSearchOpen } = useSearch()
  const [error, setError] = useState(null)

  // Initialize visitor tracking with error handling
  useEffect(() => {
    try {
      const cleanup = initVisitorTracking()
      return () => {
        if (typeof cleanup === "function") {
          cleanup()
        }
      }
    } catch (err) {
      console.error("Error initializing visitor tracking:", err)
      setError("There was an issue loading some features. The site will still function normally.")
    }
  }, [])

  return (
    <div className="site-wrapper">
      {error && (
        <div
          className="error-banner"
          style={{
            background: "#ffdddd",
            color: "#333",
            padding: "10px",
            textAlign: "center",
          }}
        >
          {error}
        </div>
      )}
      <Announcement />
      <Header />
      {isSearchOpen && (
        <Suspense fallback={<div className="search-loading">Loading search...</div>}>
          <SearchOverlay />
        </Suspense>
      )}
      <main className="main-content">
        <Outlet />
        <SpeedInsights/>
      </main>
      <Footer />
    </div>
  )
}

export default Layout
