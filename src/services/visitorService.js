import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "../firebase/config"

// Storage keys
const VISITOR_INFO_KEY = "pallets_visitor_info"
const VISITOR_TRACKED_KEY = "pallets_visitor_tracked"

// Track a visitor
export const trackVisitor = async (page = window.location.pathname) => {
  try {
    // Check if we already have visitor info in storage
    let visitorInfo = getStoredVisitorInfo()

    // If no stored info, get it once and store it
    if (!visitorInfo) {
      visitorInfo = await getVisitorInfoSafely()
      storeVisitorInfo(visitorInfo)
    }

    // Check if this page has been tracked in this session
    const trackedPages = getTrackedPages()
    if (trackedPages.includes(page)) {
      // Page already tracked in this session, don't track again
      return visitorInfo
    }

    // Add page to tracked pages
    addTrackedPage(page)

    // Add page information
    const visitData = {
      ...visitorInfo,
      page,
      timestamp: serverTimestamp(),
      referrer: document.referrer || "Direct",
      visitTime: new Date().toISOString(),
    }

    // Save to Firestore
    await addDoc(collection(db, "visitors"), visitData)

    // Use debug level logging instead of info to reduce console noise
    if (process.env.NODE_ENV !== "production") {
      console.debug("Visit tracked successfully")
    }

    return visitData
  } catch (error) {
    console.error("Error tracking visitor:", error)
    return {
      ip: "Unknown",
      location: "Unknown",
      device: getBrowserInfo(),
      browser: navigator.userAgent,
      page,
      timestamp: serverTimestamp(),
      referrer: document.referrer || "Direct",
    }
  }
}

// Get visitor information safely without external API calls
const getVisitorInfoSafely = async () => {
  // Create basic visitor info without making external API calls
  const visitorInfo = {
    // We don't attempt to get IP address to avoid CSP violations
    ip: "Not collected",
    location: "Not collected",
    region: "Not collected",
    country: "Not collected",
    device: getBrowserInfo(),
    browser: navigator.userAgent,
    firstVisit: new Date().toISOString(),
    // Generate a random visitor ID that persists across sessions
    visitorId: generateVisitorId(),
  }

  return visitorInfo
}

// Generate a random visitor ID
const generateVisitorId = () => {
  // Check if we already have a visitor ID in localStorage
  const existingId = localStorage.getItem("pallets_visitor_id")
  if (existingId) {
    return existingId
  }

  // Generate a new ID if none exists
  const newId = "visitor_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

  // Store in localStorage so it persists across sessions
  localStorage.setItem("pallets_visitor_id", newId)

  return newId
}

// Store visitor info in sessionStorage
const storeVisitorInfo = (visitorInfo) => {
  try {
    sessionStorage.setItem(VISITOR_INFO_KEY, JSON.stringify(visitorInfo))
  } catch (error) {
    console.error("Error storing visitor info:", error)
  }
}

// Get stored visitor info from sessionStorage
const getStoredVisitorInfo = () => {
  try {
    const storedInfo = sessionStorage.getItem(VISITOR_INFO_KEY)
    return storedInfo ? JSON.parse(storedInfo) : null
  } catch (error) {
    console.error("Error retrieving stored visitor info:", error)
    return null
  }
}

// Get tracked pages from sessionStorage
const getTrackedPages = () => {
  try {
    const trackedPages = sessionStorage.getItem(VISITOR_TRACKED_KEY)
    return trackedPages ? JSON.parse(trackedPages) : []
  } catch (error) {
    console.error("Error retrieving tracked pages:", error)
    return []
  }
}

// Add a page to tracked pages in sessionStorage
const addTrackedPage = (page) => {
  try {
    const trackedPages = getTrackedPages()
    if (!trackedPages.includes(page)) {
      trackedPages.push(page)
      sessionStorage.setItem(VISITOR_TRACKED_KEY, JSON.stringify(trackedPages))
    }
  } catch (error) {
    console.error("Error adding tracked page:", error)
  }
}

// Get browser and device information
const getBrowserInfo = () => {
  const userAgent = navigator.userAgent

  // Detect mobile devices
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)

  // Detect browser
  let browserName = "Unknown"
  if (userAgent.indexOf("Firefox") > -1) {
    browserName = "Firefox"
  } else if (userAgent.indexOf("SamsungBrowser") > -1) {
    browserName = "Samsung Browser"
  } else if (userAgent.indexOf("Opera") > -1 || userAgent.indexOf("OPR") > -1) {
    browserName = "Opera"
  } else if (userAgent.indexOf("Trident") > -1) {
    browserName = "Internet Explorer"
  } else if (userAgent.indexOf("Edge") > -1 || userAgent.indexOf("Edg") > -1) {
    browserName = "Edge"
  } else if (userAgent.indexOf("Chrome") > -1) {
    browserName = "Chrome"
  } else if (userAgent.indexOf("Safari") > -1) {
    browserName = "Safari"
  }

  return isMobile ? `Mobile (${browserName})` : `Desktop (${browserName})`
}

// Initialize visitor tracking
export const initVisitorTracking = () => {
  // Track initial page load only once
  setTimeout(() => {
    trackVisitor()
  }, 2000)

  // Track page changes (for single page apps)
  let lastTrackedPath = window.location.pathname

  // Check for path changes less frequently
  const interval = setInterval(() => {
    const currentPath = window.location.pathname

    // Only track if path changed
    if (currentPath !== lastTrackedPath) {
      trackVisitor(currentPath)
      lastTrackedPath = currentPath
    }
  }, 5000)

  // Return cleanup function
  return () => clearInterval(interval)
}
