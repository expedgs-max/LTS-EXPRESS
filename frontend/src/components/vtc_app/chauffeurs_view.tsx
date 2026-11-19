"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    FaTaxi,
    FaUserPlus,
    FaSearch,
    FaFilter,
    FaCar,
    FaStar,
    FaBan,
    FaCheckCircle,
    FaThLarge,
    FaThList,
    FaIdCard,
    FaRedo,
    FaMapMarkerAlt,
    FaRoute,
    FaEdit
} from "react-icons/fa";
import { VtcChauffeur, toggleVtcChauffeurStatus } from "@/lib/chauffeur_action";
import { Wilaya } from "@/lib/tools/named";
import ChauffeurCreateModal from "./chauffeur_create_modal";
import ChauffeurDetailModal from "./chauffeur_detail_modal";
import ChauffeurEditModal from "./chauffeur_edit_modal";

interface ChauffeursViewProps {
    chauffeurs: VtcChauffeur[];
    statsOverview?: {
        total: number;
        online: number;
        active: number;
        blocked: number;
    };
    initialSearch?: string;
    initialWilaya?: string;
    initialStatus?: string;
    initialTypeVehicule?: string;
}

export default function ChauffeursView({
    chauffeurs,
    statsOverview = { total: 0, online: 0, active: 0, blocked: 0 },
    initialSearch = "",
    initialWilaya = "",
    initialStatus = "",
    initialTypeVehicule = ""
}: ChauffeursViewProps) {
    const router = useRouter();
    const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedChauffeur, setSelectedChauffeur] = useState<VtcChauffeur | null>(null);
    const [editingChauffeur, setEditingChauffeur] = useState<VtcChauffeur | null>(null);

    // Fast search / filter form states
    const [search, setSearch] = useState(initialSearch);
    const [wilaya, setWilaya] = useState(initialWilaya);
    const [status, setStatus] = useState(initialStatus);
    const [typeVehicule, setTypeVehicule] = useState(initialTypeVehicule);

    const applyFilters = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const params = new URLSearchParams();
        if (search) params.set("search", search);
        if (wilaya) params.set("wilaya", wilaya);
        if (status) params.set("status", status);
        if (typeVehicule) params.set("type_vehicule", typeVehicule);
        router.push(`/dashboard/chauffeurs?${params.toString()}`);
    };

    const handleResetFilters = () => {
        setSearch("");
        setWilaya("");
        setStatus("");
        setTypeVehicule("");
        router.push("/dashboard/chauffeurs");
    };

    const handleQuickToggleBlock = async (chauffeur: VtcChauffeur, e: React.MouseEvent) => {
        e.stopPropagation();
        const action = chauffeur.is_blocked ? "unblock" : "block";
        await toggleVtcChauffeurStatus(chauffeur.id, action);
        router.refresh();
    };

    return (
        <div className="py-6 px-4 sm:px-8 max-w-7xl mx-auto text-slate-900 dark:text-slate-100">
            {/* Top Breadcrumb & Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6">
                <div>
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-1">
                        <Link href="/dashboard" className="hover:text-amber-500 font-medium">Tableau de bord</Link>
                        <span>/</span>
                        <span className="text-slate-700 dark:text-slate-300 font-semibold">VTC</span>
                        <span>/</span>
                        <span className="text-amber-600 dark:text-amber-400 font-bold">Chauffeurs</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
                        <FaTaxi className="text-amber-500 text-3xl" /> Gestion des Chauffeurs VTC
                    </h1>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-2xl shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2"
                    >
                        <FaUserPlus className="text-sm" /> Nouveau Chauffeur VTC
                    </button>
                </div>
            </div>

            {/* KPI Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center text-xl font-bold">
                        <FaTaxi />
                    </div>
                    <div>
                        <span className="text-xs text-slate-400 font-medium">Total Chauffeurs</span>
                        <h3 className="text-2xl font-black text-slate-800 dark:text-white">{statsOverview.total}</h3>
                    </div>
                </div>

                <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-xl font-bold relative">
                        <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping absolute" />
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 relative" />
                    </div>
                    <div>
                        <span className="text-xs text-slate-400 font-medium">En Ligne Actuellement</span>
                        <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{statsOverview.online}</h3>
                    </div>
                </div>

                <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center text-xl font-bold">
                        <FaCheckCircle />
                    </div>
                    <div>
                        <span className="text-xs text-slate-400 font-medium">Comptes Actifs</span>
                        <h3 className="text-2xl font-black text-blue-600 dark:text-blue-400">{statsOverview.active}</h3>
                    </div>
                </div>

                <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center text-xl font-bold">
                        <FaBan />
                    </div>
                    <div>
                        <span className="text-xs text-slate-400 font-medium">Comptes Bloqués</span>
                        <h3 className="text-2xl font-black text-red-600 dark:text-red-400">{statsOverview.blocked}</h3>
                    </div>
                </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-sm border border-slate-200/80 dark:border-slate-800 mb-6">
                <form onSubmit={applyFilters} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    {/* Search */}
                    <div className="relative lg:col-span-2">
                        <FaSearch className="absolute left-3.5 top-3.5 text-slate-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Nom, username, tél, matricule, marque..."
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs sm:text-sm outline-none focus:ring-2 focus:ring-amber-500"
                        />
                    </div>

                    {/* Wilaya Filter */}
                    <div>
                        <select
                            value={wilaya}
                            onChange={(e) => setWilaya(e.target.value)}
                            className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs sm:text-sm outline-none focus:ring-2 focus:ring-amber-500"
                        >
                            <option value="">Toutes les Wilayas</option>
                            {Wilaya.map((w) => (
                                <option key={w.id} value={w.name}>
                                    {w.id} - {w.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Status Filter */}
                    <div>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs sm:text-sm outline-none focus:ring-2 focus:ring-amber-500"
                        >
                            <option value="">Tous les statuts</option>
                            <option value="online">🟢 En ligne</option>
                            <option value="active">🔵 Actif</option>
                            <option value="offline">⚪ Hors ligne</option>
                            <option value="blocked">🔴 Bloqué</option>
                        </select>
                    </div>

                    {/* Type Véhicule Filter */}
                    <div>
                        <select
                            value={typeVehicule}
                            onChange={(e) => setTypeVehicule(e.target.value)}
                            className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs sm:text-sm outline-none focus:ring-2 focus:ring-amber-500"
                        >
                            <option value="">Tous les véhicules</option>
                            <option value="Classique">Classique</option>
                            <option value="Comfort">Comfort</option>
                            <option value="Black">Black (Luxe)</option>
                            <option value="XXL">XXL (7 Places)</option>
                            <option value="Moto">Moto</option>
                            <option value="Utilitaire">Utilitaire</option>
                        </select>
                    </div>
                </form>

                {/* Filter Actions & View Mode Toggle */}
                <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => applyFilters()}
                            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
                        >
                            <FaFilter className="text-xs" /> Filtrer les résultats
                        </button>
                        {(search || wilaya || status || typeVehicule) && (
                            <button
                                type="button"
                                onClick={handleResetFilters}
                                className="px-3 py-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium flex items-center gap-1 transition-colors"
                            >
                                <FaRedo className="text-xs" /> Réinitialiser
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-slate-400 font-medium hidden sm:inline">Affichage :</span>
                        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                            <button
                                onClick={() => setViewMode("grid")}
                                className={`p-2 rounded-lg transition-all ${
                                    viewMode === "grid"
                                        ? "bg-white dark:bg-slate-900 text-amber-500 shadow-sm"
                                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                }`}
                                title="Vue Grille"
                            >
                                <FaThLarge />
                            </button>
                            <button
                                onClick={() => setViewMode("table")}
                                className={`p-2 rounded-lg transition-all ${
                                    viewMode === "table"
                                        ? "bg-white dark:bg-slate-900 text-amber-500 shadow-sm"
                                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                }`}
                                title="Vue Tableau"
                            >
                                <FaThList />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Chauffeurs List Content */}
            {chauffeurs.length === 0 ? (
                <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800">
                    <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-500 flex items-center justify-center text-3xl mx-auto mb-4">
                        <FaTaxi />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">Aucun chauffeur VTC trouvé</h3>
                    <p className="text-xs text-slate-400 max-w-md mx-auto mb-5">
                        Aucun compte chauffeur ne correspond à vos filtres actuels. Modifiez les critères ou créez un nouveau chauffeur.
                    </p>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl transition-all shadow-md inline-flex items-center gap-2"
                    >
                        <FaUserPlus /> Créer un nouveau chauffeur
                    </button>
                </div>
            ) : viewMode === "grid" ? (
                /* GRID VIEW */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {chauffeurs.map((chauffeur) => {
                        const veh = chauffeur.vehicule;
                        return (
                            <div
                                key={chauffeur.id}
                                onClick={() => setSelectedChauffeur(chauffeur)}
                                className="group p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-amber-500/50 shadow-sm hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between"
                            >
                                <div>
                                    {/* Top Card Row */}
                                    <div className="flex items-start justify-between gap-3 mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-white font-bold flex items-center justify-center text-lg shadow-md group-hover:scale-105 transition-transform">
                                                    {chauffeur.full_name ? chauffeur.full_name.charAt(0).toUpperCase() : "C"}
                                                </div>
                                                {chauffeur.is_available && (
                                                    <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 animate-pulse" />
                                                )}
                                            </div>

                                            <div>
                                                <h4 className="font-bold text-base text-slate-900 dark:text-white line-clamp-1 group-hover:text-amber-500 transition-colors">
                                                    {chauffeur.full_name || chauffeur.username}
                                                </h4>
                                                <p className="text-xs text-slate-400 flex items-center gap-1.5">
                                                    <span>@{chauffeur.username}</span>
                                                    <span>•</span>
                                                    <span className="flex items-center gap-1 text-amber-500 font-semibold">
                                                        <FaStar className="text-[10px]" /> {chauffeur.stats?.rating ?? 5.0}
                                                    </span>
                                                </p>
                                            </div>
                                        </div>

                                        {/* Status Tag */}
                                        {chauffeur.is_blocked ? (
                                            <span className="text-[10px] px-2.5 py-1 rounded-full bg-red-500/10 text-red-500 font-bold border border-red-500/20">
                                                Bloqué
                                            </span>
                                        ) : chauffeur.is_available ? (
                                            <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 font-bold border border-emerald-500/20 flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> En Ligne
                                            </span>
                                        ) : (
                                            <span className="text-[10px] px-2.5 py-1 rounded-full bg-slate-500/10 text-slate-500 font-bold border border-slate-500/20">
                                                Hors ligne
                                            </span>
                                        )}
                                    </div>

                                    {/* Vehicle Card Box */}
                                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 mb-3 space-y-2">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                                <FaCar className="text-amber-500 text-sm" />
                                                {veh?.marque ? `${veh.marque} ${veh.modele || ""}` : "Véhicule non défini"}
                                            </span>
                                            <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-500 font-bold text-[10px]">
                                                {veh?.type_vehicule || "Classique"}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between text-xs text-slate-400">
                                            <span className="font-mono bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                                                {veh?.matricule || "Matricule N/A"}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <FaMapMarkerAlt className="text-slate-400" /> {chauffeur.wilaya || "N/A"}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Stats preview */}
                                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 dark:text-slate-400 px-1 mb-4">
                                        <div>
                                            <span>Courses : </span>
                                            <strong className="text-slate-800 dark:text-slate-200 font-bold">
                                                {chauffeur.stats?.completed_courses ?? 0}
                                            </strong>
                                        </div>
                                        <div>
                                            <span>Chiffre : </span>
                                            <strong className="text-amber-600 dark:text-amber-400 font-bold">
                                                {(chauffeur.stats?.chiffre_affaires ?? 0).toLocaleString()} DA
                                            </strong>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions Footer */}
                                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                                    <span className="text-xs text-blue-500 font-semibold group-hover:underline">
                                        Voir la fiche &rarr;
                                    </span>

                                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                        <button
                                            type="button"
                                            onClick={() => setEditingChauffeur(chauffeur)}
                                            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-white text-slate-600 dark:text-slate-400 transition-colors"
                                            title="Modifier le profil"
                                        >
                                            <FaEdit className="text-xs" />
                                        </button>

                                        <button
                                            type="button"
                                            onClick={(e) => handleQuickToggleBlock(chauffeur, e)}
                                            className={`p-2 rounded-xl transition-colors ${
                                                chauffeur.is_blocked
                                                    ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 hover:bg-emerald-600 hover:text-white"
                                                    : "bg-red-100 dark:bg-red-950/40 text-red-600 hover:bg-red-600 hover:text-white"
                                            }`}
                                            title={chauffeur.is_blocked ? "Débloquer" : "Bloquer"}
                                        >
                                            {chauffeur.is_blocked ? <FaCheckCircle className="text-xs" /> : <FaBan className="text-xs" />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                /* TABLE VIEW */
                <div className="overflow-x-auto rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                    <table className="w-full text-left border-collapse text-xs sm:text-sm">
                        <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                                <th className="p-4">Chauffeur</th>
                                <th className="p-4">Véhicule</th>
                                <th className="p-4">Catégorie</th>
                                <th className="p-4">Wilaya</th>
                                <th className="p-4">Téléphone</th>
                                <th className="p-4">Statut</th>
                                <th className="p-4">Rating</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {chauffeurs.map((c) => {
                                const v = c.vehicule;
                                return (
                                    <tr
                                        key={c.id}
                                        onClick={() => setSelectedChauffeur(c)}
                                        className="hover:bg-amber-50/50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                                    >
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 font-bold flex items-center justify-center text-sm">
                                                    {c.full_name ? c.full_name.charAt(0).toUpperCase() : "C"}
                                                </div>
                                                <div>
                                                    <span className="font-bold text-slate-900 dark:text-white block">
                                                        {c.full_name || c.username}
                                                    </span>
                                                    <span className="text-[11px] text-slate-400">@{c.username}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                                                {v?.marque ? `${v.marque} ${v.modele || ""}` : "N/A"}
                                            </span>
                                            <span className="text-[10px] font-mono text-slate-400">{v?.matricule || "Pas de matricule"}</span>
                                        </td>
                                        <td className="p-4">
                                            <span className="px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-500 font-bold text-xs">
                                                {v?.type_vehicule || "Classique"}
                                            </span>
                                        </td>
                                        <td className="p-4 text-slate-600 dark:text-slate-300 font-medium">{c.wilaya || "N/A"}</td>
                                        <td className="p-4">
                                            <a
                                                href={`tel:${c.phone_number_1}`}
                                                onClick={(e) => e.stopPropagation()}
                                                className="text-blue-500 font-semibold hover:underline"
                                            >
                                                {c.phone_number_1 || "N/A"}
                                            </a>
                                        </td>
                                        <td className="p-4">
                                            {c.is_blocked ? (
                                                <span className="text-[10px] px-2.5 py-1 rounded-full bg-red-500/10 text-red-500 font-bold">
                                                    Bloqué
                                                </span>
                                            ) : c.is_available ? (
                                                <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 font-bold flex items-center gap-1 w-fit">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> En Ligne
                                                </span>
                                            ) : (
                                                <span className="text-[10px] px-2.5 py-1 rounded-full bg-slate-500/10 text-slate-500 font-bold">
                                                    Hors ligne
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <span className="flex items-center gap-1 text-amber-500 font-semibold">
                                                <FaStar className="text-xs" /> {c.stats?.rating ?? 5.0}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => setSelectedChauffeur(c)}
                                                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors"
                                                >
                                                    Détails
                                                </button>
                                                <button
                                                    onClick={() => setEditingChauffeur(c)}
                                                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1 shadow-sm"
                                                >
                                                    <FaEdit className="text-[10px]" /> Modifier
                                                </button>
                                                <button
                                                    onClick={(e) => handleQuickToggleBlock(c, e)}
                                                    className={`p-2 rounded-xl transition-colors ${
                                                        c.is_blocked
                                                            ? "bg-emerald-100 text-emerald-600 hover:bg-emerald-600 hover:text-white"
                                                            : "bg-red-100 text-red-600 hover:bg-red-600 hover:text-white"
                                                    }`}
                                                    title={c.is_blocked ? "Débloquer" : "Bloquer"}
                                                >
                                                    {c.is_blocked ? <FaCheckCircle className="text-xs" /> : <FaBan className="text-xs" />}
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

            {/* Modal Création */}
            {isCreateModalOpen && (
                <ChauffeurCreateModal
                    initialWilaya={wilaya}
                    onClose={() => setIsCreateModalOpen(false)}
                    onCreated={() => {
                        router.refresh();
                    }}
                />
            )}

            {/* Modal Détails & Gestion */}
            {selectedChauffeur && (
                <ChauffeurDetailModal
                    chauffeur={selectedChauffeur}
                    onClose={() => setSelectedChauffeur(null)}
                    onStatusChanged={() => {
                        router.refresh();
                    }}
                    onEdit={(c) => {
                        setSelectedChauffeur(null);
                        setEditingChauffeur(c);
                    }}
                />
            )}

            {/* Modal Modification */}
            {editingChauffeur && (
                <ChauffeurEditModal
                    chauffeur={editingChauffeur}
                    onClose={() => setEditingChauffeur(null)}
                    onUpdated={() => {
                        router.refresh();
                    }}
                />
            )}
        </div>
    );
}
