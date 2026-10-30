import MapClient from "./client";

export const metadata = {
  title: "Spatial risk map — NenoGuard",
  description:
    "Risk and practice prevalence across the 11 sub-counties of Narok and Kajiado.",
  openGraph: {
    title: "Spatial risk map — NenoGuard",
    description:
      "Risk and practice prevalence across the 11 sub-counties of Narok and Kajiado.",
  },
};

export default function RiskMap() {
  return <MapClient />;
}