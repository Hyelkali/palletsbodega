import React from "react"
import ReactDOM from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import App from "./App"
import "./index.css"
import { AuthProvider } from "./context/AuthContext"
import { CartProvider } from "./context/CartContext"
import { ChatProvider } from "./context/ChatContext"
import { SearchProvider } from "./hooks/useSearch"
import { ToastProvider } from "./context/ToastContext"

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <CartProvider>
            <ChatProvider>
              <SearchProvider>
                <App />
              </SearchProvider>
            </ChatProvider>
          </CartProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
