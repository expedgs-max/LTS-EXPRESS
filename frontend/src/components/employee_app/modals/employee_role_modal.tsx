"use client";

import React, { useState } from "react";
import { MdClose, MdAdminPanelSettings, MdCheckCircle, MdArrowForward } from "react-icons/md";
import { ALL_USER_ROLES, updateEmployeeRole } from "@/lib/employee_action";

interface EmployeeRoleModalProps {
    employee: Users;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function EmployeeRoleModal({
    employee,
    isOpen,
    onClose,
    onSuccess,
}: EmployeeRoleModalProps) {
    const [selectedRole, setSelectedRole] = useState(employee.role);
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const currentRoleDef = ALL_USER_ROLES.find((r) => r.key === employee.role) || {
        key: employee.role,
        label: employee.role,
        category: "client",
        description: "Rôle personnalisé",
        badgeColor: "bg-slate-100 text-slate-800 border-slate-200",
        bgSoft: "bg-slate-50",
    };

    const targetRoleDef = ALL_USER_ROLES.find((r) => r.key === selectedRole) || currentRoleDef;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedRole === employee.role) {
            onClose();
            return;
        }

        setIsSubmitting(true);
        const success = await updateEmployeeRole(employee.id, selectedRole);
        setIsSubmitting(false);

        if (success) {
            onSuccess();
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
            <div className="relative w-full max-w-xl bg-white dark:bg-[#181a20] rounded-3xl shadow-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200/80 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/40">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center text-xl font-bold">
                            <MdAdminPanelSettings />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800 dark:text-zinc-100">
                                Changer le Rôle de l&apos;Employé
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-zinc-400">
                                {employee.first_name} {employee.last_name} (@{employee.username})
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

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
                    {/* Role Comparison Preview */}
                    <div className="p-4 rounded-2xl bg-slate-100/70 dark:bg-zinc-900/70 border border-slate-200/80 dark:border-zinc-800 flex items-center justify-between gap-3">
                        <div className="flex-1">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 block mb-1">
                                Rôle actuel
                            </span>
                            <span className={`inline-flex px-2.5 py-1 text-xs font-bold rounded-lg border ${currentRoleDef.badgeColor}`}>
                                {currentRoleDef.label}
                            </span>
                        </div>

                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 flex items-center justify-center shrink-0">
                            <MdArrowForward className="text-base" />
                        </div>

                        <div className="flex-1 text-right">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 block mb-1">
                                Nouveau rôle
                            </span>
                            <span className={`inline-flex px-2.5 py-1 text-xs font-bold rounded-lg border ${targetRoleDef.badgeColor}`}>
                                {targetRoleDef.label}
                            </span>
                        </div>
                    </div>

                    {/* Role Options */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-2.5">
                            Sélectionnez le nouveau rôle :
                        </label>
                        <div className="space-y-2">
                            {ALL_USER_ROLES.map((roleDef) => {
                                const isSelected = selectedRole === roleDef.key;
                                const isCurrent = employee.role === roleDef.key;

                                return (
                                    <div
                                        key={roleDef.key}
                                        onClick={() => setSelectedRole(roleDef.key)}
                                        className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start gap-3.5 ${
                                            isSelected
                                                ? "border-rose-500 bg-rose-50/40 dark:bg-rose-950/20 shadow-xs ring-2 ring-rose-500/20"
                                                : "border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900/40"
                                        }`}
                                    >
                                        <div
                                            className={`w-5 h-5 rounded-full border mt-0.5 flex items-center justify-center shrink-0 transition-all ${
                                                isSelected
                                                    ? "border-rose-600 bg-rose-600 text-white"
                                                    : "border-slate-300 dark:border-zinc-600 bg-transparent"
                                            }`}
                                        >
                                            {isSelected && <MdCheckCircle className="text-xs" />}
                                        </div>

                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-sm text-slate-900 dark:text-zinc-100">
                                                    {roleDef.label}
                                                </span>
                                                {isCurrent && (
                                                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400">
                                                        Actuel
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                                                {roleDef.description}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Submit Bar */}
                    <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200/80 dark:border-zinc-800/80">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 font-semibold text-sm transition-all"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || selectedRole === employee.role}
                            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 active:scale-[0.98] text-white font-bold text-sm shadow-md shadow-rose-600/30 transition-all disabled:opacity-50 disabled:pointer-events-none"
                        >
                            {isSubmitting ? "Modification..." : "Confirmer le nouveau rôle"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
