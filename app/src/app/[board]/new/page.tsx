"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { WalletButton } from "@/components/WalletButton";
import { BoardNav } from "@/components/BoardNav";
import { useBoards, useCreateThread } from "@/lib/solana/queries";
import { PostForm } from "@/components/PostForm";

interface Props {
  params: Promise<{ board: string }>;
}

export default function NewThreadPage({ params }: Props) {
  const { board: boardName } = use(params);
  const router = useRouter();
  const { boards, loading: boardsLoading } = useBoards();
  const { createThread, loading: creating } = useCreateThread();

  // Find the board by name
  const board = boards.find((b) => b.name === boardName);

  const handleSubmit = async (title: string | null, content: string) => {
    if (!board || !title) return;

    const { threadId } = await createThread(board.boardId, title, content);
    router.push(`/${boardName}/${threadId}`);
  };

  return (
    <main className="max-w-4xl mx-auto p-4">
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <Link href={`/${boardName}`} className="text-[#0000EE] hover:underline">
            &larr; Back to /{boardName}/
          </Link>
        </div>
        <WalletButton />
      </header>

      <BoardNav currentBoard={boardName} />

      <h1 className="text-2xl font-bold text-[#800000] mb-6">
        Create New Thread on /{boardName}/
      </h1>

      {boardsLoading ? (
        <div className="text-[#666666]">Loading...</div>
      ) : !board ? (
        <div className="text-[#666666] p-8 border border-[#D9BFB7] rounded-lg bg-[#F0E0D6] text-center">
          <p>Board not found.</p>
        </div>
      ) : (
        <PostForm onSubmit={handleSubmit} isThread loading={creating} />
      )}
    </main>
  );
}
