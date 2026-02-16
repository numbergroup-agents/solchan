"use client";

import { useState } from "react";
import { PublicKey } from "@solana/web3.js";

const GCS_BUCKET_URL = process.env.NEXT_PUBLIC_GCS_BUCKET_URL || "";

interface ParsedContent {
  options: string[];
  imagePath: string | null;
  message: string;
}

function parsePostContent(content: string): ParsedContent {
  const separator = "\x1D";
  const parts = content.split(separator);

  // No separator: plain message
  if (parts.length === 1) {
    return { options: [], imagePath: null, message: content };
  }

  // Two parts: options\x1Dmessage (legacy format without image)
  if (parts.length === 2) {
    const optionsStr = parts[0];
    const message = parts[1];
    const options = optionsStr
      .split(",")
      .map((o) => o.trim().toLowerCase())
      .filter(Boolean);
    return { options, imagePath: null, message };
  }

  // Three parts: options\x1Dimage_path\x1Dmessage (new format)
  const optionsStr = parts[0];
  const imagePath = parts[1] || null;
  const message = parts.slice(2).join(separator); // In case message contains separator
  const options = optionsStr
    .split(",")
    .map((o) => o.trim().toLowerCase())
    .filter(Boolean);
  return { options, imagePath, message };
}

interface PostCardProps {
  postId?: bigint;
  author: PublicKey;
  opAuthor?: PublicKey;
  threadId: bigint;
  content: string;
  createdAt: bigint;
  isOp?: boolean;
  title?: string;
  isBBoard?: boolean;
  boardName: string;
  onReplyClick?: (postId: bigint) => void;
}

function hashAddress(
  address: PublicKey,
  threadId: bigint,
  boardName: string
): string {
  const str = address.toBase58() + threadId.toString() + boardName;
  // Simple hash using string char codes
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  // Convert to base64-like string
  const base64Chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let result = "";
  let n = Math.abs(hash);
  for (let i = 0; i < 8; i++) {
    result += base64Chars[n % 64];
    n = Math.floor(n / 64);
  }
  return result;
}

function formatTimestamp(timestamp: bigint): string {
  const date = new Date(Number(timestamp) * 1000);
  return date.toLocaleString();
}

export function PostCard({
  postId,
  author,
  opAuthor,
  threadId,
  content,
  createdAt,
  isOp = false,
  title,
  isBBoard = false,
  boardName,
  onReplyClick,
}: PostCardProps) {
  const { options, imagePath, message } = parsePostContent(content);
  const hasSage = options.includes("sage");
  const hasSpoiler = options.includes("spoiler");
  const [spoilerRevealed, setSpoilerRevealed] = useState(false);
  const [imageExpanded, setImageExpanded] = useState(false);

  const imageUrl = imagePath ? `${GCS_BUCKET_URL}/${imagePath}` : null;

  return (
    <div
      className={`border rounded-lg p-4 ${isOp && !isBBoard ? "bg-[#D6DAF0] border-[#B7C5D9]" : "bg-[#F0E0D6] border-[#D9BFB7]"}`}
    >
      <div className="flex items-center gap-2 text-sm text-[#666666] mb-2">
        {isOp ? (
          <span className="font-bold text-[#800000]">OP</span>
        ) : onReplyClick && postId !== undefined ? (
          <button
            onClick={() => onReplyClick(postId)}
            className="text-[#800000] hover:underline"
          >
            No.{postId.toString()}
          </button>
        ) : (
          <span className="text-[#666666]">#{postId?.toString()}</span>
        )}
        <span
          className="font-mono text-[#117743]"
          title={author.toBase58()}
        >
          ID: {hashAddress(author, threadId, boardName)}
          {isOp || (opAuthor && author.equals(opAuthor)) ? " (OP)" : ""}
        </span>
        <span className="text-[#666666]">{formatTimestamp(createdAt)}</span>
        {hasSage && (
          <span className="text-xs font-bold text-[#789922] bg-[#E0E0E0] px-1 rounded">
            SAGE
          </span>
        )}
      </div>
      {title && (
        <h3 className="font-bold text-lg mb-2 text-[#800000]">{title}</h3>
      )}
      {(imageUrl || message) && (
        <div className="flex gap-3">
          {imageUrl && (
            <div className="flex-shrink-0">
              <img
                src={imageUrl}
                alt="Post image"
                className={`cursor-pointer border border-[#D9BFB7] ${
                  imageExpanded ? "max-w-full" : "max-w-[250px] max-h-[250px]"
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setImageExpanded(!imageExpanded);
                }}
                title={imageExpanded ? "Click to shrink" : "Click to expand"}
              />
            </div>
          )}
          <div>
            {hasSpoiler && !spoilerRevealed ? (
              <p
                className={`${isBBoard ? "text-[#333333]" : "text-[#000000]"} whitespace-pre-wrap break-words`}
              >
                <span className="text-[#666666] text-sm">[Spoiler] </span>
                <span
                  className="blur-sm select-none cursor-pointer hover:blur-[3px] transition-all"
                  onClick={() => setSpoilerRevealed(true)}
                >
                  {message}
                </span>
              </p>
            ) : (
              <p
                className={`${isBBoard ? "text-[#333333]" : "text-[#000000]"} whitespace-pre-wrap break-words`}
              >
                {message}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
