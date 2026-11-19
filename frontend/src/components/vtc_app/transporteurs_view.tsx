"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    FaTruck,
    FaPlus,
    FaSearch,
    FaFilter,
    FaStar,
    FaBan,
    FaCheckCircle,
    FaThLarge,
    FaThList,
    FaRedo,
    FaMapMarkerAlt,
    FaEdit,
    FaTrash,
    FaUndo,
    FaPhoneAlt,
    FaClock,
    FaMoneyBillWave,
    FaTag,
    FaUserCheck,
    FaExclamationTriangle
} from "react-icons/fa";
import {
    Transporteur,
    toggleTransporteurStatus,
    deleteTransporteur,
    restoreTransporteur,
    hardDeleteTransporteur,
    emptyTrashTransporteurs,
    getTransportCategories,
    TransportCategoryItem
} from "@/lib/transporteur_action";
import { Wilaya } from "@/lib/tools/named";
import TransporteurCreateModal from "./transporteur_create_modal";
import toast from "react-hot-toast";

interface TransporteursViewProps {
    transporteurs: Transporteur[];
    statsOverview?: {
        total: number;
        online: number;
        active: number;
        blocked: number;
        trash?: number;
        corbeille?: number;
    };
    initialSearch?: string;
    initialWilaya?: string;
    initialCategory?: string;
    initialStatus?: string;
}

const DEFAULT_CATEGORY_TABS = [
    { id: "", label: "Toutes catégories", icon: "🌐" },
    { id: "hilux", label: "Hilux / Pick-up", icon: "🛻" },
    { id: "camion", label: "Camions & Fret", icon: "🚛" },
    { id: "utilitaire", label: "Utilitaires / Dokker", icon: "📦" },
    { id: "confort", label: "Confort VIP", icon: "👑" },
    { id: "classique", label: "Classique Éco", icon: "🚗" },
];

export default function TransporteursView({
    transporteurs,
    statsOverview = { total: 0, online: 0, active: 0, blocked: 0, trash: 0, corbeille: 0 },
    initialSearch = "",
    initialWilaya = "",
    initialCategory = "",
    initialStatus = ""
}: TransporteursViewProps) {
    const router = useRouter();
    const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingTransporteur, setEditingTransporteur] = useState<Transporteur | null>(null);

    // Dynamic Categories for Tabs
    const [categoryTabs, setCategoryTabs] = useState<{ id: string; label: string; icon: string }[]>(
        DEFAULT_CATEGORY_TABS
    );

    useEffect(() => {
        let isMounted = true;
        getTransportCategories().then((cats) => {
            if (isMounted && cats && cats.length > 0) {
                setCategoryTabs([
                    { id: "", label: "Toutes catégories", icon: "🌐" },
                    ...cats.map((c) => ({
                        id: c.slug,
                        label: c.name,
                        icon: c.icon || "🛻",
                    })),
                ]);
            }
        });
        return () => {
            isMounted = false;
        };
    }, []);

    // Filter states
    const [search, setSearch] = useState(initialSearch);
    const [wilaya, setWilaya] = useState(initialWilaya);
    const [category, setCategory] = useState(initialCategory);
    const [status, setStatus] = useState(initialStatus);

    const isTrashView = status === "trash" || status === "corbeille";
    const trashCount = statsOverview.trash ?? statsOverview.corbeille ?? 0;

    const applyFilters = (newCategory?: string, newStatus?: string) => {
        const catVal = newCategory !== undefined ? newCategory : category;
        const statusVal = newStatus !== undefined ? newStatus : status;
        const params = new URLSearchParams();
        if (search) params.set("search", search);
        if (wilaya) params.set("wilaya", wilaya);
        if (catVal) params.set("category", catVal);
        if (statusVal) params.set("status", statusVal);
        router.push(`/dashboard/transporteurs?${params.toString()}`);
    };

    const handleReset = () => {
        setSearch("");
        setWilaya("");
        setCategory("");
        setStatus("");
        router.push("/dashboard/transporteurs");
    };

    const handleToggleStatus = async (
        id: number,
        action: "available" | "unavailable" | "block" | "unblock" | "activate" | "deactivate"
    ) => {
        const res = await toggleTransporteurStatus(id, action);
        if (res.success) {
            router.refresh();
        }
    };

    // Soft delete (Move to Corbeille)
    const handleDelete = async (t: Transporteur) => {
        if (confirm(`Voulez-vous déplacer le transporteur ${t.driver_name} dans la corbeille ?`)) {
            const res = await deleteTransporteur(t.id);
            if (res.success) {
                router.refresh();
            }
        }
    };

    // Restore from Corbeille
    const handleRestore = async (t: Transporteur) => {
        const res = await restoreTransporteur(t.id);
        if (res.success) {
            router.refresh();
        }
    };

    // Permanent hard delete
    const handleHardDelete = async (t: Transporteur) => {
        if (
            confirm(
                `ATTENTION : Voulez-vous supprimer DÉFINITIVEMENT le transporteur ${t.driver_name} ? Cette action est irréversible.`
            )
        ) {
            const res = await hardDeleteTransporteur(t.id);
            if (res.success) {
                router.refresh();
            }
        }
    };

    // Empty entire trash
    const handleEmptyTrash = async () => {
        if (
            confirm(
                "ATTENTION : Êtes-vous sûr de vouloir vider complètement la corbeille ? Tous les transporteurs dans la corbeille seront supprimés définitivement."
            )
        ) {
            const res = await emptyTrashTransporteurs();
            if (res.success) {
                router.refresh();
            }
        }
    };

    return (
        <div className="space-y-6 pb-12">
            {/* Top Bar Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-slate-200/80 dark:border-zinc-800 shadow-sm">
                <div>
                    <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-2xl text-white shadow-md ${
                            isTrashView
                                ? "bg-gradient-to-br from-rose-500 to-red-600 shadow-rose-500/20"
                                : "bg-gradient-to-br from-amber-500 to-amber-600 shadow-amber-500/20"
                        }`}>
                            {isTrashView ? <FaTrash className="text-2xl" /> : <FaTruck className="text-2xl" />}
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-800 dark:text-zinc-100 flex items-center gap-2">
                                {isTrashView ? "Corbeille des Transporteurs" : "Transporteurs & Fret"}
                                <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                                    isTrashView
                                        ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30"
                                        : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
                                }`}>
                                    {isTrashView ? "Corbeille" : "Partenaires Transport"}
                                </span>
                            </h1>
                            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                                {isTrashView
                                    ? "Consultez, restaurez ou supprimez définitivement les transporteurs placés dans la corbeille."
                                    : "Gestion des transporteurs Hilux, Camions, Utilitaires et fret affichés dans l'application mobile."}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* View Switcher */}
                    <div className="flex items-center bg-slate-100 dark:bg-zinc-800 p-1 rounded-2xl border border-slate-200 dark:border-zinc-700">
                        <button
                            onClick={() => setViewMode("grid")}
                            className={`p-2 rounded-xl transition text-xs flex items-center gap-1.5 font-bold ${
                                viewMode === "grid"
                                    ? "bg-white dark:bg-zinc-900 text-amber-600 dark:text-amber-400 shadow-sm"
                                    : "text-slate-500 dark:text-zinc-400 hover:text-slate-800"
                            }`}
                        >
                            <FaThLarge /> Cartes
                        </button>
                        <button
                            onClick={() => setViewMode("table")}
                            className={`p-2 rounded-xl transition text-xs flex items-center gap-1.5 font-bold ${
                                viewMode === "table"
                                    ? "bg-white dark:bg-zinc-900 text-amber-600 dark:text-amber-400 shadow-sm"
                                    : "text-slate-500 dark:text-zinc-400 hover:text-slate-800"
                            }`}
                        >
                            <FaThList /> Tableau
                        </button>
                    </div>

                    {/* Trash shortcut button in header */}
                    <button
                        onClick={() => {
                            const newStatus = isTrashView ? "" : "trash";
                            setStatus(newStatus);
                            applyFilters(undefined, newStatus);
                        }}
                        className={`px-4 py-2.5 rounded-2xl font-bold text-xs transition flex items-center gap-2 border ${
                            isTrashView
                                ? "bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-500/20"
                                : "bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:border-rose-400 hover:text-rose-600"
                        }`}
                        title={isTrashView ? "Retourner aux transporteurs actifs" : "Voir la corbeille"}
                    >
                        <FaTrash />
                        <span>Corbeille</span>
                        {trashCount > 0 && (
                            <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-black ${
                                isTrashView ? "bg-white text-rose-600" : "bg-rose-500 text-white"
                            }`}>
                                {trashCount}
                            </span>
                        )}
                    </button>

                    {/* Add Button */}
                    {!isTrashView && (
                        <button
                            onClick={() => {
                                setEditingTransporteur(null);
                                setIsCreateModalOpen(true);
                            }}
                            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs shadow-lg shadow-amber-500/25 transition flex items-center gap-2 hover:scale-[1.02]"
                        >
                            <FaPlus /> + Nouveau Transporteur
                        </button>
                    )}
                </div>
            </div>

            {/* KPI Statistics */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div
                    onClick={() => {
                        if (isTrashView) {
                            setStatus("");
                            applyFilters(undefined, "");
                        }
                    }}
                    className={`p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-sm transition ${
                        isTrashView ? "cursor-pointer hover:border-amber-400" : ""
                    }`}
                >
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Transporteurs</p>
                    <div className="flex items-baseline justify-between mt-2">
                        <span className="text-3xl font-black text-slate-800 dark:text-zinc-100">
                            {statsOverview.total}
                        </span>
                        <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                            <FaTruck />
                        </span>
                    </div>
                </div>

                <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-sm">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Comptes Actifs</p>
                    <div className="flex items-baseline justify-between mt-2">
                        <span className="text-3xl font-black text-blue-600 dark:text-blue-400">
                            {statsOverview.active}
                        </span>
                        <span className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                            <FaUserCheck />
                        </span>
                    </div>
                </div>

                <div
                    onClick={() => {
                        setStatus("blocked");
                        applyFilters(undefined, "blocked");
                    }}
                    className="p-5 rounded-3xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 shadow-sm cursor-pointer hover:border-rose-400 transition"
                >
                    <p className="text-xs font-bold text-rose-500 uppercase tracking-wider">Bloqués</p>
                    <div className="flex items-baseline justify-between mt-2">
                        <span className="text-3xl font-black text-rose-600 dark:text-rose-400">
                            {statsOverview.blocked}
                        </span>
                        <span className="p-2 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400">
                            <FaBan />
                        </span>
                    </div>
                </div>

                <div
                    onClick={() => {
                        const newStatus = isTrashView ? "" : "trash";
                        setStatus(newStatus);
                        applyFilters(undefined, newStatus);
                    }}
                    className={`p-5 rounded-3xl border shadow-sm transition-all cursor-pointer ${
                        isTrashView
                            ? "bg-rose-100/70 dark:bg-rose-950/50 border-rose-500 shadow-rose-500/15 ring-2 ring-rose-400/40"
                            : "bg-white dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 hover:border-rose-400 hover:scale-[1.02]"
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Corbeille</p>
                        <span className={`p-2 rounded-xl transition ${
                            isTrashView ? "bg-rose-500 text-white" : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                        }`}>
                            <FaTrash />
                        </span>
                    </div>
                    <div className="flex items-baseline justify-between mt-2">
                        <span className="text-3xl font-black text-rose-600 dark:text-rose-400">
                            {trashCount}
                        </span>
                        <span className="text-[11px] font-bold text-slate-500 hover:underline">
                            {isTrashView ? "← Actifs" : "Voir corbeille"}
                        </span>
                    </div>
                </div>
            </div>

            {/* Trash Alert Banner */}
            {isTrashView && (
                <div className="p-5 rounded-3xl bg-gradient-to-r from-rose-50 to-red-50 dark:from-rose-950/40 dark:to-red-950/30 border-2 border-rose-300 dark:border-rose-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-rose-500 text-white rounded-2xl text-xl shrink-0 shadow-md shadow-rose-500/20">
                            <FaTrash />
                        </div>
                        <div>
                            <h4 className="font-extrabold text-sm text-rose-900 dark:text-rose-200">
                                Éléments dans la Corbeille ({transporteurs.length})
                            </h4>
                            <p className="text-xs text-rose-700 dark:text-rose-300 mt-0.5">
                                Ces transporteurs sont retirés de l&apos;application mobile et ne reçoivent plus de commandes. Vous pouvez les restaurer à tout moment ou les supprimer définitivement.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        {transporteurs.length > 0 && (
                            <button
                                onClick={handleEmptyTrash}
                                className="px-4 py-2 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-rose-600/20 hover:scale-[1.02]"
                            >
                                <FaTrash /> Vider la corbeille
                            </button>
                        )}
                        <button
                            onClick={() => {
                                setStatus("");
                                applyFilters(undefined, "");
                            }}
                            className="px-4 py-2 rounded-2xl bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 text-xs font-bold transition border border-slate-200 dark:border-zinc-700 shadow-sm"
                        >
                            ← Retour à la liste
                        </button>
                    </div>
                </div>
            )}

            {/* Category Filter Pills (when not in trash) */}
            {!isTrashView && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                    {categoryTabs.map((tab) => {
                        const isActive = category === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    setCategory(tab.id);
                                    applyFilters(tab.id);
                                }}
                                className={`px-4 py-2 rounded-2xl text-xs font-bold transition shrink-0 flex items-center gap-2 border ${
                                    isActive
                                        ? "bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20"
                                        : "bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border-slate-200/80 dark:border-zinc-800 hover:border-amber-500/50"
                                }`}
                            >
                                <span>{tab.icon}</span>
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Filter Bar */}
            <div className="bg-white dark:bg-zinc-900 p-4 rounded-3xl border border-slate-200/80 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row items-center gap-3">
                {/* Search */}
                <div className="relative flex-1 w-full">
                    <FaSearch className="absolute left-3.5 top-3 text-slate-400 text-xs" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && applyFilters()}
                        placeholder="Rechercher par chauffeur, téléphone, véhicule, badge..."
                        className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                    />
                </div>

                {/* Wilaya Filter */}
                <div className="w-full md:w-48">
                    <select
                        value={wilaya}
                        onChange={(e) => {
                            setWilaya(e.target.value);
                        }}
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500/40 capitalize"
                    >
                        <option value="">Toutes les Wilayas</option>
                        {Wilaya.map((w) => (
                            <option key={w.code} value={w.name}>
                                {w.code} - {w.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Status Filter */}
                <div className="w-full md:w-48">
                    <select
                        value={status}
                        onChange={(e) => {
                            setStatus(e.target.value);
                        }}
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                    >
                        <option value="">Tous les statuts</option>
                        <option value="active">Actif</option>
                        <option value="blocked">Bloqué</option>
                        <option value="trash">🗑️ Corbeille ({trashCount})</option>
                    </select>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <button
                        onClick={() => applyFilters()}
                        className="flex-1 md:flex-none px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
                    >
                        <FaFilter /> Filtrer
                    </button>
                    <button
                        onClick={handleReset}
                        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 bg-slate-100 dark:bg-zinc-800 rounded-2xl transition"
                        title="Réinitialiser les filtres"
                    >
                        <FaRedo className="text-xs" />
                    </button>
                </div>
            </div>

            {/* Content List (Grid or Table) */}
            {transporteurs.length === 0 ? (
                <div className="bg-white dark:bg-zinc-900 rounded-3xl p-12 text-center border border-slate-200/80 dark:border-zinc-800">
                    <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center text-2xl mb-4 ${
                        isTrashView ? "bg-rose-500/10 text-rose-500" : "bg-amber-500/10 text-amber-500"
                    }`}>
                        {isTrashView ? <FaTrash /> : <FaTruck />}
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-zinc-100">
                        {isTrashView ? "La corbeille est vide" : "Aucun transporteur trouvé"}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
                        {isTrashView
                            ? "Aucun transporteur n'a été placé dans la corbeille."
                            : "Aucun résultat ne correspond à vos filtres actuels. Cliquez sur le bouton ci-dessous pour ajouter votre premier transporteur."}
                    </p>
                    {!isTrashView && (
                        <button
                            onClick={() => {
                                setEditingTransporteur(null);
                                setIsCreateModalOpen(true);
                            }}
                            className="mt-5 px-5 py-2.5 rounded-2xl bg-amber-500 text-white text-xs font-bold shadow-md shadow-amber-500/20 transition hover:bg-amber-600 inline-flex items-center gap-2"
                        >
                            <FaPlus /> Ajouter un Transporteur
                        </button>
                    )}
                </div>
            ) : viewMode === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {transporteurs.map((t) => {
                        const isBlocked = t.is_blocked;
                        const isOnline = !t.is_blocked;

                        return (
                            <div
                                key={t.id}
                                className={`rounded-3xl border p-5 shadow-sm transition-all flex flex-col justify-between group relative overflow-hidden ${
                                    isTrashView
                                        ? "bg-slate-50/80 dark:bg-zinc-900/80 border-slate-300 dark:border-zinc-800 opacity-90"
                                        : isBlocked
                                        ? "bg-gradient-to-br from-rose-50/90 via-red-50/40 to-white dark:from-rose-950/40 dark:via-zinc-900 dark:to-zinc-900 border-2 border-red-500/90 dark:border-red-600 shadow-md shadow-red-500/10"
                                        : "bg-white dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 hover:shadow-md"
                                }`}
                            >
                                <div>
                                    {/* Blocked Banner in Card when blocked */}
                                    {isBlocked && !isTrashView && (
                                        <div className="mb-3 px-3 py-1.5 rounded-2xl bg-red-500/15 border border-red-500/40 flex items-center justify-between text-red-600 dark:text-red-400">
                                            <span className="text-[11px] font-black flex items-center gap-1.5">
                                                <FaBan className="text-xs" /> Compte Bloqué
                                            </span>
                                            <span className="text-[10px] font-extrabold uppercase tracking-wider bg-red-500 text-white px-2 py-0.5 rounded-full">
                                                Bloqué
                                            </span>
                                        </div>
                                    )}

                                    {/* Trash Banner in Card when in trash */}
                                    {isTrashView && (
                                        <div className="mb-3 px-3 py-1.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-between text-rose-600 dark:text-rose-400">
                                            <span className="text-[11px] font-black flex items-center gap-1.5">
                                                <FaTrash className="text-xs" /> Dans la corbeille
                                            </span>
                                            {t.deleted_at && (
                                                <span className="text-[10px] text-slate-400">
                                                    {new Date(t.deleted_at).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    {/* Top Driver Row */}
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="relative shrink-0">
                                                <div className={`w-12 h-12 rounded-2xl overflow-hidden flex items-center justify-center font-black ${
                                                    isBlocked && !isTrashView
                                                        ? "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400 border border-red-300 dark:border-red-800"
                                                        : "bg-slate-100 dark:bg-zinc-800 text-amber-600"
                                                }`}>
                                                    {t.driver_photo ? (
                                                        <img
                                                            src={t.driver_photo}
                                                            alt={t.driver_name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        t.driver_name.slice(0, 2).toUpperCase()
                                                    )}
                                                </div>
                                                <div
                                                    className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-zinc-900 ${
                                                        isTrashView
                                                            ? "bg-slate-400"
                                                            : isBlocked
                                                            ? "bg-red-500 ring-2 ring-red-300 dark:ring-red-900"
                                                            : isOnline
                                                            ? "bg-emerald-500"
                                                            : "bg-slate-400"
                                                    }`}
                                                />
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className={`text-sm font-bold truncate ${
                                                    isBlocked && !isTrashView
                                                        ? "text-red-950 dark:text-red-200"
                                                        : "text-slate-800 dark:text-zinc-100"
                                                }`}>
                                                    {t.driver_name}
                                                </h3>
                                                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-zinc-400">
                                                    <span className="flex items-center gap-1 text-amber-500 font-bold">
                                                        <FaStar className="text-[10px]" /> {t.driver_rating}
                                                    </span>
                                                    <span>•</span>
                                                    <span className="capitalize">
                                                        {t.commune ? `${t.wilaya} (${t.commune})` : t.wilaya || "Algérie"}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Badge */}
                                        <span
                                            className="px-2.5 py-1 text-[10px] font-extrabold rounded-full border shrink-0"
                                            style={{
                                                backgroundColor: `${t.badge_color}18`,
                                                color: t.badge_color,
                                                borderColor: `${t.badge_color}40`
                                            }}
                                        >
                                            {t.badge}
                                        </span>
                                    </div>

                                    {/* Vehicle showcase */}
                                    <div className={`mt-4 p-3 rounded-2xl border flex items-center gap-3 ${
                                        isBlocked && !isTrashView
                                            ? "bg-red-100/40 dark:bg-red-950/30 border-red-200/80 dark:border-red-900/50"
                                            : "bg-slate-50 dark:bg-zinc-800/60 border-slate-100 dark:border-zinc-800"
                                    }`}>
                                        <div className="w-16 h-12 rounded-xl bg-slate-200 dark:bg-zinc-700 overflow-hidden shrink-0 flex items-center justify-center text-slate-400">
                                            {t.vehicle_image ? (
                                                <img
                                                    src={t.vehicle_image}
                                                    alt={t.vehicle_name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <FaTruck className="text-xl text-slate-400" />
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs font-bold text-slate-800 dark:text-zinc-200 truncate">
                                                {t.vehicle_name}
                                            </p>
                                            <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                                                Année {t.vehicle_year} • {t.category_label}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    {t.description && (
                                        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-3 line-clamp-2">
                                            {t.description}
                                        </p>
                                    )}

                                    {/* Details row: Price & ETA */}
                                    <div className="flex items-center justify-between mt-3 text-xs">
                                        <div className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-xl">
                                            <FaMoneyBillWave className="text-[10px]" />
                                            <span>{t.price_estimate}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-slate-500 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-800 px-2.5 py-1 rounded-xl font-semibold">
                                            <FaClock className="text-[10px] text-amber-500" />
                                            <span>~{t.eta_minutes} min</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer Contact & Actions */}
                                <div className={`mt-4 pt-3 border-t flex items-center justify-between ${
                                    isBlocked && !isTrashView
                                        ? "border-red-200 dark:border-red-900/50"
                                        : "border-slate-100 dark:border-zinc-800"
                                }`}>
                                    <a
                                        href={`tel:${t.phone_number_1}`}
                                        className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline"
                                    >
                                        <FaPhoneAlt className="text-[10px]" />
                                        <span>{t.phone_number_1}</span>
                                    </a>

                                    {/* Actions */}
                                    {isTrashView ? (
                                        <div className="flex items-center gap-2">
                                            {/* Restore button */}
                                            <button
                                                onClick={() => handleRestore(t)}
                                                className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                                                title="Restaurer ce transporteur"
                                            >
                                                <FaUndo className="text-[10px]" /> Restaurer
                                            </button>
                                            {/* Permanent delete button */}
                                            <button
                                                onClick={() => handleHardDelete(t)}
                                                className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                                                title="Supprimer définitivement"
                                            >
                                                <FaTrash className="text-[10px]" /> Supprimer
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1">
                                            {/* Toggle Block */}
                                            <button
                                                onClick={() =>
                                                    handleToggleStatus(
                                                        t.id,
                                                        t.is_blocked ? "unblock" : "block"
                                                    )
                                                }
                                                className={`p-2 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                                                    t.is_blocked
                                                        ? "bg-rose-600 text-white hover:bg-rose-700 shadow-sm shadow-rose-600/30"
                                                        : "bg-slate-100 dark:bg-zinc-800 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                                                }`}
                                                title={t.is_blocked ? "Débloquer le compte" : "Bloquer le compte"}
                                            >
                                                <FaBan />
                                            </button>

                                            {/* Edit */}
                                            <button
                                                onClick={() => {
                                                    setEditingTransporteur(t);
                                                    setIsCreateModalOpen(true);
                                                }}
                                                className="p-2 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 hover:text-amber-600 transition"
                                                title="Modifier"
                                            >
                                                <FaEdit />
                                            </button>

                                            {/* Soft Delete -> Corbeille */}
                                            <button
                                                onClick={() => handleDelete(t)}
                                                className="p-2 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 hover:text-rose-600 transition"
                                                title="Déplacer dans la corbeille"
                                            >
                                                <FaTrash />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                /* Table View */
                <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200/80 dark:border-zinc-800 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 dark:bg-zinc-800/60 text-slate-400 uppercase tracking-wider font-bold border-b border-slate-100 dark:border-zinc-800">
                                <tr>
                                    <th className="py-3.5 px-4">Chauffeur</th>
                                    <th className="py-3.5 px-4">Contact</th>
                                    <th className="py-3.5 px-4">Véhicule</th>
                                    <th className="py-3.5 px-4">Catégorie & Badge</th>
                                    <th className="py-3.5 px-4">Tarif estimé</th>
                                    <th className="py-3.5 px-4">Statut</th>
                                    <th className="py-3.5 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                                {transporteurs.map((t) => {
                                    const isBlocked = t.is_blocked;

                                    return (
                                        <tr
                                            key={t.id}
                                            className={
                                                isTrashView
                                                    ? "bg-slate-50/50 dark:bg-zinc-800/20 opacity-90 hover:bg-slate-100/60"
                                                    : isBlocked
                                                    ? "bg-rose-50/70 dark:bg-rose-950/30 hover:bg-rose-100/70 dark:hover:bg-rose-950/50 border-l-4 border-l-red-500 transition"
                                                    : "hover:bg-slate-50/50 dark:hover:bg-zinc-800/40 transition"
                                            }
                                        >
                                            <td className="py-3.5 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="relative">
                                                        <div className={`w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center font-bold ${
                                                            isBlocked && !isTrashView
                                                                ? "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400"
                                                                : "bg-slate-100 dark:bg-zinc-800 text-amber-600"
                                                        }`}>
                                                            {t.driver_photo ? (
                                                                <img
                                                                    src={t.driver_photo}
                                                                    alt={t.driver_name}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                t.driver_name.slice(0, 2).toUpperCase()
                                                            )}
                                                        </div>
                                                        <div
                                                            className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-white dark:border-zinc-900 ${
                                                                isTrashView
                                                                    ? "bg-slate-400"
                                                                    : isBlocked
                                                                    ? "bg-red-500"
                                                                    : "bg-emerald-500"
                                                            }`}
                                                        />
                                                    </div>
                                                    <div>
                                                        <p className={`font-bold ${
                                                            isBlocked && !isTrashView
                                                                ? "text-red-950 dark:text-red-200"
                                                                : "text-slate-800 dark:text-zinc-100"
                                                        }`}>
                                                            {t.driver_name}
                                                        </p>
                                                        <p className="text-[11px] text-slate-400">
                                                            @{t.username}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <p className="font-bold text-slate-700 dark:text-zinc-200">
                                                    {t.phone_number_1}
                                                </p>
                                                <p className="text-[11px] text-slate-400 capitalize">
                                                    {t.commune ? `${t.wilaya} (${t.commune})` : t.wilaya || "Algérie"}
                                                </p>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <p className="font-bold text-slate-700 dark:text-zinc-200">
                                                    {t.vehicle_name}
                                                </p>
                                                <p className="text-[11px] text-slate-400">
                                                    Année {t.vehicle_year}
                                                </p>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <span
                                                    className="inline-block px-2.5 py-0.5 text-[10px] font-extrabold rounded-full border"
                                                    style={{
                                                        backgroundColor: `${t.badge_color}18`,
                                                        color: t.badge_color,
                                                        borderColor: `${t.badge_color}40`
                                                    }}
                                                >
                                                    {t.badge}
                                                </span>
                                                <p className="text-[11px] text-slate-400 mt-0.5">
                                                    {t.category_label}
                                                </p>
                                            </td>
                                            <td className="py-3.5 px-4 font-bold text-emerald-600 dark:text-emerald-400">
                                                {t.price_estimate}
                                            </td>
                                            <td className="py-3.5 px-4">
                                                {isTrashView ? (
                                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 flex items-center gap-1 w-fit">
                                                        <FaTrash className="text-[9px]" /> Corbeille
                                                    </span>
                                                ) : isBlocked ? (
                                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-red-500 text-white shadow-xs flex items-center gap-1 w-fit">
                                                        <FaBan className="text-[9px]" /> Bloqué
                                                    </span>
                                                ) : (
                                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center gap-1 w-fit">
                                                        <FaCheckCircle className="text-[9px]" /> Actif
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-4 text-right">
                                                {isTrashView ? (
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => handleRestore(t)}
                                                            className="px-2.5 py-1 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-bold transition flex items-center gap-1 shadow-sm"
                                                            title="Restaurer"
                                                        >
                                                            <FaUndo className="text-[9px]" /> Restaurer
                                                        </button>
                                                        <button
                                                            onClick={() => handleHardDelete(t)}
                                                            className="px-2.5 py-1 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold transition flex items-center gap-1 shadow-sm"
                                                            title="Supprimer définitivement"
                                                        >
                                                            <FaTrash className="text-[9px]" /> Supprimer
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-end gap-1">
                                                        {/* Toggle Block */}
                                                        <button
                                                            onClick={() =>
                                                                handleToggleStatus(
                                                                    t.id,
                                                                    t.is_blocked ? "unblock" : "block"
                                                                )
                                                            }
                                                            className={`p-2 rounded-xl text-xs transition ${
                                                                t.is_blocked
                                                                    ? "bg-rose-600 text-white hover:bg-rose-700"
                                                                    : "bg-slate-100 dark:bg-zinc-800 text-slate-400 hover:text-rose-500"
                                                            }`}
                                                            title={t.is_blocked ? "Débloquer le compte" : "Bloquer le compte"}
                                                        >
                                                            <FaBan />
                                                        </button>

                                                        {/* Edit */}
                                                        <button
                                                            onClick={() => {
                                                                setEditingTransporteur(t);
                                                                setIsCreateModalOpen(true);
                                                            }}
                                                            className="p-2 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-500 hover:text-amber-600 transition"
                                                            title="Modifier"
                                                        >
                                                            <FaEdit />
                                                        </button>

                                                        {/* Soft Delete -> Corbeille */}
                                                        <button
                                                            onClick={() => handleDelete(t)}
                                                            className="p-2 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-500 hover:text-rose-600 transition"
                                                            title="Déplacer dans la corbeille"
                                                        >
                                                            <FaTrash />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Create / Edit Modal */}
            {isCreateModalOpen && (
                <TransporteurCreateModal
                    onClose={() => {
                        setIsCreateModalOpen(false);
                        setEditingTransporteur(null);
                    }}
                    onSaved={() => {
                        router.refresh();
                    }}
                    initialData={editingTransporteur}
                    initialWilaya={wilaya}
                />
            )}
        </div>
    );
}
