/* eslint-disable */
"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
    VtcChauffeur,
    getVtcChauffeurs,
    toggleVtcChauffeurStatus
} from "@/lib/chauffeur_action";
import { getCourses } from "@/lib/gestion_action";
import { Wilaya } from "@/lib/tools/named";
import VtcDispatchMap from "./vtc_dispatch_map";
import ChauffeurDetailModal from "./chauffeur_detail_modal";
import ChauffeurEditModal from "./chauffeur_edit_modal";
import {
    MdLocalTaxi,
    MdSearch,
    MdFilterList,
    MdRefresh,
    MdPhone,
    MdCheckCircle,
    MdBlock,
    MdDirectionsCar,
    MdAltRoute,
    MdChevronLeft,
    MdChevronRight,
    MdStar,
    MdAccessTime,
    MdAttachMoney
} from "react-icons/md";
import { toast } from "react-hot-toast";

interface VtcDispatchProps {
    initialChauffeurs?: VtcChauffeur[];
    initialCourses?: Courses[];
    initialWilaya?: string;
    currentUser?: Partial<Users> | null;
}

export default function VtcDispatch({
    initialChauffeurs = [],
    initialCourses = [],
    initialWilaya = "",
    currentUser
}: VtcDispatchProps) {
    // Data State
    const [chauffeurs, setChauffeurs] = useState<VtcChauffeur[]>(initialChauffeurs);
    const [courses, setCourses] = useState<Courses[]>(initialCourses);
    const [loading, setLoading] = useState(false);

    // Filters State
    const [search, setSearch] = useState("");
    const [selectedWilaya, setSelectedWilaya] = useState(initialWilaya);
    const [statusFilter, setStatusFilter] = useState<"all" | "online" | "offline" | "blocked">("all");

    // Selection State
    const [selectedChauffeur, setSelectedChauffeur] = useState<VtcChauffeur | null>(null);
    const [selectedCourse, setSelectedCourse] = useState<Courses | null>(null);

    // Modals State
    const [detailChauffeur, setDetailChauffeur] = useState<VtcChauffeur | null>(null);
    const [editChauffeur, setEditChauffeur] = useState<VtcChauffeur | null>(null);

    // Sidebar & UI State
    const [activeTab, setActiveTab] = useState<"chauffeurs" | "courses">("chauffeurs");
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [refreshInterval, setRefreshInterval] = useState<number>(30); // 30 seconds default
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    // Fetch Live Data
    const fetchData = useCallback(async (isSilent = false) => {
        if (!isSilent) setLoading(true);
        try {
            const [chauffeursRes, coursesRes] = await Promise.all([
                getVtcChauffeurs({
                    page_size: 200,
                    wilaya: selectedWilaya || undefined,
                }),
                getCourses({
                    page: "1",
                    search: "",
                    valide: "",
                    wilaya: selectedWilaya || "",
                }),
            ]);

            if (chauffeursRes?.results) {
                setChauffeurs(chauffeursRes.results);
            }
            if (coursesRes?.result) {
                setCourses(coursesRes.result);
            }
            setLastUpdated(new Date());
        } catch {
            if (!isSilent) toast.error("Erreur lors de l'actualisation des données");
        } finally {
            if (!isSilent) setLoading(false);
        }
    }, [selectedWilaya]);

    // Initial Fetch & Wilaya Change
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Auto-refresh Timer
    useEffect(() => {
        if (!refreshInterval || refreshInterval <= 0) return;
        const intervalId = setInterval(() => {
            fetchData(true);
        }, refreshInterval * 1000);

        return () => clearInterval(intervalId);
    }, [refreshInterval, fetchData]);

    // Status Toggle Action
    const handleToggleStatus = async (id: number, action: "block" | "unblock") => {
        const res = await toggleVtcChauffeurStatus(id, action);
        if (res.success) {
            setChauffeurs(prev =>
                prev.map(ch => (ch.id === id ? { ...ch, is_blocked: action === "block" } : ch))
            );
            if (detailChauffeur && detailChauffeur.id === id) {
                setDetailChauffeur(prev => (prev ? { ...prev, is_blocked: action === "block" } : null));
            }
        }
    };

    // Filtered Chauffeurs
    const filteredChauffeurs = useMemo(() => {
        return chauffeurs.filter(ch => {
            const isBlocked = ch.is_blocked;
            const isOnline = ch.is_available && ch.is_active && !isBlocked;

            // Status filter
            if (statusFilter === "online" && !isOnline) return false;
            if (statusFilter === "offline" && (isOnline || isBlocked)) return false;
            if (statusFilter === "blocked" && !isBlocked) return false;

            // Search filter
            if (search.trim()) {
                const q = search.toLowerCase();
                const name = (ch.full_name || "").toLowerCase();
                const phone = (ch.phone_number_1 || "").toLowerCase();
                const car = `${ch.vehicule?.marque || ""} ${ch.vehicule?.modele || ""} ${ch.vehicule?.matricule || ""}`.toLowerCase();
                if (!name.includes(q) && !phone.includes(q) && !car.includes(q)) {
                    return false;
                }
            }
            return true;
        });
    }, [chauffeurs, statusFilter, search]);

    // KPI Summary
    const stats = useMemo(() => {
        const total = chauffeurs.length;
        const online = chauffeurs.filter(c => c.is_available && c.is_active && !c.is_blocked).length;
        const blocked = chauffeurs.filter(c => c.is_blocked).length;
        const offline = total - online - blocked;
        const activeCourses = courses.length;
        return { total, online, blocked, offline, activeCourses };
    }, [chauffeurs, courses]);

    return (
        <div className="flex flex-col h-[calc(100vh-80px)] w-full overflow-hidden p-3 md:p-4 gap-3 bg-slate-50 dark:bg-zinc-950">
            {/* Top Header & KPI Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm shrink-0">
                {/* Title & Live indicator */}
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-amber-500/10 dark:bg-amber-500/20 text-amber-500 rounded-xl">
                        <MdLocalTaxi className="text-2xl" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-lg md:text-xl font-black text-slate-800 dark:text-zinc-100 tracking-tight">
                                Dispatch VTC & Carte Live
                            </h1>
                            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                                EN DIRECT
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-zinc-400">
                            Supervision géographique et répartition en temps réel des chauffeurs VTC
                        </p>
                    </div>
                </div>

                {/* KPI Counters */}
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-zinc-800/80 rounded-xl border border-slate-200 dark:border-zinc-700/60">
                        <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium">Total:</span>
                        <span className="text-sm font-bold text-slate-800 dark:text-zinc-100">{stats.total}</span>
                    </div>

                    <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800/60">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm" />
                        <span className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">En ligne:</span>
                        <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">{stats.online}</span>
                    </div>

                    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-zinc-800/80 rounded-xl border border-slate-200 dark:border-zinc-700/60">
                        <span className="w-2 h-2 rounded-full bg-slate-400" />
                        <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium">Hors ligne:</span>
                        <span className="text-sm font-bold text-slate-700 dark:text-zinc-300">{stats.offline}</span>
                    </div>

                    <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 dark:bg-red-950/30 rounded-xl border border-red-200 dark:border-red-800/60">
                        <span className="w-2 h-2 rounded-full bg-red-500 shadow-sm" />
                        <span className="text-xs text-red-700 dark:text-red-300 font-medium">Bloqués:</span>
                        <span className="text-sm font-bold text-red-700 dark:text-red-300">{stats.blocked}</span>
                    </div>

                    <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800/60">
                        <span className="w-2 h-2 rounded-full bg-blue-500 shadow-sm" />
                        <span className="text-xs text-blue-700 dark:text-blue-300 font-medium">Courses:</span>
                        <span className="text-sm font-bold text-blue-700 dark:text-blue-300">{stats.activeCourses}</span>
                    </div>
                </div>

                {/* Auto-refresh selector & Manual button */}
                <div className="flex items-center gap-2">
                    <select
                        value={refreshInterval}
                        onChange={(e) => setRefreshInterval(Number(e.target.value))}
                        className="px-2.5 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                        title="Délai d'actualisation automatique"
                    >
                        <option value={10}>Auto: 10s</option>
                        <option value={30}>Auto: 30s</option>
                        <option value={60}>Auto: 60s</option>
                        <option value={0}>Auto: Off</option>
                    </select>

                    <button
                        type="button"
                        onClick={() => fetchData()}
                        disabled={loading}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-500/20 active:scale-95 transition-all disabled:opacity-50"
                        title="Actualiser maintenant"
                    >
                        <MdRefresh className={`text-base ${loading ? "animate-spin" : ""}`} />
                        <span className="hidden sm:inline">Actualiser</span>
                    </button>
                </div>
            </div>

            {/* Main Area: Map + Collapsible Sidebar */}
            <div className="relative flex-1 flex overflow-hidden rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
                {/* Map View */}
                <div className="flex-1 relative h-full">
                    <VtcDispatchMap
                        chauffeurs={filteredChauffeurs}
                        courses={courses}
                        selectedWilaya={selectedWilaya}
                        selectedChauffeur={selectedChauffeur}
                        selectedCourse={selectedCourse}
                        onSelectChauffeur={(ch) => setSelectedChauffeur(ch)}
                        onSelectCourse={(crs) => setSelectedCourse(crs)}
                        onOpenChauffeurDetail={(ch) => setDetailChauffeur(ch)}
                        onToggleStatus={handleToggleStatus}
                        onRefresh={() => fetchData(true)}
                    />

                    {/* Floating Toggle Sidebar Button */}
                    <button
                        type="button"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="absolute top-20 right-4 z-10 p-2.5 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-slate-200/80 dark:border-zinc-700/80 rounded-xl shadow-lg text-slate-700 dark:text-zinc-200 hover:text-amber-500 dark:hover:text-amber-400 transition-all"
                        title={sidebarOpen ? "Réduire le panneau" : "Ouvrir le panneau"}
                    >
                        {sidebarOpen ? <MdChevronRight className="text-xl" /> : <MdChevronLeft className="text-xl" />}
                    </button>
                </div>

                {/* Right Drawer / Sidebar */}
                <div
                    className={`transition-all duration-300 ease-in-out flex flex-col border-l border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 ${
                        sidebarOpen ? "w-80 md:w-96" : "w-0 border-l-0 overflow-hidden"
                    }`}
                >
                    {sidebarOpen && (
                        <>
                            {/* Drawer Tabs */}
                            <div className="flex items-center border-b border-slate-200 dark:border-zinc-800 p-2 gap-2 bg-slate-50/50 dark:bg-zinc-900/50">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab("chauffeurs")}
                                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-xl transition-all ${
                                        activeTab === "chauffeurs"
                                            ? "bg-amber-500 text-white shadow-sm"
                                            : "text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
                                    }`}
                                >
                                    <MdLocalTaxi className="text-base" />
                                    <span>Chauffeurs ({filteredChauffeurs.length})</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab("courses")}
                                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-xl transition-all ${
                                        activeTab === "courses"
                                            ? "bg-amber-500 text-white shadow-sm"
                                            : "text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
                                    }`}
                                >
                                    <MdAltRoute className="text-base" />
                                    <span>Courses ({courses.length})</span>
                                </button>
                            </div>

                            {/* Filters Bar inside Drawer */}
                            <div className="p-3 border-b border-slate-200 dark:border-zinc-800 flex flex-col gap-2">
                                {/* Search */}
                                <div className="relative">
                                    <MdSearch className="absolute left-3 top-2.5 text-slate-400 text-base" />
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Nom, tél, matricule..."
                                        className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-100 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700/60 rounded-xl text-slate-800 dark:text-zinc-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                                    />
                                    {search && (
                                        <button
                                            type="button"
                                            onClick={() => setSearch("")}
                                            className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>

                                {/* Wilaya Selector */}
                                <div className="flex gap-2">
                                    <select
                                        value={selectedWilaya}
                                        onChange={(e) => setSelectedWilaya(e.target.value)}
                                        className="flex-1 px-2.5 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700/60 rounded-xl text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                                    >
                                        <option value="">Toutes les Wilayas</option>
                                        {Wilaya.map((w) => (
                                            <option key={w.code} value={w.code}>
                                                {w.code} - {w.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Status Filters */}
                                {activeTab === "chauffeurs" && (
                                    <div className="grid grid-cols-4 gap-1 pt-1">
                                        {(["all", "online", "offline", "blocked"] as const).map((st) => {
                                            const labels = {
                                                all: "Tous",
                                                online: "En ligne",
                                                offline: "Hors lig.",
                                                blocked: "Bloqués"
                                            };
                                            const isCurr = statusFilter === st;
                                            return (
                                                <button
                                                    key={st}
                                                    type="button"
                                                    onClick={() => setStatusFilter(st)}
                                                    className={`py-1 text-[11px] font-bold rounded-lg transition-all ${
                                                        isCurr
                                                            ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40"
                                                            : "text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
                                                    }`}
                                                >
                                                    {labels[st]}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* List Content */}
                            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                                {activeTab === "chauffeurs" ? (
                                    filteredChauffeurs.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-48 text-center p-4 text-slate-400 dark:text-zinc-500">
                                            <MdLocalTaxi className="text-4xl mb-2 opacity-50" />
                                            <p className="text-xs font-semibold">Aucun chauffeur trouvé</p>
                                        </div>
                                    ) : (
                                        filteredChauffeurs.map((ch) => {
                                            const isSelected = selectedChauffeur?.id === ch.id;
                                            const isBlocked = ch.is_blocked;
                                            const isOnline = ch.is_available && ch.is_active && !isBlocked;

                                            return (
                                                <div
                                                    key={ch.id}
                                                    onClick={() => setSelectedChauffeur(ch)}
                                                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                                                        isSelected
                                                            ? "bg-amber-50/80 dark:bg-amber-950/20 border-amber-500 shadow-sm"
                                                            : "bg-white dark:bg-zinc-800/40 border-slate-200/80 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700"
                                                    }`}
                                                >
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="relative">
                                                                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-zinc-700 flex items-center justify-center font-bold text-slate-700 dark:text-zinc-200">
                                                                    🚕
                                                                </div>
                                                                <span
                                                                    className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-zinc-900 ${
                                                                        isBlocked
                                                                            ? "bg-red-500"
                                                                            : isOnline
                                                                            ? "bg-emerald-500"
                                                                            : "bg-slate-400"
                                                                    }`}
                                                                />
                                                            </div>
                                                            <div>
                                                                <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-100">
                                                                    {ch.full_name}
                                                                </h4>
                                                                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-zinc-400">
                                                                    <span>{ch.wilaya || "Sans wilaya"}</span>
                                                                    {ch.stats?.rating && (
                                                                        <span className="flex items-center gap-0.5 text-amber-500 font-bold">
                                                                            <MdStar className="text-xs" /> {ch.stats.rating}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Status Badge */}
                                                        <span
                                                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                                isBlocked
                                                                    ? "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                                                                    : isOnline
                                                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                                                    : "bg-slate-500/10 text-slate-600 dark:text-zinc-400 border border-slate-500/20"
                                                            }`}
                                                        >
                                                            {isBlocked ? "Bloqué" : isOnline ? "Disponible" : "Hors ligne"}
                                                        </span>
                                                    </div>

                                                    {/* Car details */}
                                                    {ch.vehicule && (
                                                        <div className="mt-2 pt-2 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between text-[11px] text-slate-600 dark:text-zinc-400">
                                                            <div className="flex items-center gap-1">
                                                                <MdDirectionsCar className="text-amber-500" />
                                                                <span>{ch.vehicule.marque} {ch.vehicule.modele}</span>
                                                            </div>
                                                            <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">
                                                                {ch.vehicule.matricule}
                                                            </span>
                                                        </div>
                                                    )}

                                                    {/* Action Buttons */}
                                                    <div className="mt-2.5 flex items-center justify-between gap-2">
                                                        <a
                                                            href={`tel:${ch.phone_number_1}`}
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-lg text-[11px] font-semibold text-slate-700 dark:text-zinc-200 transition-colors"
                                                        >
                                                            <MdPhone className="text-emerald-500" />
                                                            <span>Appeler</span>
                                                        </a>

                                                        <div className="flex gap-1.5">
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setDetailChauffeur(ch);
                                                                }}
                                                                className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-lg text-[11px] font-bold transition-colors"
                                                            >
                                                                Détails
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleToggleStatus(ch.id, isBlocked ? "unblock" : "block");
                                                                }}
                                                                className={`p-1.5 rounded-lg text-white text-xs transition-colors ${
                                                                    isBlocked
                                                                        ? "bg-emerald-600 hover:bg-emerald-700"
                                                                        : "bg-red-500 hover:bg-red-600"
                                                                }`}
                                                                title={isBlocked ? "Débloquer" : "Bloquer"}
                                                            >
                                                                {isBlocked ? <MdCheckCircle /> : <MdBlock />}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )
                                ) : (
                                    courses.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-48 text-center p-4 text-slate-400 dark:text-zinc-500">
                                            <MdAltRoute className="text-4xl mb-2 opacity-50" />
                                            <p className="text-xs font-semibold">Aucune course enregistrée</p>
                                        </div>
                                    ) : (
                                        courses.map((crs) => {
                                            const isSelected = selectedCourse?.id === crs.id;
                                            return (
                                                <div
                                                    key={crs.id}
                                                    onClick={() => setSelectedCourse(crs)}
                                                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                                                        isSelected
                                                            ? "bg-sky-50/80 dark:bg-sky-950/20 border-sky-500 shadow-sm"
                                                            : "bg-white dark:bg-zinc-800/40 border-slate-200/80 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700"
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs font-bold text-slate-800 dark:text-zinc-100">
                                                            Course #{crs.id}
                                                        </span>
                                                        <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                                                            {crs.prix} DZD
                                                        </span>
                                                    </div>

                                                    <div className="mt-2 space-y-1 text-[11px] text-slate-600 dark:text-zinc-400">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="w-2 h-2 rounded-full bg-blue-500" />
                                                            <span className="truncate">{crs.point_gbs_localisation_aller || "Départ GPS"}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="w-2 h-2 rounded-full bg-orange-500" />
                                                            <span className="truncate">{crs.point_gbs_localisation_arrive || "Destination GPS"}</span>
                                                        </div>
                                                    </div>

                                                    <div className="mt-2 pt-2 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between text-[10px] text-slate-500 dark:text-zinc-400">
                                                        <span>{crs.km ? `${crs.km} km` : ""}</span>
                                                        <span className="capitalize">{crs.etat || "En attente"}</span>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Chauffeur Detail Modal */}
            {detailChauffeur && (
                <ChauffeurDetailModal
                    chauffeur={detailChauffeur}
                    onClose={() => setDetailChauffeur(null)}
                    onStatusChanged={() => {
                        fetchData(true);
                        setDetailChauffeur(null);
                    }}
                    onEdit={(ch) => {
                        setDetailChauffeur(null);
                        setEditChauffeur(ch);
                    }}
                />
            )}

            {/* Chauffeur Edit Modal */}
            {editChauffeur && (
                <ChauffeurEditModal
                    chauffeur={editChauffeur}
                    onClose={() => setEditChauffeur(null)}
                    onUpdated={() => {
                        fetchData(true);
                        setEditChauffeur(null);
                    }}
                />
            )}
        </div>
    );
}
