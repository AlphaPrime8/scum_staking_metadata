use anchor_lang::prelude::*;
use std;
use anchor_lang;
use anchor_spl::token::{Token, TokenAccount};

declare_id!("E6m882zCThfmrDER7CpXVHxEdJovtzjMyvkErdzJhR7B");

// config
const MAX_NFTS_IN_COLLECTION: u64 = 6000;
const STATE_PDA_SEED: &[u8] = b"state";
const NFT_PDA_SEED: &[u8] = b"nft";
// const AUTHORIZED_SIGNER_PUBKEY: &str = "5aWNmcpfP9rUjEFkXFpFaxu6gnpWvBXeHLcxkseP4r8W";

#[program]
pub mod scum_staking_metadata {
    use super::*;

    pub fn init_state_pda(
        ctx: Context<InitStatePda>,
    ) -> ProgramResult {
        ctx.accounts.state_pda.num_nfts_registered = 0;
        ctx.accounts.state_pda.registration_finalized = false;
        Ok(())
    }

    pub fn register_nft(
        ctx: Context<RegisterNft>,
    ) -> ProgramResult {

        // check registration still open
        if ctx.accounts.state_pda.registration_finalized == true {
            return Err(ErrorCode::RegistrationIsClosed.into());
        }

        // check if num nfts registered within limit
        if ctx.accounts.state_pda.num_nfts_registered >= MAX_NFTS_IN_COLLECTION {
            return Err(ErrorCode::TooManyNftsAlreadyRegistered.into());
        }

        ctx.accounts.state_pda.num_nfts_registered += 1;
        ctx.accounts.nft_metadata_pda.is_valid = true;
        Ok(())
    }

    pub fn close_registration(
        ctx: Context<CloseRegistration>,
    ) -> ProgramResult {
        ctx.accounts.state_pda.registration_finalized = true;
        Ok(())
    }

    pub fn reopen_registration(
        ctx: Context<ReopenRegistration>,
    ) -> ProgramResult {
        ctx.accounts.state_pda.registration_finalized = false;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitStatePda<'info> {
    #[account(signer)] //TODO add contraint here so only I can open and close registration
    pub signer: AccountInfo<'info>,
    #[account(
        init,
        seeds = [STATE_PDA_SEED],
        bump,
        payer = signer)]
    pub state_pda: Account<'info, StateAccount>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct RegisterNft<'info> {
    #[account(signer)]
    pub staker: AccountInfo<'info>,
    #[account(mut)]
    pub nft_account: Account<'info, TokenAccount>,
    #[account(
    init,
    seeds = [NFT_PDA_SEED, nft_account.key().as_ref()],
    bump,
    payer = staker)]
    pub nft_metadata_pda: Account<'info, NftMetadata>,
    #[account(
        mut,
        seeds = [STATE_PDA_SEED],
        bump,)]
    pub state_pda: Account<'info, StateAccount>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct CloseRegistration<'info> {
    #[account(signer)] //TODO add contraint here so only I can open and close registration
    pub signer: AccountInfo<'info>,
    #[account(
    mut,
    seeds = [STATE_PDA_SEED],
    bump)]
    pub state_pda: Account<'info, StateAccount>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct ReopenRegistration<'info> {
    #[account(signer)] //TODO add contraint here so only I can open and close registration
    pub signer: AccountInfo<'info>,
    #[account(
    mut,
    seeds = [STATE_PDA_SEED],
    bump)]
    pub state_pda: Account<'info, StateAccount>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

#[account]
#[derive(Default)]
pub struct StateAccount {
    pub num_nfts_registered: u64,
    pub registration_finalized: bool,
}

#[account]
#[derive(Default)]
pub struct NftMetadata {
    pub is_valid: bool,
}

#[error]
pub enum ErrorCode {
    #[msg("Invalid authorized signed")]
    InvalideAuthorizedSigner,
    #[msg("Registration is already closed")]
    RegistrationIsClosed,
    #[msg("Num NFTs registered exceeds collection limit")]
    TooManyNftsAlreadyRegistered,
}
