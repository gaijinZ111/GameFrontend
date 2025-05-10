import { Connection } from "@solana/web3.js";

export const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL ?? "https://api.devnet.solana.com";
export const connection = new Connection(RPC_URL);

export const TREASURY_WALLET_ADDRESS = "55JcNfJrfxf8AN9ddaYhpwydthyFMj242dVs6N7Ttqmg";
