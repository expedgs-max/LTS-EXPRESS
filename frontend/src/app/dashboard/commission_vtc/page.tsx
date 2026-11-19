import React from "react";
import { Metadata } from "next";
import CommissionVtcComponent from "@/components/gestion_app/commission_vtc";
import {
    getCommissionsVTC,
    getChauffeurCommissionRate,
    getTypeCourses,
} from "@/lib/commission_vtc_action";

export const metadata: Metadata = {
    title: "Commissions & Tarifs VTC | Tableau de bord",
    description: "Configuration et lecture des commissions et tarifs VTC",
};

export const dynamic = "force-dynamic";

export default async function CommissionVTCPage() {
    // Fetch commissions, chauffeur rate and type courses in parallel
    const [commissions, chauffeurRate, typeCourses] = await Promise.all([
        getCommissionsVTC(),
        getChauffeurCommissionRate(),
        getTypeCourses(),
    ]);

    return (
        <CommissionVtcComponent
            initialCommissions={commissions || []}
            initialChauffeurRate={chauffeurRate}
            initialTypeCourses={typeCourses || []}
        />
    );
}
