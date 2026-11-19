"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    FaSearch,
    FaPlus,
    FaPen,
    FaTrash,
    FaMotorcycle,
    FaRoute,
    FaPercentage,
    FaCoins,
    FaSyncAlt,
    FaTag,
    FaInfoCircle,
    FaArrowRight,
    FaCheckCircle,
} from "react-icons/fa";
import { MdDeliveryDining, MdAttachMoney } from "react-icons/md";
import {
    getCommissionsLivreur,
    getLivreurCommissionRate,
} from "@/lib/commission_livreur_action";
import AddCommissionLivreurModal from "../windows/gestion_win/add_commission_livreur_modal";
import ModifyCommissionLivreurModal from "../windows/gestion_win/modify_commission_livreur_modal";
import DeleteCommissionLivreurModal from "../windows/gestion_win/delete_commission_livreur_modal";
import ModifyLivreurRateModal from "../windows/gestion_win/modify_livreur_rate_modal";

type Props = {
    initialCommissions: CommissionLivreur[];
    initialLivreurRate: LivreurCommissionRate | null;
};

export default function CommissionLivreurComponent({
    initialCommissions,
    initialLivreurRate,
}: Props) {
    const router = useRouter();

    const [commissions, setCommissions] = useState<CommissionLivreur[]>(initialCommissions);
    const [livreurRate, setLivreurRate] = useState<LivreurCommissionRate | null>(
        initialLivreurRate
    );
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Search and filter state
    const [searchQuery, setSearchQuery] = useState("");

    // Modals state
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editingCommission, setEditingCommission] = useState<CommissionLivreur | null>(null);
    const [deletingCommission, setDeletingCommission] = useState<CommissionLivreur | null>(null);
    const [isRateModalOpen, setIsRateModalOpen] = useState(false);

    // Filtered commissions
    const filteredCommissions = useMemo(() => {
        const sorted = [...commissions].sort((a, b) => a.km - b.km);
        if (!searchQuery.trim()) return sorted;

        const q = searchQuery.toLowerCase().trim();
        return sorted.filter(
            (item) =>
                String(item.km).includes(q) ||
                String(item.prix).includes(q) ||
                (item.description && item.description.toLowerCase().includes(q))
        );
    }, [commissions, searchQuery]);

    // Statistics calculations
    const stats = useMemo(() => {
        if (commissions.length === 0) {
            return {
                totalTiers: 0,
                minPrice: 0,
                maxPrice: 0,
                maxKm: 0,
                avgKmRatio: "0",
                ratePercent: livreurRate?.tax_tawsile ?? 10,
            };
        }

        const prices = commissions.map((c) => c.prix);
        const kms = commissions.map((c) => c.km);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const maxKm = Math.max(...kms);

        const ratios = commissions
            .filter((c) => c.km > 0)
            .map((c) => c.prix / c.km);
        const avgKmRatio =
            ratios.length > 0
                ? (ratios.reduce((acc, r) => acc + r, 0) / ratios.length).toFixed(1)
                : "0";

        return {
            totalTiers: commissions.length,
            minPrice,
            maxPrice,
            maxKm,
            avgKmRatio,
            ratePercent: livreurRate?.tax_tawsile ?? 10,
        };
    }, [commissions, livreurRate]);

    // Refresh data handler
    const refreshData = async () => {
        setIsRefreshing(true);
        try {
            const [newCommissions, newRate] = await Promise.all([
                getCommissionsLivreur(),
                getLivreurCommissionRate(),
            ]);
            if (newCommissions) setCommissions(newCommissions);
            if (newRate) setLivreurRate(newRate);
        } catch {
            // Error handled in actions
        } finally {
            setIsRefreshing(false);
        }
    };

    return (
        <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-8 animate-fadeIn">
            {/* Top Navigation & Breadcrumb */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        <Link href="/dashboard" className="hover:underline">
                            Dashboard
                        </Link>
                        <span>/</span>
                        <span className="text-slate-600 dark:text-zinc-400">Livraisons</span>
                        <span>/</span>
                        <span className="text-slate-900 dark:text-white font-bold">
                            Commission & Tarifs Livreur
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-2xl shadow-lg shadow-emerald-600/20 text-white">
                            <MdDeliveryDining className="text-2xl" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                                Commission & Tarifs Livreur
                            </h1>
                            <p className="text-sm text-slate-500 dark:text-zinc-400">
                                Configuration des barèmes par palier kilométrique et commissions plateforme pour les livreurs.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Top Action Buttons */}
                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={refreshData}
                        disabled={isRefreshing}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-sm font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-700 shadow-sm transition-all disabled:opacity-50"
                        title="Actualiser les données"
                    >
                        <FaSyncAlt className={`${isRefreshing ? "animate-spin text-emerald-600" : ""}`} />
                        <span>{isRefreshing ? "Actualisation..." : "Actualiser"}</span>
                    </button>

                    <button
                        onClick={() => setIsRateModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-bold shadow-md shadow-amber-500/20 hover:shadow-lg transition-all"
                    >
                        <FaPercentage />
                        <span>Commission Plateforme : {stats.ratePercent}%</span>
                    </button>

                    <button
                        onClick={() => setIsAddOpen(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-600/30 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                        <FaPlus />
                        <span>Nouveau Barème</span>
                    </button>
                </div>
            </div>

            {/* KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Total Paliers */}
                <div className="relative overflow-hidden bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                            Paliers configurés
                        </span>
                        <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
                            <FaRoute className="text-lg" />
                        </div>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-3xl font-black text-slate-900 dark:text-white">
                            {stats.totalTiers}
                        </span>
                        <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
                            barèmes
                        </span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400 dark:text-zinc-500">
                        Paliers de distance actifs
                    </p>
                </div>

                {/* Tarif Minimum */}
                <div className="relative overflow-hidden bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                            Tarif de Base (Min)
                        </span>
                        <div className="p-2.5 bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 rounded-xl">
                            <FaCoins className="text-lg" />
                        </div>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                            {stats.minPrice}
                        </span>
                        <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">
                            DA
                        </span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400 dark:text-zinc-500">
                        Zone courte distance
                    </p>
                </div>

                {/* Tarif Maximum */}
                <div className="relative overflow-hidden bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                            Tarif Max (Longue distance)
                        </span>
                        <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl">
                            <MdAttachMoney className="text-lg" />
                        </div>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-3xl font-black text-amber-600 dark:text-amber-400">
                            {stats.maxPrice}
                        </span>
                        <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">
                            DA
                        </span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400 dark:text-zinc-500">
                        Jusqu'à {stats.maxKm} km
                    </p>
                </div>

                {/* Distance Max */}
                <div className="relative overflow-hidden bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                            Rayon Max Couvert
                        </span>
                        <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl">
                            <FaMotorcycle className="text-lg" />
                        </div>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-3xl font-black text-blue-600 dark:text-blue-400">
                            {stats.maxKm}
                        </span>
                        <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">
                            KM
                        </span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400 dark:text-zinc-500">
                        Distance max configurée
                    </p>
                </div>

                {/* Taux Commission Plateforme */}
                <div className="relative overflow-hidden bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                            Taxe Plateforme (LTC)
                        </span>
                        <div className="p-2.5 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-xl">
                            <FaPercentage className="text-lg" />
                        </div>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-3xl font-black text-purple-600 dark:text-purple-400">
                            {stats.ratePercent}
                        </span>
                        <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">
                            %
                        </span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400 dark:text-zinc-500">
                        Prélèvement par livraison
                    </p>
                </div>
            </div>

            {/* Visual Timeline / Progress of Distance Tiers */}
            {commissions.length > 0 && (
                <div className="bg-gradient-to-r from-emerald-900/10 via-teal-900/10 to-emerald-900/10 dark:from-emerald-950/30 dark:via-teal-950/20 dark:to-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/50 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-sm font-bold text-emerald-800 dark:text-emerald-300">
                            <FaRoute className="text-emerald-600" />
                            <span>Progression des Barèmes par Distance</span>
                        </div>
                        <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">
                            Ordre croissant par palier kilométrique
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                        {[...commissions]
                            .sort((a, b) => a.km - b.km)
                            .map((tier, idx) => (
                                <div
                                    key={tier.id}
                                    className="relative bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm border border-emerald-200/60 dark:border-zinc-700/80 rounded-xl p-3.5 shadow-sm hover:border-emerald-500 transition-all group"
                                >
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                                            Palier {idx + 1}
                                        </span>
                                        <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                                            ≤ {tier.km} km
                                        </span>
                                    </div>
                                    <div className="text-xl font-black text-slate-900 dark:text-white">
                                        {tier.prix.toLocaleString("fr-DZ")}{" "}
                                        <span className="text-xs font-bold text-emerald-600">DA</span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 line-clamp-1 mt-1">
                                        {tier.description || `Jusqu'à ${tier.km} km`}
                                    </p>
                                </div>
                            ))}
                    </div>
                </div>
            )}

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm">
                <div className="relative w-full sm:w-96">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <FaSearch />
                    </div>
                    <input
                        type="text"
                        placeholder="Rechercher par distance, tarif ou description..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-zinc-100 placeholder-slate-400"
                    />
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-zinc-400">
                    <span>Affichage de</span>
                    <span className="font-bold text-slate-800 dark:text-zinc-200">
                        {filteredCommissions.length}
                    </span>
                    <span>sur {commissions.length} paliers</span>
                </div>
            </div>

            {/* Table / Cards View */}
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
                {filteredCommissions.length === 0 ? (
                    <div className="py-16 text-center space-y-3">
                        <div className="w-16 h-16 mx-auto bg-slate-100 dark:bg-zinc-800 text-slate-400 rounded-2xl flex items-center justify-center text-2xl">
                            <FaMotorcycle />
                        </div>
                        <h3 className="text-base font-bold text-slate-800 dark:text-zinc-200">
                            Aucun barème trouvé
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm mx-auto">
                            Aucun palier ne correspond à votre recherche ou aucun barème n'a encore été configuré.
                        </p>
                        <button
                            onClick={() => setIsAddOpen(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 mt-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20"
                        >
                            <FaPlus />
                            <span>Ajouter un premier palier</span>
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-zinc-800/60 border-b border-slate-200 dark:border-zinc-800 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                                    <th className="py-3.5 px-6">ID</th>
                                    <th className="py-3.5 px-6">Distance Maximale</th>
                                    <th className="py-3.5 px-6">Tarif de Livraison</th>
                                    <th className="py-3.5 px-6">Ratio estimé / km</th>
                                    <th className="py-3.5 px-6">Description / Notes</th>
                                    <th className="py-3.5 px-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                                {filteredCommissions.map((tier, index) => {
                                    const ratio = tier.km > 0 ? (tier.prix / tier.km).toFixed(1) : "-";
                                    return (
                                        <tr
                                            key={tier.id}
                                            className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 transition-colors"
                                        >
                                            {/* ID */}
                                            <td className="py-4 px-6 font-mono text-xs text-slate-400">
                                                #{tier.id}
                                            </td>

                                            {/* Distance */}
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="p-2 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-xl">
                                                        <FaRoute />
                                                    </div>
                                                    <div>
                                                        <span className="font-bold text-slate-900 dark:text-white text-base">
                                                            {tier.km}
                                                        </span>
                                                        <span className="text-xs font-semibold text-slate-500 ml-1">
                                                            km
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Prix */}
                                            <td className="py-4 px-6">
                                                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-black text-base rounded-xl border border-emerald-200/50 dark:border-emerald-800/50">
                                                    <span>{tier.prix.toLocaleString("fr-DZ")}</span>
                                                    <span className="text-xs font-semibold">DA</span>
                                                </div>
                                            </td>

                                            {/* Ratio / km */}
                                            <td className="py-4 px-6">
                                                <span className="text-xs font-semibold text-slate-600 dark:text-zinc-400">
                                                    ~{ratio} DA / km
                                                </span>
                                            </td>

                                            {/* Description */}
                                            <td className="py-4 px-6">
                                                <span className="text-xs text-slate-600 dark:text-zinc-300">
                                                    {tier.description || (
                                                        <span className="text-slate-400 italic">Sans description</span>
                                                    )}
                                                </span>
                                            </td>

                                            {/* Actions */}
                                            <td className="py-4 px-6 text-right">
                                                <div className="inline-flex items-center gap-2">
                                                    <button
                                                        onClick={() => setEditingCommission(tier)}
                                                        className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-xl transition-all"
                                                        title="Modifier ce barème"
                                                    >
                                                        <FaPen className="text-sm" />
                                                    </button>
                                                    <button
                                                        onClick={() => setDeletingCommission(tier)}
                                                        className="p-2 text-slate-500 hover:text-red-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition-all"
                                                        title="Supprimer ce barème"
                                                    >
                                                        <FaTrash className="text-sm" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Explanatory Info Card */}
            <div className="p-5 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl border border-slate-200 dark:border-zinc-800 flex items-start gap-4">
                <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-xl shrink-0 mt-0.5">
                    <FaInfoCircle className="text-lg" />
                </div>
                <div className="space-y-1 text-xs text-slate-600 dark:text-zinc-400">
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                        Fonctionnement des barèmes de livraison
                    </h4>
                    <p>
                        Lorsqu'un client passe commande, la distance à vol d'oiseau (formule Haversine) entre le magasin et le client est calculée. Le tarif est automatiquement sélectionné selon le palier kilométrique le plus proche.
                    </p>
                    <p>
                        La taxe de commission plateforme (<span className="font-semibold text-emerald-600 dark:text-emerald-400">{stats.ratePercent}%</span>) est prélevée pour l'entreprise lors du versement et de la clôture des caisses livreurs.
                    </p>
                </div>
            </div>

            {/* Modals */}
            {isAddOpen && (
                <AddCommissionLivreurModal
                    onClose={() => setIsAddOpen(false)}
                    onSuccess={() => {
                        refreshData();
                    }}
                />
            )}

            {editingCommission && (
                <ModifyCommissionLivreurModal
                    commission={editingCommission}
                    onClose={() => setEditingCommission(null)}
                    onSuccess={() => {
                        refreshData();
                    }}
                />
            )}

            {deletingCommission && (
                <DeleteCommissionLivreurModal
                    commission={deletingCommission}
                    onClose={() => setDeletingCommission(null)}
                    onSuccess={() => {
                        refreshData();
                    }}
                />
            )}

            {isRateModalOpen && livreurRate && (
                <ModifyLivreurRateModal
                    rate={livreurRate}
                    onClose={() => setIsRateModalOpen(false)}
                    onSuccess={(newRate, newDesc) => {
                        if (newRate !== undefined) {
                            setLivreurRate((prev) =>
                                prev
                                    ? {
                                          ...prev,
                                          tax_tawsile: newRate,
                                          description: newDesc ?? prev.description,
                                      }
                                    : null
                            );
                        }
                        refreshData();
                    }}
                />
            )}
        </div>
    );
}
