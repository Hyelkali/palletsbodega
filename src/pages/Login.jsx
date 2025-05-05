"use client"

import { useState, useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import emailjs from "emailjs-com"
import "./Login.css"

const Login = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  const { login, isLoggedIn, firebaseReady, retryFirebaseInitialization } = useAuth()
  const navigate = useNavigate()

  // Redirect if already logged in
  useEffect(() => {
    if (isLoggedIn) {
      navigate("/")
    }
  }, [isLoggedIn, navigate])

  // Retry Firebase initialization up to 3 times
  useEffect(() => {
    if (!firebaseReady && retryCount < 3) {
      const timer = setTimeout(
        () => {
          retryFirebaseInitialization()
          setRetryCount((prev) => prev + 1)
        },
        2000 * (retryCount + 1),
      )

      return () => clearTimeout(timer)
    }
  }, [firebaseReady, retryCount, retryFirebaseInitialization])

  // Check internet connection
  const checkNetworkConnectivity = () => navigator.onLine

  // Handle Login Submission
  const handleSubmit = async (e) => {
    e.preventDefault()

    // Basic validation
    if (!email || !password) {
      setError("Please fill in all fields")
      return
    }

    if (!checkNetworkConnectivity()) {
      setError("No internet connection. Please check your network and try again.")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      await login(email, password)

      // Send login notification AFTER successful login
      try {
        await sendLoginNotification(email)
        console.log("Login notification sent successfully")
      } catch (notificationError) {
        console.error("Failed to send login notification:", notificationError)
        // Don't block login if notification fails
      }

      navigate("/") // ✅ Redirect after login
    } catch (error) {
      console.error("Login error:", error)
      setError(error.message || "Failed to login. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Send login notification with simplified approach
  const sendLoginNotification = async (userEmail) => {
    // Get current date and time
    const now = new Date()
    const date = now.toLocaleDateString()
    const time = now.toLocaleTimeString()

    // Get browser and device info directly
    const ua = navigator.userAgent
    const device = /Mobi|Android/i.test(ua) ? "Mobile" : /Tablet|iPad/i.test(ua) ? "Tablet" : "Desktop"

    let browser = "Unknown"
    if (ua.includes("Chrome") && !ua.includes("Edg")) browser = "Chrome"
    else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari"
    else if (ua.includes("Firefox")) browser = "Firefox"
    else if (ua.includes("Edg")) browser = "Edge"
    else if (ua.includes("MSIE") || ua.includes("Trident")) browser = "Internet Explorer"

    // Create a simple template params object with all necessary fields
    const templateParams = {
      user_email: userEmail,
      login_date: date,
      login_time: time,
      user_device: device,
      user_browser: browser,
      user_agent: ua.substring(0, 100), // Truncate to avoid issues
    }

    console.log("Sending login notification with params:", templateParams)

    // Send the email notification
    return emailjs.send("service_po0fdy4", "template_9exub1v", templateParams, "j5gTxmOKyrxCeCdyP")
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <h1 className="login-title">Pallet Bodega</h1>

        <div className="login-form-container">
          <h2 className="login-heading">Welcome Back</h2>
          <p className="login-description">Enter your credentials to access your account</p>

          {/* Service Unavailable Message */}
          {!firebaseReady && retryCount >= 3 && (
            <div className="service-unavailable-message">
              <p>Authentication service is currently unavailable.</p>
              <button onClick={retryFirebaseInitialization} className="retry-button">
                Retry Connection
              </button>
            </div>
          )}

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="login-input"
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="login-input"
                disabled={isLoading}
              />
            </div>

            <div className="forgot-password-container">
              <Link to="/forgot-password" className="forgot-password-link">
                Forgot Password?
              </Link>
            </div>

            {error && <p className="login-error">{error}</p>}

            <button type="submit" className="login-button" disabled={isLoading}>
              {isLoading ? (
                <div className="button-loader">
                  <div className="loader-spinner"></div>
                  <span>Connecting...</span>
                </div>
              ) : (
                "Log In"
              )}
            </button>
          </form>

          <div className="login-footer">
            <p>
              Don't have an account?{" "}
              <Link to="/register" className="register-link">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login



// "use client";

// import { useState, useEffect } from "react";
// import { useNavigate, Link } from "react-router-dom";
// import { useAuth } from "../context/AuthContext";
// import emailjs from "emailjs-com";
// import "./Login.css";

// const Login = () => {
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [error, setError] = useState("");
//   const [isLoading, setIsLoading] = useState(false);
//   const [retryCount, setRetryCount] = useState(0);

//   const { login, isLoggedIn, firebaseReady, retryFirebaseInitialization } = useAuth();
//   const navigate = useNavigate();

//   // Redirect if already logged in
//   useEffect(() => {
//     if (isLoggedIn) {
//       navigate("/");
//     }
//   }, [isLoggedIn, navigate]);

//   // Retry Firebase initialization up to 3 times
//   useEffect(() => {
//     if (!firebaseReady && retryCount < 3) {
//       const timer = setTimeout(() => {
//         retryFirebaseInitialization();
//         setRetryCount((prev) => prev + 1);
//       }, 2000 * (retryCount + 1));

//       return () => clearTimeout(timer);
//     }
//   }, [firebaseReady, retryCount, retryFirebaseInitialization]);

//   // Check internet connection
//   const checkNetworkConnectivity = () => navigator.onLine;

//   // Handle Login Submission
//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     // Basic validation
//     if (!email || !password) {
//       setError("Please fill in all fields");
//       return;
//     }

//     if (!checkNetworkConnectivity()) {
//       setError("No internet connection. Please check your network and try again.");
//       return;
//     }

//     setIsLoading(true);
//     setError("");

//     try {
//       await login(email, password);
//       await sendLoginNotification(email);
//       navigate("/"); // ✅ Redirect after login
//     } catch (error) {
//       console.error("Login error:", error);
//       setError(error.message || "Failed to login. Please try again.");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Send login notification
//   const sendLoginNotification = async (userEmail) => {
//     try {
//       const ipInfo = await fetchIPInfo();
//       const browserInfo = getBrowserInfo();

//       const templateParams = {
//         email: userEmail,
//         ip: ipInfo.ip || "Unavailable",
//         city: ipInfo.city || "Unavailable",
//         country: ipInfo.country || "Unavailable",
//         browser: browserInfo,
//       };

//       await emailjs.send(
//         "service_po0fdy4",   // ✅ Your EmailJS Service ID
//         "template_9exub1v",  // ✅ Your EmailJS Template ID
//         templateParams,
//         "j5gTxmOKyrxCeCdyP"  // ✅ Your EmailJS Public Key
//       );

//       console.log("Login notification email sent!");
//     } catch (error) {
//       console.error("Failed to send login notification email:", error);
//     }
//   };

//   // Fetch IP and location info
//   const fetchIPInfo = async () => {
//     try {
//       const res = await fetch("https://ipapi.co/json/");
//       if (!res.ok) throw new Error("Failed to fetch IP info");
//       const data = await res.json();
//       return {
//         ip: data.ip,
//         city: data.city,
//         country: data.country_name,
//       };
//     } catch (error) {
//       console.error("IP fetch error:", error);
//       return {};
//     }
//   };

//   // Get browser info
//   const getBrowserInfo = () => {
//     const ua = navigator.userAgent;
//     if (ua.includes("Chrome")) return "Chrome";
//     if (ua.includes("Firefox")) return "Firefox";
//     if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari";
//     if (ua.includes("Edge")) return "Edge";
//     if (ua.includes("Opera") || ua.includes("OPR")) return "Opera";
//     return "Unknown Browser";
//   };

//   return (
//     <div className="login-page">
//       <div className="login-container">
//         <h1 className="login-title">Pallet Bodega</h1>

//         <div className="login-form-container">
//           <h2 className="login-heading">Welcome Back</h2>
//           <p className="login-description">Enter your credentials to access your account</p>

//           {/* Service Unavailable Message */}
//           {!firebaseReady && retryCount >= 3 && (
//             <div className="service-unavailable-message">
//               <p>Authentication service is currently unavailable.</p>
//               <button onClick={retryFirebaseInitialization} className="retry-button">
//                 Retry Connection
//               </button>
//             </div>
//           )}

//           <form className="login-form" onSubmit={handleSubmit}>
//             <div className="form-group">
//               <input
//                 type="email"
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//                 placeholder="Email"
//                 className="login-input"
//                 disabled={isLoading}
//               />
//             </div>

//             <div className="form-group">
//               <input
//                 type="password"
//                 value={password}
//                 onChange={(e) => setPassword(e.target.value)}
//                 placeholder="Password"
//                 className="login-input"
//                 disabled={isLoading}
//               />
//             </div>

//             <div className="forgot-password-container">
//               <Link to="/forgot-password" className="forgot-password-link">
//                 Forgot Password?
//               </Link>
//             </div>

//             {error && <p className="login-error">{error}</p>}

//             <button type="submit" className="login-button" disabled={isLoading}>
//               {isLoading ? (
//                 <div className="button-loader">
//                   <div className="loader-spinner"></div>
//                   <span>Connecting...</span>
//                 </div>
//               ) : (
//                 "Log In"
//               )}
//             </button>
//           </form>

//           <div className="login-footer">
//             <p>
//               Don't have an account?{" "}
//               <Link to="/register" className="register-link">
//                 Sign up
//               </Link>
//             </p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Login;













// "use client";

// import { useState, useEffect } from "react";
// import { useNavigate, Link } from "react-router-dom";
// import { useAuth } from "../context/AuthContext";
// import emailjs from "emailjs-com"; // Import emailjs
// import "./Login.css";

// const Login = () => {
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState("");
//   const [retryCount, setRetryCount] = useState(0);
//   const { login, isLoggedIn, firebaseReady, retryFirebaseInitialization } = useAuth();
//   const navigate = useNavigate();

//   // Redirect if already logged in
//   useEffect(() => {
//     if (isLoggedIn) {
//       navigate("/");
//     }
//   }, [isLoggedIn, navigate]);

//   // Check if Firebase is ready
//   useEffect(() => {
//     if (!firebaseReady && retryCount < 3) {
//       const timer = setTimeout(() => {
//         console.log(`Attempting to initialize Firebase (retry ${retryCount + 1}/3)`);
//         retryFirebaseInitialization();
//         setRetryCount((prev) => prev + 1);
//       }, 2000 * (retryCount + 1));

//       return () => clearTimeout(timer);
//     }
//   }, [firebaseReady, retryCount, retryFirebaseInitialization]);

//   const checkNetworkConnectivity = () => {
//     return navigator.onLine;
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     if (!email || !password) {
//       setError("Please fill in all fields");
//       return;
//     }

//     if (!checkNetworkConnectivity()) {
//       setError("No internet connection. Please check your network and try again.");
//       return;
//     }

//     setIsLoading(true);
//     setError("");

//     try {
//       setTimeout(async () => {
//         try {
//           await login(email, password);
          
//           // ✅ After successful login, fetch user details and send email
//           await sendLoginNotification(email);

//         } catch (error) {
//           console.error("Login error:", error);
//           setError(error.message || "Failed to login. Please try again.");
//           setIsLoading(false);
//         }
//       }, 1000);
//     } catch (error) {
//       console.error("Login error:", error);
//       setError(error.message || "Failed to login. Please try again.");
//       setIsLoading(false);
//     }
//   };

//   // 👇 Function to send login notification email
//   const sendLoginNotification = async (userEmail) => {
//     try {
//       const ipInfo = await fetchIPInfo();
//       const browserInfo = getBrowserInfo();

//       const templateParams = {
//         email: userEmail,
//         ip: ipInfo.ip || "Unavailable",
//         city: ipInfo.city || "Unavailable",
//         country: ipInfo.country || "Unavailable",
//         browser: browserInfo,
//       };

//       await emailjs.send(
//         'service_po0fdy4',    // Replace with your EmailJS Service ID
//         'template_9exub1v',   // Replace with your EmailJS Template ID
//         templateParams,
//         'j5gTxmOKyrxCeCdyP'     // Replace with your EmailJS Public Key
//       );

//       console.log("Login notification email sent successfully!");
//     } catch (error) {
//       console.error("Failed to send login notification email:", error);
//     }
//   };

//   // 👇 Function to fetch IP, City, Country
//   const fetchIPInfo = async () => {
//     try {
//       const response = await fetch("https://ipapi.co/json/");
//       if (!response.ok) throw new Error("Failed to fetch IP info");
//       const data = await response.json();
//       return {
//         ip: data.ip,
//         city: data.city,
//         country: data.country_name,
//       };
//     } catch (error) {
//       console.error("IP fetch error:", error);
//       return {};
//     }
//   };

//   // 👇 Function to get browser info
//   const getBrowserInfo = () => {
//     const userAgent = navigator.userAgent;
//     if (userAgent.includes("Chrome")) return "Chrome";
//     if (userAgent.includes("Firefox")) return "Firefox";
//     if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) return "Safari";
//     if (userAgent.includes("Edge")) return "Edge";
//     if (userAgent.includes("Opera") || userAgent.includes("OPR")) return "Opera";
//     return "Unknown Browser";
//   };

//   return (
//     <div className="login-page">
//       <div className="login-container">
//         <h1 className="login-title">Pallet Bodega</h1>

//         <div className="login-form-container">
//           <h2 className="login-heading">Welcome Back</h2>
//           <p className="login-description">Enter your credentials to access your account</p>

//           {!firebaseReady && retryCount >= 3 && (
//             <div className="service-unavailable-message">
//               <p>Authentication service is currently unavailable.</p>
//               <button onClick={retryFirebaseInitialization} className="retry-button">
//                 Retry Connection
//               </button>
//             </div>
//           )}

//           <form className="login-form" onSubmit={handleSubmit}>
//             <div className="form-group">
//               <input
//                 type="email"
//                 id="email"
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//                 placeholder="Email"
//                 className="login-input"
//                 disabled={isLoading}
//               />
//             </div>

//             <div className="form-group">
//               <input
//                 type="password"
//                 id="password"
//                 value={password}
//                 onChange={(e) => setPassword(e.target.value)}
//                 placeholder="Password"
//                 className="login-input"
//                 disabled={isLoading}
//               />
//             </div>

//             <div className="forgot-password-container">
//               <Link to="/forgot-password" className="forgot-password-link">
//                 Forgot Password?
//               </Link>
//             </div>

//             {error && <p className="login-error">{error}</p>}

//             <button type="submit" className="login-button" disabled={isLoading}>
//               {isLoading ? (
//                 <div className="button-loader">
//                   <div className="loader-spinner"></div>
//                   <span>Connecting...</span>
//                 </div>
//               ) : (
//                 "Log In"
//               )}
//             </button>
//           </form>

//           <div className="login-footer">
//             <p>
//               Don't have an account?{" "}
//               <Link to="/register" className="register-link">
//                 Sign up
//               </Link>
//             </p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Login;
