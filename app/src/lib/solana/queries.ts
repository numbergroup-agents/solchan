"use client";

import { useConnection, useAnchorWallet } from "@solana/wallet-adapter-react";
import { useCallback } from "react";
import { SystemProgram } from "@solana/web3.js";
import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryClient,
} from "@tanstack/react-query";
import {
  getProgram,
  getConfigPda,
  getBoardPda,
  getThreadPda,
  getPostPda,
  Board,
  Thread,
  Post,
} from "../program";
import { queryKeys } from "./keys";
import { buildBoardIdFilter, buildThreadIdFilter } from "./filters";

// Cache TTL constants (in milliseconds)
const BOARDS_STALE_TIME = 5 * 60 * 1000; // 5 minutes
const THREADS_STALE_TIME = 30 * 1000; // 30 seconds
const POSTS_STALE_TIME = 30 * 1000; // 30 seconds

export function useBoards() {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  const { data: boards = [], isLoading: loading } = useQuery<Board[]>({
    queryKey: queryKeys.boards(),
    queryFn: async (): Promise<Board[]> => {
      if (!wallet) return [];

      const program = getProgram(connection, wallet);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const boardAccounts = await (program.account as any).board.all();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const boards: Board[] = boardAccounts.map((account: any) => ({
        boardId: account.account.boardId,
        name: account.account.name,
        description: account.account.description,
        threadCount: BigInt(account.account.threadCount.toString()),
        authority: account.account.authority,
        bump: account.account.bump,
      }));
      return boards.sort((a: Board, b: Board) => a.boardId - b.boardId);
    },
    enabled: !!wallet,
    staleTime: BOARDS_STALE_TIME,
  });

  return { boards, loading };
}

export function useBoard(boardId: number) {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  const { data: board = null, isLoading: loading } = useQuery({
    queryKey: queryKeys.board(boardId),
    queryFn: async () => {
      if (!wallet) return null;

      const program = getProgram(connection, wallet);
      const [boardPda] = getBoardPda(boardId);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const boardAccount = await (program.account as any).board.fetch(boardPda);
      return {
        boardId: boardAccount.boardId,
        name: boardAccount.name,
        description: boardAccount.description,
        threadCount: BigInt(boardAccount.threadCount.toString()),
        authority: boardAccount.authority,
        bump: boardAccount.bump,
      } as Board;
    },
    enabled: !!wallet,
    staleTime: BOARDS_STALE_TIME,
  });

  return { board, loading };
}

export function useThreads(boardId: number) {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  const { data: threads = [], isLoading: loading } = useQuery<Thread[]>({
    queryKey: queryKeys.threads(boardId),
    queryFn: async (): Promise<Thread[]> => {
      if (!wallet) return [];

      const program = getProgram(connection, wallet);
      // Use memcmp filter to fetch only threads for this board
      const threadAccounts = await (
        program.account as any // eslint-disable-line @typescript-eslint/no-explicit-any
      ).thread.all([buildBoardIdFilter(boardId)]);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const threads: Thread[] = threadAccounts.map((account: any) => ({
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

      // Sort by bumpedAt (most recent first)
      return threads.sort((a: Thread, b: Thread) =>
        b.bumpedAt > a.bumpedAt ? 1 : b.bumpedAt < a.bumpedAt ? -1 : 0
      );
    },
    enabled: !!wallet && boardId !== undefined,
    staleTime: THREADS_STALE_TIME,
  });

  return { threads, loading };
}

export function useThread(boardId: number, threadId: bigint) {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  const { data: thread = null, isLoading: loading } = useQuery({
    queryKey: queryKeys.thread(boardId, threadId),
    queryFn: async () => {
      if (!wallet) return null;

      const program = getProgram(connection, wallet);
      const [threadPda] = getThreadPda(boardId, threadId);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const threadAccount = await (program.account as any).thread.fetch(
        threadPda
      );
      return {
        boardId: threadAccount.boardId,
        threadId: BigInt(threadAccount.threadId.toString()),
        author: threadAccount.author,
        title: threadAccount.title,
        content: threadAccount.content,
        postCount: BigInt(threadAccount.postCount.toString()),
        createdAt: BigInt(threadAccount.createdAt.toString()),
        bumpedAt: BigInt(threadAccount.bumpedAt.toString()),
        bump: threadAccount.bump,
      } as Thread;
    },
    enabled: !!wallet,
    staleTime: THREADS_STALE_TIME,
  });

  return { thread, loading };
}

export function usePosts(boardId: number, threadId: bigint) {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  const { data: posts = [], isLoading: loading } = useQuery<Post[]>({
    queryKey: queryKeys.posts(boardId, threadId),
    queryFn: async (): Promise<Post[]> => {
      if (!wallet) return [];

      const program = getProgram(connection, wallet);
      // Use memcmp filters to fetch only posts for this board+thread
      const postAccounts = await (
        program.account as any // eslint-disable-line @typescript-eslint/no-explicit-any
      ).post.all([buildBoardIdFilter(boardId), buildThreadIdFilter(threadId)]);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const posts: Post[] = postAccounts.map((account: any) => ({
        boardId: account.account.boardId,
        threadId: BigInt(account.account.threadId.toString()),
        postId: BigInt(account.account.postId.toString()),
        author: account.account.author,
        content: account.account.content,
        createdAt: BigInt(account.account.createdAt.toString()),
        bump: account.account.bump,
      }));

      // Sort by postId (oldest first)
      return posts.sort((a: Post, b: Post) =>
        a.postId > b.postId ? 1 : a.postId < b.postId ? -1 : 0
      );
    },
    enabled: !!wallet && boardId !== undefined,
    staleTime: POSTS_STALE_TIME,
  });

  return { posts, loading };
}

export function useCreateThread() {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({
      boardId,
      title,
      content,
    }: {
      boardId: number;
      title: string;
      content: string;
    }) => {
      if (!wallet) throw new Error("Wallet not connected");

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
      const configAccount = await (program.account as any).config.fetch(
        configPda
      );

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

      return { tx, threadId: threadCount, boardId };
    },
    onSuccess: (data) => {
      // Invalidate threads list and board (thread count changed)
      queryClient.invalidateQueries({ queryKey: queryKeys.threads(data.boardId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.board(data.boardId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.boards() });
    },
  });

  const createThread = useCallback(
    async (boardId: number, title: string, content: string) => {
      const result = await mutation.mutateAsync({ boardId, title, content });
      return result;
    },
    [mutation]
  );

  return { createThread, loading: mutation.isPending };
}

export function useCreatePost() {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({
      boardId,
      threadId,
      content,
    }: {
      boardId: number;
      threadId: bigint;
      content: string;
    }) => {
      if (!wallet) throw new Error("Wallet not connected");

      const program = getProgram(connection, wallet);
      const [configPda] = getConfigPda();
      const [threadPda] = getThreadPda(boardId, threadId);

      // Get current post count
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const threadAccount = await (program.account as any).thread.fetch(
        threadPda
      );
      const postCount = BigInt(threadAccount.postCount.toString());

      const [postPda] = getPostPda(boardId, threadId, postCount);

      // Get config for treasury
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const configAccount = await (program.account as any).config.fetch(
        configPda
      );

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

      return { tx, postId: postCount, boardId, threadId };
    },
    onSuccess: (data) => {
      // Invalidate posts list and thread (post count/bumpedAt changed)
      queryClient.invalidateQueries({
        queryKey: queryKeys.posts(data.boardId, data.threadId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.thread(data.boardId, data.threadId),
      });
      // Also invalidate threads list (bumpedAt order may have changed)
      queryClient.invalidateQueries({ queryKey: queryKeys.threads(data.boardId) });
    },
  });

  const createPost = useCallback(
    async (boardId: number, threadId: bigint, content: string) => {
      const result = await mutation.mutateAsync({ boardId, threadId, content });
      return result;
    },
    [mutation]
  );

  return { createPost, loading: mutation.isPending };
}

// Functions to fetch current counts (for image upload key generation)
export function useThreadCount(boardId: number) {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  const { data: threadCount = null, refetch } = useQuery({
    queryKey: [...queryKeys.board(boardId), "threadCount"],
    queryFn: async () => {
      if (!wallet) return null;

      const program = getProgram(connection, wallet);
      const [boardPda] = getBoardPda(boardId);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const boardAccount = await (program.account as any).board.fetch(boardPda);
      return BigInt(boardAccount.threadCount.toString());
    },
    enabled: !!wallet,
    staleTime: 0, // Always refetch to get latest count
  });

  return { threadCount, refetch };
}

export function usePostCount(boardId: number, threadId: bigint) {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  const { data: postCount = null, refetch } = useQuery({
    queryKey: [...queryKeys.thread(boardId, threadId), "postCount"],
    queryFn: async () => {
      if (!wallet) return null;

      const program = getProgram(connection, wallet);
      const [threadPda] = getThreadPda(boardId, threadId);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const threadAccount = await (program.account as any).thread.fetch(
        threadPda
      );
      return BigInt(threadAccount.postCount.toString());
    },
    enabled: !!wallet,
    staleTime: 0, // Always refetch to get latest count
  });

  return { postCount, refetch };
}

// Re-export useProgram for compatibility
export { getProgram } from "../program";

// Export QueryClient creator for provider
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: true,
        retry: 2,
      },
    },
  });
}
