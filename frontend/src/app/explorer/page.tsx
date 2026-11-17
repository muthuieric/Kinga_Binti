import ExplorerClient from "./client";

export const metadata = {
  title: "Narrative explorer — Kinga Binti",
  description: "Search, filter and export the consented narrative archive.",
  openGraph: {
    title: "Narrative explorer — Kinga Binti",
    description: "Search, filter and export the consented narrative archive.",
  },
};

export default function Explorer() {
  return <ExplorerClient />;
}
