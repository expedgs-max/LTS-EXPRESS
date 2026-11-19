import React from "react";
import { Metadata } from "next";
import ObjectifsGestionComponent from "@/components/gestion_app/objectifs_gestion";
import { getObjectifs } from "@/lib/objectifs_action";

export const metadata: Metadata = {
    title: "Objectifs & Primes Chauffeurs et Livreurs | Tableau de bord",
    description: "Gestion des challenges, objectifs et primes pour les chauffeurs VTC et livreurs Food",
};

export const dynamic = "force-dynamic";

export default async function ObjectifsPage() {
    const data = await getObjectifs();

    return (
        <ObjectifsGestionComponent
            initialObjectifs={data?.objectifs || []}
            initialStats={data?.stats || null}
        />
    );
}
