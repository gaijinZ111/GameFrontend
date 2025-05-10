import { NextRequest, NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { prisma } from "@/lib/prisma";
import { connection, TREASURY_WALLET_ADDRESS } from "@/lib/config";

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body || typeof body.signature != "string")
    return NextResponse.json(
      {
        error: "invalid body, expected body.signature to be string",
        body,
      },
      { status: 400 },
    );
  const signature = body.signature;

  let wallet: PublicKey | null = null;
  if (typeof body.wallet != "undefined")
    try {
      wallet = new PublicKey(body.wallet);
    } catch (e) {
      const message = (e as Error)?.message ?? JSON.stringify(e);
      return NextResponse.json(
        {
          error: `body.wallet but could not be parsed as a public key: ${message}`,
          wallet: body.wallet,
        },
        { status: 400 },
      );
    }

  const usedSignature = await prisma.walletActivity.findUnique({
    where: { signature },
  });
  if (usedSignature)
    return NextResponse.json(
      {
        error: `transaction ${signature} already used`,
        signature,
      },
      { status: 409 },
    );

  const transactionInfo = await connection.getTransaction(signature, {
    commitment: "confirmed",
    maxSupportedTransactionVersion: 0,
  });
  if (!transactionInfo)
    return NextResponse.json(
      {
        error: `could not fetch transaction as confirmed: ${signature}`,
        signature,
      },
      { status: 412 },
    );
  const { transaction, meta } = transactionInfo;
  if (!meta)
    return NextResponse.json(
      {
        error: `could not fetch transaction meta for transaction ${signature}`,
        transactionInfo,
      },
      { status: 400 },
    );
  else if (meta.err)
    return NextResponse.json(
      {
        error: `transaction ${signature} failed with error ` + JSON.stringify(
          meta.err,
        ),
        transactionInfo,
      },
      { status: 400 },
    );

  const accountKeys = [
    ...transaction.message.staticAccountKeys,
    ...(meta.loadedAddresses?.writable ?? []),
    ...(meta.loadedAddresses?.readonly ?? []),
  ];
  if (!wallet) wallet = accountKeys[0];
  else if (!accountKeys.find((key) => wallet?.equals(key)))
    return NextResponse.json(
      {
        error: `wallet ${wallet} set but not found in transaction ${signature} keys`,
        wallet,
        signature,
      },
      { status: 403 },
    );

  const treasuryWalletIndex = accountKeys.findIndex(
    (key) => key.toBase58() == TREASURY_WALLET_ADDRESS,
  );
  if (treasuryWalletIndex == -1)
    return NextResponse.json(
      {
        error: `transaction ${signature} does not include treasury address ${TREASURY_WALLET_ADDRESS}`,
        transactionInfo,
      },
      { status: 400 },
    );
  const treasuryBalanceChange =
    BigInt(meta.postBalances[treasuryWalletIndex]) -
    BigInt(meta.preBalances[treasuryWalletIndex]);
  if (treasuryBalanceChange <= 0n)
    return NextResponse.json(
      {
        error: `transaction ${signature} has treasuryBalanceChange <= 0`,
        treasuryBalanceChange,
        transactionInfo,
      },
      { status: 400 },
    );

  const [_, user] = await prisma.$transaction([
    prisma.walletActivity.create({
      select: { signature: true },
      data: {
        signature,
        action: "deposit",
        amount: treasuryBalanceChange,
        user: {
          connectOrCreate: {
            where: { walletAddress: wallet.toBase58() },
            create: {
              walletAddress: wallet.toBase58(),
              balance: treasuryBalanceChange,
            },
          },
        },
      },
    }),
    prisma.user.update({
      where: { walletAddress: wallet.toBase58() },
      data: {
        balance: { increment: treasuryBalanceChange },
      },
      select: { walletAddress: true, balance: true },
    }),
  ]);

  return NextResponse.json({
    ...user,
    balance: user.balance.toString(),
  });
}
