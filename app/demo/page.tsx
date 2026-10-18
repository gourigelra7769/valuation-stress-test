import type { Metadata } from "next";
import { EducationalDemoClient } from "../../components/EducationalDemoClient";

export const metadata: Metadata = {
  title: "FICTIONAL EDUCATIONAL EXAMPLE — NOT REAL MARKET DATA",
  description: "FICTIONAL EDUCATIONAL EXAMPLE — NOT REAL MARKET DATA. A fictional valuation scenario.",
};

export default function EducationalDemoPage() {
  return <EducationalDemoClient />;
}
