import type { Metadata } from "next";
import React from 'react'
import AjouteAgent from "@/components/chef_app/ajoute_agent"


export const metadata: Metadata = {
  title: "Ajouté agent",
  description: "LTC expresst Dashbord",
};

export default async function AjoutAgentPage() {
  return (
    <div>
      <AjouteAgent />
    </div>
  );
}