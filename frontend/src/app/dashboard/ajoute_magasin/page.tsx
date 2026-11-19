import type { Metadata } from "next";
import React from 'react'
import AjouteMagasin from "@/components/appel_app/ajoute_magasin"

export const metadata: Metadata = {
  title: "Ajouté magasin",
  description: "LTC expresst Dashbord",
};

export default async function AjouteMagasinPage() {
  return (
    <div>
      <AjouteMagasin />
    </div>
  );
}
