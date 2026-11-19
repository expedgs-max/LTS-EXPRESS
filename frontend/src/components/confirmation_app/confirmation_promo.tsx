"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    FaSearch,
    FaPlus,
    FaTicketAlt,
    FaUsers,
    FaCoins,
    FaPercentage,
    FaCopy,
    FaCheck,
    FaEdit,
    FaTrash,
    FaEye,
    FaSyncAlt,
    FaTimes,
    FaPhoneAlt,
    FaMapMarkerAlt,
    FaRandom,
    FaDownload,
    FaCalendarAlt,
    FaUserCheck,
    FaMotorcycle,
    FaUser,
    FaStore,
    FaCheckCircle,
    FaTimesCircle,
    FaHourglassEnd
} from "react-icons/fa";
import {
    ConfirmationPromo,
    ConfirmationPromoStats,
    ConfirmationPromoUser,
    ConfirmationPromoTargetUser,
    ConfirmationPromoTargetMagasin,
    PromoCibleType,
    getConfirmationPromos,
    getConfirmationPromoUsers,
    createConfirmationPromo,
    updateConfirmationPromo,
    deleteConfirmationPromo,
    getConfirmationPromoPartners,
    getConfirmationPromoTargetUsers,
    getConfirmationPromoTargetMagasins
} from "@/lib/confirmation_action";
import toast from "react-hot-toast";

interface ConfirmationPromoProps {
    initialPromos: ConfirmationPromo[];
    initialStats: ConfirmationPromoStats;
    token?: string;
    initialSearch?: string;
    currentPage?: number;
    totalPages?: number;
}

export default function ConfirmationPromoComponent({
    initialPromos,
    initialStats,
    initialSearch = "",
}: ConfirmationPromoProps) {
    const router = useRouter();

    const [promos, setPromos] = useState<ConfirmationPromo[]>(initialPromos);
    const [stats, setStats] = useState<ConfirmationPromoStats>(initialStats);
    const [searchQuery, setSearchQuery] = useState<string>(initialSearch);
    const [cibleFilter, setCibleFilter] = useState<string>("");
    const [statusFilter, setStatusFilter] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [copiedCodeId, setCopiedCodeId] = useState<number | null>(null);

    // Modal Users View
    const [selectedPromoForUsers, setSelectedPromoForUsers] = useState<ConfirmationPromo | null>(null);
    const [promoUsersList, setPromoUsersList] = useState<ConfirmationPromoUser[]>([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState<boolean>(false);
    const [userSearchQuery, setUserSearchQuery] = useState<string>("");

    // Modal Create / Edit
    const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
    const [editingPromo, setEditingPromo] = useState<ConfirmationPromo | null>(null);
    const [formData, setFormData] = useState({
        code_invitation: "",
        pourcentage: 5,
        revunu: 0,
        partenaire_id: null as number | null,
        cible_type: "tous_clients" as PromoCibleType,
        cible_user_id: null as number | null,
        cible_magasin_id: null as number | null,
        max_utilisations: 0,
        date_expiration: "",
        is_active: true
    });

    const [partnersList, setPartnersList] = useState<{ id: number; name: string; phone: string; wilaya: string; type_compte: string }[]>([]);
    const [targetUsersSearchQuery, setTargetUsersSearchQuery] = useState<string>("");
    const [targetUsersList, setTargetUsersList] = useState<ConfirmationPromoTargetUser[]>([]);
    const [selectedTargetUser, setSelectedTargetUser] = useState<ConfirmationPromoTargetUser | null>(null);
    const [isLoadingTargetUsers, setIsLoadingTargetUsers] = useState<boolean>(false);

    // Target Magasins
    const [targetMagasinsSearchQuery, setTargetMagasinsSearchQuery] = useState<string>("");
    const [targetMagasinsList, setTargetMagasinsList] = useState<ConfirmationPromoTargetMagasin[]>([]);
    const [selectedTargetMagasin, setSelectedTargetMagasin] = useState<ConfirmationPromoTargetMagasin | null>(null);
    const [isLoadingTargetMagasins, setIsLoadingTargetMagasins] = useState<boolean>(false);

    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    // Modal Delete
    const [deletingPromo, setDeletingPromo] = useState<ConfirmationPromo | null>(null);

    useEffect(() => {
        setPromos(initialPromos);
        setStats(initialStats);
    }, [initialPromos, initialStats]);

    // Handle Copy to Clipboard
    const handleCopy = (code: string, id: number) => {
        navigator.clipboard.writeText(code);
        setCopiedCodeId(id);
        toast.success(`Code "${code}" copié !`);
        setTimeout(() => setCopiedCodeId(null), 2000);
    };

    // Fetch promos with search & filters
    const fetchPromos = async (searchVal = searchQuery, cibleVal = cibleFilter, statusVal = statusFilter) => {
        setIsLoading(true);
        try {
            const res = await getConfirmationPromos({
                search: searchVal,
                cible_type: cibleVal,
                status: statusVal,
                page: 1,
                page_size: 50
            });
            if (res && res.success) {
                setPromos(res.data);
                setStats(res.stats);
            }
        } catch {
            toast.error("Erreur lors de la récupération des codes promo");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        fetchPromos(searchQuery, cibleFilter, statusFilter);
    };

    // Search target users for specific client / driver
    const searchTargetUsers = async (query: string, role = "") => {
        setIsLoadingTargetUsers(true);
        try {
            const users = await getConfirmationPromoTargetUsers(query, role);
            setTargetUsersList(users);
        } catch {
            setTargetUsersList([]);
        } finally {
            setIsLoadingTargetUsers(false);
        }
    };

    // Search target magasins
    const searchTargetMagasins = async (query: string) => {
        setIsLoadingTargetMagasins(true);
        try {
            const mags = await getConfirmationPromoTargetMagasins(query);
            setTargetMagasinsList(mags);
        } catch {
            setTargetMagasinsList([]);
        } finally {
            setIsLoadingTargetMagasins(false);
        }
    };

    // Open Users Modal
    const handleOpenUsersModal = async (promo: ConfirmationPromo) => {
        setSelectedPromoForUsers(promo);
        setUserSearchQuery("");
        setIsLoadingUsers(true);
        try {
            const res = await getConfirmationPromoUsers(promo.id, { page_size: 100 });
            if (res && res.success) {
                setPromoUsersList(res.users);
            } else {
                setPromoUsersList([]);
            }
        } catch {
            toast.error("Impossible de charger les utilisateurs de ce code promo");
            setPromoUsersList([]);
        } finally {
            setIsLoadingUsers(false);
        }
    };

    // Open Create Modal
    const handleOpenCreateModal = async () => {
        setEditingPromo(null);
        setSelectedTargetUser(null);
        setSelectedTargetMagasin(null);
        setTargetUsersSearchQuery("");
        setTargetMagasinsSearchQuery("");
        setFormData({
            code_invitation: generateRandomCode(8),
            pourcentage: 5,
            revunu: 0,
            partenaire_id: null,
            cible_type: "tous_magasins",
            cible_user_id: null,
            cible_magasin_id: null,
            max_utilisations: 0,
            date_expiration: "",
            is_active: true
        });
        setIsCreateModalOpen(true);
        loadPartners("");
    };

    // Open Edit Modal
    const handleOpenEditModal = async (promo: ConfirmationPromo) => {
        setEditingPromo(promo);
        setSelectedTargetUser(promo.cible_user || null);
        setSelectedTargetMagasin(promo.cible_magasin || null);
        setTargetUsersSearchQuery("");
        setTargetMagasinsSearchQuery("");
        
        let formattedDate = "";
        if (promo.date_expiration) {
            try {
                formattedDate = new Date(promo.date_expiration).toISOString().slice(0, 16);
            } catch {
                formattedDate = "";
            }
        }

        setFormData({
            code_invitation: promo.code_invitation,
            pourcentage: promo.pourcentage_display || (promo.pourcentage * 100),
            revunu: promo.revunu || 0,
            partenaire_id: promo.partenneur?.id || null,
            cible_type: promo.cible_type || "tous_clients",
            cible_user_id: promo.cible_user?.id || null,
            cible_magasin_id: promo.cible_magasin?.id || null,
            max_utilisations: promo.max_utilisations || 0,
            date_expiration: formattedDate,
            is_active: promo.is_active !== undefined ? promo.is_active : true
        });
        setIsCreateModalOpen(true);
        loadPartners("");
        if (promo.cible_type === "magasin_specifique") {
            searchTargetMagasins("");
        }
    };

    const loadPartners = async (search: string) => {
        try {
            const list = await getConfirmationPromoPartners(search);
            setPartnersList(list);
        } catch {
            setPartnersList([]);
        }
    };

    function generateRandomCode(length = 8) {
        const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let result = "";
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    }

    // Quick expiration presets
    const setExpirationPreset = (days: number) => {
        if (days === 0) {
            setFormData({ ...formData, date_expiration: "" });
            return;
        }
        const d = new Date();
        d.setDate(d.getDate() + days);
        setFormData({ ...formData, date_expiration: d.toISOString().slice(0, 16) });
    };

    // Submit Create or Edit
    const handleSavePromo = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.code_invitation.trim()) {
            toast.error("Veuillez saisir un code promo");
            return;
        }

        if (
            (formData.cible_type === "client_specifique" || formData.cible_type === "livreur_specifique" || formData.cible_type === "partenaire_specifique") &&
            !formData.cible_user_id
        ) {
            toast.error("Veuillez sélectionner l'utilisateur ciblé pour ce code promo");
            return;
        }

        if (formData.cible_type === "magasin_specifique" && !formData.cible_magasin_id) {
            toast.error("Veuillez sélectionner le magasin ciblé pour ce code promo");
            return;
        }

        setIsSubmitting(true);
        try {
            if (editingPromo) {
                const res = await updateConfirmationPromo(editingPromo.id, {
                    code_invitation: formData.code_invitation.trim().toUpperCase(),
                    pourcentage: formData.pourcentage,
                    revunu: formData.revunu,
                    partenaire_id: formData.partenaire_id,
                    cible_type: formData.cible_type,
                    cible_user_id: formData.cible_user_id,
                    cible_magasin_id: formData.cible_magasin_id,
                    max_utilisations: formData.max_utilisations,
                    date_expiration: formData.date_expiration || null,
                    is_active: formData.is_active
                });
                if (res.success) {
                    setIsCreateModalOpen(false);
                    fetchPromos(searchQuery, cibleFilter, statusFilter);
                    router.refresh();
                }
            } else {
                const res = await createConfirmationPromo({
                    code_invitation: formData.code_invitation.trim().toUpperCase(),
                    pourcentage: formData.pourcentage,
                    revunu: formData.revunu,
                    partenaire_id: formData.partenaire_id,
                    cible_type: formData.cible_type,
                    cible_user_id: formData.cible_user_id,
                    cible_magasin_id: formData.cible_magasin_id,
                    max_utilisations: formData.max_utilisations,
                    date_expiration: formData.date_expiration || null,
                    is_active: formData.is_active
                });
                if (res.success) {
                    setIsCreateModalOpen(false);
                    fetchPromos(searchQuery, cibleFilter, statusFilter);
                    router.refresh();
                }
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // Delete Promo
    const handleDeletePromo = async () => {
        if (!deletingPromo) return;
        setIsSubmitting(true);
        try {
            const res = await deleteConfirmationPromo(deletingPromo.id);
            if (res.success) {
                setDeletingPromo(null);
                fetchPromos(searchQuery, cibleFilter, statusFilter);
                router.refresh();
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // Filter users inside the users modal
    const filteredUsers = promoUsersList.filter((u) => {
        if (!userSearchQuery) return true;
        const q = userSearchQuery.toLowerCase();
        return (
            u.full_name?.toLowerCase().includes(q) ||
            u.username?.toLowerCase().includes(q) ||
            u.phone?.toLowerCase().includes(q) ||
            u.email?.toLowerCase().includes(q) ||
            u.wilaya?.toLowerCase().includes(q) ||
            u.type_compte?.toLowerCase().includes(q)
        );
    });

    // Export user list as CSV
    const exportUsersCsv = () => {
        if (!selectedPromoForUsers || filteredUsers.length === 0) {
            toast.error("Aucune donnée à exporter");
            return;
        }
        const headers = ["ID", "Nom complet", "Nom d'utilisateur", "Téléphone", "Email", "Wilaya", "Type de compte", "Date inscription"];
        const rows = filteredUsers.map((u) => [
            u.id,
            `"${u.full_name}"`,
            `"${u.username}"`,
            `"${u.phone}"`,
            `"${u.email}"`,
            `"${u.wilaya}"`,
            `"${u.type_compte}"`,
            `"${u.date_joined}"`
        ]);

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `utilisateurs_code_${selectedPromoForUsers.code_invitation}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Fichier CSV téléchargé !");
    };

    const getCibleBadge = (promo: ConfirmationPromo) => {
        switch (promo.cible_type) {
            case "tous_magasins":
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900">
                        <FaStore className="text-[10px]" /> Tous les magasins
                    </span>
                );
            case "magasin_specifique":
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 border border-orange-200/60 dark:border-orange-900">
                        <FaStore className="text-[10px]" /> Magasin : {promo.cible_magasin?.name || `#${promo.cible_magasin?.id || "N/A"}`}
                    </span>
                );
            case "tous_clients":
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-900">
                        <FaUser className="text-[10px]" /> Tous les clients
                    </span>
                );
            case "client_specifique":
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-900">
                        <FaUserCheck className="text-[10px]" /> Client : {promo.cible_user?.name || `#${promo.cible_user?.id || "N/A"}`}
                    </span>
                );
            case "tous_livreurs":
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900">
                        <FaMotorcycle className="text-[10px]" /> Tous les livreurs
                    </span>
                );
            case "livreur_specifique":
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 border border-teal-200/60 dark:border-teal-900">
                        <FaMotorcycle className="text-[10px]" /> Livreur : {promo.cible_user?.name || `#${promo.cible_user?.id || "N/A"}`}
                    </span>
                );
            case "tous_partenaires":
            case "partenaire_specifique":
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200/60 dark:border-purple-900">
                        <FaUsers className="text-[10px]" /> Partenaire
                    </span>
                );
            default:
                return <span className="text-xs text-slate-500">Général</span>;
        }
    };

    const getStatusBadge = (promo: ConfirmationPromo) => {
        if (!promo.is_active) {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-slate-100 dark:bg-zinc-800 text-slate-500">
                    <FaTimesCircle className="text-[10px]" /> Désactivé
                </span>
            );
        }
        if (promo.is_expired) {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-red-100 dark:bg-red-950/70 text-red-600 dark:text-red-400 border border-red-200/60 dark:border-red-900">
                    <FaHourglassEnd className="text-[10px]" /> Expiré
                </span>
            );
        }
        if (promo.is_max_reached) {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900">
                    <FaTimesCircle className="text-[10px]" /> Limite atteinte
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900">
                <FaCheckCircle className="text-[10px]" /> Actif
            </span>
        );
    };

    return (
        <div className="py-6 px-4 sm:px-10 max-w-7xl mx-auto text-slate-900 dark:text-slate-100 min-h-screen">
            {/* Header & Breadcrumb */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-zinc-800 mb-6">
                <div>
                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-1">
                        <Link href="/dashboard" className="hover:text-blue-500 font-medium">
                            Tableau de bord
                        </Link>
                        <span>/</span>
                        <Link href="/dashboard/confirmation" className="hover:text-blue-500 font-medium">
                            Confirmation
                        </Link>
                        <span>/</span>
                        <span className="text-slate-800 dark:text-slate-200 font-semibold">Codes Promo</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
                        <span className="p-2 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-400 text-white shadow-md shadow-orange-500/20">
                            <FaTicketAlt className="text-xl" />
                        </span>
                        Gestion des Codes Promo & Magasins
                    </h1>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => fetchPromos()}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-medium text-sm transition-all shadow-xs"
                        title="Rafraîchir"
                    >
                        <FaSyncAlt className={`text-xs ${isLoading ? "animate-spin text-orange-500" : ""}`} />
                        <span className="hidden sm:inline">Actualiser</span>
                    </button>

                    <button
                        onClick={handleOpenCreateModal}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm transition-all shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 active:scale-95"
                    >
                        <FaPlus className="text-xs" />
                        <span>Créer un Code Promo</span>
                    </button>
                </div>
            </div>

            {/* KPI Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {/* Total Codes */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#14171f] border border-slate-200/80 dark:border-zinc-800/80 shadow-xs hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Total Codes Promo</span>
                        <div className="p-2.5 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400">
                            <FaTicketAlt className="text-lg" />
                        </div>
                    </div>
                    <div className="text-3xl font-extrabold text-slate-900 dark:text-white">{stats?.total_promos || 0}</div>
                    <div className="text-xs text-slate-500 dark:text-zinc-400 mt-1 flex items-center gap-2">
                        <span className="text-emerald-500 font-bold">{stats?.active_promos || 0} actifs</span>
                        <span>•</span>
                        <span className="text-red-500 font-bold">{stats?.expired_promos || 0} expirés</span>
                    </div>
                </div>

                {/* Total Users Beneficiaries */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#14171f] border border-slate-200/80 dark:border-zinc-800/80 shadow-xs hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Utilisations Totales</span>
                        <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                            <FaUsers className="text-lg" />
                        </div>
                    </div>
                    <div className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">{stats?.total_users_used || 0}</div>
                    <div className="text-xs text-slate-500 dark:text-zinc-400 mt-1">Utilisateurs ayant activé un code</div>
                </div>

                {/* Total Revenue Accumulated */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#14171f] border border-slate-200/80 dark:border-zinc-800/80 shadow-xs hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Revenu Total Généré</span>
                        <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                            <FaCoins className="text-lg" />
                        </div>
                    </div>
                    <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                        {(stats?.total_revenue || 0).toLocaleString("fr-FR")} <span className="text-lg font-bold">DZD</span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-zinc-400 mt-1">Cumulé sur l&apos;ensemble des codes</div>
                </div>

                {/* Avg Discount Rate */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#14171f] border border-slate-200/80 dark:border-zinc-800/80 shadow-xs hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Taux Moyen de Remise</span>
                        <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
                            <FaPercentage className="text-lg" />
                        </div>
                    </div>
                    <div className="text-3xl font-extrabold text-purple-600 dark:text-purple-400">{stats?.avg_percentage || 0}%</div>
                    <div className="text-xs text-slate-500 dark:text-zinc-400 mt-1">Réduction moyenne appliquée</div>
                </div>
            </div>

            {/* Search and Filters Bar */}
            <div className="p-4 rounded-2xl bg-white dark:bg-[#14171f] border border-slate-200/80 dark:border-zinc-800/80 shadow-xs mb-6">
                <form onSubmit={handleSearchSubmit} className="flex flex-col lg:flex-row items-center gap-3">
                    <div className="relative flex-1 w-full">
                        <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Rechercher par code (ex: PROMO2026), magasin, client, livreur..."
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchQuery("");
                                    fetchPromos("", cibleFilter, statusFilter);
                                }}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
                            >
                                <FaTimes className="text-xs" />
                            </button>
                        )}
                    </div>

                    {/* Cible Filter */}
                    <select
                        value={cibleFilter}
                        onChange={(e) => {
                            setCibleFilter(e.target.value);
                            fetchPromos(searchQuery, e.target.value, statusFilter);
                        }}
                        className="w-full lg:w-52 px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs font-semibold text-slate-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                    >
                        <option value="">🎯 Toutes les cibles</option>
                        <option value="tous_magasins">🏪 Tous les magasins</option>
                        <option value="magasin_specifique">🏬 Magasin spécifique</option>
                        <option value="tous_clients">👥 Tous les clients</option>
                        <option value="client_specifique">👤 Client spécifique</option>
                        <option value="tous_livreurs">🛵 Tous les livreurs</option>
                        <option value="livreur_specifique">🏍️ Livreur spécifique</option>
                    </select>

                    {/* Status Filter */}
                    <select
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            fetchPromos(searchQuery, cibleFilter, e.target.value);
                        }}
                        className="w-full lg:w-40 px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs font-semibold text-slate-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                    >
                        <option value="">⚡ Tous statuts</option>
                        <option value="active">🟢 Actifs</option>
                        <option value="expired">🔴 Expirés</option>
                        <option value="disabled">⚪ Désactivés</option>
                    </select>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full lg:w-auto px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-zinc-800 hover:bg-slate-800 dark:hover:bg-zinc-700 text-white font-semibold text-sm transition-all shrink-0"
                    >
                        Filtrer
                    </button>
                </form>
            </div>

            {/* Promo Codes List Table */}
            <div className="rounded-2xl bg-white dark:bg-[#14171f] border border-slate-200/80 dark:border-zinc-800/80 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between">
                    <h2 className="text-base font-bold text-slate-800 dark:text-zinc-100 flex items-center gap-2">
                        <span>Liste des Codes Promo</span>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400">
                            {promos.length} codes
                        </span>
                    </h2>
                </div>

                {isLoading ? (
                    <div className="p-12 text-center">
                        <FaSyncAlt className="animate-spin text-3xl text-orange-500 mx-auto mb-3" />
                        <p className="text-sm text-slate-500 dark:text-zinc-400">Chargement des codes promo...</p>
                    </div>
                ) : promos.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 rounded-full bg-orange-50 dark:bg-orange-950/40 text-orange-500 mx-auto flex items-center justify-center mb-3">
                            <FaTicketAlt className="text-2xl" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-zinc-200 mb-1">Aucun code promo trouvé</h3>
                        <p className="text-sm text-slate-500 dark:text-zinc-400 mb-4 max-w-md mx-auto">
                            {searchQuery || cibleFilter || statusFilter
                                ? "Aucun résultat ne correspond aux filtres appliqués."
                                : "Vous n'avez pas encore configuré de code promo dans le système."}
                        </p>
                        <button
                            onClick={handleOpenCreateModal}
                            className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm transition-all inline-flex items-center gap-2"
                        >
                            <FaPlus className="text-xs" />
                            <span>Créer votre premier code promo</span>
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/50 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                                    <th className="py-3.5 px-4">Code Promo</th>
                                    <th className="py-3.5 px-4">Cible / Audience</th>
                                    <th className="py-3.5 px-4 text-center">Taux & Limite</th>
                                    <th className="py-3.5 px-4">Validité / Fin</th>
                                    <th className="py-3.5 px-4 text-center">Statut</th>
                                    <th className="py-3.5 px-4 text-center">Utilisations</th>
                                    <th className="py-3.5 px-4 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60 text-sm">
                                {promos.map((promo) => {
                                    const isCopied = copiedCodeId === promo.id;
                                    const hasUsers = promo.total_users_used > 0;
                                    const maxUtil = promo.max_utilisations > 0 ? promo.max_utilisations : "∞";

                                    return (
                                        <tr
                                            key={promo.id}
                                            className={`hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 transition-colors group ${
                                                promo.is_expired ? "opacity-75 bg-red-50/10" : ""
                                            }`}
                                        >
                                            {/* Code Badge with Quick Copy */}
                                            <td className="py-4 px-4 font-mono font-bold">
                                                <div className="flex items-center gap-2">
                                                    <span className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-yellow-500/10 dark:from-orange-500/20 dark:to-yellow-500/20 border border-orange-200 dark:border-orange-500/30 text-orange-600 dark:text-orange-400 text-sm font-extrabold tracking-wider shadow-2xs">
                                                        {promo.code_invitation}
                                                    </span>
                                                    <button
                                                        onClick={() => handleCopy(promo.code_invitation, promo.id)}
                                                        className={`p-2 rounded-lg transition-all ${
                                                            isCopied
                                                                ? "bg-emerald-500 text-white"
                                                                : "bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-zinc-700"
                                                        }`}
                                                        title="Copier le code"
                                                    >
                                                        {isCopied ? <FaCheck className="text-xs" /> : <FaCopy className="text-xs" />}
                                                    </button>
                                                </div>
                                            </td>

                                            {/* Target Audience Badge */}
                                            <td className="py-4 px-4">
                                                <div className="flex flex-col gap-1">
                                                    {getCibleBadge(promo)}
                                                    {promo.partenneur && (
                                                        <span className="text-[11px] text-slate-400">
                                                            Propriétaire : {promo.partenneur.name}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Percentage Discount & Usage Limit */}
                                            <td className="py-4 px-4 text-center">
                                                <div className="flex flex-col items-center gap-1">
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200/50 dark:border-purple-800/40">
                                                        -{promo.pourcentage_display}%
                                                    </span>
                                                    <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400">
                                                        Limite : {maxUtil}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Expiration Date */}
                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-2 text-xs">
                                                    <FaCalendarAlt className={`text-xs ${promo.is_expired ? "text-red-500" : "text-slate-400"}`} />
                                                    <span className={promo.is_expired ? "font-bold text-red-600 dark:text-red-400" : "text-slate-700 dark:text-zinc-300"}>
                                                        {promo.date_expiration_display || "Illimitée"}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Status Badge */}
                                            <td className="py-4 px-4 text-center">
                                                {getStatusBadge(promo)}
                                            </td>

                                            {/* Users Count & Preview */}
                                            <td className="py-4 px-4 text-center">
                                                <button
                                                    onClick={() => handleOpenUsersModal(promo)}
                                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all shadow-xs ${
                                                        hasUsers
                                                            ? "bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:hover:bg-blue-900/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/50"
                                                            : "bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 hover:bg-slate-200"
                                                    }`}
                                                >
                                                    <FaUsers className="text-sm" />
                                                    <span>{promo.total_users_used} / {maxUtil}</span>
                                                    <FaEye className="text-xs ml-0.5 opacity-60 group-hover:opacity-100" />
                                                </button>
                                            </td>

                                            {/* Actions */}
                                            <td className="py-4 px-4 text-center">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <button
                                                        onClick={() => handleOpenUsersModal(promo)}
                                                        className="p-2 rounded-xl text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 dark:text-blue-400 transition-all"
                                                        title="Voir la liste des utilisateurs"
                                                    >
                                                        <FaEye className="text-sm" />
                                                    </button>

                                                    <button
                                                        onClick={() => handleOpenEditModal(promo)}
                                                        className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800 hover:text-amber-500 transition-all"
                                                        title="Modifier le code promo"
                                                    >
                                                        <FaEdit className="text-sm" />
                                                    </button>

                                                    <button
                                                        onClick={() => setDeletingPromo(promo)}
                                                        className="p-2 rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400 transition-all"
                                                        title="Supprimer ce code promo"
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

            {/* ========================================================================= */}
            {/* MODAL 1 : LISTE DES UTILISATEURS DU CODE PROMO */}
            {/* ========================================================================= */}
            {selectedPromoForUsers && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-[#14171f] border border-slate-200 dark:border-zinc-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-gradient-to-r from-orange-50/50 to-amber-50/30 dark:from-zinc-900/80 dark:to-zinc-900/40">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="px-3 py-1 rounded-xl bg-orange-500 text-white font-mono font-extrabold text-sm shadow-sm">
                                        {selectedPromoForUsers.code_invitation}
                                    </span>
                                    <span className="text-xs px-2.5 py-1 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-300 font-bold">
                                        {selectedPromoForUsers.pourcentage_display}% de réduction
                                    </span>
                                    {getStatusBadge(selectedPromoForUsers)}
                                </div>
                                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                                    Utilisateurs ayant utilisé ce code promo
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                                    Cible : <span className="font-semibold text-slate-700 dark:text-zinc-300">{selectedPromoForUsers.cible_type}</span> • Utilisations : <span className="font-bold text-blue-600">{selectedPromoForUsers.total_users_used} / {selectedPromoForUsers.max_utilisations > 0 ? selectedPromoForUsers.max_utilisations : "∞"}</span> • Revenu cumulé : <span className="font-bold text-emerald-600">{selectedPromoForUsers.revunu.toLocaleString("fr-FR")} DZD</span>
                                </p>
                            </div>

                            <button
                                onClick={() => setSelectedPromoForUsers(null)}
                                className="p-2.5 rounded-full bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 transition-all"
                            >
                                <FaTimes className="text-base" />
                            </button>
                        </div>

                        {/* Search & Export Toolbar */}
                        <div className="p-4 border-b border-slate-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50 dark:bg-zinc-900/30">
                            <div className="relative w-full sm:w-80">
                                <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                                <input
                                    type="text"
                                    value={userSearchQuery}
                                    onChange={(e) => setUserSearchQuery(e.target.value)}
                                    placeholder="Filtrer par nom, tél, email, wilaya..."
                                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                                />
                            </div>

                            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                                <span className="text-xs text-slate-500 dark:text-zinc-400 font-semibold">
                                    {filteredUsers.length} utilisateur{filteredUsers.length > 1 ? "s" : ""}
                                </span>
                                <button
                                    onClick={exportUsersCsv}
                                    disabled={filteredUsers.length === 0}
                                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-all disabled:opacity-50"
                                >
                                    <FaDownload className="text-[10px]" />
                                    <span>Exporter CSV</span>
                                </button>
                            </div>
                        </div>

                        {/* Users Table / List */}
                        <div className="flex-1 overflow-y-auto p-4 max-h-[60vh]">
                            {isLoadingUsers ? (
                                <div className="p-12 text-center">
                                    <FaSyncAlt className="animate-spin text-3xl text-orange-500 mx-auto mb-3" />
                                    <p className="text-sm text-slate-500 dark:text-zinc-400">Chargement de la liste des utilisateurs...</p>
                                </div>
                            ) : filteredUsers.length === 0 ? (
                                <div className="p-12 text-center">
                                    <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-400 mx-auto flex items-center justify-center mb-3">
                                        <FaUsers className="text-2xl" />
                                    </div>
                                    <h4 className="text-base font-bold text-slate-700 dark:text-zinc-300 mb-1">
                                        {userSearchQuery ? "Aucun utilisateur trouvé pour cette recherche" : "Aucun utilisateur n'a encore utilisé ce code promo"}
                                    </h4>
                                    <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm mx-auto">
                                        Lorsque des clients ou chauffeurs appliqueront ce code promo lors de leur commande ou course, ils apparaîtront ici.
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-slate-200 dark:border-zinc-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                                                <th className="py-2.5 px-3">#ID & Utilisateur</th>
                                                <th className="py-2.5 px-3">Téléphone</th>
                                                <th className="py-2.5 px-3">Wilaya</th>
                                                <th className="py-2.5 px-3">Type / Rôle</th>
                                                <th className="py-2.5 px-3">Date</th>
                                                <th className="py-2.5 px-3 text-center">Statut</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60 text-xs">
                                            {filteredUsers.map((u) => (
                                                <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/40 transition-colors">
                                                    <td className="py-3 px-3">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs">
                                                                {u.full_name?.charAt(0).toUpperCase() || u.username?.charAt(0).toUpperCase() || "U"}
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-slate-800 dark:text-zinc-100">{u.full_name}</div>
                                                                <div className="text-[10px] text-slate-400 font-mono">@{u.username}</div>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td className="py-3 px-3 font-mono font-medium text-slate-700 dark:text-zinc-300">
                                                        {u.phone !== "N/A" ? (
                                                            <a href={`tel:${u.phone}`} className="hover:text-blue-500 flex items-center gap-1">
                                                                <FaPhoneAlt className="text-[9px] text-slate-400" />
                                                                {u.phone}
                                                            </a>
                                                        ) : (
                                                            <span className="text-slate-400">N/A</span>
                                                        )}
                                                    </td>

                                                    <td className="py-3 px-3">
                                                        <span className="flex items-center gap-1 text-slate-600 dark:text-zinc-300">
                                                            <FaMapMarkerAlt className="text-[10px] text-orange-500" />
                                                            {u.wilaya}
                                                        </span>
                                                    </td>

                                                    <td className="py-3 px-3">
                                                        <span className="px-2 py-0.5 rounded-md font-semibold text-[10px] bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
                                                            {u.type_compte}
                                                        </span>
                                                    </td>

                                                    <td className="py-3 px-3 text-slate-500 dark:text-zinc-400">
                                                        {u.date_joined || "N/A"}
                                                    </td>

                                                    <td className="py-3 px-3 text-center">
                                                        <span
                                                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                                u.is_active
                                                                    ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"
                                                                    : "bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400"
                                                            }`}
                                                        >
                                                            <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? "bg-emerald-500" : "bg-red-500"}`} />
                                                            {u.is_active ? "Actif" : "Inactif"}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t border-slate-200 dark:border-zinc-800 flex justify-end bg-slate-50/50 dark:bg-zinc-900/50">
                            <button
                                onClick={() => setSelectedPromoForUsers(null)}
                                className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-zinc-700 hover:bg-slate-300 dark:hover:bg-zinc-600 text-slate-800 dark:text-zinc-100 font-semibold text-xs transition-all"
                            >
                                Fermer
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL 2 : CRÉER / MODIFIER UN CODE PROMO AVEC CIBLAGE ET EXPIRATION */}
            {/* ========================================================================= */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-[#14171f] border border-slate-200 dark:border-zinc-800 rounded-3xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
                        <div className="p-5 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-gradient-to-r from-orange-50/50 to-amber-50/30 dark:from-zinc-900 dark:to-zinc-900/50">
                            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                                <FaTicketAlt className="text-orange-500" />
                                {editingPromo ? "Modifier le Code Promo" : "Créer un Nouveau Code Promo"}
                            </h3>
                            <button
                                onClick={() => setIsCreateModalOpen(false)}
                                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500"
                            >
                                <FaTimes />
                            </button>
                        </div>

                        <form onSubmit={handleSavePromo} className="p-6 space-y-4 overflow-y-auto flex-1">
                            {/* Code Promo Input with Auto-Generate */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-1.5">
                                    Code Promo *
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        required
                                        value={formData.code_invitation}
                                        onChange={(e) => setFormData({ ...formData, code_invitation: e.target.value.toUpperCase() })}
                                        placeholder="Ex: MAGASIN2026"
                                        className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-sm font-mono font-bold uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, code_invitation: generateRandomCode(8) })}
                                        className="px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 text-xs font-bold flex items-center gap-1.5 shrink-0"
                                        title="Générer un code aléatoire à 8 caractères"
                                    >
                                        <FaRandom className="text-xs text-orange-500" />
                                        <span>Générer</span>
                                    </button>
                                </div>
                            </div>

                            {/* CIBLE / AUDIENCE SELECTOR */}
                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 space-y-3">
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-zinc-200">
                                    🎯 Audience Ciblée *
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { id: "tous_magasins", label: "Tous les magasins", icon: <FaStore /> },
                                        { id: "magasin_specifique", label: "Un magasin précis", icon: <FaStore /> },
                                        { id: "tous_clients", label: "Tous les clients", icon: <FaUsers /> },
                                        { id: "client_specifique", label: "Un client précis", icon: <FaUserCheck /> },
                                        { id: "tous_livreurs", label: "Tous les livreurs", icon: <FaMotorcycle /> },
                                        { id: "livreur_specifique", label: "Un livreur précis", icon: <FaMotorcycle /> },
                                    ].map((opt) => (
                                        <button
                                            type="button"
                                            key={opt.id}
                                            onClick={() => {
                                                setFormData({
                                                    ...formData,
                                                    cible_type: opt.id as PromoCibleType,
                                                    cible_user_id: null,
                                                    cible_magasin_id: null
                                                });
                                                setSelectedTargetUser(null);
                                                setSelectedTargetMagasin(null);
                                                if (opt.id === "client_specifique") {
                                                    searchTargetUsers("", "client");
                                                } else if (opt.id === "livreur_specifique") {
                                                    searchTargetUsers("", "livreur");
                                                } else if (opt.id === "magasin_specifique") {
                                                    searchTargetMagasins("");
                                                }
                                            }}
                                            className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all text-left ${
                                                formData.cible_type === opt.id
                                                    ? "bg-orange-500 text-white border-orange-500 shadow-sm"
                                                    : "bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:bg-slate-100"
                                            }`}
                                        >
                                            <span className="text-sm">{opt.icon}</span>
                                            <span className="truncate">{opt.label}</span>
                                        </button>
                                    ))}
                                </div>

                                {/* Specific Magasin Search / Select if magasin_specifique */}
                                {formData.cible_type === "magasin_specifique" && (
                                    <div className="pt-2 border-t border-slate-200 dark:border-zinc-800 space-y-2">
                                        <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300">
                                            Rechercher et sélectionner le magasin ciblé :
                                        </label>

                                        {selectedTargetMagasin ? (
                                            <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-amber-600 text-white font-bold flex items-center justify-center text-xs">
                                                        <FaStore />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-xs text-amber-900 dark:text-amber-200">{selectedTargetMagasin.name}</div>
                                                        <div className="text-[10px] text-amber-700 dark:text-amber-400">
                                                            {selectedTargetMagasin.address} ({selectedTargetMagasin.wilaya || "N/A"})
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedTargetMagasin(null);
                                                        setFormData({ ...formData, cible_magasin_id: null });
                                                    }}
                                                    className="text-xs text-red-500 hover:underline font-bold px-2 py-1"
                                                >
                                                    Changer
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <div className="relative">
                                                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                                                    <input
                                                        type="text"
                                                        value={targetMagasinsSearchQuery}
                                                        onChange={(e) => {
                                                            setTargetMagasinsSearchQuery(e.target.value);
                                                            searchTargetMagasins(e.target.value);
                                                        }}
                                                        placeholder="Rechercher nom de magasin, adresse..."
                                                        className="w-full pl-8 pr-3 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
                                                    />
                                                </div>

                                                <div className="max-h-32 overflow-y-auto divide-y divide-slate-100 dark:divide-zinc-800 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
                                                    {isLoadingTargetMagasins ? (
                                                        <div className="p-3 text-center text-xs text-slate-400">Recherche...</div>
                                                    ) : targetMagasinsList.length === 0 ? (
                                                        <div className="p-3 text-center text-xs text-slate-400">Aucun magasin trouvé</div>
                                                    ) : (
                                                        targetMagasinsList.map((m) => (
                                                            <div
                                                                key={m.id}
                                                                onClick={() => {
                                                                    setSelectedTargetMagasin(m);
                                                                    setFormData({ ...formData, cible_magasin_id: m.id });
                                                                }}
                                                                className="p-2.5 hover:bg-orange-50 dark:hover:bg-zinc-700 cursor-pointer flex items-center justify-between text-xs"
                                                            >
                                                                <span className="font-bold text-slate-800 dark:text-zinc-200">{m.name}</span>
                                                                <span className="text-[10px] text-slate-500">{m.wilaya || m.address}</span>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Specific User Search / Select if client_specifique or livreur_specifique */}
                                {(formData.cible_type === "client_specifique" || formData.cible_type === "livreur_specifique") && (
                                    <div className="pt-2 border-t border-slate-200 dark:border-zinc-800 space-y-2">
                                        <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300">
                                            Rechercher et sélectionner {formData.cible_type === "client_specifique" ? "le client" : "le livreur"} :
                                        </label>

                                        {selectedTargetUser ? (
                                            <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                                                        {selectedTargetUser.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-xs text-blue-900 dark:text-blue-200">{selectedTargetUser.name}</div>
                                                        <div className="text-[10px] text-blue-600 dark:text-blue-400 font-mono">
                                                            {selectedTargetUser.phone || `@${selectedTargetUser.username}`} ({selectedTargetUser.wilaya || "N/A"})
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedTargetUser(null);
                                                        setFormData({ ...formData, cible_user_id: null });
                                                    }}
                                                    className="text-xs text-red-500 hover:underline font-bold px-2 py-1"
                                                >
                                                    Changer
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <div className="relative">
                                                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                                                    <input
                                                        type="text"
                                                        value={targetUsersSearchQuery}
                                                        onChange={(e) => {
                                                            setTargetUsersSearchQuery(e.target.value);
                                                            searchTargetUsers(e.target.value, formData.cible_type === "client_specifique" ? "client" : "livreur");
                                                        }}
                                                        placeholder="Saisir nom, prénom, tél..."
                                                        className="w-full pl-8 pr-3 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
                                                    />
                                                </div>

                                                <div className="max-h-32 overflow-y-auto divide-y divide-slate-100 dark:divide-zinc-800 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
                                                    {isLoadingTargetUsers ? (
                                                        <div className="p-3 text-center text-xs text-slate-400">Recherche...</div>
                                                    ) : targetUsersList.length === 0 ? (
                                                        <div className="p-3 text-center text-xs text-slate-400">Aucun utilisateur trouvé</div>
                                                    ) : (
                                                        targetUsersList.map((u) => (
                                                            <div
                                                                key={u.id}
                                                                onClick={() => {
                                                                    setSelectedTargetUser(u);
                                                                    setFormData({ ...formData, cible_user_id: u.id });
                                                                }}
                                                                className="p-2.5 hover:bg-orange-50 dark:hover:bg-zinc-700 cursor-pointer flex items-center justify-between text-xs"
                                                            >
                                                                <span className="font-bold text-slate-800 dark:text-zinc-200">{u.name}</span>
                                                                <span className="text-[10px] text-slate-500 font-mono">{u.phone} ({u.wilaya})</span>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Percentage Discount */}
                            <div>
                                <div className="flex justify-between items-center mb-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                                        Taux de Réduction (%) *
                                    </label>
                                    <span className="text-sm font-extrabold text-orange-600 dark:text-orange-400">
                                        {formData.pourcentage}%
                                    </span>
                                </div>
                                <input
                                    type="number"
                                    step="0.1"
                                    min="0.1"
                                    max="100"
                                    required
                                    value={formData.pourcentage}
                                    onChange={(e) => setFormData({ ...formData, pourcentage: parseFloat(e.target.value) || 0 })}
                                    className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                                />
                                <div className="flex gap-2 mt-2">
                                    {[2, 5, 10, 15, 20].map((preset) => (
                                        <button
                                            type="button"
                                            key={preset}
                                            onClick={() => setFormData({ ...formData, pourcentage: preset })}
                                            className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all ${
                                                formData.pourcentage === preset
                                                    ? "bg-orange-500 text-white shadow-xs"
                                                    : "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200"
                                            }`}
                                        >
                                            {preset}%
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* MAX USAGES & EXPIRATION DATE */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Max usages limit */}
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-1.5">
                                        Nombre Max d&apos;Utilisations
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData.max_utilisations}
                                        onChange={(e) => setFormData({ ...formData, max_utilisations: parseInt(e.target.value) || 0 })}
                                        placeholder="0 = Illimité"
                                        className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                                    />
                                    <span className="text-[10px] text-slate-400">0 pour utilisations illimitées</span>
                                </div>

                                {/* Date Expiration */}
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-1.5">
                                        Date & Heure de Fin
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={formData.date_expiration}
                                        onChange={(e) => setFormData({ ...formData, date_expiration: e.target.value })}
                                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                                    />
                                    <div className="flex gap-1.5 mt-1.5">
                                        <button
                                            type="button"
                                            onClick={() => setExpirationPreset(7)}
                                            className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200"
                                        >
                                            +7j
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setExpirationPreset(30)}
                                            className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200"
                                        >
                                            +30j
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setExpirationPreset(0)}
                                            className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200"
                                        >
                                            Sans fin
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Active Toggle & Partner */}
                            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
                                <div>
                                    <div className="text-xs font-bold text-slate-800 dark:text-zinc-200">Statut du code promo</div>
                                    <div className="text-[10px] text-slate-400">Activer ou désactiver immédiatement ce code</div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.is_active}
                                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                </label>
                            </div>

                            {/* Submit buttons */}
                            <div className="pt-4 border-t border-slate-200 dark:border-zinc-800 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 font-semibold text-sm transition-all"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm shadow-md transition-all disabled:opacity-50"
                                >
                                    {isSubmitting ? "Enregistrement..." : editingPromo ? "Mettre à jour" : "Créer le code"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL 3 : CONFIRMATION DE SUPPRESSION */}
            {/* ========================================================================= */}
            {deletingPromo && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-[#14171f] border border-slate-200 dark:border-zinc-800 rounded-3xl w-full max-w-md p-6 shadow-2xl">
                        <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/50 text-red-600 mx-auto flex items-center justify-center mb-4">
                            <FaTrash className="text-xl" />
                        </div>
                        <h3 className="text-lg font-bold text-center text-slate-900 dark:text-white mb-2">
                            Supprimer le code promo ?
                        </h3>
                        <p className="text-xs text-center text-slate-500 dark:text-zinc-400 mb-6">
                            Êtes-vous sûr de vouloir supprimer le code promo{" "}
                            <span className="font-mono font-bold text-slate-800 dark:text-white">
                                &quot;{deletingPromo.code_invitation}&quot;
                            </span>{" "}
                            ? Cette action est irréversible.
                        </p>
                        <div className="flex justify-center gap-3">
                            <button
                                onClick={() => setDeletingPromo(null)}
                                className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-semibold text-sm hover:bg-slate-200"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleDeletePromo}
                                disabled={isSubmitting}
                                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-md transition-all disabled:opacity-50"
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
