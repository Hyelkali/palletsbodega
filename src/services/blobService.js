// Vercel Blob service for file uploads
import { put } from "@vercel/blob"

/**
 * Uploads a file to Vercel Blob storage
 * @param {File} file - The file to upload
 * @param {string} folder - Optional folder path
 * @returns {Promise<string>} - The URL of the uploaded file
 */
export const uploadToBlob = async (file, folder = "payment-proofs") => {
  try {
    if (!file) {
      throw new Error("No file provided")
    }

    // Generate a unique filename with timestamp and random string
    const timestamp = new Date().getTime()
    const randomString = Math.random().toString(36).substring(2, 10)
    const fileExtension = file.name.split(".").pop()
    const fileName = `${folder}/${timestamp}-${randomString}.${fileExtension}`

    // Upload to Vercel Blob
    const { url } = await put(fileName, file, {
      access: "public",
      token: "vercel_blob_rw_vFMBEhTfmZ3ZOsSE_31rskNIQBbapMcpxCfINNoYnO4duFu",
    })

    return url
  } catch (error) {
    console.error("Error uploading to Vercel Blob:", error)
    throw new Error(`Failed to upload file: ${error.message}`)
  }
}

/**
 * Validates if a URL is a valid Vercel Blob URL
 * @param {string} url - The URL to validate
 * @returns {boolean} - Whether the URL is valid
 */
export const isValidBlobUrl = (url) => {
  if (!url) return false

  try {
    const urlObj = new URL(url)
    // Check if it's a Vercel Blob URL (typically contains .public.blob.vercel-storage.com)
    return urlObj.hostname.includes("blob.vercel-storage.com")
  } catch (e) {
    return false
  }
}
