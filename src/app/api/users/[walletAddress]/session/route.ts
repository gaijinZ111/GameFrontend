import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ walletAddress: string }> };
async function getWalletAddress({ params }: Params): Promise<string> {
  return (await params).walletAddress;
}

function generateSession(): string {
  return randomBytes(32).toString("hex");
}

export async function POST(request: NextRequest, params: Params) {
  const authHeader = request.headers.get("authorization");
  if (authHeader != `Bearer ${process.env.ADMIN_SECRET}`)
    return NextResponse.json(
      {
        error: "invalid authorization header",
      },
      { status: 403 },
    );

  const walletAddress = await getWalletAddress(params);
  const session = generateSession();

  try {
    await prisma.$transaction([
      // invalidate other sessions
      prisma.userSession.updateMany({
        where: { user: { walletAddress } },
        data: {
          expired: true,
        },
      }),

      // create new session
      prisma.userSession.create({
        data: {
          id: session,
          user: {
            connectOrCreate: {
              where: { walletAddress },
              create: { walletAddress },
            },
          },
        },
      }),
    ]);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "could not create session" },
      { status: 400 },
    );
  }

  return NextResponse.json({
    session,
  });
}
