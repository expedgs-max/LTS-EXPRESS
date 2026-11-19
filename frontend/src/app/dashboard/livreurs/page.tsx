import LivreursList from '@/components/appel_app/livreurs';
import Pagination from '@/components/options/pagination';
import { getValidation } from '@/lib/super_action';
import { getTypeMagasin } from '@/lib/gestion_action';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import React from 'react'

export const metadata: Metadata = {
    title: "Livreurs",
    description: "LTC expresst Dashbord",
};

type props = {
    searchParams: Promise<{ page?: string, search?: string, is_active?: string, wilaya?: string }>;
}

export default async function LivreursPage({ searchParams }: props) {
    const { page, search, is_active, wilaya } = await searchParams;
    const pageNumber = page ?? "1";
    const search_num = search ?? "";
    const active = is_active ?? "";
    const location = wilaya ?? "";

    // 1. Get all account types to find the livreur type ID
    const allTypes = await getTypeMagasin();
    const livreurTypeObj = allTypes?.find(t => t.name.toLowerCase().includes("livreur"));

    // Fallback if type isn't found
    const typeCompteId = livreurTypeObj ? String(livreurTypeObj.id) : "";

    // 2. Fetch partners filtered by type_compte="livreur"
    const data = await getValidation({
        page: pageNumber,
        search: search_num,
        wilaya: location,
        is_active: active,
        groupe: "",
        type_compte: typeCompteId
    });

    if (!data) notFound();

    const { result, totalAct } = data;
    const totalPages = Math.ceil(totalAct / 20);

    return (
        <>
            <LivreursList users={result} />
            <Pagination pages={totalPages} currentPage={Number(pageNumber)} params={`search=${search_num}&wilaya=${location}&is_active=${active}`} />
        </>
    );
}
