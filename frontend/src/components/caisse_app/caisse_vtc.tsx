"use client";

import { getImageUrl } from "@/lib/tools/tools";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
    FaCar,
    FaMoneyBillWave,
    FaHandHoldingUsd,
    FaReceipt,
    FaExclamationTriangle,
    FaCheckCircle,
    FaSearch,
    FaSync,
    FaHistory,
    FaTimes,
    FaUserCheck,
    FaPhoneAlt,
    FaMapMarkerAlt,
    FaCalendarAlt,
    FaArrowRight,
    FaFileInvoiceDollar
} from "react-icons/fa";
import {
    CaisseKPIs,
    CaisseVtcChauffeur,
    VersementHistoryItem,
    getCaisseVtcChauffeurs,
    solderCompteChauffeur,
    getVersementsChauffeur
} from "@/lib/caisse_action";
import { Wilaya } from "@/lib/tools/named";
import toast from "react-hot-toast";

export default function CaisseVtc() {
    const [chauffeurs, setChauffeurs] = useState<CaisseVtcChauffeur[]>([]);
    const [kpis, setKpis] = useState<CaisseKPIs | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Filters
    const [search, setSearch] = useState("");
    const [wilaya, setWilaya] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    // Modal Solder / Versement
    const [selectedChauffeur, setSelectedChauffeur] = useState<CaisseVtcChauffeur | null>(null);
    const [modalTab, setModalTab] = useState<"versement" | "history">("versement");
    const [montant, setMontant] = useState<string>("");
    const [modePaiement, setModePaiement] = useState<string>("especes");
    const [reference, setReference] = useState<string>("");
    const [observation, setObservation] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // History
    const [history, setHistory] = useState<VersementHistoryItem[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    // Fetch Data
    const fetchData = useCallback(async () => {
        setIsLoading(true);
        const data = await getCaisseVtcChauffeurs({
            search,
            wilaya,
            status: statusFilter,
            page,
            page_size: 20
        });

        if (data) {
            setChauffeurs(data.results);
            setKpis(data.kpis);
            setTotalPages(data.total_pages);
            setTotalItems(data.total);
        }
        setIsLoading(false);
    }, [search, wilaya, statusFilter, page]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Open Modal
    const handleOpenModal = async (ch: CaisseVtcChauffeur, tab: "versement" | "history" = "versement") => {
        setSelectedChauffeur(ch);
        setModalTab(tab);
        setMontant(ch.solde_a_payer > 0 ? String(ch.solde_a_payer) : "");
        setModePaiement("especes");
        setReference("");
        setObservation("");

        setIsLoadingHistory(true);
        const hist = await getVersementsChauffeur(ch.id);
        setHistory(hist);
        setIsLoadingHistory(false);
    };

    // Submit Versement
    const handleSubmitVersement = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedChauffeur) return;

        const val = parseFloat(montant);
        if (isNaN(val) || val <= 0) {
            toast.error("Veuillez saisir un montant valide supérieur à 0");
            return;
        }

        setIsSubmitting(true);
        const res = await solderCompteChauffeur({
            chauffeur_id: selectedChauffeur.id,
            montant: val,
            mode_paiement: modePaiement,
            reference: reference.trim(),
            observation: observation.trim()
        });
        setIsSubmitting(false);

        if (res.success) {
            setSelectedChauffeur(null);
            fetchData();
        }
    };

    return (
        <div className="p-4 sm:p-8 space-y-8 bg-slate-50 dark:bg-slate-950 min-h-screen">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center text-2xl shadow-inner">
                            <FaCar />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                                Caisse Chauffeurs VTC
                            </h1>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                Suivi financier des chauffeurs, encaissements des taxes LTC et gestion des soldes
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => fetchData()}
                        disabled={isLoading}
                        className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all flex items-center gap-2 shadow-sm"
                    >
                        <FaSync className={isLoading ? "animate-spin" : ""} /> Actualiser
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            {kpis && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    {/* CA Total */}
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Chiffre d&apos;Affaires VTC</span>
                            <span className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center text-sm">
                                <FaMoneyBillWave />
                            </span>
                        </div>
                        <div className="mt-3">
                            <p className="text-2xl font-black text-slate-900 dark:text-white">
                                {kpis.total_ca?.toLocaleString("fr-DZ")} <span className="text-xs font-semibold text-slate-400">DA</span>
                            </p>
                            <p className="text-[11px] text-slate-400 mt-1">
                                Volume total des courses terminées
                            </p>
                        </div>
                    </div>

                    {/* Bénéfice Chauffeurs */}
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Net Chauffeurs</span>
                            <span className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center text-sm">
                                <FaHandHoldingUsd />
                            </span>
                        </div>
                        <div className="mt-3">
                            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                                {kpis.total_benefice_chauffeurs?.toLocaleString("fr-DZ")} <span className="text-xs font-semibold text-slate-400">DA</span>
                            </p>
                            <p className="text-[11px] text-slate-400 mt-1">
                                Bénéfice net conservé par les chauffeurs
                            </p>
                        </div>
                    </div>

                    {/* Taxes LTC Plateforme */}
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Commissions LTC</span>
                            <span className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center text-sm">
                                <FaFileInvoiceDollar />
                            </span>
                        </div>
                        <div className="mt-3">
                            <p className="text-2xl font-black text-purple-600 dark:text-purple-400">
                                {kpis.total_tax_ltc?.toLocaleString("fr-DZ")} <span className="text-xs font-semibold text-slate-400">DA</span>
                            </p>
                            <p className="text-[11px] text-slate-400 mt-1">
                                Part de commission due à l&apos;entreprise
                            </p>
                        </div>
                    </div>

                    {/* Total Encaissé */}
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Encaissé</span>
                            <span className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 flex items-center justify-center text-sm">
                                <FaReceipt />
                            </span>
                        </div>
                        <div className="mt-3">
                            <p className="text-2xl font-black text-teal-600 dark:text-teal-400">
                                {kpis.total_encaisse?.toLocaleString("fr-DZ")} <span className="text-xs font-semibold text-slate-400">DA</span>
                            </p>
                            <p className="text-[11px] text-slate-400 mt-1">
                                Versements perçus à la caisse
                            </p>
                        </div>
                    </div>

                    {/* Dettes / Restant à Recouvrer */}
                    <div className="bg-gradient-to-br from-rose-500/10 to-rose-600/5 dark:from-rose-950/30 dark:to-slate-900 p-5 rounded-2xl border border-rose-200 dark:border-rose-900/50 shadow-sm flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">Restant Dû</span>
                            <span className="w-9 h-9 rounded-xl bg-rose-500 text-white flex items-center justify-center text-sm shadow-md shadow-rose-500/30">
                                <FaExclamationTriangle />
                            </span>
                        </div>
                        <div className="mt-3">
                            <p className="text-2xl font-black text-rose-600 dark:text-rose-400">
                                {kpis.total_solde_impaye?.toLocaleString("fr-DZ")} <span className="text-xs font-semibold text-slate-400">DA</span>
                            </p>
                            <p className="text-[11px] text-rose-600/80 dark:text-rose-400/80 font-medium mt-1">
                                {kpis.chauffeurs_en_dette ?? 0} chauffeur(s) en dette
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Filters Bar */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                <div className="flex flex-col sm:flex-row gap-3 flex-1">
                    {/* Search */}
                    <div className="relative flex-1">
                        <FaSearch className="absolute left-3.5 top-3.5 text-slate-400 text-sm" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                            placeholder="Rechercher chauffeur, téléphone, matricule..."
                            className="w-full pl-9 pr-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-amber-500"
                        />
                    </div>

                    {/* Wilaya Filter */}
                    <select
                        value={wilaya}
                        onChange={(e) => {
                            setWilaya(e.target.value);
                            setPage(1);
                        }}
                        className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-amber-500 text-slate-700 dark:text-slate-200"
                    >
                        <option value="">Toutes les wilayas</option>
                        {Wilaya.map((w) => (
                            <option key={w.code} value={w.name}>
                                {String(w.code).padStart(2, '0')} - {w.name}
                            </option>
                        ))}
                    </select>

                    {/* Status Filter */}
                    <select
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            setPage(1);
                        }}
                        className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-amber-500 text-slate-700 dark:text-slate-200"
                    >
                        <option value="all">Tous les chauffeurs</option>
                        <option value="debt">🔴 En dette (Solde &gt; 0 DA)</option>
                        <option value="settled">🟢 À jour (Soldé)</option>
                    </select>
                </div>

                <div className="text-xs text-slate-400 font-semibold px-2 shrink-0">
                    Total : {totalItems} chauffeur(s)
                </div>
            </div>

            {/* Chauffeurs Table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                        <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-bold border-b border-slate-200 dark:border-slate-800">
                            <tr>
                                <th className="px-5 py-4">Chauffeur</th>
                                <th className="px-4 py-4">Véhicule</th>
                                <th className="px-4 py-4 text-center">Courses</th>
                                <th className="px-4 py-4 text-right">Chiffre d&apos;Affaires</th>
                                <th className="px-4 py-4 text-right">Bénéfice Net</th>
                                <th className="px-4 py-4 text-right">Taxe LTC</th>
                                <th className="px-4 py-4 text-center">Solde Dû</th>
                                <th className="px-4 py-4">Dernier Versement</th>
                                <th className="px-5 py-4 text-right">Actions</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={9} className="py-16 text-center text-slate-400">
                                        <FaSync className="animate-spin text-2xl mx-auto mb-2 text-amber-500" />
                                        Chargement des données de caisse...
                                    </td>
                                </tr>
                            ) : chauffeurs.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="py-16 text-center text-slate-400">
                                        <FaCar className="text-3xl mx-auto mb-2 text-slate-300" />
                                        Aucun chauffeur trouvé pour ces critères.
                                    </td>
                                </tr>
                            ) : (
                                chauffeurs.map((ch) => {
                                    const isDebt = ch.solde_a_payer > 0;

                                    return (
                                        <tr
                                            key={ch.id}
                                            className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                                        >
                                            {/* Chauffeur info */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="relative w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                                                        {ch.image_url ? (
                                                            <Image
                                                                src={getImageUrl(ch.image_url)}
                                                                alt={ch.name}
                                                                fill
                                                                className="object-cover"
                                                                unoptimized
                                                            />
                                                        ) : (
                                                            <FaCar className="text-slate-400 text-sm" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900 dark:text-white leading-tight">
                                                            {ch.name}
                                                        </p>
                                                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                                                            <span className="flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400">
                                                                <FaPhoneAlt className="text-[9px]" /> {ch.phone || "Non renseigné"}
                                                            </span>
                                                            {ch.wilaya && (
                                                                <span className="flex items-center gap-1">
                                                                    • <FaMapMarkerAlt className="text-[9px]" /> {ch.wilaya}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Véhicule */}
                                            <td className="px-4 py-4 text-xs">
                                                {ch.vehicule ? (
                                                    <div>
                                                        <span className="font-bold text-slate-800 dark:text-slate-200">
                                                            {ch.vehicule.marque} {ch.vehicule.modele}
                                                        </span>
                                                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                                                            {ch.vehicule.matricule || "Sans matricule"}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400 text-xs">Non renseigné</span>
                                                )}
                                            </td>

                                            {/* Courses */}
                                            <td className="px-4 py-4 text-center">
                                                <span className="px-2.5 py-1 rounded-full text-xs font-black bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/60">
                                                    {ch.total_courses}
                                                </span>
                                            </td>

                                            {/* CA */}
                                            <td className="px-4 py-4 text-right font-bold text-slate-900 dark:text-white">
                                                {ch.chiffre_affaires.toLocaleString("fr-DZ")} DA
                                            </td>

                                            {/* Bénéfice Chauffeur */}
                                            <td className="px-4 py-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                                                {ch.benefice_chauffeur.toLocaleString("fr-DZ")} DA
                                            </td>

                                            {/* Taxe LTC */}
                                            <td className="px-4 py-4 text-right font-bold text-purple-600 dark:text-purple-400">
                                                {ch.tax_ltc_total.toLocaleString("fr-DZ")} DA
                                            </td>

                                            {/* Solde Dû */}
                                            <td className="px-4 py-4 text-center">
                                                {isDebt ? (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 shadow-sm animate-pulse">
                                                        <FaExclamationTriangle className="text-[10px]" />
                                                        {ch.solde_a_payer.toLocaleString("fr-DZ")} DA
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                                                        <FaCheckCircle className="text-[10px]" /> À jour
                                                    </span>
                                                )}
                                            </td>

                                            {/* Dernier versement */}
                                            <td className="px-4 py-4 text-xs">
                                                {ch.dernier_versement ? (
                                                    <div>
                                                        <p className="font-bold text-slate-800 dark:text-slate-200">
                                                            {ch.dernier_versement.montant.toLocaleString("fr-DZ")} DA
                                                        </p>
                                                        <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                                                            <FaCalendarAlt className="text-[8px]" /> {ch.dernier_versement.date}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400 text-xs">Aucun</span>
                                                )}
                                            </td>

                                            {/* Actions */}
                                            <td className="px-5 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleOpenModal(ch, "versement")}
                                                        className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm ${
                                                            isDebt
                                                                ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20"
                                                                : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                                                        }`}
                                                    >
                                                        <FaHandHoldingUsd /> {isDebt ? "Solder compte" : "Versement"}
                                                    </button>
                                                    <button
                                                        onClick={() => handleOpenModal(ch, "history")}
                                                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                                                        title="Historique des versements"
                                                    >
                                                        <FaHistory className="text-xs" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 disabled:opacity-40 text-xs font-bold rounded-xl text-slate-700 dark:text-slate-300 transition-colors"
                        >
                            Précédent
                        </button>
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                            Page {page} sur {totalPages}
                        </span>
                        <button
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 disabled:opacity-40 text-xs font-bold rounded-xl text-slate-700 dark:text-slate-300 transition-colors"
                        >
                            Suivant
                        </button>
                    </div>
                )}
            </div>

            {/* Modal Solder & Versement */}
            {selectedChauffeur && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn overflow-y-auto">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                        {/* Modal Header */}
                        <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white relative">
                            <button
                                onClick={() => setSelectedChauffeur(null)}
                                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                            >
                                <FaTimes />
                            </button>

                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/30 text-amber-300 flex items-center justify-center text-xl">
                                    <FaCar />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-white">{selectedChauffeur.name}</h3>
                                    <p className="text-xs text-slate-300 flex items-center gap-2 mt-0.5">
                                        <span>{selectedChauffeur.phone}</span>
                                        {selectedChauffeur.wilaya && <span>• {selectedChauffeur.wilaya}</span>}
                                    </p>
                                </div>
                            </div>

                            {/* Tabs inside modal */}
                            <div className="flex gap-2 mt-5 border-b border-white/10">
                                <button
                                    onClick={() => setModalTab("versement")}
                                    className={`pb-2.5 px-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
                                        modalTab === "versement"
                                            ? "border-amber-400 text-amber-300"
                                            : "border-transparent text-slate-400 hover:text-white"
                                    }`}
                                >
                                    <FaHandHoldingUsd /> Nouveau Versement
                                </button>
                                <button
                                    onClick={() => setModalTab("history")}
                                    className={`pb-2.5 px-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
                                        modalTab === "history"
                                            ? "border-amber-400 text-amber-300"
                                            : "border-transparent text-slate-400 hover:text-white"
                                    }`}
                                >
                                    <FaHistory /> Historique ({history.length})
                                </button>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6">
                            {modalTab === "versement" ? (
                                <form onSubmit={handleSubmitVersement} className="space-y-4">
                                    {/* Compte Summary */}
                                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                                        <div>
                                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Solde Restant Dû</p>
                                            <p className={`text-2xl font-black mt-0.5 ${
                                                selectedChauffeur.solde_a_payer > 0
                                                    ? "text-rose-600 dark:text-rose-400"
                                                    : "text-emerald-600 dark:text-emerald-400"
                                            }`}>
                                                {selectedChauffeur.solde_a_payer.toLocaleString("fr-DZ")} DA
                                            </p>
                                        </div>

                                        {selectedChauffeur.solde_a_payer > 0 && (
                                            <button
                                                type="button"
                                                onClick={() => setMontant(String(selectedChauffeur.solde_a_payer))}
                                                className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-extrabold transition-colors border border-amber-500/30"
                                            >
                                                Solder la totalité
                                            </button>
                                        )}
                                    </div>

                                    {/* Montant */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                            Montant Versé (DA) <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="1"
                                            required
                                            value={montant}
                                            onChange={(e) => setMontant(e.target.value)}
                                            placeholder="Ex: 5000"
                                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-base font-black text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                                        />
                                    </div>

                                    {/* Mode de Paiement */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                            Mode de Versement <span className="text-rose-500">*</span>
                                        </label>
                                        <select
                                            value={modePaiement}
                                            onChange={(e) => setModePaiement(e.target.value)}
                                            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-amber-500"
                                        >
                                            <option value="especes">💵 Espèces / Caisse physique</option>
                                            <option value="baridimob">📱 Baridimob / CCP</option>
                                            <option value="virement">🏦 Virement bancaire</option>
                                            <option value="autre">📝 Autre règlement</option>
                                        </select>
                                    </div>

                                    {/* Référence */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                            N° Reçu / Référence de Transaction (optionnel)
                                        </label>
                                        <input
                                            type="text"
                                            value={reference}
                                            onChange={(e) => setReference(e.target.value)}
                                            placeholder="Ex: REC-2026-0042 ou N° Transaction Baridimob"
                                            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-amber-500 text-slate-800 dark:text-slate-200"
                                        />
                                    </div>

                                    {/* Observation */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                            Notes / Observations (optionnel)
                                        </label>
                                        <textarea
                                            rows={2}
                                            value={observation}
                                            onChange={(e) => setObservation(e.target.value)}
                                            placeholder="Remarque du caissier..."
                                            className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-amber-500 text-slate-800 dark:text-slate-200 resize-none"
                                        />
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2 pt-2">
                                        <button
                                            type="button"
                                            onClick={() => setSelectedChauffeur(null)}
                                            className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 font-bold text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-colors"
                                        >
                                            Annuler
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
                                        >
                                            <FaUserCheck /> {isSubmitting ? "Enregistrement..." : "Confirmer le Versement"}
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                /* History Tab */
                                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                                    {isLoadingHistory ? (
                                        <div className="py-12 text-center text-slate-400 text-xs">
                                            <FaSync className="animate-spin text-lg mx-auto mb-2 text-amber-500" />
                                            Chargement de l&apos;historique...
                                        </div>
                                    ) : history.length === 0 ? (
                                        <div className="py-12 text-center text-slate-400 text-xs bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                                            <FaReceipt className="text-2xl mx-auto mb-1 text-slate-300" />
                                            Aucun versement enregistré pour ce chauffeur.
                                        </div>
                                    ) : (
                                        history.map((h) => (
                                            <div
                                                key={h.id}
                                                className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between"
                                            >
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                                                            +{h.montant.toLocaleString("fr-DZ")} DA
                                                        </span>
                                                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] uppercase">
                                                            {h.mode_paiement}
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] text-slate-400 mt-1">
                                                        Soldes : {h.solde_avant.toLocaleString("fr-DZ")} DA <FaArrowRight className="inline text-[8px] mx-1" /> {h.solde_apres.toLocaleString("fr-DZ")} DA
                                                    </p>
                                                    {h.reference && (
                                                        <p className="text-[10px] text-blue-600 dark:text-blue-400 font-mono mt-0.5">
                                                            Réf : {h.reference}
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="text-right">
                                                    <p className="text-[10px] text-slate-400 font-medium">
                                                        {h.date}
                                                    </p>
                                                    <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                                                        Par {h.agent_name}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
