import { collection, deleteDoc, doc, getDocs, query, serverTimestamp, updateDoc, where } from 'firebase/firestore'
import { db } from '../firebase'
import { normalizePortfolio } from './portfolio'

export async function deleteProject(uid, film, portfolio) {
  const filmId = film?.id
  if (!uid || !filmId) throw new Error('Missing project.')

  async function clearCollection(path) {
    const snap = await getDocs(collection(db, ...path))
    await Promise.all(snap.docs.map((item) => deleteDoc(item.ref)))
  }

  try {
    await clearCollection(['films', filmId, 'reviews'])
  } catch {
    /* reviews may be empty or unreadable */
  }

  try {
    await clearCollection(['films', filmId, 'viewers'])
  } catch {
    /* viewers may be empty or unreadable */
  }

  try {
    const invites = await getDocs(query(collection(db, 'invites'), where('ownerId', '==', uid)))
    await Promise.all(
      invites.docs.filter((item) => item.data().filmId === filmId).map((item) => deleteDoc(item.ref)),
    )
  } catch {
    /* invites may be empty */
  }

  const filmIds = (portfolio?.filmIds || []).filter((id) => id !== filmId)
  if (portfolio && filmIds.length !== (portfolio.filmIds || []).length) {
    await updateDoc(doc(db, 'users', uid), {
      portfolio: normalizePortfolio({ ...portfolio, filmIds }),
      updatedAt: serverTimestamp(),
    })
  }

  await deleteDoc(doc(db, 'films', filmId))
}
