"use client";

import React, { useEffect, useRef, useState } from "react";
import { getDeletedUsers, restoreDeletedUser, CentreAppelCompte } from "@/lib/call_action";
import { FaTrashRestore, FaTrashAlt, FaStore, FaMotorcycle, FaUser, FaPhoneAlt, FaMapMarkerAlt, FaSearch } from "react-icons/fa";
import { MdOutlineClose } from "react-icons/md";
import { TbLoader3 } from "react-icons/tb";
import { useInfiniteQuery } from "@tanstack/react-query";

interface ShowCorbielleProps {
    closeCorbiel: () => void;
    refresh: () => void;
}

export default function ShowCorbielle({ closeCorbiel, refresh }: ShowCorbielleProps) {
    const listRef = useRef<HTMLDivElement | null>(null);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 400);
        return () => clearTimeout(timer);
    }, [search]);

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        refetch
    } = useInfiniteQuery({
        queryKey: ["corbeille", debouncedSearch],
        queryFn: async ({ pageParam = 1 }) => {
            const res = await getDeletedUsers({ search: debouncedSearch, page: pageParam as number, page_size: 20 });
            return res;
        },
        getNextPageParam: (lastPage, allPages) => {
            if (!lastPage || lastPage.results.length === 0) return undefined;
            if (allPages.length >= (lastPage.total_pages ?? 1)) return undefined;
            return allPages.length + 1;
        },
        initialPageParam: 1,
    });

    const handleRestore = async (userId: number, username: string) => {
        const confirmRestore = window.confirm(
            `Voulez-vous vraiment restaurer le profil de « ${username} » depuis la Corbeille ?`
        );
        if (!confirmRestore) return;

        const success = await restoreDeletedUser(userId);
        if (success) {
            refetch();
            refresh();
        }
    };

    const deletedList: CentreAppelCompte[] = data?.pages
        .flatMap((page) => page?.results || [])
        .filter(Boolean) ?? [];

    // Infinite scroll
    useEffect(() => {
        const handleScroll = () => {
            const el = listRef.current;
            if (!el || isFetchingNextPage || !hasNextPage) return;
            const { scrollTop, scrollHeight, clientHeight } = el;
            if (scrollTop + clientHeight >= scrollHeight - 5) {
                fetchNextPage();
            }
        };

        const current = listRef.current;
        current?.addEventListener("scroll", handleScroll);
        return () => current?.removeEventListener("scroll", handleScroll);
    }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
            <div onClick={closeCorbiel} className="fixed inset-0 z-0" />
            <div className="relative z-50 max-w-4xl w-full h-[85vh] rounded-3xl p-6 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col transition-colors">

                {/* Modal Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center text-lg border border-rose-200 dark:border-rose-900/50 shadow-sm">
                            <FaTrashAlt />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                Corbeille des Profils Supprimés
                                <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-semibold border border-rose-200 dark:border-rose-800">
                                    {data?.pages[0]?.total ?? 0} profil(s)
                                </span>
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Comptes supprimés du Centre d&apos;Appel. Vous pouvez les restaurer à tout moment.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={closeCorbiel}
                        className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white flex items-center justify-center transition-colors"
                        title="Fermer"
                    >
                        <MdOutlineClose className="text-xl" />
                    </button>
                </div>

                {/* Search Bar */}
                <div className="mt-4 mb-3">
                    <div className="relative">
                        <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Rechercher par nom, téléphone, username..."
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-400 transition-all"
                        />
                    </div>
                </div>

                {/* Table Content */}
                <div ref={listRef} className="flex-1 overflow-y-auto pr-1">
                    <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                        <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold border-b border-slate-200 dark:border-slate-800 sticky top-0">
                            <tr>
                                <th className="px-5 py-3.5">#ID</th>
                                <th className="px-5 py-3.5">Utilisateur</th>
                                <th className="px-5 py-3.5">Type</th>
                                <th className="px-5 py-3.5">Contact</th>
                                <th className="px-5 py-3.5 text-center">Statut</th>
                                <th className="px-5 py-3.5 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {deletedList.length > 0 ? (
                                deletedList.map((account) => {
                                    const isLivreur = account.account_type === "livreur";
                                    const isMagasin = account.account_type === "magasin";

                                    return (
                                        <tr key={account.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="px-5 py-4 font-bold text-slate-900 dark:text-white text-xs">
                                                #{account.id}
                                            </td>
                                            <td className="px-5 py-4">
                                                <div>
                                                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                                                        {account.first_name || ""} {account.last_name || account.username}
                                                    </p>
                                                    <p className="text-xs text-slate-400">
                                                        @{account.username}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${
                                                    isLivreur
                                                        ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300"
                                                        : isMagasin
                                                        ? "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300"
                                                        : "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300"
                                                }`}>
                                                    {isLivreur && <FaMotorcycle />}
                                                    {isMagasin && <FaStore />}
                                                    {!isLivreur && !isMagasin && <FaUser />}
                                                    {account.type_label || account.account_type}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex flex-col gap-0.5 text-xs text-slate-700 dark:text-slate-300">
                                                    {account.phone && (
                                                        <span className="flex items-center gap-1">
                                                            <FaPhoneAlt className="text-[10px] text-slate-400" />
                                                            {account.phone}
                                                        </span>
                                                    )}
                                                    {account.wilaya && (
                                                        <span className="flex items-center gap-1 text-[11px] text-slate-400">
                                                            <FaMapMarkerAlt className="text-[10px]" />
                                                            {account.wilaya}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-bold rounded-full border border-rose-200 dark:border-rose-800/40">
                                                    🗑 Supprimé
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <button
                                                    onClick={() => handleRestore(account.id, account.username)}
                                                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm shadow-emerald-600/20 transition-all inline-flex items-center gap-1.5"
                                                    title="Restaurer ce profil"
                                                >
                                                    <FaTrashRestore /> Restaurer
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                !isLoading && (
                                    <tr>
                                        <td colSpan={6} className="text-center py-16 text-slate-400">
                                            <FaTrashAlt className="text-3xl mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                                            La corbeille est vide. Aucun profil supprimé.
                                        </td>
                                    </tr>
                                )
                            )}
                        </tbody>
                    </table>

                    {isFetchingNextPage && (
                        <div className="text-center py-4 text-xs text-slate-400 flex items-center justify-center gap-2">
                            <TbLoader3 className="animate-spin text-base" /> Chargement des profils suivants...
                        </div>
                    )}
                </div>

                {/* Loading overlay */}
                {isLoading && (
                    <div className="absolute inset-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xs flex items-center justify-center rounded-3xl gap-2 text-slate-700 dark:text-slate-200 font-semibold text-sm">
                        <TbLoader3 className="animate-spin text-2xl text-rose-600" />
                        Chargement de la corbeille...
                    </div>
                )}
            </div>
        </div>
    );
}