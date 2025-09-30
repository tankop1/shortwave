import { auth, db } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { uploadToImgbb } from "./imgbb";

export const signUpWithEmail = async (name, email, password, avatarFile) => {
  const { user } = await createUserWithEmailAndPassword(auth, email, password);
  let photoURL = null;
  if (avatarFile) {
    try {
      photoURL = await uploadToImgbb(avatarFile);
    } catch (e) {
      // Non-fatal: continue without photo
      photoURL = null;
    }
  }
  await updateProfile(user, {
    displayName: name || user.displayName,
    photoURL: photoURL || user.photoURL,
  });

  await setDoc(doc(db, "users", user.uid), {
    uid: user.uid,
    name: name || null,
    email: user.email,
    photoURL: photoURL || null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return user;
};

export const signInWithEmail = (email, password) =>
  signInWithEmailAndPassword(auth, email, password);

export const logOut = () => signOut(auth);

export const subscribeToAuth = (cb) => onAuthStateChanged(auth, cb);
