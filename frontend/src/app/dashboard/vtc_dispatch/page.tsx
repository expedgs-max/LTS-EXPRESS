import React from "react";
import { Metadata } from "next";
import VtcDispatch from "@/components/vtc_app/vtc_dispatch";
import { getVtcChauffeurs } from "@/lib/chauffeur_action";
import { getCourses } from "@/lib/gestion_action";

export const metadata: Metadata = {
    title: "Dispatch VTC & Carte Live - LTC Express",
    description: "Supervision live et localisation géographique des chauffeurs et courses VTC",
};

type Props = {
    searchParams: Promise<{
        wilaya?: string;
    }>;
};

export default async function VtcDispatchPage({ searchParams }: Props) {
    const { wilaya } = await searchParams;
    const selectedWilaya = wilaya ?? "";

    // Prefetch initial data on the server
    const [chauffeursData, coursesData] = await Promise.all([
        getVtcChauffeurs({
            page_size: 200,
            wilaya: selectedWilaya || undefined,
        }),
        getCourses({
            page: "1",
            search: "",
            valide: "",
            wilaya: selectedWilaya,
        }),
    ]);

    const initialChauffeurs = chauffeursData?.results ?? [];
    const initialCourses = coursesData?.result ?? [];

    return (
        <div className="w-full h-full">
            <VtcDispatch
                initialChauffeurs={initialChauffeurs}
                initialCourses={initialCourses}
                initialWilaya={selectedWilaya}
            />
        </div>
    );
}
