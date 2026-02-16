"use client";

import Link from "next/link";
import { useBoards } from "@/lib/solana/queries";

interface BoardNavProps {
  currentBoard?: string;
}

export function BoardNav({ currentBoard }: BoardNavProps) {
  const { boards, loading } = useBoards();

  if (loading || boards.length === 0) return null;

  return (
    <nav className="text-sm border-b border-[#D9BFB7] pb-2 mb-4">
      <span className="text-[#666666]">[</span>
      {boards.map((board, i) => (
        <span key={board.boardId}>
          {i > 0 && <span className="text-[#666666]"> / </span>}
          <Link
            href={`/${board.name}`}
            className={`hover:underline ${
              currentBoard === board.name
                ? "text-[#800000] font-bold"
                : "text-[#0000EE]"
            }`}
          >
            {board.name}
          </Link>
        </span>
      ))}
      <span className="text-[#666666]">]</span>
    </nav>
  );
}
