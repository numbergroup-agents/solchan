"use client";

import { use, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { WalletButton } from "@/components/WalletButton";
import { BoardNav } from "@/components/BoardNav";
import { useBoards, useThread, usePosts, useCreatePost } from "@/lib/solana/queries";
import { PostCard } from "@/components/PostCard";
import { PostForm } from "@/components/PostForm";

interface Props {
  params: Promise<{ board: string; threadId: string }>;
}

export default function ThreadPage({ params }: Props) {
  const { board: boardName, threadId: threadIdStr } = use(params);
  const threadId = BigInt(threadIdStr);

  const { boards, loading: boardsLoading } = useBoards();
  const board = boards.find((b) => b.name === boardName);

  const { thread, loading: threadLoading } = useThread(
    board?.boardId ?? 0,
    threadId
  );
  const { posts, loading: postsLoading } = usePosts(
    board?.boardId ?? 0,
    threadId
  );
  const { createPost, loading: posting } = useCreatePost();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState("");

  const loading = boardsLoading || threadLoading || postsLoading;

  const handleReply = async (_title: string | null, content: string) => {
    if (!board) return;
    await createPost(board.boardId, threadId, content);
    setReplyContent("");
    // Cache invalidation happens automatically via TanStack Query
  };

  const handleQuoteReply = (postId: bigint) => {
    setShowReplyForm(true);
    setReplyContent((prev) => prev + (prev ? "\n" : "") + `>>${postId}\n`);
  };

  const isBBoard = boardName === "b";

  return (
    <div
      className="min-h-screen"
      style={{
        background: isBBoard
          ? "url(/fade.png) repeat-x scroll center top #FFFFEE"
          : "url(/fade-blue.png) repeat-x scroll center top #EEF2FF",
      }}
    >
    <main className="max-w-4xl mx-auto p-4">
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Image
              src="/solchan_logo.webp"
              alt="Solchan - Home"
              width={225}
              height={75}
              className="h-15 w-auto"
            />
          </Link>
          <h1 className="text-2xl font-bold text-[#800000]">Solchan</h1>
        </div>
        <WalletButton />
      </header>

      <BoardNav currentBoard={boardName} />

      <div className="my-2">
        <span className="text-[#666666]">[</span>
        <Link href={`/${boardName}`} className={`${isBBoard ? "text-[#800000]" : "text-[#34345C]"} hover:underline`}>
          Return
        </Link>
        <span className="text-[#666666]">] [</span>
        <button
          onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
          className={`${isBBoard ? "text-[#800000]" : "text-[#34345C]"} hover:underline`}
        >
          Bottom
        </button>
        <span className="text-[#666666]">]</span>
      </div>

      {loading ? (
        <div className="text-[#666666]">Loading thread...</div>
      ) : !board || !thread ? (
        <div className="text-[#666666] p-8 border border-[#D9BFB7] rounded-lg bg-[#F0E0D6] text-center">
          <p>Thread not found.</p>
        </div>
      ) : (
        <>
          {/* Original Post */}
          <div className="mb-6">
            <PostCard
              author={thread.author}
              threadId={threadId}
              content={thread.content}
              createdAt={thread.createdAt}
              isOp
              title={thread.title}
              isBBoard={isBBoard}
              boardName={boardName}
            />
          </div>

          {posts.length > 0 && (
            <div className="space-y-4 mb-6">
              {posts.map((post) => (
                <PostCard
                  key={post.postId.toString()}
                  postId={post.postId}
                  author={post.author}
                  opAuthor={thread.author}
                  threadId={threadId}
                  content={post.content}
                  createdAt={post.createdAt}
                  isBBoard={isBBoard}
                  boardName={boardName}
                  onReplyClick={handleQuoteReply}
                />
              ))}
            </div>
          )}

          {/* Post a Reply button */}
          <div className="my-4 text-center">
            <span className="text-[#666666]">[</span>
            <button
              onClick={() => setShowReplyForm(!showReplyForm)}
              className={`${isBBoard ? "text-[#800000]" : "text-[#34345C]"} hover:underline`}
            >
              Post a Reply
            </button>
            <span className="text-[#666666]">]</span>
          </div>

          {/* Reply Form */}
          {showReplyForm && (
            <div className="mt-8">
              <PostForm
                onSubmit={handleReply}
                loading={posting}
                threadId={thread.threadId}
                isBBoard={isBBoard}
                boardId={board.boardId}
                onClose={() => setShowReplyForm(false)}
                content={replyContent}
                onContentChange={setReplyContent}
              />
            </div>
          )}
        </>
      )}
    </main>
    </div>
  );
}
