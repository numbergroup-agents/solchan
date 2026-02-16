"use client";

import { use, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { WalletButton } from "@/components/WalletButton";
import { BoardNav } from "@/components/BoardNav";
import { useBoards, useThreads, useCreateThread } from "@/lib/solana/queries";
import { PostCard } from "@/components/PostCard";
import { PostForm } from "@/components/PostForm";

interface Props {
  params: Promise<{ board: string }>;
}

export default function BoardPage({ params }: Props) {
  const { board: boardName } = use(params);
  const router = useRouter();
  const { boards, loading: boardsLoading } = useBoards();
  const { createThread, loading: creating } = useCreateThread();
  const [showNewThreadForm, setShowNewThreadForm] = useState(false);

  // Find the board by name
  const board = boards.find((b) => b.name === boardName);
  const { threads, loading: threadsLoading } = useThreads(board?.boardId ?? 0);

  const loading = boardsLoading || threadsLoading;

  const isBBoard = boardName === "b";

  const handleCreateThread = async (title: string | null, content: string) => {
    if (!board || !title) return;
    const { threadId } = await createThread(board.boardId, title, content);
    router.push(`/${boardName}/${threadId}`);
  };

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

      <hr className="border-[#D9BFB7] my-4" />

      <h2 className="text-xl font-bold text-[#800000] text-center mb-2">
        /{boardName}/ - {board?.description ?? boardName}
      </h2>

      <div className="mb-4 text-center">
        <span className="text-[#666666]">[</span>
        <button
          onClick={() => setShowNewThreadForm(!showNewThreadForm)}
          className="text-[#800000] hover:underline"
        >
          {showNewThreadForm ? "Close" : "Start a New Thread"}
        </button>
        <span className="text-[#666666]">]</span>
      </div>

      {showNewThreadForm && board && (
        <div className="mb-4">
          <PostForm onSubmit={handleCreateThread} isThread loading={creating} isBBoard={isBBoard} boardId={board.boardId} />
        </div>
      )}

      <hr className="border-[#D9BFB7] my-4" />

      <h2 className="text-lg font-semibold text-[#800000] mb-6">Threads</h2>

      {loading ? (
        <div className="text-[#666666]">Loading threads...</div>
      ) : !board ? (
        <div className="text-[#666666] p-8 border border-[#D9BFB7] rounded-lg bg-[#F0E0D6] text-center">
          <p>Board not found. Make sure the program is deployed and boards are created.</p>
        </div>
      ) : threads.length === 0 ? (
        <div className={`text-[#666666] p-8 border border-[#D9BFB7] rounded-lg ${isBBoard ? 'bg-[#F0E0D6]' : 'bg-[#D6DAF0]'} text-center`}>
          <p>No threads yet. Be the first to create one!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {threads.map((thread) => (
            <Link
              key={thread.threadId.toString()}
              href={`/${boardName}/${thread.threadId}`}
              className="block hover:shadow-md transition-shadow"
            >
              <PostCard
                author={thread.author}
                threadId={thread.threadId}
                content={thread.content.length > 300 ? thread.content.slice(0, 300) + "..." : thread.content}
                createdAt={thread.createdAt}
                isOp
                title={thread.title}
                isBBoard={isBBoard}
                boardName={boardName}
              />
              <div className="text-sm text-[#666666] mt-1 ml-4">
                {thread.postCount.toString()} replies
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
    </div>
  );
}
