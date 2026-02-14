export const queryKeys = {
  all: ["solana"] as const,
  boards: () => [...queryKeys.all, "boards"] as const,
  board: (boardId: number) => [...queryKeys.boards(), boardId] as const,
  threads: (boardId: number) => [...queryKeys.all, "threads", boardId] as const,
  thread: (boardId: number, threadId: bigint) =>
    [...queryKeys.threads(boardId), threadId.toString()] as const,
  posts: (boardId: number, threadId: bigint) =>
    [...queryKeys.all, "posts", boardId, threadId.toString()] as const,
};
