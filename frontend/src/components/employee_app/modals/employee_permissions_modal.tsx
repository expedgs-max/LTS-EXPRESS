"use client";

import React, { useState, useMemo } from "react";
import {
    MdClose,
    MdSecurity,
    MdSave,
    MdCheckCircle,
    MdBlock,
    MdFilterList,
    MdDoneAll,
    MdRemoveCircleOutline,
    MdLocalTaxi,
    MdAttachMoney,
    MdAltRoute,
    MdLocalShipping,
    MdOutlineRequestQuote,
    MdOutlinePendingActions,
    MdContactSupport,
    MdOutlineShoppingBasket,
    MdOutlineStorefront,
    MdDeliveryDining,
    MdMap,
    MdCampaign,
    MdCalculate,
    MdBusinessCenter,
    MdPeopleAlt,
    MdOutlineReport,
    MdAccountBalanceWallet,
} from "react-icons/md";
import { TbRecharging } from "react-icons/tb";
import { FaTrophy } from "react-icons/fa6";
import { updateEmployeePermissions, toggleEmployeeBlock } from "@/lib/employee_action";
import {
    ALL_PERMISSIONS_REGISTRY,
    getPermissionsForRole,
    getRoleDisplayInfo,
    isDefaultActiveForRole,
    PermissionDefinition,
} from "@/lib/permissions_definitions";

interface EmployeePermissionsModalProps {
    employee: Users;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function EmployeePermissionsModal({
    employee,
    isOpen,
    onClose,
    onSuccess,
}: EmployeePermissionsModalProps) {
    const roleInfo = useMemo(() => getRoleDisplayInfo(employee.role), [employee.role]);

    // Permissions spécifiques à ce rôle
    const rolePermissions = useMemo(() => getPermissionsForRole(employee.role), [employee.role]);

    // Mode d'affichage : "role_only" (seulement ce rôle) ou "all" (toutes)
    const [viewMode, setViewMode] = useState<"role_only" | "all">("role_only");

    const getInitialPermissions = (emp: Users): Record<string, boolean> => {
        const state: Record<string, boolean> = {};

        ALL_PERMISSIONS_REGISTRY.forEach((perm) => {
            const rawVal =
                (emp as unknown as Record<string, unknown>)[perm.key] ??
                (perm.key === "permission_commission_vtc" ? emp.commission_vtc : undefined) ??
                (perm.key === "permission_compte_vtc" ? emp.compte_vtc : undefined) ??
                (perm.key === "permission_list_course" ? emp.list_course : undefined) ??
                (perm.key === "permission_vtc_detaille" ? emp.vtc_detaille : undefined);

            if (rawVal !== undefined && rawVal !== null) {
                state[perm.key] = Boolean(rawVal);
            } else {
                state[perm.key] = isDefaultActiveForRole(perm.key, emp.role);
            }
        });

        // Cas particulier validation
        if (emp.permission_vlider !== undefined && emp.permission_vlider !== null) {
            state.permission_vlider = Boolean(emp.permission_vlider);
        } else {
            state.permission_vlider = isDefaultActiveForRole("permission_vlider", emp.role);
        }

        return state;
    };

    // Initialisation dynamique des permissions
    const [permissionsState, setPermissionsState] = useState<Record<string, boolean>>(() =>
        getInitialPermissions(employee)
    );

    // Statut Actif / Bloqué
    const [isBlocked, setIsBlocked] = useState(Boolean(employee.bloquer));
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Synchronisation lorsque l'employé change ou que la modale s'ouvre
    React.useEffect(() => {
        setPermissionsState(getInitialPermissions(employee));
        setIsBlocked(Boolean(employee.bloquer));
    }, [employee, isOpen]);

    // Liste des permissions à afficher selon l'onglet choisi
    const displayedPermissions = useMemo(() => {
        if (viewMode === "role_only") {
            return rolePermissions;
        }
        return ALL_PERMISSIONS_REGISTRY;
    }, [viewMode, rolePermissions]);

    if (!isOpen) return null;

    const handleToggle = (key: string) => {
        setPermissionsState((prev) => ({
            ...prev,
            [key]: !prev[key],
        }));
    };

    const handleSelectAll = (enable: boolean) => {
        setPermissionsState((prev) => {
            const updated = { ...prev };
            displayedPermissions.forEach((p) => {
                updated[p.key] = enable;
            });
            return updated;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const permPromise = updateEmployeePermissions(employee.id, permissionsState);

        const blockPromise =
            isBlocked !== employee.bloquer
                ? toggleEmployeeBlock(employee.id, isBlocked)
                : Promise.resolve(true);

        const [permRes, blockRes] = await Promise.all([permPromise, blockPromise]);
        setIsSubmitting(false);

        if (permRes && blockRes) {
            onSuccess();
            onClose();
        }
    };

    const getPermissionIcon = (key: string) => {
        switch (key) {
            case "permission_dispatch_vtc":
                return <MdMap className="text-amber-500" />;
            case "permission_list_course":
                return <MdAltRoute className="text-sky-500" />;
            case "permission_compte_vtc":
                return <MdLocalTaxi className="text-amber-500" />;
            case "permission_commission_vtc":
                return <MdAttachMoney className="text-amber-500" />;
            case "permission_vtc_detaille":
                return <MdLocalTaxi className="text-rose-500" />;
            case "permission_transporteurs":
                return <MdLocalShipping className="text-amber-600" />;
            case "permission_demandes_vtc":
                return <MdOutlineRequestQuote className="text-teal-500" />;
            case "permission_actions_vtc":
            case "permission_actions":
                return <MdOutlinePendingActions className="text-indigo-500" />;
            case "permission_caisse_vtc":
                return <MdAccountBalanceWallet className="text-amber-500" />;
            case "permission_apple_center":
                return <MdContactSupport className="text-sky-500" />;
            case "permission_commandes":
                return <MdOutlineShoppingBasket className="text-violet-500" />;
            case "permission_magasins":
                return <MdOutlineStorefront className="text-rose-500" />;
            case "permission_livreurs":
                return <MdDeliveryDining className="text-emerald-500" />;
            case "permission_dispatch":
                return <MdMap className="text-emerald-500" />;
            case "permission_vlider":
                return <MdCheckCircle className="text-emerald-500" />;
            case "permission_promo":
                return <MdCampaign className="text-pink-500" />;
            case "permission_objectifs":
                return <FaTrophy className="text-amber-400" />;
            case "permission_comptable":
                return <MdCalculate className="text-teal-500" />;
            case "permission_caisses":
                return <MdAttachMoney className="text-amber-500" />;
            case "permission_caisse_livreur":
            case "permission_commission_livreur":
                return <MdDeliveryDining className="text-emerald-500" />;
            case "permission_deliveries":
                return <MdDeliveryDining className="text-blue-500" />;
            case "permission_partenaire":
                return <MdBusinessCenter className="text-indigo-500" />;
            case "permission_superviseurs":
                return <MdPeopleAlt className="text-purple-500" />;
            case "permission_rapports":
                return <MdOutlineReport className="text-purple-500" />;
            case "permission_recharge":
                return <TbRecharging className="text-amber-500" />;
            default:
                return <MdSecurity className="text-indigo-500" />;
        }
    };

    const grantedCount = displayedPermissions.filter((p) => permissionsState[p.key]).length;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
            <div className="relative w-full max-w-xl bg-white dark:bg-[#181a20] rounded-3xl shadow-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[92vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200/80 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/40 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-2xl font-bold">
                            <MdSecurity />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-lg font-bold text-slate-800 dark:text-zinc-100">
                                    Permissions & Accès
                                </h2>
                                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${roleInfo.badgeColor}`}>
                                    {roleInfo.label}
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                                {employee.first_name || ""} {employee.last_name || ""}{" "}
                                <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                                    (@{employee.username})
                                </span>
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-all"
                    >
                        <MdClose className="text-xl" />
                    </button>
                </div>

                {/* Sub-header Filter Tabs */}
                <div className="px-6 py-3 border-b border-slate-200/80 dark:border-zinc-800/80 bg-slate-100/50 dark:bg-zinc-900/20 flex flex-wrap items-center justify-between gap-2 shrink-0">
                    <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-200/70 dark:bg-zinc-800">
                        <button
                            type="button"
                            onClick={() => setViewMode("role_only")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                viewMode === "role_only"
                                    ? "bg-white dark:bg-zinc-700 text-slate-900 dark:text-white shadow-xs"
                                    : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
                            }`}
                        >
                            Permissions {roleInfo.label} ({rolePermissions.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode("all")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                viewMode === "all"
                                    ? "bg-white dark:bg-zinc-700 text-slate-900 dark:text-white shadow-xs"
                                    : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
                            }`}
                        >
                            Toutes les Permissions ({ALL_PERMISSIONS_REGISTRY.length})
                        </button>
                    </div>

                    {/* Quick batch toggles */}
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => handleSelectAll(true)}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                            title="Tout activer dans cette vue"
                        >
                            <MdDoneAll /> Tout activer
                        </button>
                        <span className="text-slate-300 dark:text-zinc-700">|</span>
                        <button
                            type="button"
                            onClick={() => handleSelectAll(false)}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-slate-700 dark:text-zinc-400"
                            title="Tout désactiver dans cette vue"
                        >
                            <MdRemoveCircleOutline /> Tout désactiver
                        </button>
                    </div>
                </div>

                {/* Form Body (Scrollable) */}
                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                    <div className="p-6 space-y-3.5 overflow-y-auto max-h-[calc(92vh-190px)]">
                        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400 pb-1">
                            <span>
                                {grantedCount} sur {displayedPermissions.length} accordée(s)
                            </span>
                            {viewMode === "role_only" && (
                                <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                                    Filtre automatique appliqué pour {roleInfo.label}
                                </span>
                            )}
                        </div>

                        {/* List of Permissions */}
                        {displayedPermissions.map((perm) => {
                            const isGranted = Boolean(permissionsState[perm.key]);

                            return (
                                <div
                                    key={perm.key}
                                    className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                                        isGranted
                                            ? "bg-slate-50/80 dark:bg-zinc-900/60 border-slate-200 dark:border-zinc-700/80"
                                            : "bg-slate-50/30 dark:bg-zinc-900/20 border-slate-200/60 dark:border-zinc-800/60 opacity-80"
                                    }`}
                                >
                                    <div className="flex items-start gap-3 flex-1 min-w-0">
                                        <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-lg shrink-0 mt-0.5 shadow-2xs">
                                            {getPermissionIcon(perm.key)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-bold text-sm text-slate-900 dark:text-zinc-100 truncate">
                                                    {perm.label}
                                                </span>
                                                {isGranted ? (
                                                    <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                                                        Accordé
                                                    </span>
                                                ) : (
                                                    <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-slate-200 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400">
                                                        Désactivé
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                                                {perm.description}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Toggle Switch */}
                                    <button
                                        type="button"
                                        onClick={() => handleToggle(perm.key)}
                                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                                            isGranted ? "bg-emerald-600" : "bg-slate-300 dark:bg-zinc-700"
                                        }`}
                                    >
                                        <span
                                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                                isGranted ? "translate-x-5" : "translate-x-0"
                                            }`}
                                        />
                                    </button>
                                </div>
                            );
                        })}

                        {/* Account Access (Block / Active) */}
                        <div className="pt-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                                Sécurité du Compte
                            </span>
                            <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-900/50 flex items-center justify-between gap-3">
                                <div className="flex items-start gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center text-lg shrink-0 mt-0.5">
                                        <MdBlock />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-sm text-slate-900 dark:text-zinc-100">
                                                Statut de Connexion (Bloqué / Actif)
                                            </span>
                                            {isBlocked ? (
                                                <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
                                                    Bloqué
                                                </span>
                                            ) : (
                                                <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                                                    Actif
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                                            Empêche l&apos;utilisateur d&apos;accéder au tableau de bord.
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setIsBlocked(!isBlocked)}
                                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                                        isBlocked ? "bg-red-600" : "bg-slate-300 dark:bg-zinc-700"
                                    }`}
                                >
                                    <span
                                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                            isBlocked ? "translate-x-5" : "translate-x-0"
                                        }`}
                                    />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Submit Bar */}
                    <div className="px-6 py-4 flex items-center justify-end gap-3 border-t border-slate-200/80 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/40 shrink-0">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 font-semibold text-sm transition-all"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-bold text-sm shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50"
                        >
                            <MdSave className="text-lg" />
                            {isSubmitting ? "Enregistrement..." : "Enregistrer les permissions"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
