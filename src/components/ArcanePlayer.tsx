"use client";

import Script from "next/script";
import { useCallback, useEffect } from "react";
import {
  ArcanePlayer as ArcanePlayerType,
  getArcane,
  initArcanePlayer,
} from "@/arcane";

export function ArcanePlayer({
  projectId,
  projectKey,
  token,
  onPlayerLoaded,
}: {
  projectId: number;
  projectKey: string;
  token: string;
  onPlayerLoaded?: (arcane: ArcanePlayerType) => void;
}) {
  const handlePlayerLoaded = useCallback(() => {
    console.log("ArcanePlayerLoaded");
    const player = getArcane();
    onPlayerLoaded?.(player);
  }, [onPlayerLoaded]);

  useEffect(() => {
    window.addEventListener("ArcanePlayerLoaded", handlePlayerLoaded);
    return () =>
      window.removeEventListener("ArcanePlayerLoaded", handlePlayerLoaded);
  }, [handlePlayerLoaded]);

  return projectKey && projectId ? (
    <>
      <Script
        type="text/javascript"
        async
        defer
        src={`https://embed.arcanemirage.com/${projectKey}/e`}
        onLoad={() => initArcanePlayer()}
      />
      <main style={{ height: "500px" }}>
        <div
          id="arcane-player"
          data-project-id={projectId}
          data-project-key={projectKey}
          data-idle-timeout="200"
          data-capture-mouse="false"
          data-enable-events-passthrough="true"
          data-hide-ui-controls="true"
          data-autoplay="false"
          data-token={token}
        ></div>
      </main>
    </>
  ) : null;
}
