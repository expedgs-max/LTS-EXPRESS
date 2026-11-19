"use client";

import React, { useState, useEffect, useTransition } from "react";
import {
    MdAttachMoney,
    MdLocalTaxi,
    MdDeliveryDining,
    MdTrendingUp,
    MdTrendingDown,
    MdRefresh,
    MdCalendarToday,
    MdFileDownload,
    MdReceiptLong,
    MdPieChart,
    MdCompareArrows,
    MdAccountBalanceWallet,
    MdStorefront
} from "react-icons/md";
import {
    getCaisseGlobaleAnalytics,
    CaisseGlobaleAnalyticsResponse,
    CaisseGlobaleDailyTrend
} from "@/lib/caisse_action";
import { toast } from "react-hot-toast";

type PeriodType = "day" | "week" | "month" | "year";

export default function CaisseGlobale() {
    const [period, setPeriod] = useState<PeriodType>("day");
    const [dateRef, setDateRef] = useState<string>(() => {
        const today = new Date();
        return today.toISOString().split("T")[0];
    });
    const [data, setData] = useState<CaisseGlobaleAnalyticsResponse | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [, startTransition] = useTransition();

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const res = await getCaisseGlobaleAnalytics({
                period,
                date_ref: dateRef
            });
            if (res) {
                setData(res);
            } else {
                toast.error("Impossible de récupérer les statistiques de la caisse globale");
            }
        } catch {
            toast.error("Erreur de connexion au serveur");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        startTransition(() => {
            fetchData();
        });
    }, [period, dateRef]);

    const formatDA = (val?: number) => {
        return (val || 0).toLocaleString("fr-DZ", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }) + " DA";
    };

    const renderGrowthBadge = (growthPercent?: number, inverse = false) => {
        const p = growthPercent || 0;
        const isPositive = p > 0;
        const isNeutral = p === 0;

        let bg = "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60";
        let Icon = MdTrendingUp;

        if (isNeutral) {
            bg = "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700";
            Icon = MdCompareArrows;
        } else if ((!inverse && !isPositive) || (inverse && isPositive)) {
            bg = "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800/60";
            Icon = MdTrendingDown;
        }

        return (
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black border ${bg}`}>
                <Icon className="text-sm" />
                {p > 0 ? `+${p}%` : `${p}%`}
            </span>
        );
    };

    const exportDailyTrendsCSV = () => {
        if (!data?.daily_trends || data.daily_trends.length === 0) return;
        const headers = ["Date", "Jour", "CA VTC (DA)", "CA Food (DA)", "CA Global (DA)", "Bénéfice LTC (DA)", "Courses VTC", "Commandes Food", "Versements Reçus (DA)", "Croissance vs Veille (%)"];
        const rows = data.daily_trends.map((t) => [
            t.date_full,
            t.day_name,
            t.ca_vtc.toFixed(2),
            t.ca_food.toFixed(2),
            t.ca_global.toFixed(2),
            t.benefice_global.toFixed(2),
            t.courses_count,
            t.commandes_count,
            t.total_versements.toFixed(2),
            t.growth_vs_previous.toFixed(1) + "%"
        ]);

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `caisse_globale_evolution_${data.period}_${data.date_ref}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Export CSV téléchargé avec succès !");
    };

    // Calculate max value for chart scaling
    const maxDayCA = Math.max(...(data?.daily_trends?.map((d) => d.ca_global) || [1]), 100);

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
            {/* Top Header & Period Switcher */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl text-white shadow-lg shadow-indigo-500/30">
                            <MdAccountBalanceWallet className="text-3xl" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                                Caisse Globale & Finances
                            </h1>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                Analyse consolidée du Chiffre d&apos;Affaires, VTC, Food, et Bénéfices nets LTC
                            </p>
                        </div>
                    </div>
                </div>

                {/* Controls & Period Selector */}
                <div className="flex flex-wrap items-center gap-2">
                    {/* Period Buttons */}
                    <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                        <button
                            onClick={() => setPeriod("day")}
                            className={`px-4 py-2 text-xs font-black rounded-xl transition-all ${
                                period === "day"
                                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                            }`}
                        >
                            Jour
                        </button>
                        <button
                            onClick={() => setPeriod("week")}
                            className={`px-4 py-2 text-xs font-black rounded-xl transition-all ${
                                period === "week"
                                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                            }`}
                        >
                            Semaine
                        </button>
                        <button
                            onClick={() => setPeriod("month")}
                            className={`px-4 py-2 text-xs font-black rounded-xl transition-all ${
                                period === "month"
                                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                            }`}
                        >
                            Mois
                        </button>
                        <button
                            onClick={() => setPeriod("year")}
                            className={`px-4 py-2 text-xs font-black rounded-xl transition-all ${
                                period === "year"
                                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                            }`}
                        >
                            Année
                        </button>
                    </div>

                    {/* Date Picker */}
                    <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-xs">
                        <MdCalendarToday className="text-slate-400 text-sm" />
                        <input
                            type="date"
                            value={dateRef}
                            onChange={(e) => setDateRef(e.target.value)}
                            className="bg-transparent outline-none cursor-pointer text-slate-800 dark:text-slate-100 font-semibold"
                        />
                    </div>

                    {/* Action buttons */}
                    <button
                        onClick={fetchData}
                        disabled={isLoading}
                        title="Actualiser les données"
                        className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-all shadow-xs"
                    >
                        <MdRefresh className={`text-lg ${isLoading ? "animate-spin" : ""}`} />
                    </button>

                    <button
                        onClick={exportDailyTrendsCSV}
                        title="Exporter le journal comparatif en CSV"
                        className="flex items-center gap-1.5 px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-indigo-600/20"
                    >
                        <MdFileDownload className="text-base" />
                        <span>Export CSV</span>
                    </button>
                </div>
            </div>

            {/* Active Period Range Indicator */}
            {data?.labels && (
                <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950/20 dark:via-purple-950/20 dark:to-pink-950/20 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl">
                    <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                            Période sélectionnée :
                        </span>
                        <span className="text-xs font-black text-indigo-700 dark:text-indigo-400">
                            {data.labels.current} ({data.labels.curr_range})
                        </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                        <span>Comparé à :</span>
                        <span className="font-bold text-slate-700 dark:text-slate-200">
                            {data.labels.previous} ({data.labels.prev_range})
                        </span>
                    </div>
                </div>
            )}

            {/* Top 5 KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* 1. CA GLOBAL TOTAL */}
                <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm relative overflow-hidden flex flex-col justify-between group hover:border-indigo-400 transition-all">
                    <div className="flex items-center justify-between gap-2">
                        <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                            <MdAccountBalanceWallet className="text-2xl" />
                        </div>
                        {renderGrowthBadge(data?.growth.ca_global)}
                    </div>
                    <div className="mt-4">
                        <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                            Chiffre d&apos;Affaires Global
                        </div>
                        <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                            {formatDA(data?.current.ca_global)}
                        </div>
                        <div className="text-xs text-slate-400 mt-1 flex items-center justify-between">
                            <span>Précédent : {formatDA(data?.previous.ca_global)}</span>
                        </div>
                    </div>
                </div>

                {/* 2. BÉNÉFICE NET LTC */}
                <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm relative overflow-hidden flex flex-col justify-between group hover:border-purple-400 transition-all">
                    <div className="flex items-center justify-between gap-2">
                        <div className="p-2.5 rounded-2xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
                            <MdAttachMoney className="text-2xl" />
                        </div>
                        {renderGrowthBadge(data?.growth.benefice_global)}
                    </div>
                    <div className="mt-4">
                        <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                            Bénéfice Net LTC
                        </div>
                        <div className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">
                            {formatDA(data?.current.benefice_global)}
                        </div>
                        <div className="text-xs text-slate-400 mt-1 flex items-center justify-between">
                            <span>VTC: {formatDA(data?.current.benefice_vtc)}</span>
                            <span>Food: {formatDA(data?.current.benefice_food)}</span>
                        </div>
                    </div>
                </div>

                {/* 3. CA VTC */}
                <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm relative overflow-hidden flex flex-col justify-between group hover:border-amber-400 transition-all">
                    <div className="flex items-center justify-between gap-2">
                        <div className="p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
                            <MdLocalTaxi className="text-2xl" />
                        </div>
                        {renderGrowthBadge(data?.growth.ca_vtc)}
                    </div>
                    <div className="mt-4">
                        <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                            Chiffre d&apos;Affaires VTC
                        </div>
                        <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
                            {formatDA(data?.current.ca_vtc)}
                        </div>
                        <div className="text-xs text-slate-400 mt-1 flex items-center justify-between">
                            <span>{data?.current.courses_count || 0} courses</span>
                            <span>Part: {formatDA(data?.current.part_chauffeurs)}</span>
                        </div>
                    </div>
                </div>

                {/* 4. CA FOOD & LIVRAISON */}
                <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm relative overflow-hidden flex flex-col justify-between group hover:border-emerald-400 transition-all">
                    <div className="flex items-center justify-between gap-2">
                        <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                            <MdDeliveryDining className="text-2xl" />
                        </div>
                        {renderGrowthBadge(data?.growth.ca_food)}
                    </div>
                    <div className="mt-4">
                        <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                            CA Food (Livraison)
                        </div>
                        <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                            {formatDA(data?.current.ca_food_livraison)}
                        </div>
                        <div className="text-xs text-slate-400 mt-1 flex items-center justify-between">
                            <span>{data?.current.commandes_count || 0} commandes</span>
                            <span>Part: {formatDA(data?.current.part_livreurs)}</span>
                        </div>
                    </div>
                </div>

                {/* 5. VERSEMENTS ENCAISSÉS */}
                <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm relative overflow-hidden flex flex-col justify-between group hover:border-blue-400 transition-all">
                    <div className="flex items-center justify-between gap-2">
                        <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                            <MdReceiptLong className="text-2xl" />
                        </div>
                        {renderGrowthBadge(data?.growth.total_versements)}
                    </div>
                    <div className="mt-4">
                        <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                            Versements Reçus
                        </div>
                        <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
                            {formatDA(data?.current.total_versements)}
                        </div>
                        <div className="text-xs text-slate-400 mt-1 flex items-center justify-between">
                            <span>VTC: {formatDA(data?.current.versements_vtc)}</span>
                            <span>Livreur: {formatDA(data?.current.versements_livreur)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Activity Ratio & Breakdown Bar */}
            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <MdPieChart className="text-xl text-indigo-500" />
                        <h2 className="text-base font-black text-slate-900 dark:text-white">
                            Répartition des Revenus : VTC vs Food
                        </h2>
                    </div>
                    <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
                            <span>VTC : {data?.ratios.vtc_percent || 0}% ({formatDA(data?.current.ca_vtc)})</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                            <span>Food : {data?.ratios.food_percent || 0}% ({formatDA(data?.current.ca_food_livraison)})</span>
                        </div>
                    </div>
                </div>

                {/* Progress Visual Bar */}
                <div className="w-full h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
                    <div
                        style={{ width: `${data?.ratios.vtc_percent || 50}%` }}
                        className="h-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-700"
                        title={`VTC: ${data?.ratios.vtc_percent}%`}
                    />
                    <div
                        style={{ width: `${data?.ratios.food_percent || 50}%` }}
                        className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-700"
                        title={`Food: ${data?.ratios.food_percent}%`}
                    />
                </div>

                {/* Extra food merchant indicator */}
                <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                    <div className="flex items-center gap-1.5">
                        <MdStorefront className="text-slate-400 text-sm" />
                        <span>Volume marchandise Food globale transitée : <strong className="text-slate-700 dark:text-slate-200">{formatDA(data?.current.valeur_marchandise_food)}</strong></span>
                    </div>
                    <span>Total opérations : <strong className="text-slate-700 dark:text-slate-200">{(data?.current.courses_count || 0) + (data?.current.commandes_count || 0)}</strong></span>
                </div>
            </div>

            {/* Daily Trends Chart & Comparison (14 derniers jours) */}
            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div>
                        <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                            <MdTrendingUp className="text-xl text-indigo-500" />
                            <span>Évolution et Comparaison avec les Jours Passés</span>
                        </h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Historique journalier sur les 14 derniers jours avec taux d&apos;avancement quotidien
                        </p>
                    </div>
                </div>

                {/* Interactive Bar Histogram */}
                <div className="pt-6 pb-2">
                    <div className="flex items-end justify-between gap-2 md:gap-3 h-52">
                        {data?.daily_trends.map((day: CaisseGlobaleDailyTrend, i: number) => {
                            const heightPercent = maxDayCA > 0 ? Math.max((day.ca_global / maxDayCA) * 100, 4) : 4;
                            const vtcShare = day.ca_global > 0 ? (day.ca_vtc / day.ca_global) * 100 : 50;

                            return (
                                <div key={i} className="flex-1 flex flex-col items-center h-full justify-end group relative cursor-pointer">
                                    {/* Tooltip on hover */}
                                    <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col p-3 bg-slate-900 text-white text-[11px] rounded-xl shadow-xl z-20 whitespace-nowrap pointer-events-none border border-slate-800">
                                        <div className="font-bold border-b border-slate-700 pb-1 mb-1 text-slate-300">
                                            {day.day_name} {day.date_full}
                                        </div>
                                        <div className="flex items-center justify-between gap-4">
                                            <span className="text-slate-400">Total Caisse :</span>
                                            <span className="font-bold text-white">{formatDA(day.ca_global)}</span>
                                        </div>
                                        <div className="flex items-center justify-between gap-4 text-amber-400">
                                            <span>CA VTC :</span>
                                            <span className="font-bold">{formatDA(day.ca_vtc)} ({day.courses_count} courses)</span>
                                        </div>
                                        <div className="flex items-center justify-between gap-4 text-emerald-400">
                                            <span>CA Food :</span>
                                            <span className="font-bold">{formatDA(day.ca_food)} ({day.commandes_count} cmd)</span>
                                        </div>
                                        <div className="flex items-center justify-between gap-4 text-purple-300">
                                            <span>Bénéfice LTC :</span>
                                            <span className="font-bold">{formatDA(day.benefice_global)}</span>
                                        </div>
                                        {day.growth_vs_previous !== 0 && (
                                            <div className="pt-1 mt-1 border-t border-slate-700 text-xs font-bold flex items-center justify-between">
                                                <span>Progression :</span>
                                                <span className={day.growth_vs_previous > 0 ? "text-emerald-400" : "text-red-400"}>
                                                    {day.growth_vs_previous > 0 ? `+${day.growth_vs_previous}%` : `${day.growth_vs_previous}%`}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Value on top of bar */}
                                    <div className="text-[10px] font-bold text-slate-400 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {Math.round(day.ca_global)}
                                    </div>

                                    {/* Dual-tone Bar */}
                                    <div
                                        style={{ height: `${heightPercent}%` }}
                                        className={`w-full max-w-[28px] rounded-t-xl overflow-hidden flex flex-col justify-end transition-all duration-300 group-hover:brightness-110 shadow-xs ${
                                            day.is_today
                                                ? "ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-900"
                                                : ""
                                        }`}
                                    >
                                        <div
                                            style={{ height: `${100 - vtcShare}%` }}
                                            className="w-full bg-emerald-500"
                                            title={`Food: ${day.ca_food.toFixed(0)} DA`}
                                        />
                                        <div
                                            style={{ height: `${vtcShare}%` }}
                                            className="w-full bg-amber-500"
                                            title={`VTC: ${day.ca_vtc.toFixed(0)} DA`}
                                        />
                                    </div>

                                    {/* Date label at bottom */}
                                    <div className="mt-2 text-center">
                                        <span className={`block text-[11px] font-bold ${day.is_today ? "text-indigo-600 dark:text-indigo-400 font-black" : "text-slate-600 dark:text-slate-400"}`}>
                                            {day.date_display}
                                        </span>
                                        <span className="block text-[9px] text-slate-400">
                                            {day.day_name.slice(0, 3)}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Detailed Comparison Table of Past Days */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider font-black border-y border-slate-200 dark:border-slate-800">
                            <tr>
                                <th className="px-4 py-3">Date</th>
                                <th className="px-4 py-3">CA VTC</th>
                                <th className="px-4 py-3">CA Food</th>
                                <th className="px-4 py-3">CA Total Caisse</th>
                                <th className="px-4 py-3">Bénéfice LTC</th>
                                <th className="px-4 py-3 text-center">Activité</th>
                                <th className="px-4 py-3">Versements</th>
                                <th className="px-4 py-3 text-right">Progression vs Veille</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                            {data?.daily_trends.slice().reverse().map((day: CaisseGlobaleDailyTrend, i: number) => (
                                <tr
                                    key={i}
                                    className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                                        day.is_today ? "bg-indigo-50/30 dark:bg-indigo-950/20 font-bold" : ""
                                    }`}
                                >
                                    <td className="px-4 py-3">
                                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                            <span>{day.day_name} {day.date_full}</span>
                                            {day.is_today && (
                                                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300 text-[10px] font-black rounded-md">
                                                    Aujourd&apos;hui
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 font-semibold text-amber-600 dark:text-amber-400">
                                        {formatDA(day.ca_vtc)}
                                    </td>
                                    <td className="px-4 py-3 font-semibold text-emerald-600 dark:text-emerald-400">
                                        {formatDA(day.ca_food)}
                                    </td>
                                    <td className="px-4 py-3 font-black text-slate-900 dark:text-white">
                                        {formatDA(day.ca_global)}
                                    </td>
                                    <td className="px-4 py-3 font-bold text-purple-600 dark:text-purple-400">
                                        {formatDA(day.benefice_global)}
                                    </td>
                                    <td className="px-4 py-3 text-center text-xs text-slate-500">
                                        <span className="inline-block px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                            🚕 {day.courses_count} / 🛵 {day.commandes_count}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-blue-600 dark:text-blue-400 font-semibold">
                                        {formatDA(day.total_versements)}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        {renderGrowthBadge(day.growth_vs_previous)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Recent Cash Deposits / Versements */}
            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <MdReceiptLong className="text-xl text-blue-500" />
                        <span>Derniers Versements Encaissés à la Caisse</span>
                    </h2>
                    <span className="text-xs text-slate-400">
                        {data?.recent_versements?.length || 0} dernières opérations
                    </span>
                </div>

                {data?.recent_versements && data.recent_versements.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider font-black">
                                <tr>
                                    <th className="px-4 py-2.5">Type Caisse</th>
                                    <th className="px-4 py-2.5">Bénéficiaire</th>
                                    <th className="px-4 py-2.5">Montant Versé</th>
                                    <th className="px-4 py-2.5">Mode</th>
                                    <th className="px-4 py-2.5">Référence</th>
                                    <th className="px-4 py-2.5">Date & Heure</th>
                                    <th className="px-4 py-2.5">Agent Encaisseur</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                                {data.recent_versements.map((v) => (
                                    <tr key={v.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                                        <td className="px-4 py-2.5">
                                            {v.type_caisse === "VTC" ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                                                    🚖 Caisse VTC
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                                    🛵 Caisse Livreur
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-2.5 font-bold text-slate-800 dark:text-slate-200">
                                            {v.person_name}
                                        </td>
                                        <td className="px-4 py-2.5 font-black text-blue-600 dark:text-blue-400">
                                            {formatDA(v.montant)}
                                        </td>
                                        <td className="px-4 py-2.5 capitalize text-slate-600 dark:text-slate-400 text-xs">
                                            {v.mode_paiement}
                                        </td>
                                        <td className="px-4 py-2.5 font-mono text-xs text-slate-500">
                                            {v.reference || "-"}
                                        </td>
                                        <td className="px-4 py-2.5 text-xs text-slate-500">
                                            {v.date}
                                        </td>
                                        <td className="px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                                            {v.agent_name}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="py-8 text-center text-slate-400 text-xs font-medium">
                        Aucun versement enregistré pour le moment.
                    </div>
                )}
            </div>
        </div>
    );
}
