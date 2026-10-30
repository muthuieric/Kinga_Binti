import TranslateClient from "./client";

export const metadata = {
  title: "English to Maa translator — NenoGuard",
  description:
    "Draft awareness messages in Maa from English, for review by a Maa speaker.",
  openGraph: {
    title: "English to Maa translator — NenoGuard",
    description: "Draft awareness messages in Maa from English.",
  },
};

export default function Translate() {
  return <TranslateClient />;
}