"use client";

import { useCallback } from "react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import "./page.module.css";
import { ArcanePlayer as ArcanePlayerType, getArcane } from "@/arcane";
import { ArcanePlayer } from "@/components/ArcanePlayer";

interface AuthInfo {
  publicKey: string;
  message: string;
  signature: string;
}

export default function Home() {
  const { publicKey, signMessage } = useWallet();

  const getAuthInfo = useCallback(async (): Promise<AuthInfo | null> => {
    if (typeof window === "undefined" || !publicKey || !signMessage)
      return null;

    const auth = JSON.parse(window.localStorage.auth ?? "{}");

    const key = publicKey.toBase58();

    if (!(key in auth)) {
      const message = "Login to Game";
      const signature = await signMessage(Buffer.from(message));
      auth[key] = {
        message,
        signature: Buffer.from(signature).toString("base64"),
      };
      window.localStorage.auth = JSON.stringify(auth);
    }

    return {
      publicKey: key,
      ...auth[key],
    };
  }, [publicKey, signMessage]);

  async function handleAuthenticateUserRequest() {
    console.debug("handing cmd.AuthenticateUserRequest");

    const auth = await getAuthInfo();
    console.log(auth);

    const arcane = getArcane();
    arcane.emitUIEvent({
      event: "AuthenticateUserResponse",
      data: auth,
    });
  }

  function setupArcaneEvents(arcane: ArcanePlayerType) {
    arcane.onReceiveEvent(
      "cmd.AuthenticateUserRequest",
      handleAuthenticateUserRequest,
    );
  }

  return (
    <>
      <div style={{ textAlign: "right" }}>
        <WalletMultiButton />
      </div>

      <ArcanePlayer
        projectId={5499}
        projectKey="bf03dfec-ce02-466b-82af-30e1ce1dc285"
        token="2xtjgipTSLxj"
        onPlayerLoaded={setupArcaneEvents}
      />
    </>
  );
}
