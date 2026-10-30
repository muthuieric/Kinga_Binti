import CaptureClient from "./client";

export const metadata = {
  title: "Capture a narrative — NenoGuard",
  description:
    "Record a consented Swahili or Maa narrative and get an explainable classification.",
  openGraph: {
    title: "Capture a narrative — NenoGuard",
    description:
      "Record a consented Swahili or Maa narrative and get an explainable classification.",
  },
};

export default function Capture() {
  return <CaptureClient />;
}