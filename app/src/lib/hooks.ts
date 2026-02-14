"use client";

import { useConnection, useAnchorWallet } from "@solana/wallet-adapter-react";
import { useCallback, useEffect, useState } from "react";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import {
  getProgram,
  getConfigPda,
  getBoardPda,
  getThreadPda,
  getPostPda,
  Board,
  Thread,
  Post,
} from "./program";

export function useProgram() {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  if (!wallet) return null;
  return getProgram(connection, wallet);
}


export function useBoards() {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBoards() {
      if (!wallet) {
        setLoading(false);
        return;
      }

      try {
        const program = getProgram(connection, wallet);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const boardAccounts = await (program.account as any).board.all();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const boards = boardAccounts.map((account: any) => ({
          boardId: account.account.boardId,
          name: account.account.name,
          description: account.account.description,
          threadCount: BigInt(account.account.threadCount.toString()),
          authority: account.account.authority,
          bump: account.account.bump,
        }));
        setBoards(boards.sort((a: Board, b: Board) => a.boardId - b.boardId));
      } catch (error) {
        console.error("Error fetching boards:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchBoards();
  }, [connection, wallet]);

  return { boards, loading };
}

export function useBoard(boardId: number) {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const [board, setBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBoard() {
      if (!wallet) {
        setLoading(false);
        return;
      }

      try {
        const program = getProgram(connection, wallet);
        const [boardPda] = getBoardPda(boardId);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const boardAccount = await (program.account as any).board.fetch(boardPda);
        setBoard({
          boardId: boardAccount.boardId,
          name: boardAccount.name,
          description: boardAccount.description,
          threadCount: BigInt(boardAccount.threadCount.toString()),
          authority: boardAccount.authority,
          bump: boardAccount.bump,
        });
      } catch (error) {
        console.error("Error fetching board:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchBoard();
  }, [connection, wallet, boardId]);

  return { board, loading };
}

export function useThreads(boardId: number) {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchThreads() {
      if (!wallet) {
        setLoading(false);
        return;
      }

      try {
        const program = getProgram(connection, wallet);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const threadAccounts = await (program.account as any).thread.all();

        // Filter by boardId
        const filteredThreads = threadAccounts
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .filter((account: any) => account.account.boardId === boardId)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((account: any) => ({
            boardId: account.account.boardId,
            threadId: BigInt(account.account.threadId.toString()),
            author: account.account.author,
            title: account.account.title,
            content: account.account.content,
            postCount: BigInt(account.account.postCount.toString()),
            createdAt: BigInt(account.account.createdAt.toString()),
            bumpedAt: BigInt(account.account.bumpedAt.toString()),
            bump: account.account.bump,
          }));

        // Sort by bumpedAt (most recent first) - compare BigInts directly to avoid overflow
        setThreads(
          filteredThreads.sort((a: Thread, b: Thread) =>
            b.bumpedAt > a.bumpedAt ? 1 : b.bumpedAt < a.bumpedAt ? -1 : 0
          )
        );
      } catch (error) {
        console.error("Error fetching threads:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchThreads();
  }, [connection, wallet, boardId]);

  return { threads, loading };
}

export function useThread(boardId: number, threadId: bigint) {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const [thread, setThread] = useState<Thread | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchThread() {
      if (!wallet) {
        setLoading(false);
        return;
      }

      try {
        const program = getProgram(connection, wallet);
        const [threadPda] = getThreadPda(boardId, threadId);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const threadAccount = await (program.account as any).thread.fetch(threadPda);
        setThread({
          boardId: threadAccount.boardId,
          threadId: BigInt(threadAccount.threadId.toString()),
          author: threadAccount.author,
          title: threadAccount.title,
          content: threadAccount.content,
          postCount: BigInt(threadAccount.postCount.toString()),
          createdAt: BigInt(threadAccount.createdAt.toString()),
          bumpedAt: BigInt(threadAccount.bumpedAt.toString()),
          bump: threadAccount.bump,
        });
      } catch (error) {
        console.error("Error fetching thread:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchThread();
  }, [connection, wallet, boardId, threadId]);

  return { thread, loading };
}

export function usePosts(boardId: number, threadId: bigint) {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPosts() {
      if (!wallet) {
        setLoading(false);
        return;
      }

      try {
        const program = getProgram(connection, wallet);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const postAccounts = await (program.account as any).post.all();

        // Filter by boardId and threadId
        const filteredPosts = postAccounts
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .filter(
            (account: any) =>
              account.account.boardId === boardId &&
              BigInt(account.account.threadId.toString()) === threadId
          )
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((account: any) => ({
            boardId: account.account.boardId,
            threadId: BigInt(account.account.threadId.toString()),
            postId: BigInt(account.account.postId.toString()),
            author: account.account.author,
            content: account.account.content,
            createdAt: BigInt(account.account.createdAt.toString()),
            bump: account.account.bump,
          }));

        // Sort by postId (oldest first) - compare BigInts directly to avoid overflow
        setPosts(
          filteredPosts.sort((a: Post, b: Post) =>
            a.postId > b.postId ? 1 : a.postId < b.postId ? -1 : 0
          )
        );
      } catch (error) {
        console.error("Error fetching posts:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchPosts();
  }, [connection, wallet, boardId, threadId]);

  return { posts, loading };
}

export function useCreateThread() {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const [loading, setLoading] = useState(false);

  const createThread = useCallback(
    async (boardId: number, title: string, content: string) => {
      if (!wallet) throw new Error("Wallet not connected");

      setLoading(true);
      try {
        const program = getProgram(connection, wallet);
        const [configPda] = getConfigPda();
        const [boardPda] = getBoardPda(boardId);

        // Get current thread count
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const boardAccount = await (program.account as any).board.fetch(boardPda);
        const threadCount = BigInt(boardAccount.threadCount.toString());

        const [threadPda] = getThreadPda(boardId, threadCount);

        // Get config for treasury
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const configAccount = await (program.account as any).config.fetch(configPda);

        const tx = await program.methods
          .createThread(title, content)
          .accounts({
            author: wallet.publicKey,
            config: configPda,
            treasury: configAccount.treasury,
            board: boardPda,
            thread: threadPda,
            systemProgram: SystemProgram.programId,
          })
          .rpc();

        return { tx, threadId: threadCount };
      } finally {
        setLoading(false);
      }
    },
    [connection, wallet]
  );

  return { createThread, loading };
}

export function useCreatePost() {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const [loading, setLoading] = useState(false);

  const createPost = useCallback(
    async (boardId: number, threadId: bigint, content: string) => {
      if (!wallet) throw new Error("Wallet not connected");

      setLoading(true);
      try {
        const program = getProgram(connection, wallet);
        const [configPda] = getConfigPda();
        const [threadPda] = getThreadPda(boardId, threadId);

        // Get current post count
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const threadAccount = await (program.account as any).thread.fetch(threadPda);
        const postCount = BigInt(threadAccount.postCount.toString());

        const [postPda] = getPostPda(boardId, threadId, postCount);

        // Get config for treasury
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const configAccount = await (program.account as any).config.fetch(configPda);

        const tx = await program.methods
          .createPost(content)
          .accounts({
            author: wallet.publicKey,
            config: configPda,
            treasury: configAccount.treasury,
            thread: threadPda,
            post: postPda,
            systemProgram: SystemProgram.programId,
          })
          .rpc();

        return { tx, postId: postCount };
      } finally {
        setLoading(false);
      }
    },
    [connection, wallet]
  );

  return { createPost, loading };
}
