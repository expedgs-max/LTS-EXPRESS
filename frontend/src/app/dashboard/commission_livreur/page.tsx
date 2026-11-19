import React from "react";
import { Metadata } from "next";
import CommissionLivreurComponent from "@/components/gestion_app/commission_livreur";
import {
    getCommissionsLivreur,
    getLivreurCommissionRate,
} from "@/lib/commission_livreur_action";

export const metadata: Metadata = {
    title: "Commissions & Tarifs Livreur | Tableau de bord",
    description: "Configuration et gestion des commissions et tarifs de livraison pour les livreurs",
};

export const dynamic = "force-dynamic";

export default async function CommissionLivreurPage() {
    // Fetch commissions and livreur rate in parallel
    const [commissions, livreurRate] = await Promise.all([
        getCommissionsLivreur(),
        getLivreurCommissionRate(),
    ]);

    return (
        <CommissionLivreurComponent
            initialCommissions={commissions || []}
            initialLivreurRate={livreurRate}
        />
    );
}
