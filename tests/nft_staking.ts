import * as anchor from "@project-serum/anchor";
import { Program, BN, IdlAccounts } from "@project-serum/anchor";
import { PublicKey, Keypair, SystemProgram, Account, AccountInfo } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, Token } from "@solana/spl-token";
import { assert } from "chai";
import { ScumStakingMetadata } from '../target/types/scum_staking_metadata';
import {stat} from "fs";

describe("scum_staking_metadata", () => {

  const provider = anchor.Provider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.ScumStakingMetadata as Program<ScumStakingMetadata>;

  const STATE_PDA_SEED = "state";
  const NFT_PDA_SEED = "nft";

  let mintA: Token = null;
  let mintB: Token = null;
  let nftAccount: PublicKey = null;
  let nftAccountB: PublicKey = null;
  let statePda: PublicKey = null;
  let nftMetadataPda: PublicKey = null;
  let nftMetadataPdaB: PublicKey = null;

  //
  const payer = Keypair.generate();
  const mintAuthority = Keypair.generate();

  it("Create test accounts", async () => {
    // Airdropping tokens to a payer.
    await provider.connection.confirmTransaction(
        await provider.connection.requestAirdrop(payer.publicKey, 10000000000),
        "confirmed"
    );

    mintA = await Token.createMint(
        provider.connection,
        payer,
        mintAuthority.publicKey,
        null,
        0,
        TOKEN_PROGRAM_ID
    );

    nftAccount = await mintA.createAccount(
        provider.wallet.publicKey
    );

    mintB = await Token.createMint(
        provider.connection,
        payer,
        mintAuthority.publicKey,
        null,
        0,
        TOKEN_PROGRAM_ID
    );

    nftAccountB = await mintB.createAccount(
        provider.wallet.publicKey
    );

    await mintA.mintTo(
        nftAccount,
        mintAuthority.publicKey,
        [mintAuthority],
        1
    );

    await mintB.mintTo(
        nftAccountB,
        mintAuthority.publicKey,
        [mintAuthority],
        1
    );

    let _initializerTokenAccountA = await mintA.getAccountInfo(
        nftAccount
    );

    assert.ok(_initializerTokenAccountA.amount.toNumber() == 1);

  });

  it("Init State Account", async () => {

    [statePda] = await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from(STATE_PDA_SEED)],
        program.programId
    );

    await program.rpc.initStatePda(
        {
          accounts: {
            signer: provider.wallet.publicKey,
            statePda: statePda,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
          },
        }
    );

    // lookup and deserialize stake account
    const _statePda = await program.account.stateAccount.fetch(statePda);
    assert.ok(_statePda.numNftsRegistered.toNumber() == 0);
    assert.ok(_statePda.registrationFinalized === false);
  });

  it("Register NFT", async () => {

    [nftMetadataPda] = await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from(NFT_PDA_SEED), nftAccount.toBuffer()],
        program.programId
    );

    [nftMetadataPdaB] = await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from(NFT_PDA_SEED), nftAccountB.toBuffer()],
        program.programId
    );


    await program.rpc.registerNft(
        {
          accounts: {
            staker: provider.wallet.publicKey,
            nftAccount: nftAccount,
            nftMetadataPda: nftMetadataPda,
            statePda: statePda,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
          },
          instructions: [
              program.instruction.registerNft(
                  {
                    accounts: {
                      staker: provider.wallet.publicKey,
                      nftAccount: nftAccountB,
                      nftMetadataPda: nftMetadataPdaB,
                      statePda: statePda,
                      systemProgram: SystemProgram.programId,
                      tokenProgram: TOKEN_PROGRAM_ID,
                    }
                  }
              )
          ]
        }
    );

    const _statePda = await program.account.stateAccount.fetch(statePda);
    assert.ok(_statePda.numNftsRegistered.toNumber() == 2);

    const _nftMetadataPda = await program.account.nftMetadata.fetch(nftMetadataPda);
    assert.ok(_nftMetadataPda.isValid === true);

  });

  it("Close registration", async () => {
    await program.rpc.closeRegistration(
        {
          accounts: {
            signer: provider.wallet.publicKey,
            statePda: statePda,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
          },
        }
    );

    // lookup and deserialize stake account
    const _statePda = await program.account.stateAccount.fetch(statePda);
    assert.ok(_statePda.registrationFinalized === true);


  });
});
