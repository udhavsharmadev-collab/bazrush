// lib/firebase.js

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDf2kSfnWXkwsL0ZqwbF2pC1PjsEbl8E-E",
  authDomain: "bazrush-d0f45.firebaseapp.com",
  projectId: "bazrush-d0f45",
  storageBucket: "bazrush-d0f45.firebasestorage.app",
  messagingSenderId: "837922963697",
  appId: "1:837922963697:web:120c068a665d1fbbd3e950",
};

// Initialize app
const app = initializeApp(firebaseConfig);

// ✅ THIS LINE WAS MISSING
export const auth = getAuth(app);
export const storage = getStorage(app);