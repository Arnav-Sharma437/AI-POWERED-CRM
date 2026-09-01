import { supabase } from "./supabase";
import * as crypto from "crypto";

export interface UploadedFile {
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string; // Stores the path inside the private bucket
}

export async function saveAttachment(
  fileName: string,
  fileType: string,
  base64Data: string
): Promise<UploadedFile> {
  const buffer = Buffer.from(base64Data, "base64");
  const fileSize = buffer.length;
  if (fileSize > 10 * 1024 * 1024) {
    throw new Error("File size exceeds the 10MB limit.");
  }

  // Ensure 'chat-attachments' bucket exists
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    if (!buckets?.some(b => b.name === "chat-attachments")) {
      await supabase.storage.createBucket("chat-attachments", {
        public: false
      });
    }
  } catch (err) {
    console.warn("Failed to check or create bucket:", err);
  }

  // Generate safe unique filename path
  const fileId = crypto.randomUUID();
  const safeName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const filePath = `${fileId}/${safeName}`;

  // Upload file buffer to Supabase Storage
  const { data, error } = await supabase.storage
    .from("chat-attachments")
    .upload(filePath, buffer, {
      contentType: fileType,
      cacheControl: "3600",
      upsert: false
    });

  if (error) {
    throw new Error(`Supabase upload failed: ${error.message}`);
  }

  return {
    fileName,
    fileType,
    fileSize,
    fileUrl: filePath
  };
}
