use anchor_lang::prelude::*;
use anchor_lang::system_program;

declare_id!("9NMwTxHV9UhDUaihnbg4cWqXH7d3VAPP4Dv2J8ZGAi7C");

#[program]
pub mod solchan {
    use super::*;

    /// Initialize the program with config
    pub fn initialize(
        ctx: Context<Initialize>,
        thread_fee: u64,
        post_fee: u64,
    ) -> Result<()> {
        let config = &mut ctx.accounts.config;

        config.authority = ctx.accounts.authority.key();
        config.treasury = ctx.accounts.treasury.key();
        config.thread_fee = thread_fee;
        config.post_fee = post_fee;
        config.board_count = 0;
        config.bump = ctx.bumps.config;

        msg!("Solchan initialized with authority: {}", config.authority);
        Ok(())
    }

    /// Create a new board (admin only)
    pub fn create_board(
        ctx: Context<CreateBoard>,
        name: String,
        description: String,
    ) -> Result<()> {
        require!(
            !name.is_empty() && name.len() <= 4,
            SolchanError::InvalidBoardName
        );
        require!(
            !description.is_empty() && description.len() <= 64,
            SolchanError::InvalidBoardDescription
        );
        require!(
            ctx.accounts.config.board_count < 255,
            SolchanError::MaxBoardsReached
        );

        let config = &mut ctx.accounts.config;
        let board = &mut ctx.accounts.board;

        board.board_id = config.board_count;
        board.name = name;
        board.description = description;
        board.thread_count = 0;
        board.authority = ctx.accounts.authority.key();
        board.bump = ctx.bumps.board;

        config.board_count += 1;

        msg!("Board /{} created with id: {}", board.name, board.board_id);
        Ok(())
    }

    /// Create a new thread on a board
    pub fn create_thread(
        ctx: Context<CreateThread>,
        title: String,
        content: String,
    ) -> Result<()> {
        require!(
            !title.is_empty() && title.len() <= 100,
            SolchanError::InvalidThreadTitle
        );
        require!(
            !content.is_empty() && content.len() <= 2000,
            SolchanError::InvalidContent
        );

        // Transfer fee to treasury
        let fee = ctx.accounts.config.thread_fee;
        if fee > 0 {
            system_program::transfer(
                CpiContext::new(
                    ctx.accounts.system_program.to_account_info(),
                    system_program::Transfer {
                        from: ctx.accounts.author.to_account_info(),
                        to: ctx.accounts.treasury.to_account_info(),
                    },
                ),
                fee,
            )?;
        }

        let clock = Clock::get()?;
        let board = &mut ctx.accounts.board;
        let thread = &mut ctx.accounts.thread;

        thread.board_id = board.board_id;
        thread.thread_id = board.thread_count;
        thread.author = ctx.accounts.author.key();
        thread.title = title;
        thread.content = content;
        thread.post_count = 0;
        thread.created_at = clock.unix_timestamp;
        thread.bumped_at = clock.unix_timestamp;
        thread.bump = ctx.bumps.thread;

        board.thread_count += 1;

        msg!("Thread #{} created on /{}", thread.thread_id, board.name);
        Ok(())
    }

    /// Create a reply post in a thread
    pub fn create_post(ctx: Context<CreatePost>, content: String) -> Result<()> {
        require!(
            !content.is_empty() && content.len() <= 2000,
            SolchanError::InvalidContent
        );

        // Transfer fee to treasury
        let fee = ctx.accounts.config.post_fee;
        if fee > 0 {
            system_program::transfer(
                CpiContext::new(
                    ctx.accounts.system_program.to_account_info(),
                    system_program::Transfer {
                        from: ctx.accounts.author.to_account_info(),
                        to: ctx.accounts.treasury.to_account_info(),
                    },
                ),
                fee,
            )?;
        }

        let clock = Clock::get()?;
        let thread = &mut ctx.accounts.thread;
        let post = &mut ctx.accounts.post;

        post.board_id = thread.board_id;
        post.thread_id = thread.thread_id;
        post.post_id = thread.post_count;
        post.author = ctx.accounts.author.key();
        post.content = content;
        post.created_at = clock.unix_timestamp;
        post.bump = ctx.bumps.post;

        // Bump the thread (update last activity time)
        thread.bumped_at = clock.unix_timestamp;
        thread.post_count += 1;

        msg!("Post #{} created in thread #{}", post.post_id, thread.thread_id);
        Ok(())
    }
}

// ============================================================================
// Account Contexts
// ============================================================================

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = 8 + Config::INIT_SPACE,
        seeds = [b"config"],
        bump
    )]
    pub config: Account<'info, Config>,

    /// CHECK: Treasury account to receive fees
    pub treasury: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(name: String, description: String)]
pub struct CreateBoard<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"config"],
        bump = config.bump,
        constraint = config.authority == authority.key() @ SolchanError::Unauthorized
    )]
    pub config: Account<'info, Config>,

    #[account(
        init,
        payer = authority,
        space = 8 + Board::INIT_SPACE,
        seeds = [b"board", config.board_count.to_le_bytes().as_ref()],
        bump
    )]
    pub board: Account<'info, Board>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(title: String, content: String)]
pub struct CreateThread<'info> {
    #[account(mut)]
    pub author: Signer<'info>,

    #[account(
        seeds = [b"config"],
        bump = config.bump
    )]
    pub config: Account<'info, Config>,

    /// CHECK: Treasury to receive fees
    #[account(
        mut,
        constraint = treasury.key() == config.treasury
    )]
    pub treasury: UncheckedAccount<'info>,

    #[account(
        mut,
        seeds = [b"board", board.board_id.to_le_bytes().as_ref()],
        bump = board.bump
    )]
    pub board: Account<'info, Board>,

    #[account(
        init,
        payer = author,
        space = 8 + Thread::INIT_SPACE,
        seeds = [
            b"thread",
            board.board_id.to_le_bytes().as_ref(),
            board.thread_count.to_le_bytes().as_ref()
        ],
        bump
    )]
    pub thread: Account<'info, Thread>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(content: String)]
pub struct CreatePost<'info> {
    #[account(mut)]
    pub author: Signer<'info>,

    #[account(
        seeds = [b"config"],
        bump = config.bump
    )]
    pub config: Account<'info, Config>,

    /// CHECK: Treasury to receive fees
    #[account(
        mut,
        constraint = treasury.key() == config.treasury
    )]
    pub treasury: UncheckedAccount<'info>,

    #[account(
        mut,
        seeds = [
            b"thread",
            thread.board_id.to_le_bytes().as_ref(),
            thread.thread_id.to_le_bytes().as_ref()
        ],
        bump = thread.bump
    )]
    pub thread: Account<'info, Thread>,

    #[account(
        init,
        payer = author,
        space = 8 + Post::INIT_SPACE,
        seeds = [
            b"post",
            thread.board_id.to_le_bytes().as_ref(),
            thread.thread_id.to_le_bytes().as_ref(),
            thread.post_count.to_le_bytes().as_ref()
        ],
        bump
    )]
    pub post: Account<'info, Post>,

    pub system_program: Program<'info, System>,
}

// ============================================================================
// Account Structures
// ============================================================================

/// Program configuration account
#[account]
#[derive(InitSpace)]
pub struct Config {
    /// Admin who can create boards
    pub authority: Pubkey,
    /// Treasury account receiving fees
    pub treasury: Pubkey,
    /// Fee per thread creation (in lamports)
    pub thread_fee: u64,
    /// Fee per post creation (in lamports)
    pub post_fee: u64,
    /// Total number of boards created
    pub board_count: u8,
    /// Bump seed for PDA
    pub bump: u8,
}

/// Board account - represents a single board like /b/, /g/, /pol/
#[account]
#[derive(InitSpace)]
pub struct Board {
    /// Board ID (0-255)
    pub board_id: u8,
    /// Short name (max 4 chars, e.g., "b", "g", "pol")
    #[max_len(4)]
    pub name: String,
    /// Description (max 64 chars)
    #[max_len(64)]
    pub description: String,
    /// Total threads on this board
    pub thread_count: u64,
    /// Authority who created this board
    pub authority: Pubkey,
    /// Bump seed for PDA
    pub bump: u8,
}

/// Thread account - represents a thread with OP post
#[account]
#[derive(InitSpace)]
pub struct Thread {
    /// Board this thread belongs to
    pub board_id: u8,
    /// Thread ID within the board
    pub thread_id: u64,
    /// Author's wallet address
    pub author: Pubkey,
    /// Thread title (max 100 chars)
    #[max_len(100)]
    pub title: String,
    /// OP post content (max 2000 chars)
    #[max_len(2000)]
    pub content: String,
    /// Number of replies
    pub post_count: u64,
    /// Unix timestamp of creation
    pub created_at: i64,
    /// Unix timestamp of last bump (reply)
    pub bumped_at: i64,
    /// Bump seed for PDA
    pub bump: u8,
}

/// Post account - represents a reply to a thread
#[account]
#[derive(InitSpace)]
pub struct Post {
    /// Board this post belongs to
    pub board_id: u8,
    /// Thread this post belongs to
    pub thread_id: u64,
    /// Post ID within the thread
    pub post_id: u64,
    /// Author's wallet address
    pub author: Pubkey,
    /// Post content (max 2000 chars)
    #[max_len(2000)]
    pub content: String,
    /// Unix timestamp of creation
    pub created_at: i64,
    /// Bump seed for PDA
    pub bump: u8,
}

// ============================================================================
// Errors
// ============================================================================

#[error_code]
pub enum SolchanError {
    #[msg("Board name must be 1-4 characters")]
    InvalidBoardName,
    #[msg("Board description must be 1-64 characters")]
    InvalidBoardDescription,
    #[msg("Thread title must be 1-100 characters")]
    InvalidThreadTitle,
    #[msg("Content must be 1-2000 characters")]
    InvalidContent,
    #[msg("Unauthorized - only admin can perform this action")]
    Unauthorized,
    #[msg("Maximum number of boards reached")]
    MaxBoardsReached,
}
