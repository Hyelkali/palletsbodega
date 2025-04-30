import { initializeApp } from "firebase/app";
import { getAuth, browserLocalPersistence, setPersistence } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCBvUbXZdJ7aQd7UbdPfGjytnxV41Qa9U4",
  authDomain: "pallet-bodega-shop.firebaseapp.com",
  projectId: "pallet-bodega-shop",
  storageBucket: "pallet-bodega-shop.firebasestorage.app",
  messagingSenderId: "799472142873",
  appId: "1:799472142873:web:d3811abd5485e81d4af888",
  measurementId: "G-T16HMRRJ54",
};

// Initialize Firebase services
let app, auth, db, storage;

// Function to initialize Firebase with retry logic
const initializeFirebase = async (retryCount = 0, maxRetries = 3) => {
  try {
    console.log(`Initializing Firebase (attempt ${retryCount + 1}/${maxRetries + 1})`);

    // Initialize Firebase app
    if (!app) {
      app = initializeApp(firebaseConfig);
      console.log("Firebase app initialized");
    }

    // Initialize Authentication
    if (!auth) {
      auth = getAuth(app);

      // Set persistence to LOCAL
      try {
        await setPersistence(auth, browserLocalPersistence);
        console.log("Firebase Auth persistence set to LOCAL");
      } catch (error) {
        console.warn("Failed to set Auth persistence:", error.message);
      }

      console.log("Firebase Auth initialized");
    }

    // Initialize Firestore
    if (!db) {
      db = getFirestore(app);

      // Enable offline persistence
      try {
        await enableIndexedDbPersistence(db);
        console.log("Firestore offline persistence enabled");
      } catch (error) {
        console.warn("Failed to enable Firestore persistence:", error.message);
      }

      console.log("Firebase Firestore initialized");
    }

    // Initialize Storage
    if (!storage) {
      storage = getStorage(app);
      console.log("Firebase Storage initialized");
    }

    console.log("Firebase services initialized successfully");
    return { auth, db, storage };
  } catch (error) {
    console.error(`Firebase initialization failed (attempt ${retryCount + 1}):`, error.message);

    if (retryCount < maxRetries) {
      console.log(`Retrying in ${(retryCount + 1) * 2}s...`);
      await new Promise((resolve) => setTimeout(resolve, (retryCount + 1) * 2000));
      return initializeFirebase(retryCount + 1, maxRetries);
    }

    console.error(`Firebase initialization failed after ${maxRetries + 1} attempts`);
    auth = auth || createFallbackAuth();
    db = db || createFallbackDb();
    storage = storage || createFallbackStorage();
    throw new Error(`Firebase initialization failed: ${error.message}`);
  }
};

// Fallback implementations
const createFallbackAuth = () => {
  console.warn("Using fallback Auth");
  return {
    currentUser: null,
    onAuthStateChanged: (cb) => {
      cb(null);
      return () => {};
    },
    signInWithEmailAndPassword: () => Promise.reject(new Error("Auth unavailable")),
    createUserWithEmailAndPassword: () => Promise.reject(new Error("Auth unavailable")),
    signOut: () => Promise.resolve(),
  };
};

const createFallbackDb = () => {
  console.warn("Using fallback Firestore");
  return {
    collection: () => ({
      doc: () => ({
        get: () => Promise.reject(new Error("Firestore unavailable")),
        set: () => Promise.reject(new Error("Firestore unavailable")),
      }),
    }),
  };
};

const createFallbackStorage = () => {
  console.warn("Using fallback Storage");
  return {
    ref: () => ({
      put: () => Promise.reject(new Error("Storage unavailable")),
      getDownloadURL: () => Promise.reject(new Error("Storage unavailable")),
    }),
  };
};

// Initialize Firebase
initializeFirebase()
  .then(() => console.log("Firebase initialization complete"))
  .catch((error) => console.error("Firebase initialization error:", error));

// Export services
export { auth, db, storage };

// Export utility functions
export const isFirebaseReady = () => Boolean(auth && db && storage);
export const retryFirebaseInitialization = () => initializeFirebase(0, 3);