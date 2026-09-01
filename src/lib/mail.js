import { httpsCallable } from 'firebase/functions'
import { functions } from '../firebase'

function callableError(err, fallback) {
  const message = String(err?.message || '')
    .replace(/^Firebase:\s*/i, '')
    .replace(/\s*\([^)]*\)\s*$/, '')
    .replace(/\s*\[[^\]]*\]\s*$/, '')
    .trim()
  return new Error(message || fallback)
}

async function callTestMail(name, fallback) {
  const send = httpsCallable(functions, name)
  try {
    const result = await send({})
    return result.data
  } catch (err) {
    throw callableError(err, fallback)
  }
}

export async function sendTestContactEmail() {
  return callTestMail('sendTestContactEmail', 'Couldn’t send the test contact email.')
}

export async function sendTestRatingEmail() {
  return callTestMail('sendTestRatingEmail', 'Couldn’t send the test rating email.')
}

export async function sendTestPlaysEmail() {
  return callTestMail('sendTestPlaysEmail', 'Couldn’t send the test plays email.')
}

export async function sendTestWelcomeEmail() {
  return callTestMail('sendTestWelcomeEmail', 'Couldn’t send the test welcome email.')
}
