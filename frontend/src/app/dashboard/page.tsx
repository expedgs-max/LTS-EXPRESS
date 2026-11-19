import type { Metadata } from "next";
import Dashboard from "@/components/dashboard/dashboard";
import { GetStatic } from "@/lib/actions";
import { getConfirmationStats } from "@/lib/confirmation_action";

export const metadata: Metadata = {
  title: "Dashboard - LTC Express",
  description: "Tableau de bord et supervision",
};

export default async function DashbordPage() {
  const [staticData, confirmationStats] = await Promise.all([
    GetStatic(),
    getConfirmationStats(),
  ]);

  return (
    <div>
      <Dashboard data={staticData} initialConfirmationStats={confirmationStats} />
    </div>
  );
}
