"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    FaSearch,
    FaPlus,
    FaPen,
    FaTrash,
    FaCar,
    FaMapMarkerAlt,
    FaPercentage,
    FaCoins,
    FaFilter,
    FaSyncAlt,
    FaTag,
    FaCrown,
    FaMotorcycle,
    FaUsers,
    FaBox,
    FaTaxi,
    FaCheckCircle,
    FaTimesCircle,
} from "react-icons/fa";
import { MdLocalTaxi } from "react-icons/md";
import { Wilaya } from "@/lib/tools/named";
import {
    getCommissionsVTC,
    getChauffeurCommissionRate,
    getTypeCourses,
} from "@/lib/commission_vtc_action";
import AddCommissionModal from "../windows/gestion_win/add_commission_modal";
import ModifyCommissionModal from "../windows/gestion_win/modify_commission_modal";
import DeleteCommissionModal from "../windows/gestion_win/delete_commission_modal";
import ModifyChauffeurRateModal from "../windows/gestion_win/modify_chauffeur_rate_modal";
import AddTypeCourseModal from "../windows/gestion_win/add_type_course_modal";
import ModifyTypeCourseModal from "../windows/gestion_win/modify_type_course_modal";
import DeleteTypeCourseModal from "../windows/gestion_win/delete_type_course_modal";

type Props = {
    initialCommissions: CommissionVTC[];
    initialChauffeurRate: ChauffeurCommissionRate | null;
    initialTypeCourses?: TypeCourseVTC[];
};

export default function CommissionVtcComponent({
    initialCommissions,
    initialChauffeurRate,
    initialTypeCourses = [],
}: Props) {
    const router = useRouter();

    const [commissions, setCommissions] = useState<CommissionVTC[]>(initialCommissions);
    const [chauffeurRate, setChauffeurRate] = useState<ChauffeurCommissionRate | null>(
        initialChauffeurRate
    );
    const [typeCourses, setTypeCourses] = useState<TypeCourseVTC[]>(initialTypeCourses);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Active Navigation Tab: "wilaya" (Tarifs par Wilaya) vs "types" (Types de Course)
    const [activeTab, setActiveTab] = useState<"wilaya" | "types">("wilaya");

    // Commission Filters state
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedWilaya, setSelectedWilaya] = useState("");
    const [selectedType, setSelectedType] = useState("");

    // Type Course Filter state
    const [typeSearchQuery, setTypeSearchQuery] = useState("");

    // Commission Modals state
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editingCommission, setEditingCommission] = useState<CommissionVTC | null>(null);
    const [deletingCommission, setDeletingCommission] = useState<CommissionVTC | null>(null);
    const [isRateModalOpen, setIsRateModalOpen] = useState(false);

    // Type Course Modals state
    const [isAddTypeOpen, setIsAddTypeOpen] = useState(false);
    const [editingTypeCourse, setEditingTypeCourse] = useState<TypeCourseVTC | null>(null);
    const [deletingTypeCourse, setDeletingTypeCourse] = useState<TypeCourseVTC | null>(null);

    // Filtered commissions calculation
    const filteredCommissions = useMemo(() => {
        return commissions.filter((item) => {
            const matchesSearch =
                !searchQuery ||
                item.wilaya?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.type_course?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.description?.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesWilaya =
                !selectedWilaya ||
                item.wilaya?.toLowerCase() === selectedWilaya.toLowerCase() ||
                (item.code_wilaya && String(item.code_wilaya) === selectedWilaya);

            const matchesType =
                !selectedType ||
                item.type_course?.toLowerCase() === selectedType.toLowerCase();

            return matchesSearch && matchesWilaya && matchesType;
        });
    }, [commissions, searchQuery, selectedWilaya, selectedType]);

    // Filtered course types calculation
    const filteredTypeCourses = useMemo(() => {
        if (!typeSearchQuery.trim()) return typeCourses;
        const q = typeSearchQuery.toLowerCase();
        return typeCourses.filter(
            (t) =>
                t.name.toLowerCase().includes(q) ||
                t.code.toLowerCase().includes(q) ||
                (t.description && t.description.toLowerCase().includes(q))
        );
    }, [typeCourses, typeSearchQuery]);

    // Statistics calculations
    const stats = useMemo(() => {
        const uniqueWilayas = new Set(
            commissions.map((c) => c.wilaya?.toLowerCase().trim()).filter(Boolean)
        );
        const avgKmPrice =
            commissions.length > 0
                ? (
                      commissions.reduce((acc, c) => acc + (c.prix_km || 0), 0) /
                      commissions.length
                  ).toFixed(1)
                : "0";

        return {
            totalRules: commissions.length,
            uniqueWilayasCount: uniqueWilayas.size,
            avgKmPrice,
            ratePercent: chauffeurRate?.tax_tawsile ?? 15,
            typesCount: typeCourses.length,
        };
    }, [commissions, chauffeurRate, typeCourses]);

    // Client-side refresh (No full page/layout reload)
    const refreshData = async () => {
        setIsRefreshing(true);
        try {
            const [newCommissions, newRate, newTypes] = await Promise.all([
                getCommissionsVTC(),
                getChauffeurCommissionRate(),
                getTypeCourses(),
            ]);
            if (newCommissions) setCommissions(newCommissions);
            if (newRate) setChauffeurRate(newRate);
            if (newTypes) setTypeCourses(newTypes);
        } catch {
            // silent catch
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleRefresh = () => {
        refreshData();
    };

    const getTypeBadgeClass = (type: string) => {
        switch (type?.toLowerCase()) {
            case "classique":
                return "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800";
            case "confort":
                return "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200 dark:border-purple-800";
            case "moto":
                return "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800";
            case "famille":
                return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";
            case "livraison":
                return "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200 dark:border-rose-800";
            default:
                return "bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 border-slate-200 dark:border-zinc-700";
        }
    };

    const renderTypeIcon = (iconName?: string | null, typeCode?: string) => {
        switch (iconName || typeCode?.toLowerCase()) {
            case "FaCrown":
            case "confort":
                return <FaCrown className="text-purple-500" />;
            case "FaMotorcycle":
            case "moto":
                return <FaMotorcycle className="text-amber-500" />;
            case "FaUsers":
            case "famille":
                return <FaUsers className="text-emerald-500" />;
            case "FaBox":
            case "livraison":
                return <FaBox className="text-rose-500" />;
            case "FaTaxi":
                return <FaTaxi className="text-yellow-500" />;
            default:
                return <FaCar className="text-blue-500" />;
        }
    };

    return (
        <div className="p-4 sm:p-8 space-y-8 max-w-7xl mx-auto">
            {/* Breadcrumb & Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-zinc-400 mb-1">
                        <Link href="/dashboard" className="hover:text-emerald-600 transition-colors">
                            Tableau de bord
                        </Link>
                        <span>/</span>
                        <span className="text-emerald-600 dark:text-emerald-400">Commissions & Tarifs VTC</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-700 text-white rounded-2xl shadow-lg shadow-emerald-600/20">
                            <MdLocalTaxi className="text-2xl" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                                Configuration des Commissions VTC
                            </h1>
                            <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400">
                                Gestion des tarifs kilométriques, des types de course et du taux plateforme
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="p-2.5 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-700 rounded-xl shadow-sm transition-all disabled:opacity-60"
                        title="Rafraîchir les données"
                    >
                        <FaSyncAlt className={`text-sm ${isRefreshing ? "animate-spin text-emerald-600" : ""}`} />
                    </button>

                    {activeTab === "wilaya" ? (
                        <button
                            onClick={() => setIsAddOpen(true)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/30 transition-all"
                        >
                            <FaPlus className="text-xs" />
                            <span>Ajouter une tarification</span>
                        </button>
                    ) : (
                        <button
                            onClick={() => setIsAddTypeOpen(true)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition-all"
                        >
                            <FaPlus className="text-xs" />
                            <span>Nouveau type de course</span>
                        </button>
                    )}
                </div>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Stat 1: Total Wilayas */}
                <div
                    onClick={() => setActiveTab("wilaya")}
                    className="p-5 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group cursor-pointer"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                                Wilayas Couvertes
                            </p>
                            <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-1">
                                {stats.uniqueWilayasCount} <span className="text-sm font-medium text-slate-400">/ 58</span>
                            </h3>
                        </div>
                        <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-2xl group-hover:scale-110 transition-transform">
                            <FaMapMarkerAlt className="text-xl" />
                        </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-zinc-800/80 text-[11px] text-slate-500 dark:text-zinc-400">
                        {stats.totalRules} règle(s) tarifaire(s) active(s)
                    </div>
                </div>

                {/* Stat 2: Types de Course */}
                <div
                    onClick={() => setActiveTab("types")}
                    className="p-5 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group cursor-pointer"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                                Types de Course
                            </p>
                            <h3 className="text-3xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
                                {stats.typesCount}
                            </h3>
                        </div>
                        <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-2xl group-hover:scale-110 transition-transform">
                            <FaTag className="text-xl" />
                        </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-zinc-800/80 text-[11px] text-slate-500 dark:text-zinc-400 flex items-center justify-between">
                        <span>Classique, Confort, Moto...</span>
                        <span className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline">Gérer &rarr;</span>
                    </div>
                </div>

                {/* Stat 3: Average Km Price */}
                <div className="p-5 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                                Tarif Moyen / Km
                            </p>
                            <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-1">
                                {stats.avgKmPrice} <span className="text-sm font-medium text-slate-400">DA</span>
                            </h3>
                        </div>
                        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-2xl group-hover:scale-110 transition-transform">
                            <FaCoins className="text-xl" />
                        </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-zinc-800/80 text-[11px] text-slate-500 dark:text-zinc-400">
                        Prix au km moyen en zone urbaine
                    </div>
                </div>

                {/* Stat 4: Chauffeur Commission Rate */}
                <div className="p-5 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-amber-500/10 dark:from-amber-950/30 dark:to-orange-950/20 rounded-2xl border border-amber-300 dark:border-amber-800/60 shadow-sm relative overflow-hidden group">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider">
                                Taux Plateforme VTC
                            </p>
                            <h3 className="text-3xl font-black text-amber-900 dark:text-amber-300 mt-1">
                                {stats.ratePercent}%
                            </h3>
                        </div>
                        <div className="p-3.5 bg-amber-500 text-white rounded-2xl shadow-md shadow-amber-500/30 group-hover:scale-110 transition-transform">
                            <FaPercentage className="text-xl" />
                        </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-amber-200/60 dark:border-amber-900/60 flex items-center justify-between">
                        <span className="text-[11px] text-amber-800 dark:text-amber-400 font-medium">
                            Part taxe prélevée (tax_tawsile)
                        </span>
                        <button
                            onClick={() => setIsRateModalOpen(true)}
                            className="text-xs font-bold text-amber-700 dark:text-amber-300 hover:underline flex items-center gap-1"
                        >
                            <FaPen className="text-[10px]" /> Modifier
                        </button>
                    </div>
                </div>
            </div>

            {/* Chauffeur Commission Rate Banner Card */}
            <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 text-xs font-bold bg-amber-500 text-slate-950 rounded-full">
                            PARAMÈTRE GLOBAL CHAUFFEUR
                        </span>
                        <span className="text-xs text-slate-400">Type de compte: choffeur</span>
                    </div>
                    <h2 className="text-lg font-bold">
                        Taux de commission prélevé sur les chauffeurs :{" "}
                        <span className="text-amber-400 text-xl font-black">{stats.ratePercent}%</span>
                    </h2>
                    <p className="text-xs text-slate-300 max-w-2xl">
                        Lors de chaque course terminée, l'application calcule automatiquement la commission due par le chauffeur en appliquant ce taux au montant total de la course.
                    </p>
                </div>
                <button
                    onClick={() => setIsRateModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-amber-500/20 active:scale-95 transition-all shrink-0"
                >
                    <FaPen />
                    <span>Modifier le taux ({stats.ratePercent}%)</span>
                </button>
            </div>

            {/* Navigation Tabs (Tarifs par Wilaya vs Types de Course) */}
            <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-zinc-800/80 rounded-2xl w-fit border border-slate-200/80 dark:border-zinc-700/60">
                <button
                    onClick={() => setActiveTab("wilaya")}
                    className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
                        activeTab === "wilaya"
                            ? "bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-sm"
                            : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                >
                    <FaCar className="text-sm" />
                    <span>Grille des Tarifs par Wilaya</span>
                    <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
                            activeTab === "wilaya"
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                                : "bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-300"
                        }`}
                    >
                        {commissions.length}
                    </span>
                </button>

                <button
                    onClick={() => setActiveTab("types")}
                    className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
                        activeTab === "types"
                            ? "bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                            : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                >
                    <FaTag className="text-sm" />
                    <span>Types de Course</span>
                    <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
                            activeTab === "types"
                                ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300"
                                : "bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-300"
                        }`}
                    >
                        {typeCourses.length}
                    </span>
                </button>
            </div>

            {/* TAB 1: GRILLE DES TARIFS PAR WILAYA */}
            {activeTab === "wilaya" && (
                <div className="space-y-4 animate-fadeIn">
                    {/* Filter and Search Bar */}
                    <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm space-y-4">
                        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
                            {/* Search Input */}
                            <div className="relative flex-1">
                                <FaSearch className="absolute left-3.5 top-3.5 text-slate-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Rechercher par wilaya, type de course, description..."
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-white"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery("")}
                                        className="absolute right-3 top-3 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
                                    >
                                        Effacer
                                    </button>
                                )}
                            </div>

                            {/* Dropdown Filters */}
                            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
                                {/* Wilaya Filter */}
                                <div className="relative min-w-[180px] flex-1 sm:flex-initial">
                                    <select
                                        value={selectedWilaya}
                                        onChange={(e) => setSelectedWilaya(e.target.value)}
                                        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-white"
                                    >
                                        <option value="">Toutes les wilayas</option>
                                        {Wilaya.map((w) => (
                                            <option key={w.code} value={w.name}>
                                                {w.code} - {w.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Type Filter (Dynamically loaded from typeCourses) */}
                                <div className="relative min-w-[170px] flex-1 sm:flex-initial">
                                    <select
                                        value={selectedType}
                                        onChange={(e) => setSelectedType(e.target.value)}
                                        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-white"
                                    >
                                        <option value="">Tous les types</option>
                                        {typeCourses.map((t) => (
                                            <option key={t.code} value={t.code}>
                                                {t.name}
                                            </option>
                                        ))}
                                        {/* Fallback if list is empty */}
                                        {typeCourses.length === 0 && (
                                            <>
                                                <option value="classique">Classique</option>
                                                <option value="confort">Confort</option>
                                                <option value="moto">Moto</option>
                                                <option value="famille">Famille</option>
                                                <option value="livraison">Livraison VTC</option>
                                            </>
                                        )}
                                    </select>
                                </div>

                                {(selectedWilaya || selectedType || searchQuery) && (
                                    <button
                                        onClick={() => {
                                            setSelectedWilaya("");
                                            setSelectedType("");
                                            setSearchQuery("");
                                        }}
                                        className="px-3 py-2.5 text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 rounded-xl transition-colors"
                                    >
                                        Réinitialiser
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400 pt-2 border-t border-slate-100 dark:border-zinc-800/80">
                            <span>
                                Affichage de <strong className="text-slate-800 dark:text-zinc-200">{filteredCommissions.length}</strong> règle(s) sur {commissions.length}
                            </span>
                            {selectedWilaya && <span>Wilaya : <strong>{selectedWilaya}</strong></span>}
                            {selectedType && <span>Type : <strong>{selectedType}</strong></span>}
                        </div>
                    </div>

                    {/* Table Card */}
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-zinc-800/60 border-b border-slate-200 dark:border-zinc-800 text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                                        <th className="px-5 py-3.5">Wilaya</th>
                                        <th className="px-5 py-3.5">Type de Course</th>
                                        <th className="px-5 py-3.5">Prix Départ</th>
                                        <th className="px-5 py-3.5">Prix / Km</th>
                                        <th className="px-5 py-3.5">Prix Km Long</th>
                                        <th className="px-5 py-3.5">Prix Seconde</th>
                                        <th className="px-5 py-3.5">Nuit (sec)</th>
                                        <th className="px-5 py-3.5">Description</th>
                                        <th className="px-5 py-3.5 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 text-sm">
                                    {filteredCommissions.length > 0 ? (
                                        filteredCommissions.map((comm) => (
                                            <tr
                                                key={comm.id}
                                                className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 transition-colors group"
                                            >
                                                {/* Wilaya */}
                                                <td className="px-5 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                                                            {comm.code_wilaya || "?"}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-slate-900 dark:text-white">
                                                                {comm.wilaya || "National"}
                                                            </div>
                                                            <div className="text-[11px] text-slate-400">
                                                                Code {comm.code_wilaya || "N/A"}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Type Course */}
                                                <td className="px-5 py-4 whitespace-nowrap">
                                                    <span
                                                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border capitalize ${getTypeBadgeClass(
                                                            comm.type_course
                                                        )}`}
                                                    >
                                                        {renderTypeIcon(null, comm.type_course)}
                                                        {comm.type_course}
                                                    </span>
                                                </td>

                                                {/* Prix Départ */}
                                                <td className="px-5 py-4 whitespace-nowrap">
                                                    <span className="font-extrabold text-slate-900 dark:text-white">
                                                        {comm.prix_depart ?? 0}
                                                    </span>{" "}
                                                    <span className="text-xs text-slate-400">DA</span>
                                                </td>

                                                {/* Prix / Km */}
                                                <td className="px-5 py-4 whitespace-nowrap">
                                                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                                                        {comm.prix_km ?? 0}
                                                    </span>{" "}
                                                    <span className="text-xs text-slate-400">DA/km</span>
                                                </td>

                                                {/* Prix Km Long */}
                                                <td className="px-5 py-4 whitespace-nowrap">
                                                    <span className="font-semibold text-slate-700 dark:text-zinc-300">
                                                        {comm.prix_km_long ?? 0}
                                                    </span>{" "}
                                                    <span className="text-xs text-slate-400">DA/km</span>
                                                </td>

                                                {/* Prix Seconde */}
                                                <td className="px-5 py-4 whitespace-nowrap">
                                                    <span className="font-mono text-xs text-slate-600 dark:text-zinc-400">
                                                        {comm.prix_second ?? 0} DA/s
                                                    </span>
                                                </td>

                                                {/* Prix Nuit Seconde */}
                                                <td className="px-5 py-4 whitespace-nowrap">
                                                    <span className="font-mono text-xs text-indigo-600 dark:text-indigo-400">
                                                        {comm.prix_nuit_second ?? 0} DA/s
                                                    </span>
                                                </td>

                                                {/* Description */}
                                                <td className="px-5 py-4 text-xs text-slate-500 dark:text-zinc-400 max-w-[200px] truncate">
                                                    {comm.description || "-"}
                                                </td>

                                                {/* Actions */}
                                                <td className="px-5 py-4 whitespace-nowrap text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => setEditingCommission(comm)}
                                                            className="p-2 text-blue-600 hover:text-white hover:bg-blue-600 rounded-lg transition-all"
                                                            title="Modifier cette commission"
                                                        >
                                                            <FaPen className="text-xs" />
                                                        </button>
                                                        <button
                                                            onClick={() => setDeletingCommission(comm)}
                                                            className="p-2 text-rose-600 hover:text-white hover:bg-rose-600 rounded-lg transition-all"
                                                            title="Supprimer cette commission"
                                                        >
                                                            <FaTrash className="text-xs" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={9} className="text-center py-16 px-4">
                                                <div className="flex flex-col items-center justify-center gap-3">
                                                    <div className="p-4 bg-slate-100 dark:bg-zinc-800 text-slate-400 rounded-full">
                                                        <FaCar className="text-3xl" />
                                                    </div>
                                                    <p className="text-base font-bold text-slate-700 dark:text-zinc-300">
                                                        Aucune tarification VTC trouvée
                                                    </p>
                                                    <p className="text-xs text-slate-400 max-w-sm">
                                                        Aucune règle tarifaire ne correspond à vos filtres actuels ou aucune tarification n'a encore été ajoutée.
                                                    </p>
                                                    <button
                                                        onClick={() => setIsAddOpen(true)}
                                                        className="mt-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition-all"
                                                    >
                                                        Ajouter une première commission
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 2: TYPES DE COURSE */}
            {activeTab === "types" && (
                <div className="space-y-4 animate-fadeIn">
                    {/* Search and Add Header */}
                    <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm space-y-4">
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                            {/* Search Input */}
                            <div className="relative flex-1 max-w-md">
                                <FaSearch className="absolute left-3.5 top-3.5 text-slate-400" />
                                <input
                                    type="text"
                                    value={typeSearchQuery}
                                    onChange={(e) => setTypeSearchQuery(e.target.value)}
                                    placeholder="Rechercher un type par nom, code, description..."
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white"
                                />
                                {typeSearchQuery && (
                                    <button
                                        onClick={() => setTypeSearchQuery("")}
                                        className="absolute right-3 top-3 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
                                    >
                                        Effacer
                                    </button>
                                )}
                            </div>

                            <button
                                onClick={() => setIsAddTypeOpen(true)}
                                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition-all"
                            >
                                <FaPlus className="text-xs" />
                                <span>Ajouter un type de course</span>
                            </button>
                        </div>

                        <div className="text-xs text-slate-500 dark:text-zinc-400 pt-2 border-t border-slate-100 dark:border-zinc-800/80">
                            Total de <strong>{typeCourses.length}</strong> types configurés pour la plateforme VTC.
                        </div>
                    </div>

                    {/* Types Table Card */}
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-zinc-800/60 border-b border-slate-200 dark:border-zinc-800 text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                                        <th className="px-5 py-3.5">ID</th>
                                        <th className="px-5 py-3.5">Type de Course</th>
                                        <th className="px-5 py-3.5">Identifiant (Code / Slug)</th>
                                        <th className="px-5 py-3.5">Description</th>
                                        <th className="px-5 py-3.5 text-center">Règles Tarifaires</th>
                                        <th className="px-5 py-3.5 text-center">Statut</th>
                                        <th className="px-5 py-3.5 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 text-sm">
                                    {filteredTypeCourses.length > 0 ? (
                                        filteredTypeCourses.map((typeItem) => (
                                            <tr
                                                key={typeItem.id}
                                                className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 transition-colors group"
                                            >
                                                {/* ID */}
                                                <td className="px-5 py-4 whitespace-nowrap text-xs font-mono text-slate-400">
                                                    #{typeItem.id}
                                                </td>

                                                {/* Name + Icon */}
                                                <td className="px-5 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 text-lg flex items-center justify-center">
                                                            {renderTypeIcon(typeItem.icon, typeItem.code)}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-slate-900 dark:text-white">
                                                                {typeItem.name}
                                                            </div>
                                                            <div className="text-[11px] text-slate-400">
                                                                Icône: {typeItem.icon || "FaCar"}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Code / Slug */}
                                                <td className="px-5 py-4 whitespace-nowrap">
                                                    <code className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-zinc-800 text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-zinc-700">
                                                        {typeItem.code}
                                                    </code>
                                                </td>

                                                {/* Description */}
                                                <td className="px-5 py-4 text-xs text-slate-600 dark:text-zinc-300 max-w-xs">
                                                    {typeItem.description || (
                                                        <span className="text-slate-400 italic">Aucune description</span>
                                                    )}
                                                </td>

                                                {/* Associated Rules Count */}
                                                <td className="px-5 py-4 whitespace-nowrap text-center">
                                                    <span
                                                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                                                            (typeItem.rules_count || 0) > 0
                                                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                                                                : "bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400"
                                                        }`}
                                                    >
                                                        {typeItem.rules_count || 0} règle(s)
                                                    </span>
                                                </td>

                                                {/* Status */}
                                                <td className="px-5 py-4 whitespace-nowrap text-center">
                                                    {typeItem.is_active !== false ? (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                                            <FaCheckCircle className="text-[10px]" /> Actif
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700">
                                                            <FaTimesCircle className="text-[10px]" /> Inactif
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Actions */}
                                                <td className="px-5 py-4 whitespace-nowrap text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => setEditingTypeCourse(typeItem)}
                                                            className="p-2 text-indigo-600 hover:text-white hover:bg-indigo-600 rounded-lg transition-all"
                                                            title="Modifier ce type de course"
                                                        >
                                                            <FaPen className="text-xs" />
                                                        </button>
                                                        <button
                                                            onClick={() => setDeletingTypeCourse(typeItem)}
                                                            className="p-2 text-rose-600 hover:text-white hover:bg-rose-600 rounded-lg transition-all"
                                                            title="Supprimer ce type de course"
                                                        >
                                                            <FaTrash className="text-xs" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={7} className="text-center py-16 px-4">
                                                <div className="flex flex-col items-center justify-center gap-3">
                                                    <div className="p-4 bg-slate-100 dark:bg-zinc-800 text-slate-400 rounded-full">
                                                        <FaTag className="text-3xl" />
                                                    </div>
                                                    <p className="text-base font-bold text-slate-700 dark:text-zinc-300">
                                                        Aucun type de course trouvé
                                                    </p>
                                                    <p className="text-xs text-slate-400 max-w-sm">
                                                        Créez votre premier type de course pour enrichir les options de réservation et de tarification.
                                                    </p>
                                                    <button
                                                        onClick={() => setIsAddTypeOpen(true)}
                                                        className="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition-all"
                                                    >
                                                        Créer un type de course
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Modals for Commission */}
            {isAddOpen && (
                <AddCommissionModal
                    typeCourses={typeCourses}
                    onClose={() => setIsAddOpen(false)}
                    onSuccess={() => {
                        refreshData();
                    }}
                />
            )}

            {editingCommission && (
                <ModifyCommissionModal
                    commission={editingCommission}
                    typeCourses={typeCourses}
                    onClose={() => setEditingCommission(null)}
                    onSuccess={() => {
                        refreshData();
                    }}
                />
            )}

            {deletingCommission && (
                <DeleteCommissionModal
                    commission={deletingCommission}
                    onClose={() => setDeletingCommission(null)}
                    onSuccess={() => {
                        refreshData();
                    }}
                />
            )}

            {/* Modal for Chauffeur Rate */}
            {isRateModalOpen && chauffeurRate && (
                <ModifyChauffeurRateModal
                    rate={chauffeurRate}
                    onClose={() => setIsRateModalOpen(false)}
                    onSuccess={(newRate, newDesc) => {
                        if (typeof newRate === "number") {
                            setChauffeurRate((prev) => ({
                                id: prev?.id ?? 1,
                                name: prev?.name ?? "choffeur",
                                tax_tawsile: newRate,
                                description: newDesc ?? prev?.description,
                            }));
                        } else {
                            getChauffeurCommissionRate().then((r) => {
                                if (r) setChauffeurRate(r);
                            });
                        }
                    }}
                />
            )}

            {/* Modals for Type Course */}
            {isAddTypeOpen && (
                <AddTypeCourseModal
                    onClose={() => setIsAddTypeOpen(false)}
                    onSuccess={() => {
                        refreshData();
                    }}
                />
            )}

            {editingTypeCourse && (
                <ModifyTypeCourseModal
                    typeCourse={editingTypeCourse}
                    onClose={() => setEditingTypeCourse(null)}
                    onSuccess={() => {
                        refreshData();
                    }}
                />
            )}

            {deletingTypeCourse && (
                <DeleteTypeCourseModal
                    typeCourse={deletingTypeCourse}
                    onClose={() => setDeletingTypeCourse(null)}
                    onSuccess={() => {
                        refreshData();
                    }}
                />
            )}
        </div>
    );
}
