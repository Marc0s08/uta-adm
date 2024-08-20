import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: "AIzaSyDn6C6LnT6Z5FVQZSCsg6Kl_-_fdzUMTFI",
    authDomain: "barons-cave.firebaseapp.com",
    projectId: "barons-cave",
    storageBucket: "barons-cave.appspot.com",
    messagingSenderId: "453502993981",
    appId: "1:453502993981:web:217758ba871e9e28854c54",
    measurementId: "G-D5P6MQ3PWE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Firestore
const db = getFirestore(app);

// Storage
const storage = getStorage(app);

export { db, storage };
