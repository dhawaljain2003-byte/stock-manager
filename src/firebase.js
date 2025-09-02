// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCPjFmyR8u-MFlkz9_mG75CninvcXwb9K8",
  authDomain: "stock-manager-ef5bf.firebaseapp.com",
  projectId: "stock-manager-ef5bf",
  storageBucket: "stock-manager-ef5bf.firebasestorage.app",
  messagingSenderId: "591023777922",
  appId: "1:591023777922:web:c6c08a6e497b01a3dd6c9b",
  measurementId: "G-ZCN6W2TFDZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);