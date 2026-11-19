"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
    MdPeopleAlt,
    MdPersonAdd,
    MdSearch,
    MdFilterList,
    MdRefresh,
    MdCheckCircle,
    MdBlock,
    MdTrendingUp,
    MdGridView,
    MdTableRows,
    MdAdminPanelSettings,
    MdSecurity,
    MdVpnKey,
    MdEdit,
    MdPhone,
    MdEmail,
    MdLocationOn,
    MdStar,
    MdPerson,
} from "react-icons/md";
import { Wilaya } from "@/lib/tools/named";
import {
    ALL_USER_ROLES,
    EMPLOYEE_ROLE_DEFINITIONS,
    EmployeeStatsOverview,
    toggleEmployeeBlock,
} from "@/lib/employee_action";
import { getPermissionsForRole } from "@/lib/permissions_definitions";
import EmployeeEditModal from "./modals/employee_edit_modal";
import EmployeeRoleModal from "./modals/employee_role_modal";
import EmployeePermissionsModal from "./modals/employee_permissions_modal";
import EmployeePasswordModal from "./modals/employee_password_modal";
import EmployeeRendementModal from "./modals/employee_rendement_modal";
import EmployeeCreateModal from "./modals/employee_create_modal";

interface EmployeesViewProps {
    employees: Users[];
    statsOverview: EmployeeStatsOverview;
    currentRole?: string;
    currentSearch?: string;
    currentWilaya?: string;
    currentBloquer?: string;
}

export default function EmployeesView({
    employees,
    statsOverview,
    currentRole = "",
    currentSearch = "",
    currentWilaya = "",
    currentBloquer = "",
}: EmployeesViewProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
    const [search, setSearch] = useState(currentSearch);
    const [wilaya, setWilaya] = useState(currentWilaya);
    const [bloquer, setBloquer] = useState(currentBloquer);

    // Modals state
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<Users | null>(null);
    const [roleEmployee, setRoleEmployee] = useState<Users | null>(null);
    const [permissionsEmployee, setPermissionsEmployee] = useState<Users | null>(null);
    const [passwordEmployee, setPasswordEmployee] = useState<Users | null>(null);
    const [rendementEmployee, setRendementEmployee] = useState<Users | null>(null);

    const handleApplyFilters = (newRole?: string) => {
        const params = new URLSearchParams();
        const roleVal = newRole !== undefined ? newRole : currentRole;

        if (roleVal && roleVal !== "all") params.set("role", roleVal);
        if (search.trim()) params.set("search", search.trim());
        if (wilaya) params.set("wilaya", wilaya);
        if (bloquer !== "") params.set("bloquer", bloquer);

        router.push(`/dashboard/employees?${params.toString()}`);
    };

    const handleResetFilters = () => {
        setSearch("");
        setWilaya("");
        setBloquer("");
        router.push("/dashboard/employees");
    };

    const handleToggleBlock = async (employee: Users) => {
        const newStatus = !employee.bloquer;
        const confirmMsg = newStatus
            ? `Êtes-vous sûr de vouloir bloquer le compte de ${employee.first_name} ${employee.last_name} ?`
            : `Êtes-vous sûr de vouloir débloquer le compte de ${employee.first_name} ${employee.last_name} ?`;

        if (window.confirm(confirmMsg)) {
            const success = await toggleEmployeeBlock(employee.id, newStatus);
            if (success) {
                router.refresh();
            }
        }
    };

    const getRoleBadge = (roleKey: string) => {
        const rDef = ALL_USER_ROLES.find((r) => r.key === roleKey) || EMPLOYEE_ROLE_DEFINITIONS.find((r) => r.key === roleKey);
        if (!rDef) {
            return {
                label: roleKey,
                badgeColor: "bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 border-slate-200",
            };
        }
        return {
            label: rDef.label,
            badgeColor: rDef.badgeColor,
        };
    };

    const getRendementBadge = (val: number = 0) => {
        if (val >= 80) return { bg: "bg-emerald-500", text: "text-emerald-700 dark:text-emerald-400", label: "Excellent" };
        if (val >= 50) return { bg: "bg-amber-500", text: "text-amber-700 dark:text-amber-400", label: "Moyen" };
        return { bg: "bg-red-500", text: "text-red-700 dark:text-red-400", label: "Faible" };
    };

    return (
        <div className="py-6 px-4 sm:px-8 max-w-7xl mx-auto space-y-6">
            {/* Top Breadcrumb & Actions Bar */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-zinc-400 mb-1">
                        <Link href="/dashboard" className="hover:text-rose-600 transition-colors">
                            Tableau de bord
                        </Link>
                        <span>/</span>
                        <span className="text-slate-800 dark:text-zinc-200 font-bold">
                            Gestion des Employés
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-zinc-100 tracking-tight">
                            Gestion des Employés
                        </h1>
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                            {statsOverview.total} comptes
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2.5">
                    <button
                        onClick={() => router.refresh()}
                        className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 font-semibold text-sm transition-all shadow-xs"
                        title="Rafraîchir les données"
                    >
                        <MdRefresh className="text-lg" />
                        <span className="hidden sm:inline">Rafraîchir</span>
                    </button>

                    <button
                        onClick={() => setIsCreateOpen(true)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 active:scale-[0.98] text-white font-bold text-sm shadow-md shadow-rose-600/30 transition-all"
                    >
                        <MdPersonAdd className="text-lg" />
                        <span>+ Nouveau Compte</span>
                    </button>
                </div>
            </div>

            {/* KPI Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Employés */}
                <div className="p-4 rounded-3xl bg-white dark:bg-[#181a20] border border-slate-200/80 dark:border-zinc-800/80 shadow-xs flex items-center justify-between">
                    <div>
                        <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
                            Total Employés
                        </span>
                        <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-zinc-100">
                                {statsOverview.total}
                            </span>
                            <span className="text-xs text-slate-400">membres</span>
                        </div>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center text-2xl font-bold">
                        <MdPeopleAlt />
                    </div>
                </div>

                {/* Comptes Actifs */}
                <div className="p-4 rounded-3xl bg-white dark:bg-[#181a20] border border-slate-200/80 dark:border-zinc-800/80 shadow-xs flex items-center justify-between">
                    <div>
                        <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
                            Comptes Actifs
                        </span>
                        <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                                {statsOverview.active}
                            </span>
                            <span className="text-xs text-emerald-500 font-semibold">
                                {statsOverview.total ? Math.round((statsOverview.active / statsOverview.total) * 100) : 0}%
                            </span>
                        </div>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-2xl font-bold">
                        <MdCheckCircle />
                    </div>
                </div>

                {/* Comptes Bloqués */}
                <div className="p-4 rounded-3xl bg-white dark:bg-[#181a20] border border-slate-200/80 dark:border-zinc-800/80 shadow-xs flex items-center justify-between">
                    <div>
                        <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
                            Comptes Bloqués
                        </span>
                        <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-2xl sm:text-3xl font-black text-red-600 dark:text-red-400">
                                {statsOverview.blocked}
                            </span>
                            <span className="text-xs text-red-500 font-semibold">
                                {statsOverview.total ? Math.round((statsOverview.blocked / statsOverview.total) * 100) : 0}%
                            </span>
                        </div>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center text-2xl font-bold">
                        <MdBlock />
                    </div>
                </div>

                {/* Rendement Moyen */}
                <div className="p-4 rounded-3xl bg-white dark:bg-[#181a20] border border-slate-200/80 dark:border-zinc-800/80 shadow-xs flex items-center justify-between">
                    <div>
                        <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
                            Rendement Moyen
                        </span>
                        <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
                                {statsOverview.avg_rendement}%
                            </span>
                            <span className="text-xs text-amber-500 font-semibold">score moyen</span>
                        </div>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center text-2xl font-bold">
                        <MdTrendingUp />
                    </div>
                </div>
            </div>

            {/* Role Filter Tabs (Les 7 Rôles Spécifiés) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 no-scrollbar">
                <button
                    onClick={() => handleApplyFilters("all")}
                    className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border ${
                        !currentRole || currentRole === "all"
                            ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent shadow-md scale-[1.02]"
                            : "bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-800 hover:border-slate-300"
                    }`}
                >
                    Tous les Rôles ({statsOverview.total})
                </button>

                {ALL_USER_ROLES.map((r) => {
                    const isSelected = currentRole === r.key;
                    const roleCount = statsOverview.role_counts?.[r.key] ?? 0;

                    return (
                        <button
                            key={r.key}
                            onClick={() => handleApplyFilters(r.key)}
                            className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-2 ${
                                isSelected
                                    ? "bg-gradient-to-r from-rose-600 to-rose-700 text-white border-rose-600 shadow-md shadow-rose-600/25 scale-[1.02]"
                                    : "bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700"
                            }`}
                        >
                            <span>{r.label}</span>
                            <span
                                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                                    isSelected
                                        ? "bg-white/20 text-white"
                                        : "bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400"
                                }`}
                            >
                                {roleCount}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Filter Search Bar & View Mode Toggle */}
            <div className="p-4 rounded-3xl bg-white dark:bg-[#181a20] border border-slate-200/80 dark:border-zinc-800/80 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleApplyFilters();
                    }}
                    className="flex-1 flex flex-col sm:flex-row items-center gap-2.5"
                >
                    {/* Search Input */}
                    <div className="relative w-full sm:flex-1">
                        <MdSearch className="absolute left-3.5 top-3.5 text-slate-400 text-lg" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Recherche par nom, prénom, username, tél, email..."
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900/80 text-slate-900 dark:text-zinc-100 text-sm focus:ring-2 focus:ring-rose-500 outline-hidden transition-all"
                        />
                    </div>

                    {/* Wilaya Filter */}
                    <div className="w-full sm:w-52">
                        <select
                            value={wilaya}
                            onChange={(e) => {
                                setWilaya(e.target.value);
                            }}
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900/80 text-slate-900 dark:text-zinc-100 text-sm focus:ring-2 focus:ring-rose-500 outline-hidden transition-all"
                        >
                            <option value="">Toutes Wilayas</option>
                            {Wilaya.map((w) => (
                                <option key={w.code} value={w.name}>
                                    {w.code} - {w.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Status Filter */}
                    <div className="w-full sm:w-40">
                        <select
                            value={bloquer}
                            onChange={(e) => {
                                setBloquer(e.target.value);
                            }}
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900/80 text-slate-900 dark:text-zinc-100 text-sm focus:ring-2 focus:ring-rose-500 outline-hidden transition-all"
                        >
                            <option value="">Tous statuts</option>
                            <option value="false">Actifs uniquement</option>
                            <option value="true">Bloqués uniquement</option>
                        </select>
                    </div>

                    {/* Submit & Reset buttons */}
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                            type="submit"
                            className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm transition-all"
                        >
                            Filtrer
                        </button>
                        {(search || wilaya || bloquer || (currentRole && currentRole !== "all")) && (
                            <button
                                type="button"
                                onClick={handleResetFilters}
                                className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 text-sm font-semibold transition-all"
                            >
                                Réinitialiser
                            </button>
                        )}
                    </div>
                </form>

                {/* Grid / Table switch */}
                <div className="flex items-center justify-end gap-1 border-t lg:border-t-0 pt-2 lg:pt-0 border-slate-100 dark:border-zinc-800">
                    <button
                        onClick={() => setViewMode("grid")}
                        className={`p-2 rounded-xl text-lg transition-all ${
                            viewMode === "grid"
                                ? "bg-slate-900 text-white dark:bg-zinc-100 dark:text-slate-900 shadow-xs"
                                : "text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300"
                        }`}
                        title="Vue Grille"
                    >
                        <MdGridView />
                    </button>
                    <button
                        onClick={() => setViewMode("table")}
                        className={`p-2 rounded-xl text-lg transition-all ${
                            viewMode === "table"
                                ? "bg-slate-900 text-white dark:bg-zinc-100 dark:text-slate-900 shadow-xs"
                                : "text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300"
                        }`}
                        title="Vue Tableau"
                    >
                        <MdTableRows />
                    </button>
                </div>
            </div>

            {/* Empty State */}
            {employees.length === 0 ? (
                <div className="p-12 text-center bg-white dark:bg-[#181a20] rounded-3xl border border-slate-200/80 dark:border-zinc-800/80">
                    <div className="w-16 h-16 mx-auto rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-400 text-3xl flex items-center justify-center mb-3">
                        <MdPeopleAlt />
                    </div>
                    <h3 className="text-base font-bold text-slate-800 dark:text-zinc-200">
                        Aucun employé trouvé
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
                        Aucun membre du personnel ne correspond aux filtres actuels. Modifiez votre recherche ou créez un nouvel employé.
                    </p>
                    <button
                        onClick={() => setIsCreateOpen(true)}
                        className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold shadow-md shadow-rose-600/30"
                    >
                        <MdPersonAdd /> + Ajouter un Employé
                    </button>
                </div>
            ) : viewMode === "grid" ? (
                /* GRID VIEW */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {employees.map((emp) => {
                        const roleBadge = getRoleBadge(emp.role);
                        const rendBadge = getRendementBadge(emp.rendement);

                        return (
                            <div
                                key={emp.id}
                                className={`rounded-3xl p-5 border transition-all duration-200 hover:shadow-lg flex flex-col justify-between ${
                                    emp.bloquer
                                        ? "bg-slate-50/80 dark:bg-zinc-900/40 border-red-200/80 dark:border-red-900/40"
                                        : "bg-white dark:bg-[#181a20] border-slate-200/80 dark:border-zinc-800/80"
                                }`}
                            >
                                <div>
                                    {/* Card Header: Avatar, Name, Status */}
                                    <div className="flex items-start justify-between gap-3 mb-3">
                                        <div className="flex items-center gap-3">
                                            {/* Avatar or Initial */}
                                            <div
                                                className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-base uppercase shrink-0 shadow-xs ${
                                                    emp.bloquer
                                                        ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                                                        : "bg-gradient-to-br from-rose-500 to-rose-700 text-white"
                                                }`}
                                            >
                                                {emp.first_name?.[0] || emp.username?.[0] || "U"}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-1.5">
                                                    <h3 className="font-bold text-slate-900 dark:text-zinc-100 text-sm leading-tight">
                                                        {emp.first_name || emp.last_name
                                                            ? `${emp.first_name || ""} ${emp.last_name || ""}`.trim()
                                                            : emp.username}
                                                    </h3>
                                                    {/* Status Dot */}
                                                    <span
                                                        className={`w-2 h-2 rounded-full shrink-0 ${
                                                            emp.bloquer ? "bg-red-500" : "bg-emerald-500"
                                                        }`}
                                                        title={emp.bloquer ? "Compte bloqué" : "Compte actif"}
                                                    />
                                                </div>
                                                <span className="text-xs text-slate-400 dark:text-zinc-500 block">
                                                    @{emp.username}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Status Badge */}
                                        <span
                                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${
                                                emp.bloquer
                                                    ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border-red-200 dark:border-red-800"
                                                    : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                                            }`}
                                        >
                                            {emp.bloquer ? "Bloqué" : "Actif"}
                                        </span>
                                    </div>

                                    {/* Role Badge */}
                                    <div className="mb-3.5">
                                        <span
                                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-xl border ${roleBadge.badgeColor}`}
                                        >
                                            <MdAdminPanelSettings className="text-sm" />
                                            {roleBadge.label}
                                        </span>
                                    </div>

                                    {/* Details Info List */}
                                    <div className="space-y-1.5 text-xs text-slate-600 dark:text-zinc-400 mb-4 bg-slate-50/70 dark:bg-zinc-900/60 p-3 rounded-2xl border border-slate-100 dark:border-zinc-800">
                                        <div className="flex items-center justify-between">
                                            <span className="flex items-center gap-1.5 text-slate-500">
                                                <MdPhone className="text-slate-400" /> Téléphone :
                                            </span>
                                            <span className="font-semibold text-slate-800 dark:text-zinc-200">
                                                {emp.phone_number_1 || "—"}
                                            </span>
                                        </div>

                                        {emp.email && (
                                            <div className="flex items-center justify-between truncate">
                                                <span className="flex items-center gap-1.5 text-slate-500">
                                                    <MdEmail className="text-slate-400" /> Email :
                                                </span>
                                                <span className="font-semibold text-slate-800 dark:text-zinc-200 truncate max-w-[150px]">
                                                    {emp.email}
                                                </span>
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between">
                                            <span className="flex items-center gap-1.5 text-slate-500">
                                                <MdLocationOn className="text-slate-400" /> Wilaya :
                                            </span>
                                            <span className="font-semibold text-slate-800 dark:text-zinc-200">
                                                {emp.wilaya || (emp.wilaya_code ? `Wilaya ${emp.wilaya_code}` : "—")}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <span className="flex items-center gap-1.5 text-slate-500">
                                                <MdSecurity className="text-slate-400" /> Validation :
                                            </span>
                                            <span
                                                className={`font-bold ${
                                                    emp.permission_vlider ? "text-emerald-600" : "text-slate-400"
                                                }`}
                                            >
                                                {emp.permission_vlider ? "Oui (Autorisé)" : "Non"}
                                            </span>
                                        </div>

                                        {/* Permissions spécifiques au rôle */}
                                        {(() => {
                                            const rolePerms = getPermissionsForRole(emp.role);
                                            const activeCount = rolePerms.filter((p) => {
                                                const v = (emp as unknown as Record<string, unknown>)[p.key];
                                                return v === true || (v !== false && p.roles.includes(emp.role || ""));
                                            }).length;
                                            const displayedPerms = rolePerms.slice(0, 4);

                                            return (
                                                <div className="pt-2 border-t border-slate-100 dark:border-zinc-800/80">
                                                    <div className="flex items-center justify-between mb-1.5">
                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                            Permissions ({activeCount}/{rolePerms.length}) :
                                                        </span>
                                                        <button
                                                            onClick={() => setPermissionsEmployee(emp)}
                                                            className="text-[10px] font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                                                        >
                                                            Gérer
                                                        </button>
                                                    </div>
                                                    <div className="flex flex-wrap gap-1">
                                                        {displayedPerms.map((perm) => {
                                                            const rawVal = (emp as unknown as Record<string, unknown>)[perm.key];
                                                            const isActive =
                                                                rawVal === true ||
                                                                (rawVal !== false && perm.roles.includes(emp.role || ""));
                                                            return (
                                                                <span
                                                                    key={perm.key}
                                                                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border transition-colors ${
                                                                        isActive
                                                                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800/50"
                                                                            : "bg-slate-50 text-slate-400 border-slate-200 line-through dark:bg-zinc-800/40 dark:text-zinc-500 dark:border-zinc-700"
                                                                    }`}
                                                                    title={`${perm.label} (${isActive ? "Activé" : "Désactivé"})`}
                                                                >
                                                                    {perm.label}
                                                                </span>
                                                            );
                                                        })}
                                                        {rolePerms.length > 4 && (
                                                            <button
                                                                onClick={() => setPermissionsEmployee(emp)}
                                                                className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700"
                                                                title="Voir toutes les permissions"
                                                            >
                                                                +{rolePerms.length - 4}
                                                            </button>
                                                        )}
                                                        {rolePerms.length === 0 && (
                                                            <span className="text-[9px] italic text-slate-400">
                                                                Aucune restriction
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>

                                    {/* Rendement KPI Bar */}
                                    <div className="mb-4">
                                        <div className="flex items-center justify-between text-xs mb-1.5">
                                            <span className="font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1">
                                                <MdTrendingUp className="text-emerald-500 text-sm" /> Rendement
                                            </span>
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-black text-slate-900 dark:text-zinc-100">
                                                    {emp.rendement || 0}%
                                                </span>
                                                <span className={`text-[10px] font-bold ${rendBadge.text}`}>
                                                    ({rendBadge.label})
                                                </span>
                                            </div>
                                        </div>
                                        <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-300 ${rendBadge.bg}`}
                                                style={{ width: `${Math.min(100, Math.max(0, emp.rendement || 0))}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons Grid */}
                                <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between gap-1 flex-wrap">
                                    {/* Edit Profile */}
                                    <button
                                        onClick={() => setEditingEmployee(emp)}
                                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 text-sm transition-all"
                                        title="Modifier le profil"
                                    >
                                        <MdEdit />
                                    </button>

                                    {/* Change Role */}
                                    <button
                                        onClick={() => setRoleEmployee(emp)}
                                        className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 text-sm transition-all"
                                        title="Changer le rôle"
                                    >
                                        <MdAdminPanelSettings />
                                    </button>

                                    {/* Permissions */}
                                    <button
                                        onClick={() => setPermissionsEmployee(emp)}
                                        className="p-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/30 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 text-sm transition-all"
                                        title="Gérer les permissions"
                                    >
                                        <MdSecurity />
                                    </button>

                                    {/* Rendement */}
                                    <button
                                        onClick={() => setRendementEmployee(emp)}
                                        className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:hover:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 text-sm transition-all"
                                        title="Regarder / Modifier le rendement"
                                    >
                                        <MdTrendingUp />
                                    </button>

                                    {/* Change Password */}
                                    <button
                                        onClick={() => setPasswordEmployee(emp)}
                                        className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/30 dark:hover:bg-amber-900/50 text-amber-600 dark:text-amber-400 text-sm transition-all"
                                        title="Changer le mot de passe"
                                    >
                                        <MdVpnKey />
                                    </button>

                                    {/* Block / Unblock Account */}
                                    <button
                                        onClick={() => handleToggleBlock(emp)}
                                        className={`p-2 rounded-xl text-sm transition-all ${
                                            emp.bloquer
                                                ? "bg-emerald-500 text-white hover:bg-emerald-600"
                                                : "bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400"
                                        }`}
                                        title={emp.bloquer ? "Débloquer le compte" : "Bloquer le compte"}
                                    >
                                        {emp.bloquer ? <MdCheckCircle /> : <MdBlock />}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                /* TABLE VIEW */
                <div className="bg-white dark:bg-[#181a20] rounded-3xl border border-slate-200/80 dark:border-zinc-800/80 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 dark:bg-zinc-900/70 text-slate-500 dark:text-zinc-400 text-xs uppercase tracking-wider border-b border-slate-200 dark:border-zinc-800">
                                <tr>
                                    <th className="px-5 py-4">Employé</th>
                                    <th className="px-5 py-4">Rôle</th>
                                    <th className="px-5 py-4">Contact</th>
                                    <th className="px-5 py-4">Wilaya</th>
                                    <th className="px-5 py-4">Rendement</th>
                                    <th className="px-5 py-4">Statut</th>
                                    <th className="px-5 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                                {employees.map((emp) => {
                                    const roleBadge = getRoleBadge(emp.role);
                                    const rendBadge = getRendementBadge(emp.rendement);

                                    return (
                                        <tr
                                            key={emp.id}
                                            className={`hover:bg-slate-50/70 dark:hover:bg-zinc-900/40 transition-colors ${
                                                emp.bloquer ? "bg-red-50/20 dark:bg-red-950/10" : ""
                                            }`}
                                        >
                                            {/* Employé (Avatar + Name) */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm uppercase shrink-0 shadow-xs ${
                                                            emp.bloquer
                                                                ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                                                                : "bg-gradient-to-br from-rose-500 to-rose-700 text-white"
                                                        }`}
                                                    >
                                                        {emp.first_name?.[0] || emp.username?.[0] || "U"}
                                                    </div>
                                                    <div>
                                                        <span className="font-bold text-slate-900 dark:text-zinc-100 block">
                                                            {emp.first_name || emp.last_name
                                                                ? `${emp.first_name || ""} ${emp.last_name || ""}`.trim()
                                                                : emp.username}
                                                        </span>
                                                        <span className="text-xs text-slate-400">@{emp.username}</span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Rôle */}
                                            <td className="px-5 py-4">
                                                <span
                                                    className={`inline-flex px-2.5 py-1 text-xs font-bold rounded-lg border ${roleBadge.badgeColor}`}
                                                >
                                                    {roleBadge.label}
                                                </span>
                                            </td>

                                            {/* Contact */}
                                            <td className="px-5 py-4">
                                                <div className="text-xs">
                                                    <span className="font-semibold text-slate-800 dark:text-zinc-200 block">
                                                        {emp.phone_number_1 || "—"}
                                                    </span>
                                                    {emp.email && (
                                                        <span className="text-slate-400 truncate max-w-[150px] block">
                                                            {emp.email}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Wilaya */}
                                            <td className="px-5 py-4 text-xs font-semibold text-slate-700 dark:text-zinc-300">
                                                {emp.wilaya || (emp.wilaya_code ? `Wilaya ${emp.wilaya_code}` : "—")}
                                            </td>

                                            {/* Rendement */}
                                            <td className="px-5 py-4">
                                                <div className="w-32">
                                                    <div className="flex items-center justify-between text-xs font-bold mb-1">
                                                        <span>{emp.rendement || 0}%</span>
                                                        <span className={`text-[10px] ${rendBadge.text}`}>
                                                            {rendBadge.label}
                                                        </span>
                                                    </div>
                                                    <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full ${rendBadge.bg}`}
                                                            style={{
                                                                width: `${Math.min(100, Math.max(0, emp.rendement || 0))}%`,
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Statut */}
                                            <td className="px-5 py-4">
                                                <span
                                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${
                                                        emp.bloquer
                                                            ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border-red-200"
                                                            : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200"
                                                    }`}
                                                >
                                                    {emp.bloquer ? "Bloqué" : "Actif"}
                                                </span>
                                            </td>

                                            {/* Actions Toolbar */}
                                            <td className="px-5 py-4 text-right">
                                                <div className="inline-flex items-center gap-1">
                                                    <button
                                                        onClick={() => setEditingEmployee(emp)}
                                                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-300"
                                                        title="Modifier profil"
                                                    >
                                                        <MdEdit className="text-base" />
                                                    </button>
                                                    <button
                                                        onClick={() => setRoleEmployee(emp)}
                                                        className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600"
                                                        title="Changer rôle"
                                                    >
                                                        <MdAdminPanelSettings className="text-base" />
                                                    </button>
                                                    <button
                                                        onClick={() => setPermissionsEmployee(emp)}
                                                        className="p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-600"
                                                        title="Permissions"
                                                    >
                                                        <MdSecurity className="text-base" />
                                                    </button>
                                                    <button
                                                        onClick={() => setRendementEmployee(emp)}
                                                        className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600"
                                                        title="Rendement"
                                                    >
                                                        <MdTrendingUp className="text-base" />
                                                    </button>
                                                    <button
                                                        onClick={() => setPasswordEmployee(emp)}
                                                        className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600"
                                                        title="Mot de passe"
                                                    >
                                                        <MdVpnKey className="text-base" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleToggleBlock(emp)}
                                                        className={`p-1.5 rounded-lg ${
                                                            emp.bloquer ? "text-emerald-600 hover:bg-emerald-50" : "text-red-600 hover:bg-red-50"
                                                        }`}
                                                        title={emp.bloquer ? "Débloquer" : "Bloquer"}
                                                    >
                                                        {emp.bloquer ? <MdCheckCircle className="text-base" /> : <MdBlock className="text-base" />}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modals Mounting */}
            {editingEmployee && (
                <EmployeeEditModal
                    employee={editingEmployee}
                    isOpen={Boolean(editingEmployee)}
                    onClose={() => setEditingEmployee(null)}
                    onSuccess={() => router.refresh()}
                />
            )}

            {roleEmployee && (
                <EmployeeRoleModal
                    employee={roleEmployee}
                    isOpen={Boolean(roleEmployee)}
                    onClose={() => setRoleEmployee(null)}
                    onSuccess={() => router.refresh()}
                />
            )}

            {permissionsEmployee && (
                <EmployeePermissionsModal
                    employee={permissionsEmployee}
                    isOpen={Boolean(permissionsEmployee)}
                    onClose={() => setPermissionsEmployee(null)}
                    onSuccess={() => router.refresh()}
                />
            )}

            {passwordEmployee && (
                <EmployeePasswordModal
                    employee={passwordEmployee}
                    isOpen={Boolean(passwordEmployee)}
                    onClose={() => setPasswordEmployee(null)}
                    onSuccess={() => router.refresh()}
                />
            )}

            {rendementEmployee && (
                <EmployeeRendementModal
                    employee={rendementEmployee}
                    isOpen={Boolean(rendementEmployee)}
                    onClose={() => setRendementEmployee(null)}
                    onSuccess={() => router.refresh()}
                />
            )}

            {isCreateOpen && (
                <EmployeeCreateModal
                    isOpen={isCreateOpen}
                    onClose={() => setIsCreateOpen(false)}
                    onSuccess={() => router.refresh()}
                />
            )}
        </div>
    );
}
