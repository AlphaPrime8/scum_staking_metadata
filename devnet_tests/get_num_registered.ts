// run with: npx ts-node devnet_tests/metaplex_metadata_validation.ts
import {Keypair, clusterApiUrl, SystemProgram} from "@solana/web3.js";
import {Provider, Wallet, web3} from "@project-serum/anchor";
// const prompt = require('prompt-sync')();
import * as anchor from "@project-serum/anchor";
import {TOKEN_PROGRAM_ID} from "@solana/spl-token";
import {assert} from "chai";
let idl = JSON.parse(require('fs').readFileSync('./target/idl/scum_staking_metadata.json', 'utf8'));
const metaplex = require("@metaplex/js");

// setup
let program_id = 'E6m882zCThfmrDER7CpXVHxEdJovtzjMyvkErdzJhR7B'; // can also load from file as done with localKeypair below
const programId = new anchor.web3.PublicKey(program_id);
const localKeypair = Keypair.fromSecretKey(Buffer.from(JSON.parse(require("fs").readFileSync("/home/myware/.config/solana/devnet.json", {encoding: "utf-8",}))));
let wallet = new Wallet(localKeypair);
let opts = Provider.defaultOptions();
const network = clusterApiUrl('devnet');
let connection = new web3.Connection(network, opts.preflightCommitment);
let provider = new Provider(connection, wallet, opts);
const program = new anchor.Program(idl, programId, provider);

console.log('loaded local wallet: %s', localKeypair.publicKey.toString());
console.log("ProgramID: %s == program.program_id: %s", programId.toString(), program.programId.toString());

async function run_test_1() {

    const STATE_PDA_SEED = "state";
    const [statePda] = await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from(STATE_PDA_SEED)],
        program.programId
    );

    console.log("got state pda: ", statePda.toString());

    const _statePda = await program.account.stateAccount.fetch(statePda);
    const num_registered =  _statePda.numNftsRegistered.toNumber();
    const is_finalized =  _statePda.registrationFinalized;
    console.log("Got num nfts registered: ", num_registered);
    console.log("Got registrationFinalized state: ", is_finalized);

    return num_registered;
}

run_test_1()
    .then(value => {
        console.log("success with value: %s", value);
    })
    .catch(err => {
        console.error("got err: %s", err);
    });






