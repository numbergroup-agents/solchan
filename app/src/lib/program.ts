import { Program, AnchorProvider, Idl } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import { AnchorWallet } from "@solana/wallet-adapter-react";
import idl from "./solchan.json";

// Browser-compatible helper for writing BigInt as little-endian bytes
// (Buffer.writeBigUInt64LE is not available in browser polyfills)
function writeBigUInt64LE(buffer: Buffer, value: bigint): void {
  for (let i = 0; i < 8; i++) {
    buffer[i] = Number((value >> BigInt(i * 8)) & BigInt(0xff));
  }
}

const programIdString = process.env.NEXT_PUBLIC_PROGRAM_ID;

export const IS_PROGRAM_CONFIGURED = !!programIdString;

export const PROGRAM_ID = IS_PROGRAM_CONFIGURED
  ? new PublicKey(programIdString as string)
  : null;

export function getProgram(connection: Connection, wallet: AnchorWallet) {
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  return new Program(idl as Idl, provider);
}

// PDA derivation helpers
export function getConfigPda(): [PublicKey, number] {
  if (!PROGRAM_ID) throw new Error("PROGRAM_NOT_CONFIGURED");
  return PublicKey.findProgramAddressSync([Buffer.from("config")], PROGRAM_ID);
}

export function getBoardPda(boardId: number): [PublicKey, number] {
  if (!PROGRAM_ID) throw new Error("PROGRAM_NOT_CONFIGURED");
  const boardIdBuffer = Buffer.alloc(1);
  boardIdBuffer.writeUInt8(boardId);
  return PublicKey.findProgramAddressSync(
    [Buffer.from("board"), boardIdBuffer],
    PROGRAM_ID
  );
}

export function getThreadPda(
  boardId: number,
  threadId: bigint
): [PublicKey, number] {
  if (!PROGRAM_ID) throw new Error("PROGRAM_NOT_CONFIGURED");
  const boardIdBuffer = Buffer.alloc(1);
  boardIdBuffer.writeUInt8(boardId);
  const threadIdBuffer = Buffer.alloc(8);
  writeBigUInt64LE(threadIdBuffer, threadId);
  return PublicKey.findProgramAddressSync(
    [Buffer.from("thread"), boardIdBuffer, threadIdBuffer],
    PROGRAM_ID
  );
}

export function getPostPda(
  boardId: number,
  threadId: bigint,
  postId: bigint
): [PublicKey, number] {
  if (!PROGRAM_ID) throw new Error("PROGRAM_NOT_CONFIGURED");
  const boardIdBuffer = Buffer.alloc(1);
  boardIdBuffer.writeUInt8(boardId);
  const threadIdBuffer = Buffer.alloc(8);
  writeBigUInt64LE(threadIdBuffer, threadId);
  const postIdBuffer = Buffer.alloc(8);
  writeBigUInt64LE(postIdBuffer, postId);
  return PublicKey.findProgramAddressSync(
    [Buffer.from("post"), boardIdBuffer, threadIdBuffer, postIdBuffer],
    PROGRAM_ID
  );
}

// Account types
export interface Config {
  authority: PublicKey;
  treasury: PublicKey;
  threadFee: bigint;
  postFee: bigint;
  boardCount: number;
  bump: number;
}

export interface Board {
  boardId: number;
  name: string;
  description: string;
  threadCount: bigint;
  authority: PublicKey;
  bump: number;
}

export interface Thread {
  boardId: number;
  threadId: bigint;
  author: PublicKey;
  title: string;
  content: string;
  postCount: bigint;
  createdAt: bigint;
  bumpedAt: bigint;
  bump: number;
}

export interface Post {
  boardId: number;
  threadId: bigint;
  postId: bigint;
  author: PublicKey;
  content: string;
  createdAt: bigint;
  bump: number;
}
