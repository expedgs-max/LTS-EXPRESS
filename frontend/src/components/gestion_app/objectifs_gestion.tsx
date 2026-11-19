"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    FaTrophy,
    FaCar,
    FaMotorcycle,
    FaUsers,
    FaPlus,
    FaSearch,
    FaPen,
    FaTrash,
    FaSyncAlt,
    FaCoins,
    FaCalendarAlt,
    FaMapMarkerAlt,
    FaCheckCircle,
    FaHourglassHalf,
    FaTimesCircle,
    FaChartLine,
    FaClock,
} from "react-icons/fa";
import {
    Objectif,
    ObjectifStats,
    getObjectifs,
    toggleObjectifStatus,
} from "@/lib/objectifs_action";
import AddObjectifModal from "../windows/gestion_win/add_objectif_modal";
import ModifyObjectifModal from "../windows/gestion_win/modify_objectif_modal";
import DeleteObjectifModal from "../windows/gestion_win/delete_objectif_modal";
import ObjectifProgressionsModal from "../windows/gestion_win/objectif_progressions_modal";
import { Wilaya } from "@/lib/tools/named";

type Props = {
    initialObjectifs: Objectif[];
    initialStats: ObjectifStats | null;
};

export default function ObjectifsGestionComponent({
    initialObjectifs,
    initialStats,
}: Props) {
    const router = useRouter();

    const [objectifs, setObjectifs] = useState<Objectif[]>(initialObjectifs);
    const [stats, setStats] = useState<ObjectifStats | null>(initialStats);
    const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

    // Filter states
    const [activeTab, setActiveTab] = useState<"tous" | "vtc" | "livreur">("tous");
    const [statusFilter, setStatusFilter] = useState<string>("tous"); // 'tous', 'en_cours', 'expire', 'inactif'
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [wilayaFilter, setWilayaFilter] = useState<string>("Toutes");

    // Modals state
    const [isAddOpen, setIsAddOpen] = useState<boolean>(false);
    const [editingObjectif, setEditingObjectif] = useState<Objectif | null>(null);
    const [deletingObjectif, setDeletingObjectif] = useState<Objectif | null>(null);
    const [viewingProgressions, setViewingProgressions] = useState<Objectif | null>(null);

    // Refresh data
    const refreshData = async () => {
        setIsRefreshing(true);
        const data = await getObjectifs({
            cible: activeTab,
            statut: statusFilter,
            search: searchQuery,
            wilaya: wilayaFilter,
        });
        if (data) {
            setObjectifs(data.objectifs);
            setStats(data.stats);
        }
        setIsRefreshing(false);
    };

    // Toggle active status
    const handleToggle = async (obj: Objectif) => {
        const success = await toggleObjectifStatus(obj.id);
        if (success) {
            setObjectifs((prev) =>
                prev.map((item) =>
                    item.id === obj.id ? { ...item, is_active: !item.is_active } : item
                )
            );
        }
    };

    // Filtered objectifs client-side
    const filteredObjectifs = useMemo(() => {
        return objectifs.filter((obj) => {
            // Tab filter
            if (activeTab === "vtc" && obj.cible !== "vtc" && obj.cible !== "tous") return false;
            if (activeTab === "livreur" && obj.cible !== "livreur" && obj.cible !== "tous") return false;

            // Wilaya filter
            if (wilayaFilter !== "Toutes" && obj.wilaya !== "Toutes" && obj.wilaya !== wilayaFilter) {
                return false;
            }

            // Status filter
            if (statusFilter !== "tous") {
                if (statusFilter === "en_cours" && obj.statut_periode !== "en_cours") return false;
                if (statusFilter === "expire" && obj.statut_periode !== "expire") return false;
                if (statusFilter === "inactif" && obj.is_active) return false;
            }

            // Search query
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchTitle = obj.titre.toLowerCase().includes(q);
                const matchDesc = (obj.description || "").toLowerCase().includes(q);
                const matchWilaya = (obj.wilaya || "").toLowerCase().includes(q);
                if (!matchTitle && !matchDesc && !matchWilaya) return false;
            }

            return true;
        });
    }, [objectifs, activeTab, statusFilter, wilayaFilter, searchQuery]);

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-[#0B0F17] text-slate-800 dark:text-zinc-100 p-4 sm:p-6 lg:p-8 space-y-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-tr from-red-600 via-rose-600 to-amber-500 rounded-2xl text-white shadow-lg shadow-red-600/30">
                            <FaTrophy className="text-2xl" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                                Objectifs & Primes
                                <span className="text-xs px-3 py-1 font-bold rounded-full bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400 border border-red-200 dark:border-red-800/60">
                                    VTC & Livreur
                                </span>
                            </h1>
                            <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-0.5">
                                Créez et gérez des challenges attractifs pour stimuler les courses et les livraisons
                            </p>
                        </div>
                    </div>
                </div>

                {/* Top Actions */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={refreshData}
                        disabled={isRefreshing}
                        title="Actualiser la liste"
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 font-semibold text-xs shadow-xs transition disabled:opacity-50"
                    >
                        <FaSyncAlt className={`text-xs ${isRefreshing ? "animate-spin text-red-600" : ""}`} />
                        <span className="hidden sm:inline">Actualiser</span>
                    </button>

                    <button
                        onClick={() => setIsAddOpen(true)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold text-xs shadow-lg shadow-red-600/30 transition-all hover:scale-[1.02]"
                    >
                        <FaPlus className="text-xs" />
                        <span>Créer un Objectif</span>
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
                {/* Total Objectifs */}
                <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900/90 border border-slate-200/80 dark:border-zinc-800/80 shadow-xs hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">Total Objectifs</span>
                        <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
                            <FaTrophy className="text-sm" />
                        </div>
                    </div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white">
                        {stats?.total_objectifs ?? objectifs.length}
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium">Créés sur la plateforme</span>
                </div>

                {/* VTC Actifs */}
                <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900/90 border border-slate-200/80 dark:border-zinc-800/80 shadow-xs hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-red-600 dark:text-red-400">Chauffeurs VTC</span>
                        <div className="p-2 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400">
                            <FaCar className="text-sm" />
                        </div>
                    </div>
                    <div className="text-2xl font-black text-red-600 dark:text-red-400">
                        {stats?.active_vtc_count ?? 0}
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium">Challenges en cours</span>
                </div>

                {/* Livreurs Actifs */}
                <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900/90 border border-slate-200/80 dark:border-zinc-800/80 shadow-xs hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Livreurs Food</span>
                        <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                            <FaMotorcycle className="text-sm" />
                        </div>
                    </div>
                    <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                        {stats?.active_livreur_count ?? 0}
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium">Challenges en cours</span>
                </div>

                {/* Budget Primes Actives */}
                <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900/90 border border-slate-200/80 dark:border-zinc-800/80 shadow-xs hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-amber-600 dark:text-amber-400">Primes Actives</span>
                        <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                            <FaCoins className="text-sm" />
                        </div>
                    </div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white">
                        {(stats?.total_primes_budget ?? 0).toLocaleString()} <span className="text-xs font-bold text-slate-400">DA</span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium">Budget récompenses</span>
                </div>

                {/* Primes Versées */}
                <div className="col-span-2 lg:col-span-1 p-4 rounded-2xl bg-white dark:bg-zinc-900/90 border border-slate-200/80 dark:border-zinc-800/80 shadow-xs hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-teal-600 dark:text-teal-400">Primes Versées</span>
                        <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400">
                            <FaCheckCircle className="text-sm" />
                        </div>
                    </div>
                    <div className="text-2xl font-black text-teal-600 dark:text-teal-400">
                        {(stats?.total_primes_versees ?? 0).toLocaleString()} <span className="text-xs font-bold text-slate-400">DA</span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium">{stats?.total_completions ?? 0} bonus distribués</span>
                </div>
            </div>

            {/* Filter Tabs & Search Bar */}
            <div className="bg-white dark:bg-zinc-900/90 rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 p-4 shadow-xs space-y-4">
                {/* Tabs */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 dark:border-zinc-800/80 pb-3">
                    <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-zinc-800/60 rounded-xl">
                        <button
                            onClick={() => setActiveTab("tous")}
                            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                                activeTab === "tous"
                                    ? "bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-xs"
                                    : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
                            }`}
                        >
                            <FaUsers className="text-xs" />
                            Tous les Objectifs ({objectifs.length})
                        </button>

                        <button
                            onClick={() => setActiveTab("vtc")}
                            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                                activeTab === "vtc"
                                    ? "bg-red-600 text-white shadow-md shadow-red-600/30"
                                    : "text-slate-600 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400"
                            }`}
                        >
                            <FaCar className="text-xs" />
                            Chauffeurs VTC (
                            {objectifs.filter((o) => o.cible === "vtc" || o.cible === "tous").length}
                            )
                        </button>

                        <button
                            onClick={() => setActiveTab("livreur")}
                            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                                activeTab === "livreur"
                                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                                    : "text-slate-600 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400"
                            }`}
                        >
                            <FaMotorcycle className="text-xs" />
                            Livreurs Food (
                            {objectifs.filter((o) => o.cible === "livreur" || o.cible === "tous").length}
                            )
                        </button>
                    </div>

                    <div className="text-xs text-slate-400 font-semibold">
                        Affichage : <span className="font-bold text-slate-700 dark:text-zinc-200">{filteredObjectifs.length}</span> objectif(s)
                    </div>
                </div>

                {/* Filters Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Search */}
                    <div className="relative">
                        <FaSearch className="absolute left-3.5 top-3 text-slate-400 text-xs" />
                        <input
                            type="text"
                            placeholder="Rechercher un objectif par titre ou description..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/50 text-xs text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                        />
                    </div>

                    {/* Statut filter */}
                    <div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/50 text-xs text-slate-800 dark:text-zinc-100 font-medium focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                        >
                            <option value="tous">Tous les statuts</option>
                            <option value="en_cours">En cours (Actifs)</option>
                            <option value="expire">Expirés</option>
                            <option value="inactif">Désactivés</option>
                        </select>
                    </div>

                    {/* Wilaya filter */}
                    <div>
                        <select
                            value={wilayaFilter}
                            onChange={(e) => setWilayaFilter(e.target.value)}
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/50 text-xs text-slate-800 dark:text-zinc-100 font-medium focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                        >
                            <option value="Toutes">Toutes les wilayas</option>
                            {Wilaya.map((w) => (
                                <option key={w.id} value={w.name}>
                                    {w.code} - {w.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Objectifs Grid */}
            {filteredObjectifs.length === 0 ? (
                <div className="py-16 text-center bg-white dark:bg-zinc-900/60 rounded-3xl border border-dashed border-slate-200 dark:border-zinc-800">
                    <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto mb-3">
                        <FaTrophy className="text-2xl" />
                    </div>
                    <h3 className="text-base font-bold text-slate-800 dark:text-zinc-200 mb-1">
                        Aucun objectif correspondant
                    </h3>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
                        Modifiez vos critères de recherche ou créez un nouvel objectif incitatif pour vos chauffeurs et livreurs.
                    </p>
                    <button
                        onClick={() => setIsAddOpen(true)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-600/30 transition"
                    >
                        <FaPlus className="text-xs" />
                        Créer un Objectif
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {filteredObjectifs.map((obj) => {
                        const isVTC = obj.cible === "vtc";
                        const isLivreur = obj.cible === "livreur";
                        const isTous = obj.cible === "tous";
                        const isExpired = obj.statut_periode === "expire";
                        const isFuture = obj.statut_periode === "a_venir";

                        const completionRate = obj.taux_completion || 0;

                        return (
                            <div
                                key={obj.id}
                                className={`relative flex flex-col justify-between rounded-2xl border transition-all duration-200 overflow-hidden group ${
                                    !obj.is_active
                                        ? "bg-slate-100/70 dark:bg-zinc-900/40 border-slate-200 dark:border-zinc-800/80 opacity-75"
                                        : isExpired
                                        ? "bg-white dark:bg-zinc-900/90 border-slate-200 dark:border-zinc-800"
                                        : "bg-white dark:bg-zinc-900/90 border-slate-200/80 dark:border-zinc-800/80 hover:border-slate-300 dark:hover:border-zinc-700 shadow-xs hover:shadow-xl hover:-translate-y-0.5"
                                }`}
                            >
                                {/* Top colored accent bar */}
                                <div
                                    className={`h-1.5 w-full ${
                                        !obj.is_active
                                            ? "bg-slate-300 dark:bg-zinc-700"
                                            : isVTC
                                            ? "bg-gradient-to-r from-red-600 to-rose-500"
                                            : isLivreur
                                            ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                                            : "bg-gradient-to-r from-indigo-500 to-purple-500"
                                    }`}
                                />

                                <div className="p-5 space-y-4 flex-1">
                                    {/* Top Badges and Toggle */}
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex flex-wrap items-center gap-1.5">
                                            {/* Target badge */}
                                            {isVTC && (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50">
                                                    <FaCar className="text-[10px]" /> VTC
                                                </span>
                                            )}
                                            {isLivreur && (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50">
                                                    <FaMotorcycle className="text-[10px]" /> Livreur
                                                </span>
                                            )}
                                            {isTous && (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/50">
                                                    <FaUsers className="text-[10px]" /> Tous
                                                </span>
                                            )}

                                            {/* Period badge */}
                                            <span className="px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400">
                                                {obj.periode_label}
                                            </span>

                                            {/* Wilaya badge */}
                                            {obj.wilaya && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-medium bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400">
                                                    <FaMapMarkerAlt className="text-[9px]" /> {obj.wilaya}
                                                </span>
                                            )}
                                        </div>

                                        {/* Status / Active Toggle */}
                                        <div className="flex items-center gap-2">
                                            {!obj.is_active ? (
                                                <span className="text-[11px] font-bold text-slate-400">Inactif</span>
                                            ) : isExpired ? (
                                                <span className="text-[11px] font-bold text-amber-500 flex items-center gap-1">
                                                    <FaClock className="text-[9px]" /> Expiré
                                                </span>
                                            ) : (
                                                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                    En cours
                                                </span>
                                            )}

                                            <button
                                                onClick={() => handleToggle(obj)}
                                                title={obj.is_active ? "Désactiver l'objectif" : "Activer l'objectif"}
                                                className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors ${
                                                    obj.is_active ? "bg-emerald-500" : "bg-slate-300 dark:bg-zinc-700"
                                                }`}
                                            >
                                                <div
                                                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                                                        obj.is_active ? "translate-x-4" : "translate-x-0"
                                                    }`}
                                                />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Title and Description */}
                                    <div>
                                        <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                                            {obj.titre}
                                        </h3>
                                        {obj.description && (
                                            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                                                {obj.description}
                                            </p>
                                        )}
                                    </div>

                                    {/* Goal Target & Prime Callout */}
                                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800/40 border border-slate-200/60 dark:border-zinc-800/80 flex items-center justify-between">
                                        <div>
                                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                                                Cible à atteindre
                                            </span>
                                            <span className="text-sm font-extrabold text-slate-800 dark:text-zinc-200">
                                                {obj.valeur_cible}{" "}
                                                {obj.type_objectif === "courses"
                                                    ? isLivreur
                                                        ? "livraisons"
                                                        : "courses"
                                                    : "DA"}
                                            </span>
                                        </div>

                                        <div className="text-right">
                                            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block mb-0.5">
                                                Prime / Bonus
                                            </span>
                                            <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                                                +{Number(obj.prime_montant).toLocaleString()} DA
                                            </span>
                                        </div>
                                    </div>

                                    {/* Dates & Timeline */}
                                    <div className="text-xs text-slate-500 dark:text-zinc-400 flex items-center justify-between font-medium">
                                        <span className="flex items-center gap-1.5">
                                            <FaCalendarAlt className="text-slate-400 text-[10px]" />
                                            {new Date(obj.date_debut).toLocaleDateString()} →{" "}
                                            {new Date(obj.date_fin).toLocaleDateString()}
                                        </span>
                                    </div>

                                    {/* Participation Progress Bar */}
                                    <div className="space-y-1.5 pt-1">
                                        <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-zinc-300">
                                            <span>
                                                {obj.completed_count} / {obj.participants_count} partenaires ont complété
                                            </span>
                                            <span className="text-slate-400 font-bold">{completionRate}%</span>
                                        </div>
                                        <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                                            <div
                                                className="h-full rounded-full bg-gradient-to-r from-red-600 to-amber-500 transition-all duration-500"
                                                style={{ width: `${completionRate}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Card Footer Actions */}
                                <div className="px-5 py-3 bg-slate-50/80 dark:bg-zinc-800/30 border-t border-slate-200/80 dark:border-zinc-800/80 flex items-center justify-between gap-2">
                                    <button
                                        onClick={() => setViewingProgressions(obj)}
                                        className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition"
                                    >
                                        <FaUsers className="text-xs" />
                                        <span>Suivi & Primes ({obj.participants_count})</span>
                                    </button>

                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => setEditingObjectif(obj)}
                                            title="Modifier l'objectif"
                                            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-zinc-800 transition"
                                        >
                                            <FaPen className="text-xs" />
                                        </button>

                                        <button
                                            onClick={() => setDeletingObjectif(obj)}
                                            title="Supprimer l'objectif"
                                            className="p-2 rounded-xl text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                                        >
                                            <FaTrash className="text-xs" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modals */}
            {isAddOpen && (
                <AddObjectifModal
                    onClose={() => setIsAddOpen(false)}
                    onSuccess={refreshData}
                />
            )}

            {editingObjectif && (
                <ModifyObjectifModal
                    objectif={editingObjectif}
                    onClose={() => setEditingObjectif(null)}
                    onSuccess={refreshData}
                />
            )}

            {deletingObjectif && (
                <DeleteObjectifModal
                    objectif={deletingObjectif}
                    onClose={() => setDeletingObjectif(null)}
                    onSuccess={refreshData}
                />
            )}

            {viewingProgressions && (
                <ObjectifProgressionsModal
                    objectif={viewingProgressions}
                    onClose={() => setViewingProgressions(null)}
                    onUpdateParent={refreshData}
                />
            )}
        </div>
    );
}
