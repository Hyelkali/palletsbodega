"use client"

import { useState, useRef, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import "./UserAvatar.css"

const UserAvatar = () => {
  const { user, logout, isAdmin } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef(null)
  const navigate = useNavigate()

  // Get user initials or fallback to a default
  const getUserInitials = () => {
    try {
      if (!user || !user.email) return "U"

      const email = user.email
      if (email.includes("@")) {
        const name = email.split("@")[0]
        // Get first character of name
        return name.charAt(0).toUpperCase()
      }
      return email.charAt(0).toUpperCase()
    } catch (error) {
      console.error("Error getting user initials:", error)
      return "U"
    }
  }

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const handleLogout = async () => {
    try {
      await logout()
      navigate("/")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  return (
    <div className="user-avatar-container" ref={menuRef}>
      <button className="avatar-button" onClick={toggleMenu} aria-label="User menu">
        <div className="avatar-circle">{getUserInitials()}</div>
      </button>

      {isMenuOpen && (
        <div className="avatar-menu">
          <div className="menu-header">
            <div className="user-info">
              <span className="user-email">{user?.email || "User"}</span>
              {isAdmin && <span className="admin-badge">Admin</span>}
            </div>
          </div>

          <div className="menu-items">
            {isAdmin && (
              <button className="menu-item" onClick={() => navigate("/admin")}>
                Admin Dashboard
              </button>
            )}
            <button className="menu-item" onClick={() => navigate("/transactions")}>
              Transactions
            </button>
            <button className="menu-item logout" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserAvatar
