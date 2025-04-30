"use client"

import { createContext, useContext, useState, useEffect } from "react"
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  browserLocalPersistence,
  setPersistence,
} from "firebase/auth"
import { doc, setDoc, getDoc } from "firebase/firestore"
import { auth, db, isFirebaseReady, retryFirebaseInitialization } from "../firebase/config"
import { useToast } from "./ToastContext"

// Import only the visitor tracking service for now
import { trackVisitor } from "../services/visitorService"

// Create the context
const AuthContext = createContext()

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext)

// Define admin email constant
const ADMIN_EMAIL = "palletsbodega@gmail.com"

// Maximum number of retries for auth operations
const MAX_RETRIES = 3

export const AuthProvider = ({ children }) => {
  // State to track user, login status, admin status, and loading state
  const [user, setUser] = useState(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [firebaseReady, setFirebaseReady] = useState(isFirebaseReady())
  const toast = useToast()

  // Check if Firebase is ready and retry initialization if needed
  useEffect(() => {
    if (!firebaseReady) {
      console.log("Firebase not ready, attempting to initialize...")
      retryFirebaseInitialization()
        .then(() => {
          console.log("Firebase initialization successful")
          setFirebaseReady(true)
        })
        .catch((error) => {
          console.error("Firebase initialization failed:", error)
          toast.error({
            title: "Connection Error",
            message: "Could not connect to authentication services. Some features may be unavailable.",
          })
        })
    }
  }, [firebaseReady, toast])

  // Listen for auth state changes
  useEffect(() => {
    if (!firebaseReady) return

    // Flag to track if this is the initial auth state change
    let isInitialAuthCheck = true

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in
        console.log("User signed in:", firebaseUser.email)

        // Check if this is the admin email
        const isAdminEmail = firebaseUser.email === ADMIN_EMAIL
        console.log("Is admin email?", isAdminEmail)

        try {
          // Get user data from Firestore
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid))

          let userData = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            role: isAdminEmail ? "admin" : "customer", // Default role based on email
          }

          if (userDoc.exists()) {
            // Combine Firebase auth data with Firestore data
            const firestoreData = userDoc.data()
            console.log("User data from Firestore:", firestoreData)

            userData = {
              ...userData,
              ...firestoreData,
              // Force admin role if it's the admin email
              role: isAdminEmail ? "admin" : firestoreData.role || "customer",
            }
          } else {
            // If user document doesn't exist in Firestore, create it
            console.log("Creating new user document with role:", userData.role)
            await setDoc(doc(db, "users", firebaseUser.uid), {
              email: firebaseUser.email,
              role: userData.role,
              createdAt: new Date().toISOString(),
            })
          }

          setUser(userData)
          setIsLoggedIn(true)

          // Set admin status based on email or role
          const adminStatus = isAdminEmail || userData.role === "admin"
          setIsAdmin(adminStatus)
          console.log("Admin status set to:", adminStatus, "for user:", userData.email, "with role:", userData.role)

          // If admin status is true, log additional information
          if (adminStatus) {
            console.log("Admin user detected:", {
              email: userData.email,
              role: userData.role,
              uid: userData.uid,
              isAdminEmail: isAdminEmail,
            })
          }

          // Only show the toast if this is not the initial auth check
          // This prevents the toast from showing on page load/refresh
          if (!isInitialAuthCheck) {
            toast.success({
              title: "Logged In",
              message: `Welcome back, ${userData.email}!`,
            })
          }
        } catch (error) {
          console.error("Error fetching user data:", error)
          // Basic user data if Firestore fetch fails
          const userData = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            role: isAdminEmail ? "admin" : "customer",
          }

          setUser(userData)
          setIsLoggedIn(true)
          setIsAdmin(isAdminEmail)
          console.log("Admin status set to (after error):", isAdminEmail)

          // Only show error toast if this is not the initial auth check
          if (!isInitialAuthCheck) {
            toast.error({
              title: "Data Error",
              message: "Could not fetch your complete profile data",
            })
          }
        }
      } else {
        // User is signed out
        console.log("User is signed out")
        setUser(null)
        setIsLoggedIn(false)
        setIsAdmin(false)
      }

      // After the first auth check, set the flag to false
      isInitialAuthCheck = false
      setLoading(false)
    })

    // Cleanup subscription
    return () => unsubscribe()
  }, [firebaseReady, toast])

  // Helper function to check network connectivity
  const checkNetworkConnectivity = () => {
    return navigator.onLine
  }

  // Helper function to retry an operation with exponential backoff
  const retryOperation = async (operation, retryCount = 0) => {
    try {
      return await operation()
    } catch (error) {
      if (retryCount < MAX_RETRIES) {
        // Calculate delay with exponential backoff (1s, 2s, 4s, etc.)
        const delay = Math.pow(2, retryCount) * 1000
        console.log(`Retrying operation in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`)

        await new Promise((resolve) => setTimeout(resolve, delay))
        return retryOperation(operation, retryCount + 1)
      }
      throw error
    }
  }

  // Function to log in a user
  const login = async (email, password) => {
    // Check if Firebase is ready
    if (!firebaseReady) {
      try {
        await retryFirebaseInitialization()
        setFirebaseReady(true)
      } catch (error) {
        toast.error({
          title: "Service Unavailable",
          message: "Authentication service is currently unavailable. Please try again later.",
        })
        throw new Error("Authentication service is unavailable")
      }
    }

    // Check network connectivity
    if (!checkNetworkConnectivity()) {
      toast.error({
        title: "No Internet Connection",
        message: "Please check your internet connection and try again.",
      })
      throw new Error("No internet connection")
    }

    try {
      console.log("Attempting login with email:", email)

      // Check if this is the admin email
      const isAdminEmail = email === ADMIN_EMAIL
      console.log("Is admin email?", isAdminEmail)

      // Set persistence to LOCAL before login attempt
      try {
        await setPersistence(auth, browserLocalPersistence)
        console.log("Auth persistence set to LOCAL")
      } catch (error) {
        console.warn("Could not set auth persistence:", error)
      }

      // Retry login operation with exponential backoff
      const userCredential = await retryOperation(async () => {
        // Create a timeout promise
        const loginPromise = signInWithEmailAndPassword(auth, email, password)
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Login timed out. Please try again.")), 45000),
        )

        // Race the promises
        return Promise.race([loginPromise, timeoutPromise])
      })

      console.log("Login successful for:", userCredential.user.email)

      // After successful login, track the login
      try {
        await trackVisitor("/login")
      } catch (error) {
        console.error("Error tracking login:", error)
        // Don't fail the login if tracking fails
      }

      return userCredential.user
    } catch (error) {
      console.error("Login error:", error)

      // Provide more specific error messages
      if (error.code === "auth/network-request-failed") {
        toast.error({
          title: "Network Error",
          message: "Please check your internet connection and try again.",
        })
        throw new Error("Network connection error. Please check your internet connection and try again.")
      } else if (error.message && error.message.includes("timed out")) {
        toast.error({
          title: "Connection Issue",
          message: "Could not connect to authentication service. Please try again later.",
        })
        throw new Error("Authentication service connection issue. Please try again later.")
      } else {
        const errorMessage = getAuthErrorMessage(error.code)
        toast.error({
          title: "Login Failed",
          message: errorMessage,
        })
        throw new Error(errorMessage)
      }
    }
  }

  // Function to register a new user
  const register = async (email, password) => {
    // Check if Firebase is ready
    if (!firebaseReady) {
      try {
        await retryFirebaseInitialization()
        setFirebaseReady(true)
      } catch (error) {
        toast.error({
          title: "Service Unavailable",
          message: "Registration service is currently unavailable. Please try again later.",
        })
        throw new Error("Registration service is unavailable")
      }
    }

    // Check network connectivity
    if (!checkNetworkConnectivity()) {
      toast.error({
        title: "No Internet Connection",
        message: "Please check your internet connection and try again.",
      })
      throw new Error("No internet connection")
    }

    try {
      console.log("Attempting registration with email:", email)

      // Check if this is the admin email
      const isAdminEmail = email === ADMIN_EMAIL
      console.log("Is admin email?", isAdminEmail)

      // Set persistence to LOCAL before registration attempt
      try {
        await setPersistence(auth, browserLocalPersistence)
        console.log("Auth persistence set to LOCAL")
      } catch (error) {
        console.warn("Could not set auth persistence:", error)
      }

      // Retry registration operation with exponential backoff
      const userCredential = await retryOperation(async () => {
        // Create a timeout promise
        const registerPromise = createUserWithEmailAndPassword(auth, email, password)
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Registration timed out. Please try again.")), 45000),
        )

        // Race the promises
        return Promise.race([registerPromise, timeoutPromise])
      })

      console.log("Registration successful for:", userCredential.user.email)

      // Create user document in Firestore with appropriate role
      const role = isAdminEmail ? "admin" : "customer"

      // Retry Firestore operation with exponential backoff
      await retryOperation(async () => {
        await setDoc(doc(db, "users", userCredential.user.uid), {
          email,
          role,
          createdAt: new Date().toISOString(),
        })
      })

      toast.success({
        title: "Registration Successful",
        message: "Your account has been created successfully!",
      })

      return userCredential.user
    } catch (error) {
      console.error("Registration error:", error)

      // Provide more specific error messages
      if (error.code === "auth/network-request-failed") {
        toast.error({
          title: "Network Error",
          message: "Please check your internet connection and try again.",
        })
        throw new Error("Network connection error. Please check your internet connection and try again.")
      } else if (error.message && error.message.includes("timed out")) {
        toast.error({
          title: "Connection Issue",
          message: "Could not connect to registration service. Please try again later.",
        })
        throw new Error("Registration service connection issue. Please try again later.")
      } else {
        const errorMessage = getAuthErrorMessage(error.code)
        toast.error({
          title: "Registration Failed",
          message: errorMessage,
        })
        throw new Error(errorMessage)
      }
    }
  }

  // Function to log out a user
  const logout = async () => {
    try {
      console.log("Logging out user")
      await signOut(auth)
      toast.info({
        title: "Logged Out",
        message: "You have been successfully logged out",
      })
    } catch (error) {
      console.error("Logout error:", error)
      toast.error({
        title: "Logout Error",
        message: "Failed to log out. Please try again.",
      })
      throw error
    }
  }

  // Function to send password reset email
  const resetPassword = async (email) => {
    // Check if Firebase is ready
    if (!firebaseReady) {
      try {
        await retryFirebaseInitialization()
        setFirebaseReady(true)
      } catch (error) {
        toast.error({
          title: "Service Unavailable",
          message: "Password reset service is currently unavailable. Please try again later.",
        })
        throw new Error("Password reset service is unavailable")
      }
    }

    try {
      await retryOperation(async () => {
        await sendPasswordResetEmail(auth, email)
      })

      toast.success({
        title: "Reset Email Sent",
        message: "Check your email for password reset instructions",
      })
      return true
    } catch (error) {
      console.error("Password reset error:", error)
      const errorMessage = getAuthErrorMessage(error.code)
      toast.error({
        title: "Reset Failed",
        message: errorMessage,
      })
      throw new Error(errorMessage)
    }
  }

  // Helper function to get user-friendly error messages
  const getAuthErrorMessage = (errorCode) => {
    switch (errorCode) {
      case "auth/user-not-found":
        return "No user found with this email address"
      case "auth/wrong-password":
        return "Incorrect password"
      case "auth/email-already-in-use":
        return "Email already in use"
      case "auth/weak-password":
        return "Password is too weak"
      case "auth/invalid-email":
        return "Invalid email address"
      case "auth/too-many-requests":
        return "Too many failed login attempts. Please try again later"
      case "auth/network-request-failed":
        return "Network connection error. Please check your internet connection and try again."
      case "auth/operation-not-allowed":
        return "Email/password registration is not enabled. Please contact support."
      default:
        return "An error occurred. Please try again"
    }
  }

  // Provide the auth context value to children
  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn,
        isAdmin,
        loading,
        firebaseReady,
        login,
        register,
        logout,
        resetPassword,
        retryFirebaseInitialization: () => {
          retryFirebaseInitialization()
            .then(() => setFirebaseReady(true))
            .catch((error) => console.error("Failed to retry Firebase initialization:", error))
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
