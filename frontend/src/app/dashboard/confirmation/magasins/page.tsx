import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ConfirmationMagasins from '@/components/confirmation_app/confirmation_magasins';
import { getConfirmationMagasins } from '@/lib/confirmation_action';
import Pagination from '@/components/options/pagination';

export const metadata: Metadata = {
    title: "État des Magasins - Confirmation",
    description: "Suivi des magasins ouverts et fermés par wilaya",
};

type Props = {
    searchParams: Promise<{
        page?: string;
        wilaya?: string;
        etat?: string;
        search?: string;
    }>;
};

export default async function ConfirmationMagasinsPage({ searchParams }: Props) {
    const { page, wilaya, etat, search } = await searchParams;
    const pageNumber = page ?? "1";
    const selectedWilaya = wilaya ?? "";
    const selectedEtat = etat ?? "";
    const searchParam = search ?? "";

    const data = await getConfirmationMagasins({
        page: pageNumber,
        wilaya: selectedWilaya,
        etat: selectedEtat,
        search: searchParam,
        page_size: "20"
    });

    if (!data) notFound();

    const { result, total_pages } = data;

    const queryParams = `wilaya=${selectedWilaya}&etat=${selectedEtat}&search=${searchParam}`;

    return (
        <div>
            <ConfirmationMagasins
                magasins={result}
                initialWilaya={selectedWilaya}
                initialEtat={selectedEtat}
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
