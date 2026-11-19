import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ConfirmationCommandes from '@/components/confirmation_app/confirmation_commandes';
import { getConfirmationCommandes } from '@/lib/confirmation_action';
import Pagination from '@/components/options/pagination';

import { cookies } from 'next/headers';

export const metadata: Metadata = {
    title: "Commandes par Wilaya - Confirmation",
    description: "Gestion et diffusion des commandes par code wilaya",
};

type Props = {
    searchParams: Promise<{
        page?: string;
        wilaya?: string;
        status?: string;
        confirmation?: string;
        search?: string;
        date?: string;
    }>;
};

export default async function ConfirmationCommandesPage({ searchParams }: Props) {
    const { page, wilaya, status, confirmation, search, date } = await searchParams;
    const pageNumber = page ?? "1";
    const selectedWilaya = wilaya ?? "";
    const selectedStatus = status ?? "";
    const selectedConfirmation = confirmation ?? "";
    const searchParam = search ?? "";
    const selectedDate = date ?? "";

    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value || "";

    const data = await getConfirmationCommandes({
        page: pageNumber,
        wilaya: selectedWilaya,
        status: selectedStatus,
        confirmation: selectedConfirmation,
        search: searchParam,
        date: selectedDate,
        page_size: "20"
    });

    if (!data) notFound();

    const { result, total_pages } = data;

    const queryParams = `wilaya=${selectedWilaya}&status=${selectedStatus}&confirmation=${selectedConfirmation}&search=${searchParam}&date=${selectedDate}`;

    return (
        <div>
            <ConfirmationCommandes
                commandes={result}
                token={token}
                initialWilaya={selectedWilaya}
                initialStatus={selectedStatus}
                initialConfirmation={selectedConfirmation}
                initialSearch={searchParam}
                initialDate={selectedDate}
            />
            <Pagination
                pages={total_pages}
                currentPage={Number(pageNumber)}
                params={queryParams}
            />
        </div>
    );
}
