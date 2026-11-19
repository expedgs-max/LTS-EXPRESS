import type { Metadata } from "next";
import React from "react";
import CaisseGlobale from "@/components/caisse_app/caisse_globale";

export const metadata: Metadata = {
  title: "Caisse Globale & Finances - LTC",
  description: "Tableau de bord financier consolidé : VTC, Food, Chiffre d'affaires et Bénéfices LTC",
};

export default function CaissePage() {
  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 pb-16">
      <CaisseGlobale />
    </div>
  );
}