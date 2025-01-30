"use client";

import Script from "next/script";
import { useEffect } from "react";
import { getArcane, initArcanePlayer } from "@/arcane";

export function ArcanePlayer({
  projectId,
  projectKey,
  token,
}: {
  projectId: number;
  projectKey: string;
  token: string;
}) {
  useEffect(() => {
    window.addEventListener("ArcanePlayerLoaded", () => {
      console.log("ArcanePlayerLoaded");
      const player = getArcane();

      player.onReceiveEvent("CustomUIEventResponse", (response) => {
        console.log({ ArcaneResponse: response });
      });

      player.onPlayerEvent("loading", () => {
        console.log("loading");
      });

      player.onPlayerEvent("ready", () => {
        console.log("ready");
      });

      player.onPlayerEvent("afkWarning", () => {
        console.log("afkWarning");
      });

      player.onPlayerEvent("afkWarningDeactivate", () => {
        console.log("afkWarningDeactivate");
      });

      player.onPlayerEvent("afkTimedOut", () => {
        console.log("afkTimedOut");
      });
      // Emit event to Unreal Engine
      player.emitUIEvent("MyCustomEventWithoutData");
      player.emitUIEvent({
        event: "MyCustomEventWithData",
        data: {
          foo: "bar",
        },
      });
      // Receive event from Unreal Engine
      player.onReceiveEvent("CustomUIEventResponse", (response) => {
        console.log({ ArcaneResponse: response });
      });
      // If the response from UE is a json, you'll to set the descriptor
      // of the listener as 'event.' + name or 'cmd.' + name, this response will
      // look like this:
      /*
                {
                    "event": "MyCustomEventWithData",
                    "data": {
                        "foo": "bar"
                    }
                }
            */
      player.onReceiveEvent("event.MyCustomEventWithData", (response) => {
        console.log({ ArcaneResponse: response });
      });
      // For starting the stream programatically call:
      player.play();

      // For entering and exit fullscreen mode, this needs to be called
      // after the user has any interaction with the site (click/touch or via button)
      // or it will fail
      // returns boolean for the current state of fullscreen element
      player.toggleFullscreen();

      // Receive file events, only override them if you don't want to use the default button/progress
      player.onPlayerEvent("fileProgress", (progress: number) => {
        console.log("File download progress:", progress);
      });

      player.onPlayerEvent(
        "fileReceived",
        (data: { file: Blob; extension: string }) => {
          // Do what you need with the blob, for example, create a hidden anchor tag
          // and download automatically
          const a = document.createElement("a");
          a.setAttribute("href", URL.createObjectURL(data.file));
          a.style.display = "none";
          a.setAttribute("download", `received_file.${data.extension}`);
          document.body.append(a);
          a.click();
          a.remove();
        },
      );
    });
  }, []);

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
      <button
        onClick={() => {
          getArcane().emitUIEvent({
            event: "AuthenticateUserResponse",
            data: {
              publicKey: "3FVrkePokrBYhQKthGjpTr8MCsPAymTStHuPCsLZ6SLX",
              message: "Login to Game",
              signature: "...",
            },
          });
        }}
      >
        fire event
      </button>
    </>
  ) : null;
}
