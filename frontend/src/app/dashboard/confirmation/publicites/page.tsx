import React from "react";
import { Metadata } from "next";
import ConfirmationPublicitesComponent from "@/components/confirmation_app/confirmation_publicites";
import { getConfirmationPublicites } from "@/lib/confirmation_action";
import Pagination from "@/components/options/pagination";
import { cookies } from "next/headers";

export const metadata: Metadata = {
    title: "Publicités & Bannières Mobile - Confirmation",
    description: "Gestion des bannières publicitaires affichées sur l'accueil de l'application mobile LTC",
};

type Props = {
    searchParams: Promise<{
        page?: string;
        search?: string;
        status?: string;
        wilaya?: string;
    }>;
};

export default async function ConfirmationPublicitesPage({ searchParams }: Props) {
    const { page, search, status, wilaya } = await searchParams;
    const pageNumber = page ?? "1";
    const searchParam = search ?? "";
    const statusParam = status ?? "";
    const wilayaParam = wilaya ?? "";

    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value || "";

    const data = await getConfirmationPublicites({
        page: pageNumber,
        search: searchParam,
        status: statusParam,
        wilaya: wilayaParam,
        page_size: "20"
    });

    const publicites = data?.data ?? [];
    const stats = data?.stats ?? {
        total_publicites: 0,
        active_publicites: 0,
        expired_publicites: 0,
        inactive_publicites: 0,
        total_magasins_linked: 0
    };
    const totalPages = data?.pagination?.total_pages ?? 1;

    return (
        <div>
            <ConfirmationPublicitesComponent
                initialPublicites={publicites}
                initialStats={stats}
                token={token}
                initialSearch={searchParam}
                currentPage={Number(pageNumber)}
                totalPages={totalPages}
            />
            {totalPages > 1 && (
                <div className="py-4 px-6">
                    <Pagination
                        pages={totalPages}
                        currentPage={Number(pageNumber)}
                        params={`search=${encodeURIComponent(searchParam)}&status=${encodeURIComponent(statusParam)}&wilaya=${encodeURIComponent(wilayaParam)}`}
                    />
                </div>
            )}
        </div>
    );
}
