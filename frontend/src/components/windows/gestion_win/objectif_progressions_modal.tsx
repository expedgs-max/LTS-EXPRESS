"use client";

import React, { useState, useEffect, useMemo } from "react";
import { MdClose } from "react-icons/md";
import {
    FaTrophy,
    FaCheckCircle,
    FaHourglassHalf,
    FaCoins,
    FaSearch,
    FaPhoneAlt,
    FaUserCheck,
    FaSyncAlt,
} from "react-icons/fa";
import {
    Objectif,
    ProgressionObjectif,
    getObjectifProgressions,
    validerPrimeObjectif,
} from "@/lib/objectifs_action";

type Props = {
    objectif: Objectif;
    onClose: () => void;
    onUpdateParent?: () => void;
};

export default function ObjectifProgressionsModal({
    objectif,
    onClose,
    onUpdateParent,
}: Props) {
    const [progressions, setProgressions] = useState<ProgressionObjectif[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [filterCompleted, setFilterCompleted] = useState<string>("tous"); // 'tous', 'atteint', 'en_cours', 'paye'
    const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

    const loadProgressions = async () => {
        setIsLoading(true);
        const data = await getObjectifProgressions(objectif.id);
        if (data) {
            setProgressions(data);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        loadProgressions();
    }, [objectif.id]);

    const handleValiderPrime = async (progId: number) => {
        if (!confirm("Confirmer le versement de la prime et le crédit sur le portefeuille du partenaire ?")) {
            return;
        }

        setActionLoadingId(progId);
        const success = await validerPrimeObjectif(progId);
        setActionLoadingId(null);

        if (success) {
            // Update local item
            setProgressions((prev) =>
                prev.map((p) =>
                    p.id === progId
                        ? { ...p, prime_versee: true, date_versement: new Date().toISOString() }
                        : p
                )
            );
            if (onUpdateParent) onUpdateParent();
        }
    };

    // Filtered list
    const filteredProgressions = useMemo(() => {
        return progressions.filter((p) => {
            const matchesSearch =
                p.user_nom_complet.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.user_phone.includes(searchQuery);

            if (!matchesSearch) return false;

            if (filterCompleted === "atteint") return p.est_atteint && !p.prime_versee;
            if (filterCompleted === "paye") return p.prime_versee;
            if (filterCompleted === "en_cours") return !p.est_atteint;

            return true;
        });
    }, [progressions, searchQuery, filterCompleted]);

    // Stats
    const totalCount = progressions.length;
    const completedCount = progressions.filter((p) => p.est_atteint).length;
    const paidCount = progressions.filter((p) => p.prime_versee).length;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
            <div className="relative w-full max-w-3xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shrink-0 border-b border-indigo-900/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-500/20 rounded-xl backdrop-blur-md border border-indigo-400/30 text-indigo-400">
                            <FaTrophy className="text-xl" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                Suivi des Participants & Primes
                                <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-400/30">
                                    {objectif.cible_label}
                                </span>
                            </h2>
                            <p className="text-xs text-indigo-200/80">
                                {objectif.titre} • Objectif : {objectif.valeur_cible}{" "}
                                {objectif.type_objectif === "courses" ? "courses" : "DA"} • Prime :{" "}
                                <span className="text-emerald-400 font-bold">{objectif.prime_montant} DA</span>
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                    >
                        <MdClose className="text-2xl" />
                    </button>
                </div>

                {/* Sub-header KPIs */}
                <div className="grid grid-cols-3 gap-3 px-6 py-3 bg-slate-50 dark:bg-zinc-800/40 border-b border-slate-200 dark:border-zinc-800 text-center shrink-0">
                    <div className="p-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200/60 dark:border-zinc-700/60 shadow-xs">
                        <span className="text-[11px] text-slate-500 dark:text-zinc-400 block font-semibold">
                            Total Engagés
                        </span>
                        <span className="text-base font-extrabold text-slate-800 dark:text-zinc-100">
                            {totalCount}
                        </span>
                    </div>

                    <div className="p-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200/60 dark:border-zinc-700/60 shadow-xs">
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block font-semibold">
                            Objectif Atteint
                        </span>
                        <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                            {completedCount}
                        </span>
                    </div>

                    <div className="p-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200/60 dark:border-zinc-700/60 shadow-xs">
                        <span className="text-[11px] text-indigo-600 dark:text-indigo-400 block font-semibold">
                            Primes Versées
                        </span>
                        <span className="text-base font-extrabold text-indigo-600 dark:text-indigo-400">
                            {paidCount}
                        </span>
                    </div>
                </div>

                {/* Filters & Search */}
                <div className="px-6 py-3 bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
                    <div className="relative flex-1 min-w-[200px]">
                        <FaSearch className="absolute left-3.5 top-3 text-slate-400 text-xs" />
                        <input
                            type="text"
                            placeholder="Rechercher par nom ou téléphone..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/50 text-xs text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <select
                            value={filterCompleted}
                            onChange={(e) => setFilterCompleted(e.target.value)}
                            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/50 text-xs text-slate-700 dark:text-zinc-300 font-semibold focus:outline-none"
                        >
                            <option value="tous">Tous ({progressions.length})</option>
                            <option value="atteint">Atteint - À verser</option>
                            <option value="paye">Prime Versée</option>
                            <option value="en_cours">En progression</option>
                        </select>

                        <button
                            onClick={loadProgressions}
                            title="Actualiser les progressions"
                            className="p-2 rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition"
                        >
                            <FaSyncAlt className={`text-xs ${isLoading ? "animate-spin" : ""}`} />
                        </button>
                    </div>
                </div>

                {/* Progressions List */}
                <div className="p-6 overflow-y-auto flex-1 space-y-3">
                    {isLoading ? (
                        <div className="py-16 text-center text-slate-400 text-sm">
                            <FaSyncAlt className="text-2xl animate-spin mx-auto mb-2 text-indigo-500" />
                            Chargement et calcul des courses / livraisons...
                        </div>
                    ) : filteredProgressions.length === 0 ? (
                        <div className="py-16 text-center">
                            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-3 text-slate-400">
                                <FaHourglassHalf className="text-xl" />
                            </div>
                            <h4 className="text-sm font-bold text-slate-700 dark:text-zinc-200 mb-1">
                                Aucun participant trouvé
                            </h4>
                            <p className="text-xs text-slate-400 max-w-sm mx-auto">
                                Aucun chauffeur ou livreur ne correspond aux filtres actuels ou n&apos;a encore enregistré d&apos;activité durant cette période.
                            </p>
                        </div>
                    ) : (
                        filteredProgressions.map((prog) => {
                            const isAchieved = prog.est_atteint;
                            const isPaid = prog.prime_versee;
                            const pct = prog.pourcentage || 0;

                            return (
                                <div
                                    key={prog.id}
                                    className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/40 hover:border-indigo-300 dark:hover:border-zinc-700 transition shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                                >
                                    {/* Partner Info & Bar */}
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
                                                    {prog.user_nom_complet.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-bold text-slate-800 dark:text-zinc-100 leading-none mb-1">
                                                        {prog.user_nom_complet}
                                                    </h4>
                                                    {prog.user_phone && (
                                                        <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                                                            <FaPhoneAlt className="text-[9px]" /> {prog.user_phone}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Status Badge */}
                                            {isPaid ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60">
                                                    <FaCoins className="text-[10px]" /> Prime Versée
                                                </span>
                                            ) : isAchieved ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 animate-pulse">
                                                    <FaCheckCircle className="text-[10px]" /> Objectif Atteint !
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400">
                                                    <FaHourglassHalf className="text-[10px]" /> En cours ({pct}%)
                                                </span>
                                            )}
                                        </div>

                                        {/* Progress bar */}
                                        <div className="space-y-1">
                                            <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-zinc-300">
                                                <span>
                                                    {prog.valeur_actuelle} / {prog.valeur_cible}{" "}
                                                    {objectif.type_objectif === "courses" ? "courses" : "DA"}
                                                </span>
                                                <span className="text-slate-400 dark:text-zinc-500 font-bold">{pct}%</span>
                                            </div>
                                            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-zinc-700/60 overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ${
                                                        isAchieved
                                                            ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                                                            : "bg-gradient-to-r from-blue-500 to-indigo-500"
                                                    }`}
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <div className="sm:text-right shrink-0">
                                        {isAchieved && !isPaid ? (
                                            <button
                                                type="button"
                                                disabled={actionLoadingId === prog.id}
                                                onClick={() => handleValiderPrime(prog.id)}
                                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition disabled:opacity-50"
                                            >
                                                <FaCoins className="text-xs" />
                                                {actionLoadingId === prog.id ? "Validation..." : `Verser ${prog.prime_montant} DA`}
                                            </button>
                                        ) : isPaid ? (
                                            <div className="text-[11px] text-slate-400">
                                                {prog.date_versement
                                                    ? `Versé le ${new Date(prog.date_versement).toLocaleDateString()}`
                                                    : "Prime créditée"}
                                            </div>
                                        ) : (
                                            <div className="text-xs font-semibold text-slate-400">
                                                Reste :{" "}
                                                <span className="font-bold text-slate-600 dark:text-zinc-300">
                                                    {Math.max(0, prog.valeur_cible - prog.valeur_actuelle)}{" "}
                                                    {objectif.type_objectif === "courses" ? "courses" : "DA"}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-3.5 bg-slate-50 dark:bg-zinc-800/40 border-t border-slate-200 dark:border-zinc-800 flex justify-end shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition"
                    >
                        Fermer
                    </button>
                </div>
            </div>
        </div>
    );
}
