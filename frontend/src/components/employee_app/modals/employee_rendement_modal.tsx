"use client";

import React, { useState } from "react";
import {
    MdClose,
    MdTrendingUp,
    MdStar,
    MdCheckCircle,
    MdDeliveryDining,
    MdEmojiEvents,
    MdSave,
} from "react-icons/md";
import { updateEmployeeRendement } from "@/lib/employee_action";

interface EmployeeRendementModalProps {
    employee: Users;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function EmployeeRendementModal({
    employee,
    isOpen,
    onClose,
    onSuccess,
}: EmployeeRendementModalProps) {
    const [score, setScore] = useState<number>(employee.rendement || 0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const getScoreColor = (val: number) => {
        if (val >= 80) return "text-emerald-500 stroke-emerald-500 bg-emerald-500";
        if (val >= 50) return "text-amber-500 stroke-amber-500 bg-amber-500";
        return "text-red-500 stroke-red-500 bg-red-500";
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const success = await updateEmployeeRendement(employee.id, score);
        setIsSubmitting(false);

        if (success) {
            onSuccess();
            onClose();
        }
    };

    const presets = [25, 50, 75, 90, 100];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
            <div className="relative w-full max-w-lg bg-white dark:bg-[#181a20] rounded-3xl shadow-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200/80 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/40">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl font-bold">
                            <MdTrendingUp />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800 dark:text-zinc-100">
                                Rendement & Performances
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
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Performance Overview Banner */}
                    <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-xl relative overflow-hidden">
                        <div className="absolute right-0 bottom-0 opacity-10 text-9xl pointer-events-none -mr-4 -mb-4">
                            <MdTrendingUp />
                        </div>

                        <div className="flex items-center justify-between relative z-10">
                            <div>
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                    Score de rendement global
                                </span>
                                <div className="flex items-baseline gap-2 mt-1">
                                    <span className="text-4xl font-black text-white">
                                        {score}%
                                    </span>
                                    <span className="text-xs text-emerald-400 font-bold">
                                        {score >= 80 ? "★ Excellent" : score >= 50 ? "● Moyen" : "▲ À améliorer"}
                                    </span>
                                </div>
                            </div>

                            {/* Circular gauge indicator */}
                            <div className="w-16 h-16 rounded-full border-4 border-slate-700 flex items-center justify-center relative">
                                <div
                                    className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                                        score >= 80 ? "bg-emerald-500" : score >= 50 ? "bg-amber-500" : "bg-red-500"
                                    }`}
                                >
                                    {score}%
                                </div>
                            </div>
                        </div>

                        {/* Progress line */}
                        <div className="w-full h-2 rounded-full bg-slate-700/80 mt-4 overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                    score >= 80 ? "bg-emerald-400" : score >= 50 ? "bg-amber-400" : "bg-red-400"
                                }`}
                                style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
                            />
                        </div>
                    </div>

                    {/* Secondary Metrics (Points, Rating, Commandes) */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800 text-center">
                            <div className="w-8 h-8 mx-auto rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center text-base mb-1">
                                <MdStar />
                            </div>
                            <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 block">
                                Note
                            </span>
                            <span className="text-base font-bold text-slate-800 dark:text-zinc-100">
                                {employee.rating || 5} / 5
                            </span>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800 text-center">
                            <div className="w-8 h-8 mx-auto rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center text-base mb-1">
                                <MdEmojiEvents />
                            </div>
                            <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 block">
                                Points
                            </span>
                            <span className="text-base font-bold text-slate-800 dark:text-zinc-100">
                                {employee.point || 0} pts
                            </span>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800 text-center">
                            <div className="w-8 h-8 mx-auto rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center text-base mb-1">
                                <MdDeliveryDining />
                            </div>
                            <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 block">
                                Commandes
                            </span>
                            <span className="text-base font-bold text-slate-800 dark:text-zinc-100">
                                {employee.delivered_orders_count ?? employee.nbr_commandes ?? 0}
                            </span>
                        </div>
                    </div>

                    {/* Adjust Rendement Slider */}
                    <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                                Ajuster le score de rendement
                            </label>
                            <span className="text-sm font-black text-slate-800 dark:text-zinc-100 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800">
                                {score} %
                            </span>
                        </div>

                        <input
                            type="range"
                            min={0}
                            max={100}
                            value={score}
                            onChange={(e) => setScore(Number(e.target.value))}
                            className="w-full h-2.5 bg-slate-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                        />

                        {/* Preset Quick Buttons */}
                        <div className="flex items-center justify-between gap-1.5 pt-1">
                            {presets.map((preset) => (
                                <button
                                    key={preset}
                                    type="button"
                                    onClick={() => setScore(preset)}
                                    className={`flex-1 py-1.5 text-xs font-bold rounded-xl border transition-all ${
                                        score === preset
                                            ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                                            : "border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
                                    }`}
                                >
                                    {preset}%
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Submit Bar */}
                    <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200/80 dark:border-zinc-800/80">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 font-semibold text-sm transition-all"
                        >
                            Fermer
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || score === employee.rendement}
                            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold text-sm shadow-md shadow-emerald-600/30 transition-all disabled:opacity-50"
                        >
                            <MdSave className="text-lg" />
                            {isSubmitting ? "Enregistrement..." : "Sauvegarder le rendement"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
