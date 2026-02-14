"use client";

import { useState, useRef, FormEvent, ChangeEvent } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletButton } from "@/components/WalletButton";
import { uploadImage } from "@/lib/upload";
import { useThreadCount, usePostCount } from "@/lib/solana/queries";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

interface PostFormProps {
  onSubmit: (title: string | null, content: string) => Promise<void>;
  isThread?: boolean;
  loading?: boolean;
  threadId?: bigint;
  onClose?: () => void;
  isBBoard?: boolean;
  boardId?: number;
  content?: string;
  onContentChange?: (content: string) => void;
}

export function PostForm({
  onSubmit,
  isThread = false,
  loading = false,
  threadId,
  onClose,
  isBBoard = false,
  boardId,
  content: controlledContent,
  onContentChange,
}: PostFormProps) {
  const { connected } = useWallet();
  const [title, setTitle] = useState("");
  const [internalContent, setInternalContent] = useState("");
  const contentValue = controlledContent !== undefined ? controlledContent : internalContent;
  const setContentValue = onContentChange ?? setInternalContent;
  const [options, setOptions] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch counts for image upload keys
  const { threadCount, refetch: refetchThreadCount } = useThreadCount(
    boardId ?? 0
  );
  const { postCount, refetch: refetchPostCount } = usePostCount(
    boardId ?? 0,
    threadId ?? BigInt(0)
  );

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Invalid file type. Allowed: jpg, png, gif, webp");
      return;
    }

    // Validate file size
    if (file.size > MAX_SIZE) {
      setError("File too large. Maximum size is 5MB");
      return;
    }

    setSelectedFile(file);
    setError(null);

    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isThread && !title.trim()) {
      setError("Title is required");
      return;
    }

    if (!contentValue.trim() && !selectedFile) {
      setError("Content or image is required");
      return;
    }

    try {
      let imagePath: string | null = null;

      // Upload image if selected
      if (selectedFile && boardId !== undefined) {
        setUploading(true);

        // Refetch the count right before upload to get the latest
        if (isThread) {
          await refetchThreadCount();
        } else {
          await refetchPostCount();
        }

        const count = isThread ? threadCount : postCount;
        if (count === null) {
          throw new Error("Could not fetch count for image upload");
        }

        const result = await uploadImage(selectedFile, boardId, {
          threadId: isThread ? undefined : threadId,
          postId: count,
          isThread,
        });

        setUploading(false);

        if (!result.success) {
          throw new Error(result.error || "Image upload failed");
        }

        imagePath = result.path ?? null;
      }

      // Build content with new format: options\x1Dimage_path\x1Dmessage
      let finalContent: string;
      const optionsPart = options.trim();
      const imagePart = imagePath ?? "";
      const messagePart = contentValue.trim();

      if (imagePart) {
        // New format with image
        finalContent = `${optionsPart}\x1D${imagePart}\x1D${messagePart}`;
      } else if (optionsPart) {
        // Legacy format with options but no image
        finalContent = `${optionsPart}\x1D${messagePart}`;
      } else {
        // Plain message
        finalContent = messagePart;
      }

      await onSubmit(isThread ? title : null, finalContent);
      setTitle("");
      setContentValue("");
      setOptions("");
      handleRemoveFile();
    } catch (err) {
      setUploading(false);
      setError(err instanceof Error ? err.message : "Failed to submit");
    }
  };

  const isSubmitting = loading || uploading;

  if (!connected) {
    return (
      <div className="border border-[#D9BFB7] rounded-lg p-6 bg-[#F0E0D6] text-center">
        <p className="text-[#666666] mb-4">Connect your wallet to post</p>
        <WalletButton />
      </div>
    );
  }

  const labelBg = isBBoard ? "bg-[#EA8]" : "bg-[#98E]";
  const labelText = isBBoard ? "text-[#800]" : "text-[#000]";

  // Reply mode: simplified form matching thread creation style
  if (!isThread) {
    return (
      <form onSubmit={handleSubmit}>
        <table
          className="border-separate mx-auto"
          style={{ borderSpacing: "0 2px" }}
        >
          <tbody>
            <tr>
              <td
                className={`${labelBg} ${labelText} font-bold px-2 py-1 border border-black`}
              >
                Options
              </td>
              <td className="px-1 py-1">
                <input
                  type="text"
                  value={options}
                  onChange={(e) => setOptions(e.target.value)}
                  placeholder="sage, spoiler"
                  className="px-1 py-0.5 border border-[#AAA] focus:outline-none bg-[#EEEEEE]"
                  style={{ fontFamily: "arial, helvetica, sans-serif" }}
                  disabled={isSubmitting}
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="ml-1 px-2 py-0.5 bg-[#D6D6D6] border border-[#AAA] hover:bg-[#C6C6C6] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading
                    ? "Uploading..."
                    : loading
                      ? "Submitting..."
                      : "Post"}
                </button>
              </td>
            </tr>
            <tr>
              <td
                className={`${labelBg} ${labelText} font-bold px-2 py-1 border border-black`}
              >
                File
              </td>
              <td className="px-1 py-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleFileChange}
                  className="text-sm file:mr-2 file:px-2 file:py-0.5 file:bg-[#D6D6D6] file:border file:border-[#AAA] file:hover:bg-[#C6C6C6] file:cursor-pointer file:text-black"
                  disabled={isSubmitting}
                />
                {previewUrl && (
                  <div className="mt-2 inline-block relative">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="max-w-[150px] max-h-[150px] border border-[#AAA]"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center hover:bg-red-600"
                      disabled={isSubmitting}
                    >
                      X
                    </button>
                  </div>
                )}
              </td>
            </tr>
            <tr>
              <td
                className={`${labelBg} ${labelText} font-bold px-2 py-1 border border-black align-top`}
              >
                Comment
              </td>
              <td className="px-1 py-1">
                <textarea
                  id="content"
                  value={contentValue}
                  onChange={(e) => setContentValue(e.target.value)}
                  maxLength={2000}
                  rows={5}
                  cols={48}
                  className="px-1 py-0.5 border border-[#AAA] focus:outline-none resize-y bg-[#EEEEEE]"
                  style={{ fontFamily: "arial, helvetica, sans-serif" }}
                  placeholder="Write a reply..."
                  disabled={isSubmitting}
                />
              </td>
            </tr>
          </tbody>
        </table>
        {error && <p className="text-red-600 text-sm mt-2 text-center">{error}</p>}
      </form>
    );
  }

  // Thread creation mode
  return (
    <form onSubmit={handleSubmit}>
      <table
        className="border-separate mx-auto"
        style={{ borderSpacing: "0 2px" }}
      >
        <tbody>
          <tr>
            <td
              className={`${labelBg} ${labelText} font-bold px-2 py-1 border border-black`}
            >
              Subject
            </td>
            <td className="px-1 py-1">
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
                className="px-1 py-0.5 border border-[#AAA] focus:outline-none bg-[#EEEEEE]"
                style={{ fontFamily: "arial, helvetica, sans-serif" }}
                disabled={isSubmitting}
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="ml-1 px-2 py-0.5 bg-[#D6D6D6] border border-[#AAA] hover:bg-[#C6C6C6] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading
                  ? "Uploading..."
                  : loading
                    ? "Submitting..."
                    : "Post"}
              </button>
            </td>
          </tr>
          <tr>
            <td
              className={`${labelBg} ${labelText} font-bold px-2 py-1 border border-black`}
            >
              File
            </td>
            <td className="px-1 py-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleFileChange}
                className="text-sm file:mr-2 file:px-2 file:py-0.5 file:bg-[#D6D6D6] file:border file:border-[#AAA] file:hover:bg-[#C6C6C6] file:cursor-pointer file:text-black"
                disabled={isSubmitting}
              />
              {previewUrl && (
                <div className="mt-2 inline-block relative">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-w-[150px] max-h-[150px] border border-[#AAA]"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center hover:bg-red-600"
                    disabled={isSubmitting}
                  >
                    X
                  </button>
                </div>
              )}
            </td>
          </tr>
          <tr>
            <td
              className={`${labelBg} ${labelText} font-bold px-2 py-1 border border-black align-top`}
            >
              Comment
            </td>
            <td className="px-1 py-1">
              <textarea
                id="content"
                value={contentValue}
                onChange={(e) => setContentValue(e.target.value)}
                maxLength={2000}
                rows={5}
                cols={48}
                className="px-1 py-0.5 border border-[#AAA] focus:outline-none resize-y bg-[#EEEEEE]"
                style={{ fontFamily: "arial, helvetica, sans-serif" }}
                disabled={isSubmitting}
              />
            </td>
          </tr>
        </tbody>
      </table>
      {error && <p className="text-red-600 text-sm mt-2 text-center">{error}</p>}
    </form>
  );
}
