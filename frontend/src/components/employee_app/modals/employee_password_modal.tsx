"use client";

import React, { useState } from "react";
import { MdClose, MdVpnKey, MdVisibility, MdVisibilityOff, MdCheck, MdLockReset } from "react-icons/md";
import { updateEmployeePassword } from "@/lib/employee_action";
import toast from "react-hot-toast";

interface EmployeePasswordModalProps {
    employee: Users;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function EmployeePasswordModal({
    employee,
    isOpen,
    onClose,
    onSuccess,
}: EmployeePasswordModalProps) {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password.length < 6) {
            toast.error("Le mot de passe doit comporter au moins 6 caractères");
            return;
        }

        if (password !== confirmPassword) {
            toast.error("Les deux mots de passe ne correspondent pas");
            return;
        }

        setIsSubmitting(true);
        const success = await updateEmployeePassword(employee.id, password);
        setIsSubmitting(false);

        if (success) {
            onSuccess();
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
            <div className="relative w-full max-w-md bg-white dark:bg-[#181a20] rounded-3xl shadow-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200/80 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/40">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xl font-bold">
                            <MdVpnKey />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800 dark:text-zinc-100">
                                Changer le Mot de Passe
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-zinc-400">
                                Pour : {employee.first_name} {employee.last_name} (@{employee.username})
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

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Info alert */}
                    <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/50 text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                        Le mot de passe sera immédiatement mis à jour et sécurisé. L&apos;employé devra utiliser ce nouveau mot de passe pour se connecter.
                    </div>

                    {/* Nouveau mot de passe */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5">
                            Nouveau mot de passe
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                minLength={6}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Au moins 6 caractères"
                                className="w-full pl-4 pr-11 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900/80 text-slate-900 dark:text-zinc-100 text-sm focus:ring-2 focus:ring-amber-500 outline-hidden transition-all"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 text-lg"
                            >
                                {showPassword ? <MdVisibilityOff /> : <MdVisibility />}
                            </button>
                        </div>
                    </div>

                    {/* Confirmer le mot de passe */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5">
                            Confirmer le mot de passe
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                minLength={6}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Répétez le mot de passe"
                                className="w-full pl-4 pr-11 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900/80 text-slate-900 dark:text-zinc-100 text-sm focus:ring-2 focus:ring-amber-500 outline-hidden transition-all"
                            />
                            {confirmPassword && password === confirmPassword && (
                                <span className="absolute right-3 top-3 text-emerald-500 text-lg">
                                    <MdCheck />
                                </span>
                            )}
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
                            disabled={isSubmitting || !password || password !== confirmPassword}
                            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-[0.98] text-white font-bold text-sm shadow-md shadow-amber-600/30 transition-all disabled:opacity-50"
                        >
                            <MdLockReset className="text-lg" />
                            {isSubmitting ? "Enregistrement..." : "Changer le mot de passe"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
