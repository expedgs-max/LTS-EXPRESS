import React from "react";
import { Metadata } from "next";
import ChauffeursView from "@/components/vtc_app/chauffeurs_view";
import Pagination from "@/components/options/pagination";
import { getVtcChauffeurs } from "@/lib/chauffeur_action";

export const metadata: Metadata = {
    title: "Chauffeurs VTC - LTC Express",
    description: "Gestion, consultation et création des comptes chauffeurs VTC",
};

type Props = {
    searchParams: Promise<{
        page?: string;
        search?: string;
        wilaya?: string;
        status?: string;
        type_vehicule?: string;
    }>;
};

export default async function ChauffeursPage({ searchParams }: Props) {
    const { page, search, wilaya, status, type_vehicule } = await searchParams;

    const pageNumber = page ?? "1";
    const searchParam = search ?? "";
    const selectedWilaya = wilaya ?? "";
    const selectedStatus = status ?? "";
    const selectedTypeVehicule = type_vehicule ?? "";

    const data = await getVtcChauffeurs({
        page: pageNumber,
        page_size: "20",
        search: searchParam,
        wilaya: selectedWilaya,
        status: selectedStatus,
        type_vehicule: selectedTypeVehicule,
    });

    const results = data?.results ?? [];
    const totalPages = data?.total_pages ?? 1;
    const statsOverview = data?.stats_overview ?? {
        total: 0,
        online: 0,
        active: 0,
        blocked: 0,
    };

    const queryParams = `search=${encodeURIComponent(searchParam)}&wilaya=${encodeURIComponent(selectedWilaya)}&status=${encodeURIComponent(selectedStatus)}&type_vehicule=${encodeURIComponent(selectedTypeVehicule)}`;

    return (
        <div>
            <ChauffeursView
                chauffeurs={results}
                statsOverview={statsOverview}
                initialSearch={searchParam}
                initialWilaya={selectedWilaya}
                initialStatus={selectedStatus}
                initialTypeVehicule={selectedTypeVehicule}
            />
            <div className="pb-10">
                <Pagination
                    pages={totalPages}
                    currentPage={Number(pageNumber)}
                    params={queryParams}
                />
            </div>
        </div>
    );
}
