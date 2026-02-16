import bs58 from "bs58";

// Browser-compatible helper for writing BigInt as little-endian bytes
// (Buffer.writeBigUInt64LE is not available in browser polyfills)
function writeBigUInt64LE(buffer: Buffer, value: bigint): void {
  for (let i = 0; i < 8; i++) {
    buffer[i] = Number((value >> BigInt(i * 8)) & BigInt(0xff));
  }
}

// Account layout: 8-byte discriminator, then fields
// Thread: discriminator(8) + board_id(1) + thread_id(8) + ...
// Post:   discriminator(8) + board_id(1) + thread_id(8) + post_id(8) + ...

export function buildBoardIdFilter(boardId: number) {
  return {
    memcmp: {
      offset: 8,
      bytes: bs58.encode(Buffer.from([boardId])),
    },
  };
}

export function buildThreadIdFilter(threadId: bigint) {
  const buffer = Buffer.alloc(8);
  writeBigUInt64LE(buffer, threadId);
  return {
    memcmp: {
      offset: 9,
      bytes: bs58.encode(buffer),
    },
  };
}
