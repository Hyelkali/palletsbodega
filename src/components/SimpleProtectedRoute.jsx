"use client"

import { Navigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import LoadingScreen from "./LoadingScreen"

const ProtectedRoute = ({ children }) => {
  const { isLoggedIn, loading } = useAuth()

  if (loading) {
    return <LoadingScreen message="Verifying authentication..." />
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default ProtectedRoute
