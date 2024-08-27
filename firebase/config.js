import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
    apiKey: "AIzaSyDXq79OfvJfgGZI452os1M5cGYlvrXBcjM",
    authDomain: "p2trust.firebaseapp.com",
    projectId: "p2trust",
    storageBucket: "p2trust.appspot.com",
    messagingSenderId: "846867652886",
    appId: "1:846867652886:web:0d7ee66c6c11e142027037"
};

const app = initializeApp(firebaseConfig);

const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

const fs = getFirestore(app);
const db = getDatabase(app, "https://p2trust-default-rtdb.asia-southeast1.firebasedatabase.app");

export { fs, db, auth };


