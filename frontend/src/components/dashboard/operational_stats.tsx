/* eslint-disable */
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
    MdOutlineStorefront,
    MdDeliveryDining,
    MdOutlineConfirmationNumber,
    MdCheckCircle,
    MdPendingActions,
    MdArrowForward,
    MdLocationOn,
    MdLocalOffer,
    MdGroup,
    MdRefresh,
    MdLocalTaxi
} from "react-icons/md";
import { FaTrophy } from "react-icons/fa6";
import { ConfirmationStats, getConfirmationStats } from "@/lib/confirmation_action";
import { Wilaya } from "@/lib/tools/named";
import { TbLoader3 } from "react-icons/tb";

interface OperationalStatsProps {
    initialStats?: ConfirmationStats | null;
}

export default function OperationalStats({ initialStats = null }: OperationalStatsProps) {
    const [selectedWilaya, setSelectedWilaya] = useState<string>("");
    const [stats, setStats] = useState<ConfirmationStats | null>(initialStats);
    const [loading, setLoading] = useState<boolean>(!initialStats);

    const fetchStats = async (wilaya?: string) => {
        setLoading(true);
        try {
            const data = await getConfirmationStats(wilaya);
            if (data) {
                setStats(data);
            }
        } catch {
            // Keep previous stats on error
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // If wilaya changed or initialStats was empty
        if (selectedWilaya !== "" || !initialStats) {
            fetchStats(selectedWilaya);
        }
    }, [selectedWilaya]);

    return (
        <div className="w-full space-y-6">
            {/* Header with Title & Wilaya Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl text-white shadow-lg border border-slate-700/50">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 bg-blue-500/20 text-blue-300 text-[11px] font-bold rounded-full border border-blue-400/30">
                            Supervision Opérationnelle
                        </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black mt-1 tracking-tight">
                        Magasins, Livreurs & Flux de Commandes
                    </h2>
                    <p className="text-xs text-slate-300 mt-0.5">
                        Données en temps réel de confirmation et répartition opérationnelle
                    </p>
                </div>

                {/* Wilaya Filter & Refresh */}
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/10">
                        <MdLocationOn className="text-blue-400 text-lg shrink-0" />
                        <div className="flex flex-col">
                            <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">
                                Filtrer par Wilaya
                            </span>
                            <select
                                value={selectedWilaya}
                                onChange={(e) => setSelectedWilaya(e.target.value)}
                                className="bg-transparent text-white font-semibold text-xs outline-none cursor-pointer pr-1"
                            >
                                <option value="" className="text-slate-800">
                                    Toutes les 58 Wilayas
                                </option>
                                {Wilaya.map((w) => (
                                    <option key={w.code} value={w.name} className="text-slate-800">
                                        {String(w.code).padStart(2, "0")} - {w.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => fetchStats(selectedWilaya)}
                        disabled={loading}
                        className="p-2.5 bg-white/10 hover:bg-white/20 active:scale-95 text-white rounded-2xl transition-all border border-white/10"
                        title="Actualiser les métriques"
                    >
                        <MdRefresh className={`text-xl ${loading ? "animate-spin" : ""}`} />
                    </button>
                </div>
            </div>

            {/* Live Dispatch Access Cards (VTC + Livreurs) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Dispatch VTC & Chauffeurs Live */}
                <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-yellow-700 rounded-3xl p-5 text-white shadow-md border border-amber-500/30 flex items-center justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-white/20 text-white text-[11px] font-bold rounded-full">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                                Live Dispatch VTC
                            </span>
                        </div>
                        <h3 className="text-lg font-extrabold tracking-tight">
                            Carte Live Chauffeurs & Courses VTC
                        </h3>
                        <p className="text-xs text-amber-100 max-w-md">
                            Suivi GPS en temps réel des chauffeurs, courses actives et gestion des statuts
                        </p>
                    </div>
                    <Link
                        href={selectedWilaya ? `/dashboard/vtc_dispatch?wilaya=${encodeURIComponent(selectedWilaya)}` : "/dashboard/vtc_dispatch"}
                        className="px-4 py-2.5 bg-white text-amber-800 hover:bg-amber-50 font-bold text-xs rounded-xl shadow hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 shrink-0"
                    >
                        <span>Ouvrir Carte VTC</span>
                        <MdArrowForward className="text-sm" />
                    </Link>
                </div>

                {/* 2. Dispatch Livreurs & Commandes Live */}
                <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-5 text-white shadow-md border border-blue-500/30 flex items-center justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 text-[11px] font-bold rounded-full border border-emerald-400/30">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                                Live Dispatch Livreurs
                            </span>
                        </div>
                        <h3 className="text-lg font-extrabold tracking-tight">
                            Carte Live Livreurs & Commandes
                        </h3>
                        <p className="text-xs text-slate-300 max-w-md">
                            Positionnement GPS des livreurs, affectation des commandes et suivi des livraisons
                        </p>
                    </div>
                    <Link
                        href={selectedWilaya ? `/dashboard/confirmation/dispatch?wilaya=${encodeURIComponent(selectedWilaya)}` : "/dashboard/confirmation/dispatch"}
                        className="px-4 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold text-xs rounded-xl shadow hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 shrink-0"
                    >
                        <span>Ouvrir Carte Livreurs</span>
                        <MdArrowForward className="text-sm" />
                    </Link>
                </div>
            </div>

            {/* 3 Main KPI Cards */}
            {loading && !stats ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400">
                    <TbLoader3 className="animate-spin text-4xl text-blue-500" />
                    <span className="text-xs font-semibold">Chargement des données opérationnelles...</span>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* 1. Magasins & Restaurants Card */}
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-sm border border-slate-200/80 dark:border-zinc-800 flex flex-col justify-between hover:shadow-md transition-all">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-zinc-800">
                            <div>
                                <p className="text-xs font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                                    Magasins & Restaurants
                                </p>
                                <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                                    {stats?.magasins.total || 0}
                                </h3>
                            </div>
                            <div className="p-3 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-2xl text-2xl border border-amber-200/50 dark:border-amber-500/20">
                                <MdOutlineStorefront />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 py-4">
                            <div className="bg-emerald-50/80 dark:bg-emerald-950/30 p-3 rounded-2xl border border-emerald-200/60 dark:border-emerald-800/40">
                                <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Ouverts</p>
                                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 mt-0.5">
                                    {stats?.magasins.ouverts || 0}
                                </p>
                            </div>
                            <div className="bg-rose-50/80 dark:bg-rose-950/30 p-3 rounded-2xl border border-rose-200/60 dark:border-rose-800/40">
                                <p className="text-xs font-medium text-rose-700 dark:text-rose-400">Fermés</p>
                                <p className="text-2xl font-bold text-rose-700 dark:text-rose-300 mt-0.5">
                                    {stats?.magasins.fermes || 0}
                                </p>
                            </div>
                        </div>

                        <Link
                            href={
                                selectedWilaya
                                    ? `/dashboard/confirmation/magasins?wilaya=${encodeURIComponent(selectedWilaya)}`
                                    : "/dashboard/confirmation/magasins"
                            }
                            className="w-full py-2.5 px-4 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 font-semibold text-xs rounded-xl flex items-center justify-between transition-colors mt-2"
                        >
                            <span>Voir l&apos;état des magasins</span>
                            <MdArrowForward className="text-sm" />
                        </Link>
                    </div>

                    {/* 2. Flotte de Livreurs Card */}
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-sm border border-slate-200/80 dark:border-zinc-800 flex flex-col justify-between hover:shadow-md transition-all">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-zinc-800">
                            <div>
                                <p className="text-xs font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                                    Flotte de Livreurs
                                </p>
                                <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                                    {stats?.livreurs.total || 0}
                                </h3>
                            </div>
                            <div className="p-3 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl text-2xl border border-blue-200/50 dark:border-blue-500/20">
                                <MdDeliveryDining />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 py-4">
                            <div className="bg-emerald-50/80 dark:bg-emerald-950/30 p-3 rounded-2xl border border-emerald-200/60 dark:border-emerald-800/40">
                                <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">En Ligne</p>
                                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 mt-0.5">
                                    {stats?.livreurs.en_ligne || 0}
                                </p>
                            </div>
                            <div className="bg-slate-100/80 dark:bg-zinc-800/60 p-3 rounded-2xl border border-slate-200/60 dark:border-zinc-700">
                                <p className="text-xs font-medium text-slate-600 dark:text-zinc-400">Hors Ligne</p>
                                <p className="text-2xl font-bold text-slate-700 dark:text-zinc-300 mt-0.5">
                                    {stats?.livreurs.offline || 0}
                                </p>
                            </div>
                        </div>

                        <Link
                            href={
                                selectedWilaya
                                    ? `/dashboard/confirmation/livreurs?wilaya=${encodeURIComponent(selectedWilaya)}`
                                    : "/dashboard/confirmation/livreurs"
                            }
                            className="w-full py-2.5 px-4 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 font-semibold text-xs rounded-xl flex items-center justify-between transition-colors mt-2"
                        >
                            <span>Voir l&apos;état des livreurs</span>
                            <MdArrowForward className="text-sm" />
                        </Link>
                    </div>

                    {/* 3. Commandes Reçues Card */}
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-sm border border-slate-200/80 dark:border-zinc-800 flex flex-col justify-between hover:shadow-md transition-all">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-zinc-800">
                            <div>
                                <p className="text-xs font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                                    Commandes Reçues
                                </p>
                                <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                                    {stats?.commandes.total || 0}
                                </h3>
                            </div>
                            <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl text-2xl border border-indigo-200/50 dark:border-indigo-500/20">
                                <MdOutlineConfirmationNumber />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 py-4">
                            <div className="bg-amber-50/80 dark:bg-amber-950/30 p-3 rounded-2xl border border-amber-200/60 dark:border-amber-800/40">
                                <p className="text-xs font-medium text-amber-700 dark:text-amber-400 flex items-center gap-1">
                                    <MdPendingActions /> En attente
                                </p>
                                <p className="text-2xl font-bold text-amber-700 dark:text-amber-300 mt-0.5">
                                    {stats?.commandes.en_attente || 0}
                                </p>
                            </div>
                            <div className="bg-blue-50/80 dark:bg-blue-950/30 p-3 rounded-2xl border border-blue-200/60 dark:border-blue-800/40">
                                <p className="text-xs font-medium text-blue-700 dark:text-blue-400 flex items-center gap-1">
                                    <MdCheckCircle /> Confirmées
                                </p>
                                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300 mt-0.5">
                                    {stats?.commandes.confirmees || 0}
                                </p>
                            </div>
                        </div>

                        <Link
                            href={
                                selectedWilaya
                                    ? `/dashboard/confirmation/commandes?wilaya=${encodeURIComponent(selectedWilaya)}`
                                    : "/dashboard/confirmation/commandes"
                            }
                            className="w-full py-2.5 px-4 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 font-semibold text-xs rounded-xl flex items-center justify-between transition-colors mt-2"
                        >
                            <span>Gérer & Diffuser Commandes</span>
                            <MdArrowForward className="text-sm" />
                        </Link>
                    </div>
                </div>
            )}

            {/* Quick Navigation Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8 gap-3.5">
                <Link
                    href="/dashboard/vtc_dispatch"
                    className="p-4 bg-gradient-to-br from-amber-500 via-amber-600 to-yellow-600 text-white rounded-2xl shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all flex flex-col justify-between h-28"
                >
                    <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-100">Live VTC</span>
                        <MdLocalTaxi className="text-xl" />
                    </div>
                    <div>
                        <h4 className="font-bold text-sm">Dispatch VTC</h4>
                        <p className="text-[10px] text-amber-100 truncate">Carte Live & Chauffeurs</p>
                    </div>
                </Link>

                <Link
                    href="/dashboard/confirmation/commandes"
                    className="p-4 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all flex flex-col justify-between h-28"
                >
                    <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200">Commandes</span>
                        <MdOutlineConfirmationNumber className="text-xl" />
                    </div>
                    <div>
                        <h4 className="font-bold text-sm">Diffuser Commandes</h4>
                        <p className="text-[10px] text-blue-100 truncate">Assigner aux livreurs disponibles</p>
                    </div>
                </Link>

                <Link
                    href="/dashboard/confirmation/magasins"
                    className="p-4 bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-2xl shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all flex flex-col justify-between h-28"
                >
                    <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-200">Magasins</span>
                        <MdOutlineStorefront className="text-xl" />
                    </div>
                    <div>
                        <h4 className="font-bold text-sm">Suivi Magasins</h4>
                        <p className="text-[10px] text-amber-100 truncate">Ouverture & Disponibilité</p>
                    </div>
                </Link>

                <Link
                    href="/dashboard/confirmation/livreurs"
                    className="p-4 bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-2xl shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all flex flex-col justify-between h-28"
                >
                    <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-200">Flotte</span>
                        <MdDeliveryDining className="text-xl" />
                    </div>
                    <div>
                        <h4 className="font-bold text-sm">Livreurs en Ligne</h4>
                        <p className="text-[10px] text-emerald-100 truncate">Disponibilité & charges</p>
                    </div>
                </Link>

                <Link
                    href="/dashboard/employees"
                    className="p-4 bg-gradient-to-br from-indigo-600 to-purple-700 text-white rounded-2xl shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all flex flex-col justify-between h-28"
                >
                    <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-200">Personnel</span>
                        <MdGroup className="text-xl" />
                    </div>
                    <div>
                        <h4 className="font-bold text-sm">Gestion Employés</h4>
                        <p className="text-[10px] text-indigo-100 truncate">Rôles, permissions & comptes</p>
                    </div>
                </Link>

                <Link
                    href="/dashboard/confirmation/promo"
                    className="p-4 bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500 text-white rounded-2xl shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all flex flex-col justify-between h-28"
                >
                    <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-100">Parrainage</span>
                        <MdLocalOffer className="text-xl" />
                    </div>
                    <div>
                        <h4 className="font-bold text-sm">Codes Promo</h4>
                        <p className="text-[10px] text-amber-100 truncate">Gestion & Utilisateurs</p>
                    </div>
                </Link>

                <Link
                    href="/dashboard/apple_center"
                    className="p-4 bg-gradient-to-br from-slate-700 to-slate-900 text-white rounded-2xl shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all flex flex-col justify-between h-28"
                >
                    <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">Support</span>
                        <MdLocationOn className="text-xl" />
                    </div>
                    <div>
                        <h4 className="font-bold text-sm">Centre d&apos;Appel</h4>
                        <p className="text-[10px] text-slate-300 truncate">Gestion des partenaires</p>
                    </div>
                </Link>

                <Link
                    href="/dashboard/objectifs"
                    className="p-4 bg-gradient-to-br from-amber-500 via-yellow-600 to-amber-700 text-white rounded-2xl shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all flex flex-col justify-between h-28"
                >
                    <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-100">Challenges</span>
                        <FaTrophy className="text-xl text-yellow-200" />
                    </div>
                    <div>
                        <h4 className="font-bold text-sm">Objectifs & Primes</h4>
                        <p className="text-[10px] text-amber-100 truncate">Suivi chauffeurs & livreurs</p>
                    </div>
                </Link>
            </div>
        </div>
    );
}
