import Vtc from '@/components/gestion_app/vtc';
import Pagination from '@/components/options/pagination';
import { getCourses, getChauffeursTaxSummary } from '@/lib/gestion_action';
import { Metadata } from 'next';
import React from 'react'
import { notFound } from 'next/navigation';

export const metadata: Metadata = {
  title: "Courses VTC - Validation",
  description: "Tableau de bord VTC - Validation des courses par chauffeur",
};

type props = {
  searchParams: Promise<{ page?: string, search?: string, valide?: string, wilaya?: string, chauffeur?: string }>;
}

export default async function CoursesPage({ searchParams }: props) {

  const { page, search, valide, wilaya, chauffeur } = await searchParams;
  const pageNumber = page ?? "1";
  const client_num = search ?? "";
  const valide_payment = valide ?? "";
  const city = wilaya ?? "";
  const chauffeur_id = chauffeur ?? "";

  const [data, chauffeurs] = await Promise.all([
    getCourses({ page: pageNumber, search: client_num, valide: valide_payment, wilaya: city, chauffeur: chauffeur_id }),
    getChauffeursTaxSummary({ search: client_num, wilaya: city }),
  ]);

  if (!data) notFound();

  const { result, totalAct } = data;

  const select = result.map(item => ({ ...item, selected: false }));

  const totalPages = Math.ceil(totalAct / 20);

  return (
    <div>
      <Vtc
        promise={select}
        chauffeurs={chauffeurs}
        selectedChauffeurId={chauffeur_id}
        currentWilaya={city}
        currentSearch={client_num}
        currentValide={valide_payment}
      />
      <Pagination
        pages={totalPages}
        currentPage={Number(pageNumber)}
        params={`search=${client_num}&valide=${valide_payment}&wilaya=${city}${chauffeur_id ? `&chauffeur=${chauffeur_id}` : ''}`}
      />
    </div>
  )
}
