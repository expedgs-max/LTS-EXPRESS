import React from "react";
import { Metadata } from "next";
import ConfirmationPromoComponent from "@/components/confirmation_app/confirmation_promo";
import { getConfirmationPromos } from "@/lib/confirmation_action";
import Pagination from "@/components/options/pagination";
import { cookies } from "next/headers";

export const metadata: Metadata = {
    title: "Codes Promo & Parrainage - Confirmation",
    description: "Gestion des codes promo et consultation des utilisateurs",
};

type Props = {
    searchParams: Promise<{
        page?: string;
        search?: string;
    }>;
};

export default async function ConfirmationPromoPage({ searchParams }: Props) {
    const { page, search } = await searchParams;
    const pageNumber = page ?? "1";
    const searchParam = search ?? "";

    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value || "";

    const data = await getConfirmationPromos({
        page: pageNumber,
        search: searchParam,
        page_size: "20"
    });

    const promos = data?.data ?? [];
    const stats = data?.stats ?? {
        total_promos: 0,
        total_revenue: 0,
        total_users_used: 0,
        avg_percentage: 0
    };
    const totalPages = data?.pagination?.total_pages ?? 1;

    return (
        <div>
            <ConfirmationPromoComponent
                initialPromos={promos}
                initialStats={stats}
                token={token}
                initialSearch={searchParam}
                currentPage={Number(pageNumber)}
                totalPages={totalPages}
            />
            {totalPages > 1 && (
                <div className="py-4">
                    <Pagination
                        pages={totalPages}
                        currentPage={Number(pageNumber)}
                        params={`search=${encodeURIComponent(searchParam)}`}
                    />
                </div>
            )}
        </div>
    );
}
