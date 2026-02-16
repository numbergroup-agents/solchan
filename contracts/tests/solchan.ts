import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Solchan } from "../target/types/solchan";
import { PublicKey, SystemProgram, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { expect } from "chai";

describe("solchan", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.solchan as Program<Solchan>;
  const authority = provider.wallet;
  const treasury = Keypair.generate();

  // PDAs
  let configPda: PublicKey;
  let boardPda: PublicKey;
  let threadPda: PublicKey;
  let postPda: PublicKey;

  // Test data
  const threadFee = new anchor.BN(1000); // 0.000001 SOL
  const postFee = new anchor.BN(500);

  before(async () => {
    // Derive config PDA
    [configPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("config")],
      program.programId
    );

    // Fund treasury so it can receive fees (needs rent-exempt minimum)
    const airdropSig = await provider.connection.requestAirdrop(
      treasury.publicKey,
      LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropSig, "confirmed");
  });

  describe("initialize", () => {
    it("initializes the program config", async () => {
      await program.methods
        .initialize(threadFee, postFee)
        .accounts({
          authority: authority.publicKey,
          config: configPda,
          treasury: treasury.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      const config = await program.account.config.fetch(configPda);
      expect(config.authority.toString()).to.equal(authority.publicKey.toString());
      expect(config.treasury.toString()).to.equal(treasury.publicKey.toString());
      expect(config.threadFee.toString()).to.equal(threadFee.toString());
      expect(config.postFee.toString()).to.equal(postFee.toString());
      expect(config.boardCount).to.equal(0);
    });
  });

  describe("create_board", () => {
    it("creates a new board", async () => {
      const config = await program.account.config.fetch(configPda);

      [boardPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("board"), Buffer.from([config.boardCount])],
        program.programId
      );

      await program.methods
        .createBoard("b", "Random board")
        .accounts({
          authority: authority.publicKey,
          config: configPda,
          board: boardPda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      const board = await program.account.board.fetch(boardPda);
      expect(board.boardId).to.equal(0);
      expect(board.name).to.equal("b");
      expect(board.description).to.equal("Random board");
      expect(board.threadCount.toString()).to.equal("0");

      const updatedConfig = await program.account.config.fetch(configPda);
      expect(updatedConfig.boardCount).to.equal(1);
    });

    it("fails with invalid board name (too long)", async () => {
      const config = await program.account.config.fetch(configPda);

      const [newBoardPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("board"), Buffer.from([config.boardCount])],
        program.programId
      );

      try {
        await program.methods
          .createBoard("toolong", "Description")
          .accounts({
            authority: authority.publicKey,
            config: configPda,
            board: newBoardPda,
            systemProgram: SystemProgram.programId,
          })
          .rpc();
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.error.errorCode.code).to.equal("InvalidBoardName");
      }
    });

    it("fails when non-authority tries to create board", async () => {
      const fakeAuthority = Keypair.generate();

      // Airdrop some SOL to the fake authority
      const airdropSig = await provider.connection.requestAirdrop(
        fakeAuthority.publicKey,
        LAMPORTS_PER_SOL
      );
      await provider.connection.confirmTransaction(airdropSig);

      const config = await program.account.config.fetch(configPda);

      const [newBoardPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("board"), Buffer.from([config.boardCount])],
        program.programId
      );

      try {
        await program.methods
          .createBoard("g", "Technology board")
          .accounts({
            authority: fakeAuthority.publicKey,
            config: configPda,
            board: newBoardPda,
            systemProgram: SystemProgram.programId,
          })
          .signers([fakeAuthority])
          .rpc();
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.error.errorCode.code).to.equal("Unauthorized");
      }
    });
  });

  describe("create_thread", () => {
    let user: Keypair;

    before(async () => {
      user = Keypair.generate();
      // Airdrop SOL to user
      const airdropSig = await provider.connection.requestAirdrop(
        user.publicKey,
        5 * LAMPORTS_PER_SOL
      );
      await provider.connection.confirmTransaction(airdropSig, "confirmed");
      // Small delay to ensure funds are available
      await new Promise(resolve => setTimeout(resolve, 500));
    });

    it("creates a new thread on a board", async () => {
      const board = await program.account.board.fetch(boardPda);

      [threadPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("thread"),
          Buffer.from([board.boardId]),
          board.threadCount.toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      const treasuryBalanceBefore = await provider.connection.getBalance(treasury.publicKey);

      await program.methods
        .createThread("First Thread!", "This is the content of the first thread on /b/")
        .accounts({
          author: user.publicKey,
          config: configPda,
          treasury: treasury.publicKey,
          board: boardPda,
          thread: threadPda,
          systemProgram: SystemProgram.programId,
        })
        .signers([user])
        .rpc();

      const thread = await program.account.thread.fetch(threadPda);
      expect(thread.boardId).to.equal(0);
      expect(thread.threadId.toString()).to.equal("0");
      expect(thread.author.toString()).to.equal(user.publicKey.toString());
      expect(thread.title).to.equal("First Thread!");
      expect(thread.content).to.equal("This is the content of the first thread on /b/");
      expect(thread.postCount.toString()).to.equal("0");

      // Check board thread count incremented
      const updatedBoard = await program.account.board.fetch(boardPda);
      expect(updatedBoard.threadCount.toString()).to.equal("1");

      // Check fee was transferred
      const treasuryBalanceAfter = await provider.connection.getBalance(treasury.publicKey);
      expect(treasuryBalanceAfter - treasuryBalanceBefore).to.equal(threadFee.toNumber());
    });

    it("fails with invalid title (empty)", async () => {
      const board = await program.account.board.fetch(boardPda);

      const [newThreadPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("thread"),
          Buffer.from([board.boardId]),
          board.threadCount.toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      try {
        await program.methods
          .createThread("", "Content")
          .accounts({
            author: user.publicKey,
            config: configPda,
            treasury: treasury.publicKey,
            board: boardPda,
            thread: newThreadPda,
            systemProgram: SystemProgram.programId,
          })
          .signers([user])
          .rpc();
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.error.errorCode.code).to.equal("InvalidThreadTitle");
      }
    });

    it("fails with invalid content (empty)", async () => {
      const board = await program.account.board.fetch(boardPda);

      const [newThreadPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("thread"),
          Buffer.from([board.boardId]),
          board.threadCount.toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      try {
        await program.methods
          .createThread("Valid Title", "")
          .accounts({
            author: user.publicKey,
            config: configPda,
            treasury: treasury.publicKey,
            board: boardPda,
            thread: newThreadPda,
            systemProgram: SystemProgram.programId,
          })
          .signers([user])
          .rpc();
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.error.errorCode.code).to.equal("InvalidContent");
      }
    });
  });

  describe("create_post", () => {
    let user: Keypair;

    before(async () => {
      user = Keypair.generate();
      // Airdrop SOL to user
      const airdropSig = await provider.connection.requestAirdrop(
        user.publicKey,
        5 * LAMPORTS_PER_SOL
      );
      await provider.connection.confirmTransaction(airdropSig, "confirmed");
      // Small delay to ensure funds are available
      await new Promise(resolve => setTimeout(resolve, 500));
    });

    it("creates a reply post in a thread", async () => {
      const thread = await program.account.thread.fetch(threadPda);

      [postPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("post"),
          Buffer.from([thread.boardId]),
          thread.threadId.toArrayLike(Buffer, "le", 8),
          thread.postCount.toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      const treasuryBalanceBefore = await provider.connection.getBalance(treasury.publicKey);
      const threadBumpedAtBefore = thread.bumpedAt;

      // Wait a moment to ensure timestamp changes
      await new Promise(resolve => setTimeout(resolve, 1100));

      await program.methods
        .createPost("This is a reply to the thread!")
        .accounts({
          author: user.publicKey,
          config: configPda,
          treasury: treasury.publicKey,
          thread: threadPda,
          post: postPda,
          systemProgram: SystemProgram.programId,
        })
        .signers([user])
        .rpc();

      const post = await program.account.post.fetch(postPda);
      expect(post.boardId).to.equal(0);
      expect(post.threadId.toString()).to.equal("0");
      expect(post.postId.toString()).to.equal("0");
      expect(post.author.toString()).to.equal(user.publicKey.toString());
      expect(post.content).to.equal("This is a reply to the thread!");

      // Check thread post count incremented and bumped
      const updatedThread = await program.account.thread.fetch(threadPda);
      expect(updatedThread.postCount.toString()).to.equal("1");
      expect(updatedThread.bumpedAt.toNumber()).to.be.greaterThanOrEqual(threadBumpedAtBefore.toNumber());

      // Check fee was transferred
      const treasuryBalanceAfter = await provider.connection.getBalance(treasury.publicKey);
      expect(treasuryBalanceAfter - treasuryBalanceBefore).to.equal(postFee.toNumber());
    });

    it("fails with invalid content (empty)", async () => {
      const thread = await program.account.thread.fetch(threadPda);

      const [newPostPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("post"),
          Buffer.from([thread.boardId]),
          thread.threadId.toArrayLike(Buffer, "le", 8),
          thread.postCount.toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      try {
        await program.methods
          .createPost("")
          .accounts({
            author: user.publicKey,
            config: configPda,
            treasury: treasury.publicKey,
            thread: threadPda,
            post: newPostPda,
            systemProgram: SystemProgram.programId,
          })
          .signers([user])
          .rpc();
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.error.errorCode.code).to.equal("InvalidContent");
      }
    });

    it("creates multiple posts in a thread", async () => {
      const thread = await program.account.thread.fetch(threadPda);

      const [secondPostPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("post"),
          Buffer.from([thread.boardId]),
          thread.threadId.toArrayLike(Buffer, "le", 8),
          thread.postCount.toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      await program.methods
        .createPost("Second reply!")
        .accounts({
          author: user.publicKey,
          config: configPda,
          treasury: treasury.publicKey,
          thread: threadPda,
          post: secondPostPda,
          systemProgram: SystemProgram.programId,
        })
        .signers([user])
        .rpc();

      const secondPost = await program.account.post.fetch(secondPostPda);
      expect(secondPost.postId.toString()).to.equal("1");

      const updatedThread = await program.account.thread.fetch(threadPda);
      expect(updatedThread.postCount.toString()).to.equal("2");
    });
  });
});
