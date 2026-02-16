import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Solchan } from "../target/types/solchan";
import { PublicKey } from "@solana/web3.js";

// Boards to create
const BOARDS = [
  { name: "b", description: "Random" },
  { name: "v", description: "Video Games" },
  { name: "a", description: "Anime & Manga" },
  { name: "g", description: "Technology" },
  { name: "k", description: "Weapons" },
  { name: "biz", description: "Business & Finance" },
  { name: "c", description: "Anime/Cute" },
  { name: "fit", description: "Fitness" },
  { name: "sci", description: "Science & Math" },
  { name: "mu", description: "Music" },
  { name: "tv", description: "Television & Film" },
  { name: "sp", description: "Sports" },
  { name: "r9k", description: "ROBOT9001" },
];

// Fee configuration
const THREAD_FEE = new anchor.BN(1000); // 0.000001 SOL
const POST_FEE = new anchor.BN(500);

async function main() {
  // Set up provider from environment
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.solchan as Program<Solchan>;
  const authority = provider.wallet;

  console.log("Solchan Init Script");
  console.log("===================");
  console.log(`Program ID: ${program.programId.toString()}`);
  console.log(`Authority: ${authority.publicKey.toString()}`);
  console.log("");

  // Derive config PDA
  const [configPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    program.programId
  );

  // Step 1: Initialize program config
  console.log("Step 1: Initialize program config");
  try {
    const existingConfig = await program.account.config.fetch(configPda);
    console.log(`  Config already exists (${existingConfig.boardCount} boards)`);
  } catch {
    // Config doesn't exist, initialize it
    console.log("  Initializing config...");
    await program.methods
      .initialize(THREAD_FEE, POST_FEE)
      .accounts({
        authority: authority.publicKey,
        treasury: authority.publicKey, // Use authority as treasury
      })
      .rpc();
    console.log("  Config initialized!");
  }
  console.log("");

  // Step 2: Create boards
  console.log("Step 2: Create boards");
  for (const board of BOARDS) {
    // Get current config to know board count
    const config = await program.account.config.fetch(configPda);
    const boardIndex = config.boardCount;

    // Check if board with this name already exists by checking existing boards
    let alreadyExists = false;
    for (let i = 0; i < boardIndex; i++) {
      const [existingBoardPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("board"), Buffer.from([i])],
        program.programId
      );
      try {
        const existingBoard = await program.account.board.fetch(existingBoardPda);
        if (existingBoard.name === board.name) {
          console.log(`  /${board.name}/ - Already exists (board #${i})`);
          alreadyExists = true;
          break;
        }
      } catch {
        // Board doesn't exist at this index, continue
      }
    }

    if (alreadyExists) {
      continue;
    }

    // Create the board
    try {
      console.log(`  /${board.name}/ - Creating...`);
      await program.methods
        .createBoard(board.name, board.description)
        .accounts({
          authority: authority.publicKey,
        })
        .rpc();
      console.log(`  /${board.name}/ - Created! (board #${boardIndex})`);
    } catch (error: any) {
      console.log(`  /${board.name}/ - Failed: ${error.message || error}`);
    }
  }
  console.log("");

  // Step 3: Summary
  console.log("Summary");
  console.log("-------");
  const finalConfig = await program.account.config.fetch(configPda);
  console.log(`Total boards: ${finalConfig.boardCount}`);
  console.log("");
  console.log("Boards:");
  for (let i = 0; i < finalConfig.boardCount; i++) {
    const [boardPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("board"), Buffer.from([i])],
      program.programId
    );
    try {
      const board = await program.account.board.fetch(boardPda);
      console.log(`  #${i}: /${board.name}/ - ${board.description}`);
    } catch {
      console.log(`  #${i}: (failed to fetch)`);
    }
  }
  console.log("");
  console.log("Done!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
