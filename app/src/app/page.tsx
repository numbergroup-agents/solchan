"use client";

import Link from "next/link";
import Image from "next/image";
import { WalletButton } from "@/components/WalletButton";
import { BoardNav } from "@/components/BoardNav";
import { useBoards } from "@/lib/solana/queries";

export default function Home() {
  const { boards, loading } = useBoards();

  return (
    <div
      className="min-h-screen"
      style={{
        background: "url(/fade.png) repeat-x scroll center top #FFFFEE",
      }}
    >
    <main className="max-w-4xl mx-auto p-4">
      {!process.env.NEXT_PUBLIC_PROGRAM_ID && (
        <div className="bg-yellow-900/40 border border-yellow-600 text-yellow-200 p-4 rounded-xl w-full mb-4">
          <p className="font-semibold">Program not configured</p>
          <p className="text-sm opacity-90">
            Missing <code className="font-mono">NEXT_PUBLIC_PROGRAM_ID</code>. UI is live, on-chain actions are disabled until this is set.
          </p>
        </div>
      )}

      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Image
            src="/solchan_logo.webp"
            alt="Solchan"
            width={225}
            height={75}
            className="h-15 w-auto"
          />
          <h1 className="text-2xl font-bold text-[#800000]">Solchan</h1>
        </div>
        <WalletButton />
      </header>

      <BoardNav />

      <p className="text-[#666666] mb-4">
        A decentralized imageboard on Solana. Connect your wallet to browse and post.
      </p>

      <p className="text-sm mb-8">
        <Link href="/rules" className="text-[#800000] hover:underline">
          Rules
        </Link>
        {" "}|{" "}
        <Link href="/faq" className="text-[#800000] hover:underline">
          FAQ
        </Link>
      </p>

      <h2 className="text-xl font-semibold mb-4 text-[#800000]">Boards</h2>

      {loading ? (
        <div className="text-[#666666]">Loading boards...</div>
      ) : boards.length === 0 ? (
        <div className="text-[#666666] p-8 border border-[#D9BFB7] rounded-lg bg-[#F0E0D6] text-center">
          <p>Connect your wallet to view boards.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {boards.map((board) => (
            <Link
              key={board.boardId}
              href={`/${board.name}`}
              className="block p-4 border border-[#D9BFB7] rounded-lg bg-[#F0E0D6] hover:shadow-md transition-shadow"
            >
              <h3 className="text-lg font-bold text-[#800000]">/{board.name}/</h3>
              <p className="text-[#666666] text-sm mt-1">{board.description}</p>
              <p className="text-[#666666] text-xs mt-2">
                {board.threadCount.toString()} threads
              </p>
            </Link>
          ))}
        </div>
      )}
    </main>
    </div>
  );
}
