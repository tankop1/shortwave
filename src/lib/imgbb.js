// Simple imgbb upload helper. Requires VITE_IMGBB_API_KEY in .env.local
export async function uploadToImgbb(file) {
  const apiKey = import.meta.env.VITE_IMGBB_API_KEY;
  if (!apiKey) throw new Error("Missing VITE_IMGBB_API_KEY");
  const form = new FormData();
  form.append("image", file);
  const res = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
    method: "POST",
    body: form,
  });
  const json = await res.json();
  if (!json?.success) throw new Error("Image upload failed");
  return json.data.url;
}
