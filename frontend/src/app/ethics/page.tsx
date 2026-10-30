import EthicsClient from "./client";

export const metadata = {
  title: "Ethics & consent ledger — NenoGuard",
  description:
    "SHA-256 fingerprinted consent records with right-to-be-forgotten withdrawal.",
  openGraph: {
    title: "Ethics & consent ledger — NenoGuard",
    description:
      "SHA-256 fingerprinted consent records with right-to-be-forgotten withdrawal.",
  },
};

export default function Ethics() {
  return <EthicsClient />;
}