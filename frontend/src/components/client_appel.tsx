"use client";

import { userInformation } from '@/lib/tools/store/web_socket';
import React, { useMemo } from 'react';
import AppleCenter from './appel_app/apple_center';
import CenterChef from './chef_app/center_chef';
import { getChefCentre, getCentreAppelComptes, CentreAppelCompte } from '@/lib/call_action';
import Pagination from './options/pagination';
import { useQuery } from '@tanstack/react-query';
import LoadingFirst from './loading';

interface ClientAppelProps {
    page: string;
    search: string;
    type?: string;
    wilaya?: string;
    status?: string;
    groupe?: string;
}

export default function ClientAppel({
    page,
    search,
    type = "all",
    wilaya = "",
    status = "all",
    groupe = ""
}: ClientAppelProps) {
    const { user } = userInformation();

    const fetchFn = async () => {
        if (user?.role === 'centre_appel' || user?.role === 'admin' || user?.role === 'confirmation' || user?.role === 'superviseur') {
            const res = await getCentreAppelComptes({
                page,
                search,
                type,
                wilaya,
                status
            });
            return res || { results: [], total: 0, total_pages: 1 };
        } else {
            const res = await getChefCentre({ page, search });
            return res ? { results: res.result || [], total: res.totalAct || 0, total_pages: Math.ceil((res.totalAct || 0) / 20) } : { results: [], total: 0, total_pages: 1 };
        }
    };

    const { data, isLoading, refetch } = useQuery({
        queryKey: ['appel-data', user?.role, page, search, type, wilaya, status, groupe],
        queryFn: fetchFn,
        enabled: !!user?.role, // prevent premature call
    });

    const totalPages = useMemo(() => {
        if (!data) return 1;
        return data.total_pages || (data.total ? Math.ceil(data.total / 20) : 1);
    }, [data]);

    if (isLoading) return <LoadingFirst />;

    const queryParams = `type=${type}&search=${search}&wilaya=${wilaya}&status=${status}`;

    return (
        <div>
            {user?.role === "centre_appel" || user?.role === "admin" || user?.role === "confirmation" || user?.role === "superviseur" ? (
                <AppleCenter
                    comptes={(data?.results as CentreAppelCompte[]) || []}
                    refresh={refetch}
                    currentType={type}
                    currentSearch={search}
                    currentWilaya={wilaya}
                    currentStatus={status}
                />
            ) : (
                <CenterChef parteners={(data?.results as any) || []} refresh={refetch} />
            )}
            <Pagination
                pages={totalPages}
                currentPage={Number(page)}
                params={queryParams}
                className="w-full px-4 sm:px-8 py-6"
            />
        </div>
    );
}

