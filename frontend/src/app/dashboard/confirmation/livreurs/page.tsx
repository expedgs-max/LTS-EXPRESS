import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ConfirmationLivreurs from '@/components/confirmation_app/confirmation_livreurs';
import { getConfirmationLivreurs } from '@/lib/confirmation_action';
import Pagination from '@/components/options/pagination';

import { cookies } from 'next/headers';

export const metadata: Metadata = {
    title: "État des Livreurs - Confirmation",
    description: "Suivi des livreurs en ligne et hors ligne par wilaya",
};

type Props = {
    searchParams: Promise<{
        page?: string;
        wilaya?: string;
        available?: string;
        search?: string;
    }>;
};

export default async function ConfirmationLivreursPage({ searchParams }: Props) {
    const { page, wilaya, available, search } = await searchParams;
    const pageNumber = page ?? "1";
    const selectedWilaya = wilaya ?? "";
    const selectedAvailable = available ?? "";
    const searchParam = search ?? "";

    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value || "";

    const data = await getConfirmationLivreurs({
        page: pageNumber,
        wilaya: selectedWilaya,
        available: selectedAvailable,
        search: searchParam,
        page_size: "20"
    });

    const result = data?.result ?? [];
    const total_pages = data?.total_pages ?? 1;

    const queryParams = `wilaya=${selectedWilaya}&available=${selectedAvailable}&search=${searchParam}`;

    return (
        <div>
            <ConfirmationLivreurs
                livreurs={result}
                token={token}
                initialWilaya={selectedWilaya}
                initialAvailable={selectedAvailable}
                initialSearch={searchParam}
            />
            <Pagination
                pages={total_pages}
                currentPage={Number(pageNumber)}
                params={queryParams}
                className="w-full px-4 sm:px-8 py-6"
            />
        </div>
    );
}
