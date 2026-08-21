import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  doc,
} from 'firebase/firestore'
import { db } from '../firebase'

export function subscribeMessages(uid, onChange) {
  if (!uid) return () => {}
  const q = query(collection(db, 'users', uid, 'messages'), orderBy('createdAt', 'desc'))
  return onSnapshot(
    q,
    (snap) => {
      onChange(
        snap.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        })),
      )
    },
    () => onChange([]),
  )
}

export async function sendPortfolioMessage(uid, { name, email, message }) {
  const trimmedName = name.trim()
  const trimmedEmail = email.trim()
  const trimmedMessage = message.trim()
  if (!trimmedName) throw new Error('Add your name.')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) throw new Error('Enter a valid email.')
  if (!trimmedMessage) throw new Error('Write a short message.')
  if (trimmedName.length > 120) throw new Error('Name is too long.')
  if (trimmedEmail.length > 200) throw new Error('Email is too long.')
  if (trimmedMessage.length > 4000) throw new Error('Message is too long.')

  await addDoc(collection(db, 'users', uid, 'messages'), {
    name: trimmedName,
    email: trimmedEmail,
    message: trimmedMessage,
    createdAt: serverTimestamp(),
    read: false,
  })
}

export async function markMessageRead(uid, messageId) {
  await updateDoc(doc(db, 'users', uid, 'messages', messageId), { read: true })
}
