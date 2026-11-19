"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
    FaSearch,
    FaFilter,
    FaBell,
    FaBan,
    FaCheckCircle,
    FaStore,
    FaMotorcycle,
    FaUser,
    FaTrashAlt,
    FaTimes,
    FaPhoneAlt,
    FaEnvelope,
    FaUserEdit
} from "react-icons/fa";
import { MdOutlineRefresh } from "react-icons/md";
import { CentreAppelCompte, toggleBlockUserCentreAppel, deleteUserToCorbeille } from "@/lib/call_action";
import { Wilaya } from "@/lib/tools/named";
import SendNotificationModal from "../windows/centre_win/send_notification_modal";
import ShowCorbielle from "../windows/centre_win/show_user_blocker";
import EditUserModal from "../windows/centre_win/edit_user_modal";
import toast from "react-hot-toast";

interface AppleCenterProps {
    comptes?: CentreAppelCompte[];
    parteners?: unknown[]; // fallback legacy
    refresh: () => void;
    currentType?: string;
    currentSearch?: string;
    currentWilaya?: string;
    currentStatus?: string;
}

export default function AppleCenter({
    comptes = [],
    parteners = [],
    refresh,
    currentType = "all",
    currentSearch = "",
    currentWilaya = "",
    currentStatus = "all"
}: AppleCenterProps) {
    // Normalization in case legacy parteners prop is passed
    const accountsList: CentreAppelCompte[] = (comptes && comptes.length > 0)
        ? comptes
        : (parteners as Array<any>).map((p: any) => ({
            id: p.user?.id || p.id,
            username: p.user?.username || `user_${p.id}`,
            first_name: p.user?.first_name || "",
            last_name: p.user?.last_name || "",
            date_de_naissance: p.user?.date_de_naissance || "",
            type_account: p.user?.type_account || "classique",
            phone: p.user?.phone_number_1 || "",
            email: p.user?.email || "",
            wilaya: p.user?.wilaya || "",
            wilaya_code: p.user?.wilaya_code,
            role: p.user?.role || "partener",
            account_type: (p.type_compte?.name || "").toLowerCase().includes("livreur") ? "livreur" : "magasin",
            type_label: p.nom_de_magasin ? `Magasin (${p.nom_de_magasin})` : (p.type_compte?.name || "Partenaire"),
            nom_magasin: p.nom_de_magasin || "",
            is_active: Boolean(p.user?.is_active),
            is_blocked: Boolean(p.user?.bloquer),
            date_joined: p.user?.date_joined || "",
            rating: 5.0,
            image_url: p.user?.image_url,
            rc: p.RC || "",
            partenaire_id: p.id
        }));

    const [selectedAccountForNotification, setSelectedAccountForNotification] = useState<CentreAppelCompte | null>(null);
    const [editingAccount, setEditingAccount] = useState<CentreAppelCompte | null>(null);
    const [showCorbeille, setShowCorbeille] = useState<boolean>(false);

    const handleToggleBlock = async (account: CentreAppelCompte) => {
        const confirmMsg = account.is_blocked
            ? `Voulez-vous vraiment débloquer le compte de ${account.username} ?`
            : `Voulez-vous vraiment bloquer le compte de ${account.username} ?`;

        if (window.confirm(confirmMsg)) {
            const success = await toggleBlockUserCentreAppel(account.id, account.is_blocked);
            if (success) {
                refresh();
            }
        }
    };

    const handleDeleteToCorbeille = async (account: CentreAppelCompte) => {
        const confirmMsg = `Voulez-vous vraiment supprimer le profil de « ${account.username} » ?\n\nCe profil sera déplacé dans la Corbeille (vous pourrez le restaurer à tout moment).`;
        if (window.confirm(confirmMsg)) {
            const success = await deleteUserToCorbeille(account.id);
            if (success) {
                refresh();
            }
        }
    };

    // Account counts
    const totalCount = accountsList.length;
    const clientsCount = accountsList.filter((a) => a.account_type === "client").length;
    const livreursCount = accountsList.filter((a) => a.account_type === "livreur").length;
    const magasinsCount = accountsList.filter((a) => a.account_type === "magasin").length;
    const blockedCount = accountsList.filter((a) => a.is_blocked).length;

    return (
        <div className="py-6 px-4 sm:px-8 w-full text-slate-900 dark:text-slate-100">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6">
                <div>
                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-1">
                        <Link href="/dashboard" className="hover:text-blue-500 font-medium">Tableau de bord</Link>
                        <span>/</span>
                        <span className="text-slate-800 dark:text-slate-200 font-semibold">Centre d&apos;appel</span>
                        <span>/</span>
                        <span>Gestion des Comptes</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                        Centre d&apos;Appel - Comptes & Modération
                    </h1>
                </div>

                {/* Header Action Badges & Buttons */}
                <div className="flex items-center gap-3 flex-wrap">
                    {blockedCount > 0 && (
                        <span className="px-3.5 py-1.5 bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300 font-bold text-xs rounded-full border border-red-200 dark:border-red-800/40 flex items-center gap-1.5 shadow-sm">
                            <FaBan className="text-red-500" />
                            {blockedCount} Bloqué(s)
                        </span>
                    )}

                    <button
                        onClick={() => setShowCorbeille(true)}
                        className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-2"
                        title="Voir les comptes désactivés / corbeille"
                    >
                        <FaTrashAlt className="text-red-500" /> Corbeille
                    </button>

                    <button
                        onClick={refresh}
                        className="p-2.5 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-200 dark:border-blue-800/50 transition-colors"
                        title="Actualiser"
                    >
                        <MdOutlineRefresh className="text-lg" />
                    </button>
                </div>
            </div>

            {/* Type Tabs */}
            <div className="flex items-center gap-2 pb-4 overflow-x-auto">
                <Link
                    href={`/dashboard/apple_center?type=all&search=${currentSearch}&wilaya=${currentWilaya}&status=${currentStatus}`}
                    className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shrink-0 ${
                        currentType === "all"
                            ? "bg-slate-900 text-white shadow-md"
                            : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
                    }`}
                >
                    🌐 Tous les Comptes ({totalCount})
                </Link>

                <Link
                    href={`/dashboard/apple_center?type=client&search=${currentSearch}&wilaya=${currentWilaya}&status=${currentStatus}`}
                    className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shrink-0 ${
                        currentType === "client"
                            ? "bg-blue-600 text-white shadow-md shadow-blue-500/25"
                            : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
                    }`}
                >
                    <FaUser className="text-blue-500" /> Clients ({clientsCount})
                </Link>

                <Link
                    href={`/dashboard/apple_center?type=livreur&search=${currentSearch}&wilaya=${currentWilaya}&status=${currentStatus}`}
                    className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shrink-0 ${
                        currentType === "livreur"
                            ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/25"
                            : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
                    }`}
                >
                    <FaMotorcycle className="text-emerald-500" /> Livreurs ({livreursCount})
                </Link>

                <Link
                    href={`/dashboard/apple_center?type=magasin&search=${currentSearch}&wilaya=${currentWilaya}&status=${currentStatus}`}
                    className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shrink-0 ${
                        currentType === "magasin"
                            ? "bg-purple-600 text-white shadow-md shadow-purple-500/25"
                            : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
                    }`}
                >
                    <FaStore className="text-purple-500" /> Magasins ({magasinsCount})
                </Link>
            </div>

            {/* Filter Bar */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm dark:shadow-none border border-slate-100 dark:border-slate-800 mb-6 transition-colors">
                <form method="GET" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <input type="hidden" name="type" value={currentType} />

                    {/* Search */}
                    <div className="relative">
                        <FaSearch className="absolute left-3.5 top-3.5 text-slate-400" />
                        <input
                            type="text"
                            name="search"
                            defaultValue={currentSearch}
                            placeholder="Nom, username, tél, email, magasin..."
                            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Wilaya Filter */}
                    <div>
                        <select
                            name="wilaya"
                            defaultValue={currentWilaya}
                            className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                        >
                            <option value="">Toutes les Wilayas</option>
                            {Wilaya.map((w) => (
                                <option key={w.code} value={w.name}>
                                    {String(w.code).padStart(2, "0")} - {w.name} ({w.ar_name})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Status Filter */}
                    <div>
                        <select
                            name="status"
                            defaultValue={currentStatus}
                            className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                        >
                            <option value="all">Tous les Statuts</option>
                            <option value="active">Actifs uniquement</option>
                            <option value="bloque">Bloqués uniquement</option>
                        </select>
                    </div>

                    {/* Submit Button */}
                    <div className="flex gap-2">
                        <button
                            type="submit"
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm py-2.5 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                        >
                            <FaFilter /> Filtrer
                        </button>
                        {(currentSearch || currentWilaya || (currentStatus && currentStatus !== "all")) && (
                            <Link
                                href={`/dashboard/apple_center?type=${currentType}`}
                                className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl flex items-center justify-center text-sm font-semibold transition-colors"
                                title="Réinitialiser"
                            >
                                Réinit.
                            </Link>
                        )}
                    </div>
                </form>
            </div>

            {/* Comptes Table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden transition-colors">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                        <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
                            <tr>
                                <th className="px-5 py-4">#ID</th>
                                <th className="px-5 py-4">Compte & Utilisateur</th>
                                <th className="px-5 py-4">Type</th>
                                <th className="px-5 py-4">Wilaya</th>
                                <th className="px-5 py-4">Commande Livrées</th>
                                <th className="px-5 py-4">Coordonnées</th>
                                <th className="px-5 py-4">Statut</th>
                                <th className="px-5 py-4 text-center">Actions & Modération</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                            {accountsList.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="text-center py-12 text-slate-400">
                                        Aucun compte trouvé selon ces filtres.
                                    </td>
                                </tr>
                            ) : (
                                accountsList.map((account) => {
                                    const isClient = account.account_type === "client";
                                    const isLivreur = account.account_type === "livreur";
                                    const isMagasin = account.account_type === "magasin";

                                    return (
                                        <tr
                                            key={account.id}
                                            className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors"
                                        >
                                            <td className="px-5 py-4 font-bold text-slate-900 dark:text-white">
                                                #{account.id}
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white shrink-0 ${
                                                            isClient
                                                                ? "bg-blue-600"
                                                                : isLivreur
                                                                ? "bg-emerald-600"
                                                                : "bg-purple-600"
                                                        }`}
                                                    >
                                                        {account.username?.[0]?.toUpperCase() || "U"}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                                                            @{account.username}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span
                                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${
                                                        isClient
                                                            ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/50"
                                                            : isLivreur
                                                            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50"
                                                            : "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200/50"
                                                    }`}
                                                >
                                                    {isClient && <FaUser />}
                                                    {isLivreur && <FaMotorcycle />}
                                                    {isMagasin && <FaStore />}
                                                    {account.type_label}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium rounded-lg text-xs">
                                                    {account.wilaya || "N/A"}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold text-xs rounded-lg border border-blue-100 dark:border-blue-800/40">
                                                    📦 {account.nbr_commandes ?? account.commandes_count ?? 0}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex flex-col gap-0.5">
                                                    {account.phone ? (
                                                        <a
                                                            href={`tel:${account.phone}`}
                                                            className="text-xs font-medium text-slate-800 dark:text-slate-200 hover:text-blue-500 flex items-center gap-1.5"
                                                        >
                                                            <FaPhoneAlt className="text-[10px] text-slate-400" />
                                                            {account.phone}
                                                        </a>
                                                    ) : (
                                                        <span className="text-xs text-slate-400 italic">Tél: N/A</span>
                                                    )}
                                                    {account.email && (
                                                        <span className="text-[11px] text-slate-400 truncate max-w-[150px] flex items-center gap-1.5">
                                                            <FaEnvelope className="text-[10px]" />
                                                            {account.email}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                {account.is_blocked ? (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 dark:bg-red-950/40 text-red-800 dark:text-red-300 font-bold text-xs rounded-full border border-red-200 dark:border-red-800/50">
                                                        <FaBan className="text-red-500" />
                                                        Bloqué
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold text-xs rounded-full border border-emerald-200 dark:border-emerald-800/50">
                                                        <FaCheckCircle className="text-emerald-500" />
                                                        Actif
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    {/* Edit User Button */}
                                                    <button
                                                        onClick={() => setEditingAccount(account)}
                                                        className="px-3 py-1.5 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300 font-bold text-xs rounded-xl border border-amber-200/50 dark:border-amber-800/50 transition-all flex items-center gap-1.5 shadow-sm"
                                                        title="Modifier les informations de cet utilisateur"
                                                    >
                                                        <FaUserEdit /> Modifier
                                                    </button>

                                                    {/* Notification Button */}
                                                    <button
                                                        onClick={() => setSelectedAccountForNotification(account)}
                                                        className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 font-bold text-xs rounded-xl border border-blue-200/50 dark:border-blue-800/50 transition-all flex items-center gap-1.5 shadow-sm"
                                                        title="Envoyer une notification à cet utilisateur"
                                                    >
                                                        <FaBell /> Notifier
                                                    </button>

                                                    {/* Block / Unblock Button */}
                                                    <button
                                                        onClick={() => handleToggleBlock(account)}
                                                        className={`px-3 py-1.5 font-bold text-xs rounded-xl border transition-all flex items-center gap-1.5 shadow-sm ${
                                                            account.is_blocked
                                                                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 border-emerald-200 dark:border-emerald-800/50"
                                                                : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 border-amber-200 dark:border-amber-800/50"
                                                        }`}
                                                        title={account.is_blocked ? "Débloquer ce compte" : "Bloquer ce compte"}
                                                    >
                                                        <FaBan />
                                                        {account.is_blocked ? "Débloquer" : "Bloquer"}
                                                    </button>

                                                    {/* Supprimer / Envoyer vers la Corbeille Button */}
                                                    {!account.is_blocked && (
                                                        <button
                                                            onClick={() => handleDeleteToCorbeille(account)}
                                                            className="px-3 py-1.5 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 font-bold text-xs rounded-xl border border-red-200/60 dark:border-red-800/50 transition-all flex items-center gap-1.5 shadow-sm"
                                                            title="Supprimer ce profil (envoyer dans la Corbeille)"
                                                        >
                                                            <FaTrashAlt /> Supprimer
                                                        </button>
                                                    )}

                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit User Modal */}
            {editingAccount && (
                <EditUserModal
                    account={editingAccount}
                    onClose={() => setEditingAccount(null)}
                    onSaved={refresh}
                />
            )}

            {/* Notification Modal */}
            {selectedAccountForNotification && (
                <SendNotificationModal
                    account={selectedAccountForNotification}
                    onClose={() => setSelectedAccountForNotification(null)}
                    onSent={refresh}
                />
            )}

            {/* Blocked Accounts Trash Modal */}
            {showCorbeille && (
                <ShowCorbielle
                    closeCorbiel={() => setShowCorbeille(false)}
                    refresh={refresh}
                />
            )}
        </div>
    );
}
