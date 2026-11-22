import { httpRequest } from "./http"

// Uploads a file straight from the browser to Cloudinary using a short-lived signature from our server.
// Resolves with { url, publicId, resourceType }. Rejects with Error (name "AbortError" when cancelled).
export async function uploadToCloudinary(file, { onProgress, signal } = {}) {
    const sig = await httpRequest("/assets/uploadSignature", { method: "POST", body: {} })

    const form = new FormData()
    form.append("file", file)
    form.append("api_key", sig.apiKey)
    form.append("timestamp", sig.timestamp)
    form.append("signature", sig.signature)
    form.append("folder", sig.folder)

    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open("POST", `https://api.cloudinary.com/v1_1/${sig.cloudName}/auto/upload`)

        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) onProgress?.(Math.round((event.loaded / event.total) * 100))
        }
        xhr.onload = () => {
            let data = null
            try {
                data = JSON.parse(xhr.responseText)
            } catch {
                // handled below
            }
            if (xhr.status >= 200 && xhr.status < 300 && data?.secure_url) {
                resolve({ url: data.secure_url, publicId: data.public_id, resourceType: data.resource_type })
            } else {
                reject(new Error(data?.error?.message || `Upload failed (HTTP ${xhr.status}).`))
            }
        }
        xhr.onerror = () => reject(new Error("Network error while uploading. Check your connection and try again."))
        xhr.onabort = () => reject(new DOMException("Upload cancelled", "AbortError"))

        if (signal) {
            if (signal.aborted) return xhr.abort()
            signal.addEventListener("abort", () => xhr.abort(), { once: true })
        }
        xhr.send(form)
    })
}
