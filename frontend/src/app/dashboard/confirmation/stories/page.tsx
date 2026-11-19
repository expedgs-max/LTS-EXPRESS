import React from "react";
import { Metadata } from "next";
import ConfirmationStoriesComponent from "@/components/confirmation_app/confirmation_stories";
import { getConfirmationStories } from "@/lib/confirmation_action";
import Pagination from "@/components/options/pagination";
import { cookies } from "next/headers";

export const metadata: Metadata = {
    title: "Stories Mobile (Style Instagram) - Confirmation",
    description: "Gestion des stories interactives affichées en haut de l'application mobile LTC",
};

type Props = {
    searchParams: Promise<{
        page?: string;
        search?: string;
        status?: string;
    }>;
};

export default async function ConfirmationStoriesPage({ searchParams }: Props) {
    const { page, search, status } = await searchParams;
    const pageNumber = page ?? "1";
    const searchParam = search ?? "";
    const statusParam = status ?? "";

    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value || "";

    const data = await getConfirmationStories({
        page: pageNumber,
        search: searchParam,
        status: statusParam,
        page_size: "20"
    });

    const stories = data?.data ?? [];
    const stats = data?.stats ?? {
        total_stories: 0,
        active_stories: 0,
        expired_stories: 0,
        inactive_stories: 0,
        total_items: 0
    };
    const totalPages = data?.pagination?.total_pages ?? 1;

    return (
        <div>
            <ConfirmationStoriesComponent
                initialStories={stories}
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
                        params={`search=${encodeURIComponent(searchParam)}&status=${encodeURIComponent(statusParam)}`}
                    />
                </div>
            )}
        </div>
    );
}
