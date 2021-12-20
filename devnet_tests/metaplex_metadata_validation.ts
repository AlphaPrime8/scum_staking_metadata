// run with: npx ts-node devnet_tests/metaplex_metadata_validation.ts
import {Keypair, clusterApiUrl} from "@solana/web3.js";
import {Provider, Wallet, web3} from "@project-serum/anchor";
// const prompt = require('prompt-sync')();
import * as anchor from "@project-serum/anchor";
import {TOKEN_PROGRAM_ID} from "@solana/spl-token";
let idl = JSON.parse(require('fs').readFileSync('./target/idl/scum_staking_metadata.json', 'utf8'));
const metaplex = require("@metaplex/js");

// setup
let program_id = 'HA1LGsASKrSnPiMCy4E6xPy49km8yYVdsvjVZerp71tB'; // can also load from file as done with localKeypair below
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

    //TODO set this up for our single instruction

    const mint = "7NLTcHonB818189d5RcH4kzJGx1MPrE48YjY5RfXmnAm";
    const nftMetadataPda = await metaplex.programs.metadata.Metadata.getPDA(mint);

    console.log("Got nftMetadataPda: %s", nftMetadataPda.toString());

    const tx0 = await program.rpc.validateMetadataProperty(
        {
            accounts: {
                staker: provider.wallet.publicKey,
                nftMetadataPda: nftMetadataPda,
                systemProgram: anchor.web3.SystemProgram.programId,
                tokenProgram: TOKEN_PROGRAM_ID,
            },
        });

    console.log("Got tx id {}", tx0);
}

run_test_1()
    .then(value => {
        console.log("success with value: {}", value);
    })
    .catch(err => {
        console.error("got err: {}", err);
    });

// let response = prompt('Ok we got transaction...continue? ');
// console.log(`Ok... ${response}`);





