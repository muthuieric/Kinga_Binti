import ValidationClient from "./client";

export const metadata = {
  title: "Field validation — Kinga Binti",
  description:
    "Model predictions compared against community annotations: Cohen's Kappa, Macro F1 and confusion matrix.",
  openGraph: {
    title: "Field validation — Kinga Binti",
    description:
      "Model predictions compared against community annotations.",
  },
};

export default function Validation() {
  return <ValidationClient />;
}