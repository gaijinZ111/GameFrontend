import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ walletAddress: string }> };
async function getWalletAddress({ params }: Params): Promise<string> {
  return (await params).walletAddress;
}

export async function GET(_: NextRequest, params: Params) {
  const walletAddress = await getWalletAddress(params);

  const user = await prisma.user.findUnique({
    where: { walletAddress },
    select: { balance: true },
  });
  if (!user)
    return NextResponse.json(
      {
        error: `user with wallet address ${walletAddress} not found`,
      },
      { status: 404 },
    );

  return NextResponse.json({
    balance: user.balance.toString(),
  });
}

export async function PATCH(request: NextRequest, params: Params) {
  const sessionId = request.headers.get("x-session");
  if (typeof sessionId != "string")
    return NextResponse.json(
      {
        error: `session token must be string, got: ${sessionId}`,
      },
      { status: 400 },
    );

  const session = await prisma.userSession.findUnique({
    where: { id: sessionId },
    select: {
      expired: true,
      expiresAt: true,
      user: { select: { walletAddress: true } },
    },
  });
  if (!session)
    return NextResponse.json(
      { error: "invalid session token" },
      { status: 401 },
    );
  else if (session.expired)
    return NextResponse.json(
      { error: "session token expired" },
      { status: 401 },
    );
  else if (session.expiresAt.getTime() < Date.now())
    return NextResponse.json(
      { error: `session token expired at ${session.expiresAt.toUTCString()}` },
      { status: 401 },
    );

  const body = await request.json();
  if (!Array.isArray(body))
    return NextResponse.json(
      {
        error: "expected body to be array of operations",
        body,
      },
      { status: 400 },
    );

  const walletAddress = await getWalletAddress(params);
  if (walletAddress != session.user.walletAddress)
    return NextResponse.json(
      {
        error: "incorrect wallet address",
      },
      { status: 403 },
    );

  let balanceDelta = 0n;
  for (let { operation, value } of body) {
    const change = BigInt(value);
    switch (operation) {
      case "add":
        balanceDelta += change;
        break;

      case "subtract":
        balanceDelta -= change;
        break;

      default:
        return NextResponse.json(
          {
            error: `operation must be 'add' or 'subtract', got: ${operation}`,
            body,
          },
          { status: 400 },
        );
    }
  }
  const updateResult = await prisma.user.update({
    where: { walletAddress },
    data: {
      balance: { increment: balanceDelta },
    },
    select: { balance: true },
  });

  return NextResponse.json({ balance: updateResult.balance });
}
