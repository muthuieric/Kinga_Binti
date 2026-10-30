import ExplorerClient from "./client";

export const metadata = {
  title: "Narrative explorer — NenoGuard",
  description:
    "Search, filter and export the consented narrative archive.",
  openGraph: {
    title: "Narrative explorer — NenoGuard",
    description:
      "Search, filter and export the consented narrative archive.",
  },
};

export default function Explorer() {
  return <ExplorerClient />;
}