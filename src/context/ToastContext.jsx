"use client"

import { createContext, useContext, useState, useCallback, useRef } from "react"
import Toast from "../components/Toast/Toast"

const ToastContext = createContext(null)

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])
  const toastTimeoutsRef = useRef({})

  const addToast = useCallback(
    ({ type, title, message, duration = 5000 }) => {
      const id = Date.now().toString()

      // Check if a similar toast already exists
      const isDuplicate = toasts.some(
        (toast) => toast.type === type && toast.title === title && toast.message === message && !toast.removing,
      )

      // Only add the toast if it's not a duplicate
      if (!isDuplicate) {
        setToasts((prevToasts) => [
          ...prevToasts,
          {
            id,
            type,
            title,
            message,
            duration,
          },
        ])

        if (duration !== Number.POSITIVE_INFINITY) {
          // Store the timeout ID so we can clear it if needed
          toastTimeoutsRef.current[id] = setTimeout(() => {
            removeToast(id)
          }, duration)
        }
      }

      return id
    },
    [toasts],
  )

  const removeToast = useCallback((id) => {
    // Clear any existing timeout for this toast
    if (toastTimeoutsRef.current[id]) {
      clearTimeout(toastTimeoutsRef.current[id])
      delete toastTimeoutsRef.current[id]
    }

    setToasts((prevToasts) => {
      // First mark the toast for removal (for animation)
      const updatedToasts = prevToasts.map((toast) => (toast.id === id ? { ...toast, removing: true } : toast))

      // After animation time, actually remove it
      setTimeout(() => {
        setToasts((current) => current.filter((toast) => toast.id !== id))
      }, 300) // Match animation duration

      return updatedToasts
    })
  }, [])

  // Clean up all timeouts when component unmounts
  useCallback(() => {
    return () => {
      Object.keys(toastTimeoutsRef.current).forEach((id) => {
        clearTimeout(toastTimeoutsRef.current[id])
      })
    }
  }, [])

  const value = {
    toasts,
    addToast,
    removeToast,
    success: (props) => addToast({ type: "success", ...props }),
    error: (props) => addToast({ type: "error", ...props }),
    info: (props) => addToast({ type: "info", ...props }),
    warning: (props) => addToast({ type: "warning", ...props }),
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-container">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}
