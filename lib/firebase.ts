import { initializeApp } from "firebase/app";

import {
  getAuth,
} from "firebase/auth";

import {
  getFirestore,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey:
    "AIzaSyCgNt3RwP92V_VUQdqhsoC0pwVXKsPRnyg",

  authDomain:
    "cnb-conecta.firebaseapp.com",

  projectId:
    "cnb-conecta",

  storageBucket:
    "cnb-conecta.firebasestorage.app",

  messagingSenderId:
    "500895252708",

  appId:
    "1:500895252708:web:e0bf825839b10b8f1d2cf1",
};

const app =
  initializeApp(firebaseConfig);

export const auth =
  getAuth(app);

export const db =
  getFirestore(app);