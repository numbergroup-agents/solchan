import { NextRequest, NextResponse } from "next/server";
import { Storage } from "@google-cloud/storage";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

function getStorage(): Storage {
  // Check for service account key JSON (for Vercel deployment)
  if (process.env.GCS_SERVICE_ACCOUNT_KEY) {
    const credentials = JSON.parse(process.env.GCS_SERVICE_ACCOUNT_KEY);
    return new Storage({
      projectId: process.env.GCS_PROJECT_ID,
      credentials,
    });
  }

  // Fall back to Application Default Credentials (local dev with gcloud auth)
  return new Storage({
    projectId: process.env.GCS_PROJECT_ID,
  });
}

function getExtension(mimeType: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp",
  };
  return map[mimeType] || "jpg";
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const boardId = formData.get("boardId") as string | null;
    const threadId = formData.get("threadId") as string | null;
    const postId = formData.get("postId") as string | null;
    const isThread = formData.get("isThread") === "true";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!boardId) {
      return NextResponse.json(
        { error: "boardId is required" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: jpg, png, gif, webp" },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5MB" },
        { status: 400 }
      );
    }

    const bucketName = process.env.GCS_BUCKET_NAME;
    if (!bucketName) {
      return NextResponse.json(
        { error: "Server configuration error: GCS_BUCKET_NAME not set" },
        { status: 500 }
      );
    }

    const ext = getExtension(file.type);

    // Generate storage key based on whether this is a thread or a reply
    let storagePath: string;
    if (isThread) {
      // Thread: {boardId}/{threadCount}/op.{ext}
      if (!postId) {
        return NextResponse.json(
          { error: "postId (threadCount) is required for thread images" },
          { status: 400 }
        );
      }
      storagePath = `${boardId}/${postId}/op.${ext}`;
    } else {
      // Reply: {boardId}/{threadId}/{postCount}.{ext}
      if (!threadId || !postId) {
        return NextResponse.json(
          { error: "threadId and postId are required for reply images" },
          { status: 400 }
        );
      }
      storagePath = `${boardId}/${threadId}/${postId}.${ext}`;
    }

    // Upload to GCS
    const storage = getStorage();
    const bucket = storage.bucket(bucketName);
    const blob = bucket.file(storagePath);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await blob.save(buffer, {
      contentType: file.type,
      metadata: {
        cacheControl: "public, max-age=31536000",
      },
    });

    // Public access is controlled at the bucket level (uniform bucket-level access)

    return NextResponse.json({
      success: true,
      path: storagePath,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    );
  }
}
