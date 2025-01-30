import Image from "next/image";
import styles from "./page.module.css";
import { ArcanePlayer } from "@/components/ArcanePlayer";

export default function Home() {
  return (
    <ArcanePlayer
      projectId={5104}
      projectKey="4cd8a2f9-4688-48ed-af87-8554e451209f"
      token="12mm9KpgD03P"
    />
  );
}
