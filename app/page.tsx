import { DashboardClient } from "../components/DashboardClient";
import { loadCompanyRegistry } from "../src/server/company-registry";

export default async function HomePage() {
  const result = await loadCompanyRegistry();
  return <DashboardClient companies={result.companies} rejectedCount={result.rejected.length} />;
}
