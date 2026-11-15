import DashboardClient from "./client";

export const metadata = {
  title: "Analyst dashboard — Kinga Binti",
  description:
    "Early-warning overview of community narratives across Narok and Kajiado.",
  openGraph: {
    title: "Analyst dashboard — Kinga Binti",
    description:
      "Early-warning overview of community narratives across Narok and Kajiado.",
  },
};

export default function Dashboard() {
  return <DashboardClient />;
}