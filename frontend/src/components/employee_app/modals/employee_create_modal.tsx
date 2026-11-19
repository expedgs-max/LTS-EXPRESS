"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
    MdClose,
    MdPersonAdd,
    MdPerson,
    MdEmail,
    MdPhone,
    MdVpnKey,
    MdLocationOn,
    MdAdminPanelSettings,
    MdSave,
    MdDoneAll,
    MdRemoveCircleOutline,
} from "react-icons/md";
import { Wilaya } from "@/lib/tools/named";
import { ALL_USER_ROLES, createEmployee } from "@/lib/employee_action";
import {
    getPermissionsForRole,
    getRoleDisplayInfo,
} from "@/lib/permissions_definitions";
import toast from "react-hot-toast";

interface EmployeeCreateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function EmployeeCreateModal({
    isOpen,
    onClose,
    onSuccess,
}: EmployeeCreateModalProps) {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("centre_appel");
    const [phone1, setPhone1] = useState("");
    const [phone2, setPhone2] = useState("");
    const [email, setEmail] = useState("");
    const [wilaya, setWilaya] = useState("");
    const [sexe, setSexe] = useState("homme");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Permissions dynamiques selon le rôle sélectionné
    const rolePermissions = useMemo(() => getPermissionsForRole(role), [role]);
    const roleInfo = useMemo(() => getRoleDisplayInfo(role), [role]);

    const [permissionsState, setPermissionsState] = useState<Record<string, boolean>>({});

    // Mettre à jour l'état initial des permissions quand le rôle change
    useEffect(() => {
        const initial: Record<string, boolean> = {};
        rolePermissions.forEach((p) => {
            initial[p.key] = true;
        });
        setPermissionsState(initial);
    }, [role, rolePermissions]);

    if (!isOpen) return null;

    const handleToggle = (key: string) => {
        setPermissionsState((prev) => ({
            ...prev,
            [key]: !prev[key],
        }));
    };

    const handleSelectAll = (enable: boolean) => {
        setPermissionsState((prev) => {
            const next = { ...prev };
            rolePermissions.forEach((p) => {
                next[p.key] = enable;
            });
            return next;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!username.trim() || !password.trim() || !phone1.trim()) {
            toast.error("Veuillez remplir les champs obligatoires (username, mot de passe, téléphone)");
            return;
        }

        if (password.length < 6) {
            toast.error("Le mot de passe doit comporter au moins 6 caractères");
            return;
        }

        setIsSubmitting(true);
        const formattedPhone1 = `+213${phone1.trim().replace(/^0+/, "")}`;
        const formattedPhone2 = phone2.trim() ? `+213${phone2.trim().replace(/^0+/, "")}` : undefined;

        const wilayaObj = Wilaya.find((w) => w.name.toLowerCase() === wilaya.toLowerCase());
        const wilayaCode = wilayaObj ? wilayaObj.code : undefined;

        const success = await createEmployee({
            username: username.trim(),
            password: password.trim(),
            nom: firstName.trim(),
            prenom: lastName.trim(),
            role,
            phone_number_1: formattedPhone1,
            phone_number_2: formattedPhone2,
            email: email.trim() || undefined,
            wilaya: wilaya || undefined,
            wilaya_code: wilayaCode,
            sexe,
            rendement: 100,
            ...permissionsState,
            // Aliases de compatibilité
            permission_vlider: Boolean(permissionsState.permission_vlider),
            commission_vtc: Boolean(permissionsState.permission_commission_vtc),
            compte_vtc: Boolean(permissionsState.permission_compte_vtc),
            list_course: Boolean(permissionsState.permission_list_course),
            vtc_detaille: Boolean(permissionsState.permission_vtc_detaille),
        });

        setIsSubmitting(false);

        if (success) {
            onSuccess();
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
            <div className="relative w-full max-w-2xl bg-white dark:bg-[#181a20] rounded-3xl shadow-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[92vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200/80 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/40 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-2xl font-bold">
                            <MdPersonAdd />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800 dark:text-zinc-100">
                                Créer un Nouveau Compte
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-zinc-400">
                                Renseignez les informations et activez les permissions du rôle
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

                {/* Form Body (Scrollable) */}
                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                    <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(92vh-140px)]">
                        {/* Section 1 : Identifiants de connexion */}
                        <div className="p-4 rounded-2xl bg-slate-50/60 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 space-y-3">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                                Identifiants de connexion
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block mb-1">
                                        Nom d&apos;utilisateur (@username) *
                                    </label>
                                    <div className="relative">
                                        <MdPerson className="absolute left-3 top-3 text-slate-400 text-base" />
                                        <input
                                            type="text"
                                            required
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            placeholder="ex: aminedispatch"
                                            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block mb-1">
                                        Mot de passe (min 6 car.) *
                                    </label>
                                    <div className="relative">
                                        <MdVpnKey className="absolute left-3 top-3 text-slate-400 text-base" />
                                        <input
                                            type="password"
                                            required
                                            minLength={6}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section 2 : Rôle Assigné */}
                        <div className="p-4 rounded-2xl bg-slate-50/60 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block">
                                    Rôle & Fonction dans LTC Express *
                                </label>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${roleInfo.badgeColor}`}>
                                    {roleInfo.label}
                                </span>
                            </div>
                            <div className="relative">
                                <MdAdminPanelSettings className="absolute left-3 top-3 text-slate-400 text-base" />
                                <select
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden font-semibold"
                                >
                                    {ALL_USER_ROLES.map((r) => (
                                        <option key={r.key} value={r.key}>
                                            {r.label} ({r.description})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Section 3 : Informations personnelles */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block mb-1">
                                    Prénom
                                </label>
                                <input
                                    type="text"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    placeholder="Prénom"
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900/80 text-slate-900 dark:text-zinc-100 text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block mb-1">
                                    Nom
                                </label>
                                <input
                                    type="text"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    placeholder="Nom de famille"
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900/80 text-slate-900 dark:text-zinc-100 text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block mb-1">
                                    Téléphone Principal *
                                </label>
                                <div className="relative">
                                    <MdPhone className="absolute left-3 top-3 text-slate-400 text-base" />
                                    <input
                                        type="tel"
                                        required
                                        value={phone1}
                                        onChange={(e) => setPhone1(e.target.value)}
                                        placeholder="0550 12 34 56"
                                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900/80 text-slate-900 dark:text-zinc-100 text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block mb-1">
                                    Téléphone Secondaire
                                </label>
                                <div className="relative">
                                    <MdPhone className="absolute left-3 top-3 text-slate-400 text-base" />
                                    <input
                                        type="tel"
                                        value={phone2}
                                        onChange={(e) => setPhone2(e.target.value)}
                                        placeholder="0660 98 76 54 (Optionnel)"
                                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900/80 text-slate-900 dark:text-zinc-100 text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block mb-1">
                                    Email
                                </label>
                                <div className="relative">
                                    <MdEmail className="absolute left-3 top-3 text-slate-400 text-base" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="employe@ltcexpress.dz"
                                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900/80 text-slate-900 dark:text-zinc-100 text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block mb-1">
                                    Wilaya
                                </label>
                                <div className="relative">
                                    <MdLocationOn className="absolute left-3 top-3 text-slate-400 text-base" />
                                    <select
                                        value={wilaya}
                                        onChange={(e) => setWilaya(e.target.value)}
                                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900/80 text-slate-900 dark:text-zinc-100 text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden"
                                    >
                                        <option value="">Sélectionner une Wilaya</option>
                                        {Wilaya.map((w) => (
                                            <option key={w.code} value={w.name}>
                                                {w.code} - {w.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Section 4 : Permissions dynamiques selon le rôle */}
                        <div className="p-4 rounded-2xl bg-slate-50/60 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 space-y-3">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                                <div>
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                                        Permissions pour {roleInfo.label} ({rolePermissions.length})
                                    </span>
                                    <span className="text-[11px] text-slate-400">
                                        Seules les permissions pertinentes pour ce rôle sont affichées
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => handleSelectAll(true)}
                                        className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-700"
                                    >
                                        <MdDoneAll /> Tout activer
                                    </button>
                                    <span className="text-slate-300">|</span>
                                    <button
                                        type="button"
                                        onClick={() => handleSelectAll(false)}
                                        className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-slate-700"
                                    >
                                        <MdRemoveCircleOutline /> Tout désactiver
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                {rolePermissions.map((perm) => {
                                    const isGranted = Boolean(permissionsState[perm.key]);

                                    return (
                                        <div
                                            key={perm.key}
                                            className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 flex items-center justify-between gap-3"
                                        >
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-xs text-slate-800 dark:text-zinc-200">
                                                        {perm.label}
                                                    </span>
                                                    {isGranted ? (
                                                        <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded-sm bg-emerald-100 text-emerald-700">
                                                            Accordé
                                                        </span>
                                                    ) : (
                                                        <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded-sm bg-slate-100 text-slate-600">
                                                            Désactivé
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-[11px] text-slate-500 dark:text-zinc-400 block mt-0.5">
                                                    {perm.description}
                                                </span>
                                            </div>

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
                            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 active:scale-[0.98] text-white font-bold text-sm shadow-md shadow-emerald-600/30 transition-all disabled:opacity-50"
                        >
                            <MdSave className="text-lg" />
                            {isSubmitting ? "Création en cours..." : "Créer le compte"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
