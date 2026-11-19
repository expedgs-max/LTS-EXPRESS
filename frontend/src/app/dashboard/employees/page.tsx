import React from "react";
import { Metadata } from "next";
import EmployeesView from "@/components/employee_app/employees_view";
import Pagination from "@/components/options/pagination";
import { getEmployees } from "@/lib/employee_action";

export const metadata: Metadata = {
    title: "Gestion des Employés - LTC Express",
    description: "Administration du personnel, gestion des rôles, permissions, rendement et comptes",
};

type Props = {
    searchParams: Promise<{
        page?: string;
        role?: string;
        search?: string;
        wilaya?: string;
        bloquer?: string;
    }>;
};

export default async function EmployeesPage({ searchParams }: Props) {
    const { page, role, search, wilaya, bloquer } = await searchParams;

    const pageNumber = page ?? "1";
    const selectedRole = role ?? "";
    const searchParam = search ?? "";
    const selectedWilaya = wilaya ?? "";
    const selectedBloquer = bloquer ?? "";

    const data = await getEmployees({
        page: pageNumber,
        page_size: "20",
        role: selectedRole,
        search: searchParam,
        wilaya: selectedWilaya,
        bloquer: selectedBloquer,
    });

    const results = data?.results ?? [];
    const totalPages = data?.total_pages ?? 1;
    const statsOverview = data?.stats_overview ?? {
        total: 0,
        active: 0,
        blocked: 0,
        avg_rendement: 0,
        role_counts: {},
    };

    const queryParams = `role=${encodeURIComponent(selectedRole)}&search=${encodeURIComponent(searchParam)}&wilaya=${encodeURIComponent(selectedWilaya)}&bloquer=${encodeURIComponent(selectedBloquer)}`;

    return (
        <div className="pb-16">
            <EmployeesView
                employees={results}
                statsOverview={statsOverview}
                currentRole={selectedRole}
                currentSearch={searchParam}
                currentWilaya={selectedWilaya}
                currentBloquer={selectedBloquer}
            />

            {totalPages > 1 && (
                <div className="pt-2 pb-10">
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
