export interface UploadResult {
  success: boolean;
  path?: string;
  error?: string;
}

export async function uploadImage(
  file: File,
  boardId: number,
  options: { threadId?: bigint; postId: bigint; isThread: boolean }
): Promise<UploadResult> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("boardId", boardId.toString());
  formData.append("postId", options.postId.toString());
  formData.append("isThread", options.isThread.toString());

  if (options.threadId !== undefined) {
    formData.append("threadId", options.threadId.toString());
  }

  try {
    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || "Upload failed" };
    }

    return { success: true, path: data.path };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}
