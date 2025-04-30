"use client"

import { useState, useEffect } from "react"
import { collection, query, where, getDocs, orderBy, limit, getDoc, doc } from "firebase/firestore"
import { db } from "../firebase/config"
import { useAuth } from "../context/AuthContext"

const TransactionDebug = () => {
  const { user } = useAuth()
  const [debugInfo, setDebugInfo] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [expanded, setExpanded] = useState(false)
  const [collections, setCollections] = useState([])

  useEffect(() => {
    // Auto-run debug on mount
    if (user && user.uid) {
      checkTransactions()
    }
  }, [user])

  const checkTransactions = async () => {
    if (!user || !user.uid) {
      setError("User not logged in or user ID not available")
      return
    }

    try {
      setLoading(true)
      setError("")

      // Check user document
      const userDoc = await getDoc(doc(db, "users", user.uid))
      const userData = userDoc.exists() ? userDoc.data() : null

      // Query transactions for the current user by ID
      const idQuery = query(
        collection(db, "transactions"),
        where("customerId", "==", user.uid),
        orderBy("createdAt", "desc"),
      )

      const idQuerySnapshot = await getDocs(idQuery)
      const idTransactions = []

      idQuerySnapshot.forEach((doc) => {
        const data = doc.data()
        idTransactions.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate()?.toISOString() || "No date",
        })
      })

      // Query transactions for the current user by email
      const emailQuery = query(
        collection(db, "transactions"),
        where("customerEmail", "==", user.email),
        orderBy("createdAt", "desc"),
      )

      const emailQuerySnapshot = await getDocs(emailQuery)
      const emailTransactions = []

      emailQuerySnapshot.forEach((doc) => {
        const data = doc.data()
        emailTransactions.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate()?.toISOString() || "No date",
        })
      })

      // Check orders collection
      const ordersQuery = query(
        collection(db, "orders"),
        where("customerId", "==", user.uid),
        orderBy("createdAt", "desc"),
        limit(5),
      )

      const ordersSnapshot = await getDocs(ordersQuery)
      const orders = []

      ordersSnapshot.forEach((doc) => {
        const data = doc.data()
        orders.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate()?.toISOString() || "No date",
        })
      })

      // Get all collections
      const collectionsSnapshot = await getDocs(collection(db, "_collections"))
      const collectionsList = []
      collectionsSnapshot.forEach((doc) => {
        collectionsList.push(doc.id)
      })

      setCollections(collectionsList)

      setDebugInfo({
        userId: user.uid,
        email: user.email,
        userData: userData,
        transactionsByIdCount: idTransactions.length,
        transactionsByEmailCount: emailTransactions.length,
        transactionsById: idTransactions,
        transactionsByEmail: emailTransactions,
        orders: orders,
        ordersCount: orders.length,
      })
    } catch (err) {
      console.error("Debug error:", err)
      setError(`Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        zIndex: 9999,
        background: "#333",
        padding: "10px",
        borderRadius: "5px",
        maxWidth: expanded ? "80%" : "300px",
        maxHeight: expanded ? "80vh" : "300px",
        overflowY: "auto",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
        <button
          onClick={checkTransactions}
          style={{
            background: "#00ff9d",
            color: "#000",
            border: "none",
            padding: "5px 10px",
            borderRadius: "3px",
            cursor: "pointer",
          }}
        >
          {loading ? "Checking..." : "Debug Transactions"}
        </button>

        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            background: "#555",
            color: "#fff",
            border: "none",
            padding: "5px 10px",
            borderRadius: "3px",
            cursor: "pointer",
          }}
        >
          {expanded ? "Collapse" : "Expand"}
        </button>
      </div>

      {error && <div style={{ color: "red", marginTop: "10px", fontSize: "12px" }}>{error}</div>}

      {debugInfo && (
        <div
          style={{
            marginTop: "10px",
            fontSize: "12px",
            color: "#fff",
          }}
        >
          <p>
            <strong>User ID:</strong> {debugInfo.userId}
          </p>
          <p>
            <strong>Email:</strong> {debugInfo.email}
          </p>
          <p>
            <strong>User Data:</strong> {debugInfo.userData ? "Found" : "Not found"}
          </p>
          {debugInfo.userData && (
            <div>
              <p>
                <strong>User Role:</strong> {debugInfo.userData.role || "Not set"}
              </p>
            </div>
          )}
          <p>
            <strong>Transactions by ID:</strong> {debugInfo.transactionsByIdCount}
          </p>
          <p>
            <strong>Transactions by Email:</strong> {debugInfo.transactionsByEmailCount}
          </p>
          <p>
            <strong>Orders:</strong> {debugInfo.ordersCount}
          </p>

          {expanded && (
            <>
              <div style={{ marginTop: "10px" }}>
                <h4 style={{ margin: "5px 0" }}>Collections:</h4>
                <ul style={{ margin: "5px 0", paddingLeft: "20px" }}>
                  {collections.map((col) => (
                    <li key={col}>{col}</li>
                  ))}
                </ul>
              </div>

              {debugInfo.transactionsByIdCount > 0 && (
                <div style={{ marginTop: "10px" }}>
                  <h4 style={{ margin: "5px 0" }}>Transactions by ID:</h4>
                  <pre
                    style={{
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-all",
                      background: "#222",
                      padding: "5px",
                      fontSize: "10px",
                    }}
                  >
                    {JSON.stringify(debugInfo.transactionsById[0], null, 2)}
                  </pre>
                </div>
              )}

              {debugInfo.transactionsByEmailCount > 0 && (
                <div style={{ marginTop: "10px" }}>
                  <h4 style={{ margin: "5px 0" }}>Transactions by Email:</h4>
                  <pre
                    style={{
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-all",
                      background: "#222",
                      padding: "5px",
                      fontSize: "10px",
                    }}
                  >
                    {JSON.stringify(debugInfo.transactionsByEmail[0], null, 2)}
                  </pre>
                </div>
              )}

              {debugInfo.ordersCount > 0 && (
                <div style={{ marginTop: "10px" }}>
                  <h4 style={{ margin: "5px 0" }}>Latest Order:</h4>
                  <pre
                    style={{
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-all",
                      background: "#222",
                      padding: "5px",
                      fontSize: "10px",
                    }}
                  >
                    {JSON.stringify(debugInfo.orders[0], null, 2)}
                  </pre>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default TransactionDebug
