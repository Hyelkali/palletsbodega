// Authentication service to handle password reset
import axios from "axios"

export const sendPasswordResetEmail = async (email, resetLink) => {
  try {
    const response = await axios.post("/api/email/send-password-reset", {
      email,
      resetLink,
    })

    return {
      success: true,
      message: "Password reset email sent successfully",
    }
  } catch (error) {
    console.error("Error sending password reset email:", error)
    return {
      success: false,
      message: error.response?.data?.message || "Failed to send password reset email",
    }
  }
}
