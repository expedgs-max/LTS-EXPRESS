"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
    FaSearch,
    FaPlus,
    FaBullhorn,
    FaStore,
    FaLink,
    FaCalendarAlt,
    FaCheckCircle,
    FaTimesCircle,
    FaHourglassEnd,
    FaEdit,
    FaTrash,
    FaSyncAlt,
    FaMobileAlt,
    FaExternalLinkAlt,
    FaImage,
    FaTimes,
    FaToggleOn,
    FaToggleOff,
    FaCheck,
    FaInfoCircle,
    FaLayerGroup,
    FaMotorcycle,
    FaCar,
    FaUser,
    FaTag,
    FaFire
} from "react-icons/fa";
import {
    ConfirmationPublicite,
    ConfirmationPubliciteStats,
    ConfirmationPubliciteMagasin,
    getConfirmationPublicites,
    createConfirmationPublicite,
    updateConfirmationPublicite,
    deleteConfirmationPublicite,
    toggleConfirmationPubliciteStatus,
    getConfirmationPubliciteMagasins
} from "@/lib/confirmation_action";
import toast from "react-hot-toast";

interface ConfirmationPublicitesProps {
    initialPublicites: ConfirmationPublicite[];
    initialStats: ConfirmationPubliciteStats;
    token?: string;
    initialSearch?: string;
    currentPage?: number;
    totalPages?: number;
}

export default function ConfirmationPublicitesComponent({
    initialPublicites,
    initialStats,
    initialSearch = "",
}: ConfirmationPublicitesProps) {
    const [publicites, setPublicites] = useState<ConfirmationPublicite[]>(initialPublicites);
    const [stats, setStats] = useState<ConfirmationPubliciteStats>(initialStats);
    const [searchQuery, setSearchQuery] = useState<string>(initialSearch);
    const [statusFilter, setStatusFilter] = useState<string>("");
    const [wilayaFilter, setWilayaFilter] = useState<string>("");
    const [targetFilter, setTargetFilter] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

    // Modal Create / Edit
    const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
    const [editingPublicite, setEditingPublicite] = useState<ConfirmationPublicite | null>(null);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    // Form fields
    const [name, setName] = useState<string>("");
    const [description, setDescription] = useState<string>("");
    const [target, setTarget] = useState<"client" | "livreur" | "chauffeur">("client");
    const [badgeTag, setBadgeTag] = useState<string>("");
    const [ctaText, setCtaText] = useState<string>("En savoir plus");
    const [linkType, setLinkType] = useState<"magasin" | "link" | "none">("magasin");
    const [selectedMagasinId, setSelectedMagasinId] = useState<number | null>(null);
    const [externalLink, setExternalLink] = useState<string>("");
    const [dateExpires, setDateExpires] = useState<string>("");
    const [isActive, setIsActive] = useState<boolean>(true);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    // Magasins Search in Form
    const [magasinsList, setMagasinsList] = useState<ConfirmationPubliciteMagasin[]>([]);
    const [magasinSearch, setMagasinSearch] = useState<string>("");
    const [isLoadingMagasins, setIsLoadingMagasins] = useState<boolean>(false);

    // Modal Delete
    const [deletingPublicite, setDeletingPublicite] = useState<ConfirmationPublicite | null>(null);

    // Modal Mobile Simulation Preview
    const [isMobilePreviewOpen, setIsMobilePreviewOpen] = useState<boolean>(false);
    const [activeMobileAdIndex, setActiveMobileAdIndex] = useState<number>(0);
    const [mobilePreviewTarget, setMobilePreviewTarget] = useState<"client" | "livreur" | "chauffeur">("client");

    const fileInputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        setPublicites(initialPublicites);
        setStats(initialStats);
    }, [initialPublicites, initialStats]);

    // Fetch publicites from backend
    const fetchPublicites = async (
        searchVal = searchQuery,
        statusVal = statusFilter,
        wilayaVal = wilayaFilter,
        targetVal = targetFilter
    ) => {
        setIsLoading(true);
        try {
            const res = await getConfirmationPublicites({
                search: searchVal,
                status: statusVal,
                wilaya: wilayaVal,
                target: targetVal,
                page: 1,
                page_size: 50
            });
            if (res && res.success) {
                setPublicites(res.data);
                setStats(res.stats);
            }
        } catch {
            toast.error("Erreur lors de la récupération des publicités");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        fetchPublicites(searchQuery, statusFilter, wilayaFilter, targetFilter);
    };

    // Open Modal to Create
    const handleOpenCreateModal = async () => {
        setEditingPublicite(null);
        setName("");
        setDescription("");
        setTarget("client");
        setBadgeTag("");
        setCtaText("En savoir plus");
        setLinkType("magasin");
        setSelectedMagasinId(null);
        setExternalLink("");
        setIsActive(true);
        setImageFile(null);
        setImagePreview(null);

        // Default expiration: +30 days
        const defaultExp = new Date();
        defaultExp.setDate(defaultExp.getDate() + 30);
        setDateExpires(defaultExp.toISOString().slice(0, 16));

        setIsFormModalOpen(true);
        loadMagasins("");
    };

    // Open Modal to Edit
    const handleOpenEditModal = (pub: ConfirmationPublicite) => {
        setEditingPublicite(pub);
        setName(pub.name || "");
        setDescription(pub.description || "");
        setTarget(pub.target || "client");
        setBadgeTag(pub.badge_tag || "");
        setCtaText(pub.cta_text || "En savoir plus");

        if (pub.magasin) {
            setLinkType("magasin");
            setSelectedMagasinId(pub.magasin.id);
            setExternalLink("");
        } else if (pub.lien) {
            setLinkType("link");
            setSelectedMagasinId(null);
            setExternalLink(pub.lien);
        } else {
            setLinkType("none");
            setSelectedMagasinId(null);
            setExternalLink("");
        }

        setIsActive(pub.is_active);
        setImageFile(null);
        setImagePreview(pub.image_url || null);

        if (pub.date_expires) {
            const dt = new Date(pub.date_expires);
            setDateExpires(dt.toISOString().slice(0, 16));
        } else {
            setDateExpires("");
        }

        setIsFormModalOpen(true);
        loadMagasins("");
    };

    // Load magasins for select dropdown
    const loadMagasins = async (search = "") => {
        setIsLoadingMagasins(true);
        try {
            const data = await getConfirmationPubliciteMagasins(search);
            setMagasinsList(data);
        } catch {
            toast.error("Erreur chargement magasins");
        } finally {
            setIsLoadingMagasins(false);
        }
    };

    // Image Upload handler
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (!file.type.startsWith("image/")) {
                toast.error("Veuillez sélectionner un fichier image valide.");
                return;
            }
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    // Quick set expiration helper
    const handleSetDays = (days: number) => {
        const d = new Date();
        d.setDate(d.getDate() + days);
        setDateExpires(d.toISOString().slice(0, 16));
    };

    // Submit Form (Create / Update)
    const handleSubmitForm = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            toast.error("Le titre de la publicité est obligatoire.");
            return;
        }
        if (!dateExpires) {
            toast.error("La date d'expiration est requise.");
            return;
        }

        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append("name", name.trim());
            formData.append("description", description.trim());
            formData.append("target", target);
            if (badgeTag.trim()) formData.append("badge_tag", badgeTag.trim());
            if (ctaText.trim()) formData.append("cta_text", ctaText.trim());
            formData.append("date_expires", dateExpires);
            formData.append("is_active", isActive ? "true" : "false");

            if (linkType === "magasin" && selectedMagasinId) {
                formData.append("magasin_id", selectedMagasinId.toString());
                formData.append("lien", "");
            } else if (linkType === "link" && externalLink.trim()) {
                formData.append("lien", externalLink.trim());
                formData.append("magasin_id", "");
            } else {
                formData.append("magasin_id", "");
                formData.append("lien", "");
            }

            if (imageFile) {
                formData.append("image", imageFile);
            }

            if (editingPublicite) {
                const res = await updateConfirmationPublicite(editingPublicite.id, formData);
                if (res.success) {
                    setIsFormModalOpen(false);
                    fetchPublicites();
                }
            } else {
                if (!imageFile && !imagePreview) {
                    toast.error("Veuillez téléverser une image de bannière publicitaire.");
                    setIsSubmitting(false);
                    return;
                }
                const res = await createConfirmationPublicite(formData);
                if (res.success) {
                    setIsFormModalOpen(false);
                    fetchPublicites();
                }
            }
        } catch {
            toast.error("Une erreur s'est produite lors de l'enregistrement.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Toggle Status
    const handleToggleStatus = async (pub: ConfirmationPublicite) => {
        try {
            const res = await toggleConfirmationPubliciteStatus(pub.id);
            if (res.success) {
                setPublicites((prev) =>
                    prev.map((item) =>
                        item.id === pub.id
                            ? {
                                ...item,
                                is_active: res.is_active ?? !item.is_active,
                                status: !res.is_active ? "inactive" : item.is_expired ? "expired" : "active",
                                status_label: !res.is_active ? "Désactivée" : item.is_expired ? "Expirée" : "Active"
                            }
                            : item
                    )
                );
                setStats((prev) => ({
                    ...prev,
                    active_publicites: res.is_active ? prev.active_publicites + 1 : Math.max(0, prev.active_publicites - 1),
                    inactive_publicites: !res.is_active ? prev.inactive_publicites + 1 : Math.max(0, prev.inactive_publicites - 1)
                }));
            }
        } catch {
            toast.error("Erreur lors de la modification du statut");
        }
    };

    // Delete Publicité
    const handleDelete = async () => {
        if (!deletingPublicite) return;
        setIsSubmitting(true);
        try {
            const res = await deleteConfirmationPublicite(deletingPublicite.id);
            if (res.success) {
                setDeletingPublicite(null);
                fetchPublicites();
            }
        } catch {
            toast.error("Erreur lors de la suppression");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Format date display
    const formatDate = (dateStr?: string | null) => {
        if (!dateStr) return "Non définie";
        try {
            const d = new Date(dateStr);
            return d.toLocaleDateString("fr-FR", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            });
        } catch {
            return dateStr;
        }
    };

    const getDaysRemaining = (dateStr?: string | null) => {
        if (!dateStr) return null;
        try {
            const exp = new Date(dateStr).getTime();
            const now = new Date().getTime();
            const diffDays = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
            return diffDays;
        } catch {
            return null;
        }
    };

    return (
        <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto min-h-screen bg-slate-50/50 dark:bg-zinc-950">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-slate-200/80 dark:border-zinc-800 shadow-sm">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-tr from-pink-500 to-rose-600 rounded-2xl text-white shadow-lg shadow-pink-500/30">
                            <FaBullhorn className="text-2xl" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                                Publicités & Bannières Mobile
                            </h1>
                            <p className="text-sm text-slate-500 dark:text-zinc-400 mt-0.5 font-medium">
                                Gestion des bannières publicitaires affichées sur l&apos;accueil de l&apos;application mobile LTC
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                    {/* <button
                        onClick={() => setIsMobilePreviewOpen(true)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 dark:text-indigo-300 font-semibold text-sm transition-all shadow-xs border border-indigo-200/60 dark:border-indigo-800/40"
                    >
                        <FaMobileAlt className="text-base" />
                        <span>Aperçu Mobile Live</span>
                    </button> */}

                    <button
                        onClick={handleOpenCreateModal}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold text-sm shadow-md shadow-red-600/30 hover:shadow-lg hover:shadow-red-600/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <FaPlus className="text-sm" />
                        <span>Nouvelle Publicité</span>
                    </button>
                </div>
            </div>

            {/* KPI Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 md:gap-4">
                {/* 1. Total Publicités */}
                <div className="bg-white dark:bg-zinc-900 p-4 md:p-5 rounded-3xl border border-slate-200/80 dark:border-zinc-800 shadow-xs flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                        <FaLayerGroup className="text-xl" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Total Bannières</p>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                            {stats.total_publicites}
                        </h3>
                    </div>
                </div>

                {/* 2. Actives */}
                <div className="bg-white dark:bg-zinc-900 p-4 md:p-5 rounded-3xl border border-slate-200/80 dark:border-zinc-800 shadow-xs flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                        <FaCheckCircle className="text-xl" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400">En Ligne / Actives</p>
                        <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                            {stats.active_publicites}
                        </h3>
                    </div>
                </div>

                {/* 3. Expirées */}
                <div className="bg-white dark:bg-zinc-900 p-4 md:p-5 rounded-3xl border border-slate-200/80 dark:border-zinc-800 shadow-xs flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                        <FaHourglassEnd className="text-xl" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Expirées</p>
                        <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-0.5">
                            {stats.expired_publicites}
                        </h3>
                    </div>
                </div>

                {/* 4. Désactivées */}
                <div className="bg-white dark:bg-zinc-900 p-4 md:p-5 rounded-3xl border border-slate-200/80 dark:border-zinc-800 shadow-xs flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
                        <FaTimesCircle className="text-xl" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Désactivées</p>
                        <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-0.5">
                            {stats.inactive_publicites}
                        </h3>
                    </div>
                </div>

                {/* 5. Magasins Liés */}
                <div className="col-span-2 lg:col-span-1 bg-white dark:bg-zinc-900 p-4 md:p-5 rounded-3xl border border-slate-200/80 dark:border-zinc-800 shadow-xs flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
                        <FaStore className="text-xl" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Magasins Ciblés</p>
                        <h3 className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-0.5">
                            {stats.total_magasins_linked}
                        </h3>
                    </div>
                </div>
            </div>

            {/* Target Role Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                <button
                    onClick={() => {
                        setTargetFilter("");
                        fetchPublicites(searchQuery, statusFilter, wilayaFilter, "");
                    }}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 ${
                        targetFilter === ""
                            ? "bg-slate-900 text-white dark:bg-white dark:text-zinc-900 shadow-md scale-[1.02]"
                            : "bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200/80 dark:border-zinc-800"
                    }`}
                >
                    <FaLayerGroup />
                    <span>Toutes les Cibles</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/20 text-current">
                        {stats.total_publicites}
                    </span>
                </button>

                <button
                    onClick={() => {
                        setTargetFilter("client");
                        fetchPublicites(searchQuery, statusFilter, wilayaFilter, "client");
                    }}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 ${
                        targetFilter === "client"
                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 scale-[1.02]"
                            : "bg-white dark:bg-zinc-900 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60"
                    }`}
                >
                    <FaUser />
                    <span>Clients (App Mobile)</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-indigo-500/20 text-current font-black">
                        {stats.client_publicites ?? 0}
                    </span>
                </button>

                <button
                    onClick={() => {
                        setTargetFilter("livreur");
                        fetchPublicites(searchQuery, statusFilter, wilayaFilter, "livreur");
                    }}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 ${
                        targetFilter === "livreur"
                            ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30 scale-[1.02]"
                            : "bg-white dark:bg-zinc-900 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60"
                    }`}
                >
                    <FaMotorcycle />
                    <span>Livreurs Food (Dashboard)</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-current font-black">
                        {stats.livreur_publicites ?? 0}
                    </span>
                </button>

                <button
                    onClick={() => {
                        setTargetFilter("chauffeur");
                        fetchPublicites(searchQuery, statusFilter, wilayaFilter, "chauffeur");
                    }}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 ${
                        targetFilter === "chauffeur"
                            ? "bg-amber-600 text-white shadow-md shadow-amber-600/30 scale-[1.02]"
                            : "bg-white dark:bg-zinc-900 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60"
                    }`}
                >
                    <FaCar />
                    <span>Chauffeurs VTC (Home)</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-current font-black">
                        {stats.chauffeur_publicites ?? 0}
                    </span>
                </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white dark:bg-zinc-900 p-4 rounded-3xl border border-slate-200/80 dark:border-zinc-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
                {/* Search input */}
                <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
                    <input
                        type="text"
                        placeholder="Rechercher par titre, description, tag..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-zinc-800 border-none rounded-2xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-red-500 outline-hidden font-medium"
                    />
                    <FaSearch className="absolute left-3.5 top-3.5 text-slate-400 text-sm" />
                </form>

                {/* Filters */}
                <div className="flex items-center gap-2.5 flex-wrap w-full md:w-auto">
                    {/* Status filter chips */}
                    <div className="flex items-center bg-slate-100 dark:bg-zinc-800 p-1 rounded-2xl gap-1">
                        <button
                            onClick={() => {
                                setStatusFilter("");
                                fetchPublicites(searchQuery, "", wilayaFilter, targetFilter);
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${statusFilter === ""
                                    ? "bg-white dark:bg-zinc-700 text-slate-900 dark:text-white shadow-xs"
                                    : "text-slate-600 dark:text-zinc-400 hover:text-slate-900"
                                }`}
                        >
                            Toutes
                        </button>
                        <button
                            onClick={() => {
                                setStatusFilter("active");
                                fetchPublicites(searchQuery, "active", wilayaFilter, targetFilter);
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${statusFilter === "active"
                                    ? "bg-emerald-500 text-white shadow-xs"
                                    : "text-slate-600 dark:text-zinc-400 hover:text-slate-900"
                                }`}
                        >
                            Actives
                        </button>
                        <button
                            onClick={() => {
                                setStatusFilter("expired");
                                fetchPublicites(searchQuery, "expired", wilayaFilter, targetFilter);
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${statusFilter === "expired"
                                    ? "bg-amber-500 text-white shadow-xs"
                                    : "text-slate-600 dark:text-zinc-400 hover:text-slate-900"
                                }`}
                        >
                            Expirées
                        </button>
                        <button
                            onClick={() => {
                                setStatusFilter("inactive");
                                fetchPublicites(searchQuery, "inactive", wilayaFilter, targetFilter);
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${statusFilter === "inactive"
                                    ? "bg-rose-500 text-white shadow-xs"
                                    : "text-slate-600 dark:text-zinc-400 hover:text-slate-900"
                                }`}
                        >
                            Désactivées
                        </button>
                    </div>

                    {/* Refresh */}
                    <button
                        onClick={() => fetchPublicites()}
                        title="Actualiser la liste"
                        className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-2xl text-slate-600 dark:text-zinc-300 transition-all shadow-xs shrink-0"
                    >
                        <FaSyncAlt className={`text-sm ${isLoading ? "animate-spin text-red-500" : ""}`} />
                    </button>
                </div>
            </div>

            {/* Content List / Grid */}
            {isLoading && publicites.length === 0 ? (
                <div className="bg-white dark:bg-zinc-900 p-12 rounded-3xl border border-slate-200/80 dark:border-zinc-800 text-center">
                    <div className="inline-block animate-spin w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full mb-3"></div>
                    <p className="text-sm font-semibold text-slate-500">Chargement des publicités...</p>
                </div>
            ) : publicites.length === 0 ? (
                <div className="bg-white dark:bg-zinc-900 p-12 rounded-3xl border border-slate-200/80 dark:border-zinc-800 text-center flex flex-col items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-400 text-2xl mb-4">
                        <FaBullhorn />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">Aucune publicité trouvée</h3>
                    <p className="text-sm text-slate-500 dark:text-zinc-400 max-w-md mt-1 mb-5">
                        Créez votre première publicité ou bannière pour qu&apos;elle apparaisse en tête de l&apos;application mobile.
                    </p>
                    <button
                        onClick={handleOpenCreateModal}
                        className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-2xl shadow-md transition-all"
                    >
                        + Ajouter une Publicité
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {publicites.map((pub) => {
                        const daysLeft = getDaysRemaining(pub.date_expires);
                        const isExpired = pub.is_expired;

                        return (
                            <div
                                key={pub.id}
                                className={`group bg-white dark:bg-zinc-900 rounded-3xl border transition-all duration-300 overflow-hidden flex flex-col justify-between ${isExpired
                                        ? "border-amber-200 dark:border-amber-950/60 opacity-80"
                                        : !pub.is_active
                                            ? "border-slate-200 dark:border-zinc-800 opacity-70"
                                            : "border-slate-200/90 dark:border-zinc-800 hover:border-red-500/50 hover:shadow-xl hover:shadow-red-500/5"
                                    }`}
                            >
                                {/* Banner Image Box */}
                                <div>
                                    <div className="relative w-full h-44 bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                                        {pub.image_url ? (
                                            <Image
                                                src={pub.image_url}
                                                alt={pub.name}
                                                fill
                                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                                                unoptimized
                                            />
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                                                <FaImage className="text-3xl" />
                                                <span className="text-xs font-semibold">Aucune image</span>
                                            </div>
                                        )}

                                        {/* Status Badge */}
                                        <div className="absolute top-3 left-3 flex items-center gap-1.5">
                                            {isExpired ? (
                                                <span className="px-2.5 py-1 bg-amber-500/90 backdrop-blur-md text-white text-xs font-extrabold rounded-xl shadow-sm flex items-center gap-1">
                                                    <FaHourglassEnd /> Expirée
                                                </span>
                                            ) : !pub.is_active ? (
                                                <span className="px-2.5 py-1 bg-rose-600/90 backdrop-blur-md text-white text-xs font-extrabold rounded-xl shadow-sm flex items-center gap-1">
                                                    <FaTimesCircle /> Désactivée
                                                </span>
                                            ) : (
                                                <span className="px-2.5 py-1 bg-emerald-500/90 backdrop-blur-md text-white text-xs font-extrabold rounded-xl shadow-sm flex items-center gap-1">
                                                    <FaCheckCircle /> Active
                                                </span>
                                            )}
                                        </div>

                                        {/* Days Left badge */}
                                        {daysLeft !== null && (
                                            <div className="absolute top-3 right-3">
                                                <span
                                                    className={`px-2.5 py-1 backdrop-blur-md text-xs font-bold rounded-xl shadow-sm ${daysLeft <= 0
                                                            ? "bg-zinc-900/80 text-zinc-300"
                                                            : daysLeft <= 3
                                                                ? "bg-rose-500/90 text-white animate-pulse"
                                                                : "bg-black/60 text-white"
                                                        }`}
                                                >
                                                    {daysLeft <= 0 ? "Expiré" : `${daysLeft}j restant${daysLeft > 1 ? "s" : ""}`}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Content Info */}
                                    <div className="p-5 space-y-3">
                                        {/* Target Role & Tag Badges */}
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            <span className={`px-2.5 py-1 rounded-xl text-[11px] font-extrabold flex items-center gap-1.5 ${
                                                pub.target === "livreur"
                                                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60"
                                                    : pub.target === "chauffeur"
                                                    ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60"
                                                    : "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/60"
                                            }`}>
                                                {pub.target === "livreur" ? <FaMotorcycle /> : pub.target === "chauffeur" ? <FaCar /> : <FaUser />}
                                                <span>{pub.target === "livreur" ? "Livreur Food" : pub.target === "chauffeur" ? "Chauffeur VTC" : "Client (App)"}</span>
                                            </span>

                                            {pub.badge_tag && (
                                                <span className="px-2.5 py-1 rounded-xl text-[11px] font-black bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/60 flex items-center gap-1">
                                                    <FaTag className="text-[10px]" />
                                                    <span>{pub.badge_tag}</span>
                                                </span>
                                            )}
                                        </div>

                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight line-clamp-1">
                                                {pub.name}
                                            </h3>
                                            {pub.description ? (
                                                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                                                    {pub.description}
                                                </p>
                                            ) : (
                                                <p className="text-xs text-slate-400 italic mt-1">Aucune description</p>
                                            )}
                                        </div>

                                        {/* Target Info */}
                                        <div className="pt-2 border-t border-slate-100 dark:border-zinc-800/80 space-y-2">
                                            {pub.magasin ? (
                                                <div className="flex items-center gap-2.5 p-2 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300">
                                                    <FaStore className="text-sm shrink-0" />
                                                    <div className="text-xs font-semibold truncate">
                                                        <span className="font-bold">{pub.magasin.name}</span>
                                                        {pub.magasin.wilaya && (
                                                            <span className="opacity-80 text-[11px]"> • {pub.magasin.wilaya}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : pub.lien ? (
                                                <div className="flex items-center gap-2 p-2 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300">
                                                    <FaLink className="text-sm shrink-0" />
                                                    <a
                                                        href={pub.lien}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-xs font-semibold truncate hover:underline flex items-center gap-1"
                                                    >
                                                        <span>{pub.lien}</span>
                                                        <FaExternalLinkAlt className="text-[10px] shrink-0" />
                                                    </a>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 p-2 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 text-xs font-medium">
                                                    <FaInfoCircle className="text-sm shrink-0" />
                                                    <span>Bannière d&apos;information</span>
                                                </div>
                                            )}

                                            {/* CTA Button display preview */}
                                            {pub.cta_text && (
                                                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-zinc-400 bg-slate-50 dark:bg-zinc-800/40 px-2.5 py-1.5 rounded-xl border border-slate-100 dark:border-zinc-800">
                                                    <span>Bouton d&apos;action :</span>
                                                    <span className="font-black text-slate-900 dark:text-white px-2 py-0.5 rounded-lg bg-white dark:bg-zinc-700 border border-slate-200 dark:border-zinc-600 shadow-2xs">
                                                        {pub.cta_text} &rarr;
                                                    </span>
                                                </div>
                                            )}

                                            {/* Expiration date */}
                                            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400 font-medium px-1">
                                                <span className="flex items-center gap-1.5">
                                                    <FaCalendarAlt className="text-slate-400" />
                                                    Expire le:
                                                </span>
                                                <span className="font-bold text-slate-700 dark:text-zinc-300">
                                                    {formatDate(pub.date_expires)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Card Actions Bottom Bar */}
                                <div className="p-3.5 bg-slate-50 dark:bg-zinc-800/50 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between gap-2">
                                    {/* Active / Inactive Switch Button */}
                                    <button
                                        onClick={() => handleToggleStatus(pub)}
                                        title={pub.is_active ? "Désactiver la publicité" : "Activer la publicité"}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${pub.is_active
                                                ? "bg-emerald-100 hover:bg-emerald-200 text-emerald-800 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/80 dark:text-emerald-300"
                                                : "bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-zinc-700 dark:hover:bg-zinc-600 dark:text-zinc-200"
                                            }`}
                                    >
                                        {pub.is_active ? <FaToggleOn className="text-base" /> : <FaToggleOff className="text-base" />}
                                        <span>{pub.is_active ? "Actif" : "Inactif"}</span>
                                    </button>

                                    <div className="flex items-center gap-1.5">
                                        <button
                                            onClick={() => handleOpenEditModal(pub)}
                                            title="Modifier la publicité"
                                            className="p-2 rounded-xl bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 shadow-2xs transition-all"
                                        >
                                            <FaEdit className="text-sm text-blue-600 dark:text-blue-400" />
                                        </button>
                                        <button
                                            onClick={() => setDeletingPublicite(pub)}
                                            title="Supprimer la publicité"
                                            className="p-2 rounded-xl bg-white dark:bg-zinc-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 shadow-2xs transition-all"
                                        >
                                            <FaTrash className="text-sm text-rose-600 dark:text-rose-400" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL CREATE / EDIT PUBLICITE */}
            {/* ========================================================================= */}
            {isFormModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs">
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
                        {/* Modal Header - Fixed at Top */}
                        <div className="px-6 py-4 sm:py-5 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between shrink-0 bg-white dark:bg-zinc-900">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-gradient-to-tr from-pink-500 to-rose-600 text-white rounded-2xl shadow-md shrink-0">
                                    <FaBullhorn className="text-xl" />
                                </div>
                                <div>
                                    <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                                        {editingPublicite ? "Modifier la Publicité" : "Créer une Publicité / Bannière"}
                                    </h3>
                                    <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
                                        Configurez le visuel, le ciblage et la durée d&apos;affichage
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsFormModalOpen(false)}
                                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-500 dark:text-zinc-400 transition-all cursor-pointer"
                            >
                                <FaTimes />
                            </button>
                        </div>

                        {/* Modal Form with Scrollable Body and Pinned Footer */}
                        <form onSubmit={handleSubmitForm} className="flex flex-col flex-1 overflow-hidden min-h-0">
                            <div className="p-6 space-y-5 overflow-y-auto flex-1">
                                {/* 0. Choix de la Cible / Rôle */}
                            <div className="space-y-2">
                                <label className="block text-xs font-extrabold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
                                    Cible d&apos;affichage de la publicité <span className="text-red-500">*</span>
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setTarget("client");
                                            if (!badgeTag) setBadgeTag("PROMO 30%");
                                            if (ctaText === "En savoir plus") setCtaText("Commander");
                                        }}
                                        className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                                            target === "client"
                                                ? "border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/30"
                                                : "border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800"
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className={`p-2 rounded-xl text-base ${target === "client" ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-zinc-800 text-slate-600"}`}>
                                                <FaUser />
                                            </div>
                                            {target === "client" && <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>}
                                        </div>
                                        <div className="mt-2.5">
                                            <h4 className="text-xs font-black">Clients</h4>
                                            <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-tight mt-0.5">
                                                Application client LTC (Promos & Restos)
                                            </p>
                                        </div>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setTarget("livreur");
                                            if (!badgeTag) setBadgeTag("BONUS LIVREUR");
                                            if (ctaText === "Commander") setCtaText("Voir l'offre");
                                        }}
                                        className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                                            target === "livreur"
                                                ? "border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/30"
                                                : "border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800"
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className={`p-2 rounded-xl text-base ${target === "livreur" ? "bg-emerald-600 text-white" : "bg-slate-100 dark:bg-zinc-800 text-slate-600"}`}>
                                                <FaMotorcycle />
                                            </div>
                                            {target === "livreur" && <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>}
                                        </div>
                                        <div className="mt-2.5">
                                            <h4 className="text-xs font-black">Livreurs Food</h4>
                                            <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-tight mt-0.5">
                                                Dashboard livreur (Primes, Équipements)
                                            </p>
                                        </div>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setTarget("chauffeur");
                                            if (!badgeTag) setBadgeTag("PRIME VTC");
                                            if (ctaText === "Commander") setCtaText("En profiter");
                                        }}
                                        className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                                            target === "chauffeur"
                                                ? "border-amber-500 bg-amber-50/80 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 ring-2 ring-amber-500/30"
                                                : "border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800"
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className={`p-2 rounded-xl text-base ${target === "chauffeur" ? "bg-amber-600 text-white" : "bg-slate-100 dark:bg-zinc-800 text-slate-600"}`}>
                                                <FaCar />
                                            </div>
                                            {target === "chauffeur" && <span className="w-2.5 h-2.5 rounded-full bg-amber-600"></span>}
                                        </div>
                                        <div className="mt-2.5">
                                            <h4 className="text-xs font-black">Chauffeurs VTC</h4>
                                            <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-tight mt-0.5">
                                                Accueil chauffeur (Primes, Carburant, Auto)
                                            </p>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/* 1. Titre & Description */}
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-extrabold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                                        Titre de la publicité <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder={
                                            target === "client"
                                                ? "Ex: -30% sur tous les Burgers ce Weekend !"
                                                : target === "livreur"
                                                ? "Ex: Prime Spéciale : +250 DZD dès 8 livraisons ce soir"
                                                : "Ex: Prime Heures de Pointe : Gagnez +20% par course !"
                                        }
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-2xl text-sm font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-red-500 outline-hidden"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-extrabold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                                        Description / Sous-titre
                                    </label>
                                    <textarea
                                        rows={2}
                                        placeholder={
                                            target === "client"
                                                ? "Ex: Profitez d'une remise exclusive chez nos restaurants partenaires..."
                                                : target === "livreur"
                                                ? "Ex: Valable pour tous les créneaux 19h-23h sur Alger et Oran..."
                                                : "Ex: Atteignez 15 courses cette semaine et roulez avec 0% de taxe..."
                                        }
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="w-full px-4 py-2 bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-2xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-red-500 outline-hidden resize-none"
                                    />
                                </div>
                            </div>

                            {/* Badge Tag & Bouton d'Action CTA */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl border border-slate-200 dark:border-zinc-700">
                                <div>
                                    <label className="block text-xs font-extrabold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                                        Badge d&apos;accroche (Optionnel)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Ex: BONUS, PROMO 30%, PRIME VTC..."
                                        value={badgeTag}
                                        onChange={(e) => setBadgeTag(e.target.value)}
                                        className="w-full px-3.5 py-2 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white placeholder-slate-400 outline-hidden focus:ring-2 focus:ring-red-500"
                                    />
                                    {/* Quick tag suggestions */}
                                    <div className="flex items-center gap-1.5 flex-wrap mt-2">
                                        {(target === "client"
                                            ? ["PROMO 30%", "NOUVEAU", "LIVRAISON OFFERTE", "MENU DU JOUR"]
                                            : target === "livreur"
                                            ? ["BONUS LIVREUR", "PRIME SOIRÉE", "DÉFI DU JOUR", "ÉQUIPEMENT MOTO"]
                                            : ["PRIME VTC", "0% COMMISSION", "PARTENAIRE AUTO", "DÉFI SEMAINE"]
                                        ).map((tagSuggestion) => (
                                            <button
                                                key={tagSuggestion}
                                                type="button"
                                                onClick={() => setBadgeTag(tagSuggestion)}
                                                className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-300 hover:bg-red-100 hover:text-red-700 transition-colors"
                                            >
                                                +{tagSuggestion}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-extrabold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                                        Texte du Bouton (CTA)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Ex: Commander, Voir l'offre, En profiter..."
                                        value={ctaText}
                                        onChange={(e) => setCtaText(e.target.value)}
                                        className="w-full px-3.5 py-2 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white placeholder-slate-400 outline-hidden focus:ring-2 focus:ring-red-500"
                                    />
                                    {/* Quick CTA suggestions */}
                                    <div className="flex items-center gap-1.5 flex-wrap mt-2">
                                        {(target === "client"
                                            ? ["Commander", "Voir le menu", "En profiter"]
                                            : target === "livreur"
                                            ? ["Voir la prime", "Participer au défi", "Équipement"]
                                            : ["Profiter du bonus", "Partenaire auto", "Voir la carte"]
                                        ).map((ctaSuggestion) => (
                                            <button
                                                key={ctaSuggestion}
                                                type="button"
                                                onClick={() => setCtaText(ctaSuggestion)}
                                                className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-300 hover:bg-red-100 hover:text-red-700 transition-colors"
                                            >
                                                {ctaSuggestion}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* 2. Image Upload with live preview */}
                            <div>
                                <label className="block text-xs font-extrabold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                                    Bannière / Image de la publicité {!editingPublicite && <span className="text-red-500">*</span>}
                                </label>

                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="hidden"
                                />

                                {imagePreview ? (
                                    <div className="relative w-full h-44 rounded-2xl border-2 border-dashed border-slate-300 dark:border-zinc-700 overflow-hidden group">
                                        <Image
                                            src={imagePreview}
                                            alt="Preview"
                                            fill
                                            className="object-cover"
                                            unoptimized
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                className="px-3 py-1.5 bg-white text-slate-900 rounded-xl text-xs font-bold shadow-md hover:bg-slate-100"
                                            >
                                                Changer d&apos;image
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setImageFile(null);
                                                    setImagePreview(null);
                                                }}
                                                className="p-1.5 bg-rose-600 text-white rounded-xl text-xs shadow-md hover:bg-rose-700"
                                            >
                                                <FaTimes />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-full h-36 border-2 border-dashed border-slate-300 dark:border-zinc-700 hover:border-red-500 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer bg-slate-50 dark:bg-zinc-800/40 hover:bg-red-50/20 transition-all"
                                    >
                                        <div className="p-3 rounded-full bg-slate-200 dark:bg-zinc-700 text-slate-600 dark:text-zinc-300 text-xl">
                                            <FaImage />
                                        </div>
                                        <p className="text-xs font-bold text-slate-700 dark:text-zinc-200">
                                            Cliquez pour choisir une image de bannière
                                        </p>
                                        <span className="text-[11px] text-slate-400">
                                            Format recommandé : 16:9 ou 4:3 (JPG, PNG, WebP)
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* 3. Redirection / Cible */}
                            <div className="space-y-3">
                                <label className="block text-xs font-extrabold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
                                    Action au clic sur la bannière
                                </label>

                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setLinkType("magasin")}
                                        className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${linkType === "magasin"
                                                ? "border-red-500 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 shadow-xs"
                                                : "border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800"
                                            }`}
                                    >
                                        <FaStore className="text-base" />
                                        <span>Magasin / Resto</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setLinkType("link")}
                                        className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${linkType === "link"
                                                ? "border-red-500 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 shadow-xs"
                                                : "border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800"
                                            }`}
                                    >
                                        <FaLink className="text-base" />
                                        <span>Lien externe (URL)</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setLinkType("none")}
                                        className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${linkType === "none"
                                                ? "border-red-500 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 shadow-xs"
                                                : "border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800"
                                            }`}
                                    >
                                        <FaInfoCircle className="text-base" />
                                        <span>Sans redirection</span>
                                    </button>
                                </div>

                                {/* Magasin selector */}
                                {linkType === "magasin" && (
                                    <div className="p-3.5 bg-slate-50 dark:bg-zinc-800/60 rounded-2xl border border-slate-200 dark:border-zinc-700 space-y-2">
                                        <div className="relative">
                                            <input
                                                type="text"
                                                placeholder="Filtrer ou chercher un magasin..."
                                                value={magasinSearch}
                                                onChange={(e) => {
                                                    setMagasinSearch(e.target.value);
                                                    loadMagasins(e.target.value);
                                                }}
                                                className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs"
                                            />
                                            <FaSearch className="absolute left-3 top-2.5 text-slate-400 text-xs" />
                                        </div>

                                        <select
                                            value={selectedMagasinId ?? ""}
                                            onChange={(e) =>
                                                setSelectedMagasinId(e.target.value ? Number(e.target.value) : null)
                                            }
                                            className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-white outline-hidden"
                                        >
                                            <option value="">Sélectionnez le magasin associé...</option>
                                            {magasinsList.map((m) => (
                                                <option key={m.id} value={m.id}>
                                                    {m.name} {m.wilaya ? `(${m.wilaya})` : ""}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {/* External Link input */}
                                {linkType === "link" && (
                                    <div>
                                        <input
                                            type="url"
                                            placeholder="https://votre-site-partenaire.com/promo"
                                            value={externalLink}
                                            onChange={(e) => setExternalLink(e.target.value)}
                                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-2xl text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400 outline-hidden"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* 4. Date d'expiration & Presets */}
                            <div className="space-y-2">
                                <label className="block text-xs font-extrabold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
                                    Date et heure d&apos;expiration <span className="text-red-500">*</span>
                                </label>

                                <div className="flex items-center gap-2">
                                    <input
                                        type="datetime-local"
                                        required
                                        value={dateExpires}
                                        onChange={(e) => setDateExpires(e.target.value)}
                                        className="w-full px-4 py-2 bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-2xl text-xs font-bold text-slate-800 dark:text-white outline-hidden"
                                    />
                                </div>

                                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                                    <span className="text-[11px] text-slate-400 font-bold mr-1">Raccourcis :</span>
                                    <button
                                        type="button"
                                        onClick={() => handleSetDays(7)}
                                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-xl text-[11px] font-bold text-slate-600 dark:text-zinc-300 transition-all"
                                    >
                                        +7 Jours
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleSetDays(15)}
                                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-xl text-[11px] font-bold text-slate-600 dark:text-zinc-300 transition-all"
                                    >
                                        +15 Jours
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleSetDays(30)}
                                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-xl text-[11px] font-bold text-slate-600 dark:text-zinc-300 transition-all"
                                    >
                                        +1 Mois
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleSetDays(90)}
                                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-xl text-[11px] font-bold text-slate-600 dark:text-zinc-300 transition-all"
                                    >
                                        +3 Mois
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleSetDays(365)}
                                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-xl text-[11px] font-bold text-slate-600 dark:text-zinc-300 transition-all"
                                    >
                                        +1 An
                                    </button>
                                </div>
                            </div>

                            {/* 5. Statut actif Switch */}
                            <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl border border-slate-200 dark:border-zinc-700">
                                <div>
                                    <p className="text-xs font-bold text-slate-800 dark:text-white">
                                        Activer la publicité immédiatement
                                    </p>
                                    <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                                        Si activée, elle sera visible dans le carousel de l&apos;application
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsActive(!isActive)}
                                    className={`text-2xl transition-colors ${isActive ? "text-emerald-500" : "text-slate-400"
                                        }`}
                                >
                                    {isActive ? <FaToggleOn /> : <FaToggleOff />}
                                </button>
                            </div>

                            </div>

                            {/* Pinned Modal Footer */}
                            <div className="px-6 py-4 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-end gap-3 shrink-0 bg-slate-50/90 dark:bg-zinc-900/90 backdrop-blur-xs">
                                <button
                                    type="button"
                                    onClick={() => setIsFormModalOpen(false)}
                                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 text-xs font-bold rounded-2xl transition-all cursor-pointer"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white text-xs font-bold rounded-2xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            <span>Enregistrement...</span>
                                        </>
                                    ) : (
                                        <>
                                            <FaCheck />
                                            <span>{editingPublicite ? "Mettre à jour" : "Créer la publicité"}</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL MOBILE APP LIVE PREVIEW SIMULATION */}
            {/* ========================================================================= */}
            {isMobilePreviewOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
                    <div className="bg-zinc-900 rounded-[44px] max-w-sm w-full border-[6px] border-zinc-800 shadow-2xl p-4 overflow-hidden relative text-white max-h-[92vh] overflow-y-auto">
                        {/* Close button top right */}
                        <button
                            onClick={() => setIsMobilePreviewOpen(false)}
                            className="absolute top-5 right-5 z-20 w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-300 text-sm"
                        >
                            <FaTimes />
                        </button>

                        {/* Top Notch Simulation */}
                        <div className="flex justify-center mb-4">
                            <div className="w-24 h-4 bg-black rounded-full"></div>
                        </div>

                        <div className="space-y-4">
                            {/* App Header */}
                            <div className="flex items-center justify-between px-2">
                                <div>
                                    <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">
                                        Aperçu Application
                                    </span>
                                    <h4 className="text-sm font-extrabold text-white">LTC Express Mobile</h4>
                                </div>
                                <span className="px-2 py-0.5 bg-red-600 text-white text-[10px] font-black rounded-full">
                                    LIVE
                                </span>
                            </div>

                            {/* Mobile Banner Carousel Simulation */}
                            <div className="space-y-2">
                                <div className="text-xs font-bold text-zinc-300 px-2 flex items-center justify-between">
                                    <span>Bannières d&apos;accueil</span>
                                    <span className="text-[10px] text-zinc-400 font-normal">
                                        {publicites.filter((p) => p.is_active && !p.is_expired).length} actives
                                    </span>
                                </div>

                                {publicites.filter((p) => p.is_active && !p.is_expired).length === 0 ? (
                                    <div className="p-8 bg-zinc-800/80 rounded-2xl text-center">
                                        <FaBullhorn className="text-2xl text-zinc-500 mx-auto mb-2" />
                                        <p className="text-xs font-bold text-zinc-400">
                                            Aucune publicité active pour le moment
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        {/* Banner Card Preview */}
                                        {(() => {
                                            const activeAds = publicites.filter((p) => p.is_active && !p.is_expired);
                                            const currentAd =
                                                activeAds[activeMobileAdIndex % activeAds.length] || activeAds[0];

                                            return (
                                                <div className="relative w-full h-40 rounded-2xl overflow-hidden shadow-lg border border-zinc-700/50 bg-zinc-800">
                                                    {currentAd.image_url ? (
                                                        <Image
                                                            src={currentAd.image_url}
                                                            alt={currentAd.name}
                                                            fill
                                                            className="object-cover"
                                                            unoptimized
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full bg-gradient-to-r from-red-600 to-rose-600 flex items-center justify-center p-4">
                                                            <h4 className="text-base font-extrabold text-white text-center">
                                                                {currentAd.name}
                                                            </h4>
                                                        </div>
                                                    )}

                                                    {/* Dark gradient overlay */}
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-3.5">
                                                        <span className="text-white text-xs font-black line-clamp-1">
                                                            {currentAd.name}
                                                        </span>
                                                        {currentAd.description && (
                                                            <span className="text-zinc-300 text-[10px] line-clamp-1">
                                                                {currentAd.description}
                                                            </span>
                                                        )}
                                                        {currentAd.magasin && (
                                                            <span className="text-amber-400 text-[9px] font-bold mt-0.5">
                                                                {currentAd.magasin.name}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })()}

                                        {/* Pagination dots */}
                                        <div className="flex justify-center gap-1.5 pt-1">
                                            {publicites
                                                .filter((p) => p.is_active && !p.is_expired)
                                                .map((_, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => setActiveMobileAdIndex(idx)}
                                                        className={`h-1.5 rounded-full transition-all ${idx === activeMobileAdIndex
                                                                ? "w-5 bg-red-500"
                                                                : "w-1.5 bg-zinc-700"
                                                            }`}
                                                    />
                                                ))}
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Mockup Mock Services */}
                            <div className="space-y-2 pt-2">
                                <span className="text-[11px] font-bold text-zinc-400 px-2">Nos Services</span>
                                <div className="grid grid-cols-4 gap-1.5">
                                    <div className="p-2.5 bg-zinc-800 rounded-xl text-center">
                                        <span className="text-[10px] font-bold text-zinc-200">VTC</span>
                                    </div>
                                    <div className="p-2.5 bg-zinc-800 rounded-xl text-center">
                                        <span className="text-[10px] font-bold text-zinc-200">FOOD</span>
                                    </div>
                                    <div className="p-2.5 bg-zinc-800 rounded-xl text-center">
                                        <span className="text-[10px] font-bold text-zinc-200">SERVICE</span>
                                    </div>
                                    <div className="p-2.5 bg-zinc-800 rounded-xl text-center">
                                        <span className="text-[10px] font-bold text-zinc-200">COLIS</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Home Indicator */}
                        <div className="flex justify-center mt-6">
                            <div className="w-28 h-1 bg-zinc-700 rounded-full"></div>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL DELETE CONFIRMATION */}
            {/* ========================================================================= */}
            {deletingPublicite && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-md w-full border border-slate-200 dark:border-zinc-800 shadow-2xl p-6 space-y-4">
                        <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center text-xl mx-auto">
                            <FaTrash />
                        </div>

                        <div className="text-center space-y-1">
                            <h3 className="text-lg font-black text-slate-900 dark:text-white">
                                Supprimer cette publicité ?
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-zinc-400">
                                Êtes-vous sûr de vouloir supprimer la publicité{" "}
                                <span className="font-bold text-slate-900 dark:text-white">
                                    &ldquo;{deletingPublicite.name}&rdquo;
                                </span>{" "}
                                ? Cette action est irréversible.
                            </p>
                        </div>

                        <div className="flex items-center justify-center gap-3 pt-3">
                            <button
                                type="button"
                                onClick={() => setDeletingPublicite(null)}
                                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 text-xs font-bold rounded-2xl transition-all"
                            >
                                Annuler
                            </button>
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={isSubmitting}
                                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-2xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
                            >
                                {isSubmitting ? "Suppression..." : "Confirmer la suppression"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
