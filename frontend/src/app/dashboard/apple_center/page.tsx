import ClientAppel from "@/components/client_appel";
import type { Metadata } from "next";
import React from 'react';

export const metadata: Metadata = {
  title: "Centre d'Appel - LTC Express",
  description: "Gestion des comptes clients, livreurs et magasins",
};

type Props = {
  searchParams: Promise<{
    page?: string;
    search?: string;
    type?: string;
    wilaya?: string;
    status?: string;
    groupe?: string;
  }>;
};

export default async function ApplePage({ searchParams }: Props) {
  const { page, search, type, wilaya, status, groupe } = await searchParams;
  const pageNumber = page ?? "1";
  const searchParam = search ?? "";
  const typeParam = type ?? "all";
  const wilayaParam = wilaya ?? "";
  const statusParam = status ?? "all";
  const checkGroupe = groupe ?? "";

  return (
    <div>
      <ClientAppel
        page={pageNumber}
        search={searchParam}
        type={typeParam}
        wilaya={wilayaParam}
        status={statusParam}
        groupe={checkGroupe}
      />
    </div>
  );
}

