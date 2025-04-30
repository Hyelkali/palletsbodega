"use client"

import { Routes, Route } from "react-router-dom"
import Layout from "./components/Layout"
import AdminLayout from "./components/admin/AdminLayout"
import ProtectedRoute from "./components/ProtectedRoute"
import Home from "./pages/Home"
import Catalog from "./pages/Catalog"
import Contact from "./pages/Contact"
import TodaysDeals from "./pages/TodaysDeals"
import ProductDetail from "./components/ProductDetail.jsx"
import Cart from "./pages/Cart"
import Login from "./pages/Login"
import Register from "./pages/Register"
import ForgotPassword from "./pages/ForgotPassword"
import Payment from "./pages/Payment.jsx"
import NotFound from "./pages/NotFound"
import Support from "./pages/Support"
import ThankYou from "./pages/ThankYou"
import TrackShipment from "./pages/TrackShipment"
import TransactionHistory from "./pages/TransactionHistory"
import AdminOrders from "./pages/admin/Orders"
import Viewers from "./pages/admin/Viewers"
import AdminTransactions from "./pages/admin/Transactions"
import PaymentRequests from "./pages/admin/PaymentRequests"
import AdminSetup from "./pages/AdminSetup"
import PrivacyPage from "./pages/PrivacyPage"
import { useAuth } from "./context/AuthContext"
import { useEffect } from "react"
import { initVisitorTracking } from "./services/visitorService"
import Checkout from "./pages/Checkout"
import "./App.css"

function App() {
  const { isAdmin } = useAuth()

  // Initialize visitor tracking
  useEffect(() => {
    try {
      initVisitorTracking()
    } catch (error) {
      console.error("Error initializing visitor tracking:", error)
    }
  }, [])

  // Debug log for routing
  useEffect(() => {
    console.log("App component rendered, isAdmin:", isAdmin)
  }, [isAdmin])

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="catalog" element={<Catalog />} />
        <Route path="contact" element={<Contact />} />
        <Route path="todays-deals" element={<TodaysDeals />} />
        <Route path="product/:id" element={<ProductDetail />} />
        <Route path="cart" element={<Cart />} />
        <Route path="payment" element={<Payment />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="privacy-policy" element={<PrivacyPage />} />
        <Route path="support" element={<Support />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="thank-you" element={<ThankYou />} />
        <Route path="track-shipment" element={<TrackShipment />} />
        <Route path="admin-setup" element={<AdminSetup />} />

        {/* Protected user routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="transactions" element={<TransactionHistory />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute requireAdmin={true}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminOrders />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="payment-requests" element={<PaymentRequests />} />
        <Route path="viewers" element={<Viewers />} />
        <Route path="transactions" element={<AdminTransactions />} />
      </Route>
    </Routes>
  )
}

export default App
