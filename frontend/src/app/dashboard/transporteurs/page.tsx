import React from "react";
import { Metadata } from "next";
import TransporteursView from "@/components/vtc_app/transporteurs_view";
import Pagination from "@/components/options/pagination";
import { getTransporteurs } from "@/lib/transporteur_action";

export const metadata: Metadata = {
    title: "Transporteurs & Fret - LTC Express",
    description: "Gestion, consultation et création des transporteurs Hilux, Camions et fret de marchandises",
};

type Props = {
    searchParams: Promise<{
        page?: string;
        search?: string;
        wilaya?: string;
        category?: string;
        status?: string;
    }>;
};

export default async function TransporteursPage({ searchParams }: Props) {
    const { page, search, wilaya, category, status } = await searchParams;

    const pageNumber = page ?? "1";
    const searchParam = search ?? "";
    const selectedWilaya = wilaya ?? "";
    const selectedCategory = category ?? "";
    const selectedStatus = status ?? "";

    const data = await getTransporteurs({
        page: pageNumber,
        page_size: "30",
        search: searchParam,
        wilaya: selectedWilaya,
        category: selectedCategory,
        status: selectedStatus,
    });

    const results = data?.results ?? [];
    const totalPages = data?.total_pages ?? 1;
    const statsOverview = data?.stats_overview ?? {
        total: 0,
        online: 0,
        active: 0,
        blocked: 0,
        trash: 0,
        corbeille: 0,
    };

    const queryParams = `search=${encodeURIComponent(searchParam)}&wilaya=${encodeURIComponent(selectedWilaya)}&category=${encodeURIComponent(selectedCategory)}&status=${encodeURIComponent(selectedStatus)}`;

    return (
        <div>
            <TransporteursView
                transporteurs={results}
                statsOverview={statsOverview}
                initialSearch={searchParam}
                initialWilaya={selectedWilaya}
                initialCategory={selectedCategory}
                initialStatus={selectedStatus}
            />
            {totalPages > 1 && (
                <div className="pb-10">
                    <Pagination
                        pages={totalPages}
                        currentPage={Number(pageNumber)}
                        params={queryParams}
                    />
                </div>
            )}
        </div>
    );
}
