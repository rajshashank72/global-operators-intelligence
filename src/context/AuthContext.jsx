import { auth, provider, db } from "../firebase";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, onSnapshot } from "firebase/firestore";
import emailjs from '@emailjs/browser';
import React, { createContext, useContext, useEffect, useState, useMemo } from "react";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userStatus, setUserStatus] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const adminEmails = useMemo(() => 
  process.env.REACT_APP_ADMIN_EMAILS?.split(',') || [], 
  []);

  async function googleSignIn() {
    await signInWithPopup(auth, provider);
  }

  async function logout() {
    await signOut(auth);
  }

  async function sendNewUserEmail(user) {
    try {
      await emailjs.send(
        process.env.REACT_APP_EMAILJS_SERVICE_ID,
        process.env.REACT_APP_EMAILJS_TEMPLATE_ID,
        {
          user_name: user.displayName,
          user_email: user.email,
          login_time: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
          dashboard_link: window.location.origin,
        },
        process.env.REACT_APP_EMAILJS_PUBLIC_KEY
      );
      console.log('Email sent to admin!');
    } catch (error) {
      console.error('Email failed:', error);
    }
  }

  useEffect(() => {
    let unsubscribeSnapshot = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }

      if (user) {
        const isAdminUser = adminEmails.includes(user.email);
        setIsAdmin(isAdminUser);

        const userRef = doc(db, "users", user.uid);

        const { getDoc } = await import("firebase/firestore");
        const existingSnap = await getDoc(userRef);
        const isNewUser = !existingSnap.exists();

        await setDoc(userRef, {
          name: user.displayName,
          email: user.email,
          photo: user.photoURL,
          role: isAdminUser ? "admin" : "user",
          createdAt: new Date(),
        }, { merge: true });

        if (!isAdminUser) {
          await setDoc(userRef, { status: "pending" }, { merge: true });
        } else {
          await setDoc(userRef, { status: "approved" }, { merge: true });
        }

        // Send email only for brand new non-admin users
        if (isNewUser && !isAdminUser) {
          await sendNewUserEmail(user);
        }

        unsubscribeSnapshot = onSnapshot(userRef, (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            setUserStatus(data.status);
            setIsAdmin(adminEmails.includes(data.email));
          }
          setLoading(false);
        });

      } else {
        setUserStatus(null);
        setIsAdmin(false);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, [adminEmails]);

  const value = {
    currentUser,
    userStatus,
    isAdmin,
    loading,
    googleSignIn,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}