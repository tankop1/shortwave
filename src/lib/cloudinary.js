import { compressImage } from './image'

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const PRESETS = {
  profile: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET_PROFILE_PICTURE,
  thumbnail: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET_THUMBNAIL,
}

export async function uploadImage(file, kind, { maxWidth = 1280 } = {}) {
  const preset = PRESETS[kind]
  if (!CLOUD_NAME || !preset) {
    throw new Error(
      'Cloudinary isn’t configured. Add VITE_CLOUDINARY_CLOUD_NAME and the upload presets to .env.',
    )
  }

  const blob = await compressImage(file, { maxWidth })
  const body = new FormData()
  body.append('file', blob, 'image.jpg')
  body.append('upload_preset', preset)

  const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body,
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.error?.message || 'Couldn’t upload that image.')
  }
  return data.secure_url
}
