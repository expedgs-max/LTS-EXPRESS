import type { Metadata } from "next";
import React from 'react'
import AjouteLivreur from "@/components/appel_app/ajoute_livreur"

export const metadata: Metadata = {
  title: "Ajouté livreur",
  description: "LTC expresst Dashbord",
};

export default async function AjouteLivreurPage() {
  return (
    <div>
      <AjouteLivreur />
    </div>
  );
}
