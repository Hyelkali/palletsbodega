"use client"

import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { useEffect } from "react"

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { isLoggedIn, isAdmin, loading } = useAuth()
  const location = useLocation()

  // Debug log for protected route
  useEffect(() => {
    console.log("ProtectedRoute rendered", {
      isLoggedIn,
      isAdmin,
      loading,
      requireAdmin,
      path: location.pathname,
    })
  }, [isLoggedIn, isAdmin, loading, requireAdmin, location])

  // If auth is still loading, show nothing
  if (loading) {
    return <div className="loading-auth">Checking authentication...</div>
  }

  // If not logged in, redirect to login
  if (!isLoggedIn) {
    console.log("User not logged in, redirecting to login")
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // If admin is required but user is not admin, redirect to home
  if (requireAdmin && !isAdmin) {
    console.log("Admin access required but user is not admin, redirecting to home")
    return <Navigate to="/" replace />
  }

  // If we have children, render them, otherwise render the Outlet
  return children ? children : <Outlet />
}

export default ProtectedRoute
