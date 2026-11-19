"use client";

import React, { useState } from "react";
import { MdClose } from "react-icons/md";
import {
    FaCar,
    FaMotorcycle,
    FaUsers,
    FaPen,
    FaCalendarAlt,
    FaMapMarkerAlt,
    FaCoins,
} from "react-icons/fa";
import { updateObjectif, Objectif, CibleObjectif, TypeObjectif, PeriodeObjectif } from "@/lib/objectifs_action";
import { Wilaya } from "@/lib/tools/named";

type Props = {
    objectif: Objectif;
    onClose: () => void;
    onSuccess: () => void;
};

export default function ModifyObjectifModal({ objectif, onClose, onSuccess }: Props) {
    const [cible, setCible] = useState<CibleObjectif>(objectif.cible);
    const [typeObjectif, setTypeObjectif] = useState<TypeObjectif>(objectif.type_objectif);
    const [titre, setTitre] = useState<string>(objectif.titre);
    const [description, setDescription] = useState<string>(objectif.description || "");
    const [valeurCible, setValeurCible] = useState<string>(String(objectif.valeur_cible));
    const [primeMontant, setPrimeMontant] = useState<string>(String(objectif.prime_montant));
    const [periode, setPeriode] = useState<PeriodeObjectif>(objectif.periode);
    const [wilaya, setWilaya] = useState<string>(objectif.wilaya || "Toutes");
    const [isActive, setIsActive] = useState<boolean>(objectif.is_active);

    const formatForInput = (isoStr: string) => {
        try {
            const d = new Date(isoStr);
            return d.toISOString().slice(0, 16);
        } catch {
            return "";
        }
    };

    const [dateDebut, setDateDebut] = useState<string>(formatForInput(objectif.date_debut));
    const [dateFin, setDateFin] = useState<string>(formatForInput(objectif.date_fin));
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!titre.trim()) {
            alert("Veuillez saisir un titre pour l'objectif.");
            return;
        }

        const numValeur = parseFloat(valeurCible);
        if (isNaN(numValeur) || numValeur <= 0) {
            alert("Veuillez saisir une valeur cible valide supérieure à 0.");
            return;
        }

        const numPrime = parseFloat(primeMontant);
        if (isNaN(numPrime) || numPrime < 0) {
            alert("Veuillez saisir un montant de prime valide (>= 0 DA).");
            return;
        }

        if (new Date(dateFin) <= new Date(dateDebut)) {
            alert("La date de fin doit être postérieure à la date de début.");
            return;
        }

        setIsSubmitting(true);
        const success = await updateObjectif(objectif.id, {
            titre: titre.trim(),
            description: description.trim(),
            cible,
            type_objectif: typeObjectif,
            valeur_cible: numValeur,
            prime_montant: numPrime,
            periode,
            date_debut: new Date(dateDebut).toISOString(),
            date_fin: new Date(dateFin).toISOString(),
            wilaya,
            is_active: isActive,
        });
        setIsSubmitting(false);

        if (success) {
            onSuccess();
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
            <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-md">
                            <FaPen className="text-lg" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold">Modifier l&apos;Objectif #{objectif.id}</h2>
                            <p className="text-xs text-blue-100">Ajustez les conditions, primes ou dates de validité</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                    >
                        <MdClose className="text-2xl" />
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
                    {/* Cible */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-2">
                            Public Cible *
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                            <button
                                type="button"
                                onClick={() => setCible("vtc")}
                                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all gap-1.5 ${
                                    cible === "vtc"
                                        ? "border-red-600 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 font-bold shadow-sm"
                                        : "border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:border-slate-300"
                                }`}
                            >
                                <FaCar className="text-2xl" />
                                <span className="text-xs">Chauffeur VTC</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setCible("livreur")}
                                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all gap-1.5 ${
                                    cible === "livreur"
                                        ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 font-bold shadow-sm"
                                        : "border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:border-slate-300"
                                }`}
                            >
                                <FaMotorcycle className="text-2xl" />
                                <span className="text-xs">Livreur Food</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setCible("tous")}
                                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all gap-1.5 ${
                                    cible === "tous"
                                        ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 font-bold shadow-sm"
                                        : "border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:border-slate-300"
                                }`}
                            >
                                <FaUsers className="text-2xl" />
                                <span className="text-xs">Tous Partenaires</span>
                            </button>
                        </div>
                    </div>

                    {/* Titre */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5">
                            Titre de l&apos;objectif *
                        </label>
                        <input
                            type="text"
                            required
                            value={titre}
                            onChange={(e) => setTitre(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/50 text-slate-800 dark:text-zinc-100 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm transition"
                        />
                    </div>

                    {/* Type d'objectif & Période */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5">
                                Type de Mesure *
                            </label>
                            <select
                                value={typeObjectif}
                                onChange={(e) => setTypeObjectif(e.target.value as TypeObjectif)}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/50 text-slate-800 dark:text-zinc-100 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm transition"
                            >
                                <option value="courses">
                                    {cible === "livreur" ? "Nombre de livraisons" : "Nombre de courses"}
                                </option>
                                <option value="chiffre_affaires">Chiffre d&apos;affaires en DA</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5">
                                Type de Période *
                            </label>
                            <select
                                value={periode}
                                onChange={(e) => setPeriode(e.target.value as PeriodeObjectif)}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/50 text-slate-800 dark:text-zinc-100 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm transition"
                            >
                                <option value="weekend">Week-end (Ven - Sam - Dim)</option>
                                <option value="journalier">Journalier (24h)</option>
                                <option value="hebdomadaire">Hebdomadaire (7 jours)</option>
                                <option value="mensuel">Mensuel (30 jours)</option>
                                <option value="personnalise">Personnalisé</option>
                            </select>
                        </div>
                    </div>

                    {/* Valeur cible & Prime DA */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5">
                                Valeur Cible à atteindre *
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    step="any"
                                    min="1"
                                    required
                                    value={valeurCible}
                                    onChange={(e) => setValeurCible(e.target.value)}
                                    className="w-full pl-4 pr-16 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/50 text-slate-800 dark:text-zinc-100 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm transition"
                                />
                                <span className="absolute right-3.5 top-2.5 text-xs font-bold text-slate-400 dark:text-zinc-500">
                                    {typeObjectif === "courses" ? "courses" : "DA"}
                                </span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5">
                                Montant de la Prime (Bonus) *
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    step="any"
                                    min="0"
                                    required
                                    value={primeMontant}
                                    onChange={(e) => setPrimeMontant(e.target.value)}
                                    className="w-full pl-4 pr-16 py-2.5 rounded-xl border border-emerald-300 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 font-extrabold focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm transition"
                                />
                                <span className="absolute right-3.5 top-2.5 text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                                    DA
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Dates Début et Fin */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5 flex items-center gap-1.5">
                                <FaCalendarAlt className="text-slate-400" /> Date & Heure Début *
                            </label>
                            <input
                                type="datetime-local"
                                required
                                value={dateDebut}
                                onChange={(e) => setDateDebut(e.target.value)}
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/50 text-slate-800 dark:text-zinc-100 font-medium text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5 flex items-center gap-1.5">
                                <FaCalendarAlt className="text-slate-400" /> Date & Heure Fin *
                            </label>
                            <input
                                type="datetime-local"
                                required
                                value={dateFin}
                                onChange={(e) => setDateFin(e.target.value)}
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/50 text-slate-800 dark:text-zinc-100 font-medium text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                            />
                        </div>
                    </div>

                    {/* Wilaya & Statut Actif */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5 flex items-center gap-1.5">
                                <FaMapMarkerAlt className="text-slate-400" /> Wilaya Cible
                            </label>
                            <select
                                value={wilaya}
                                onChange={(e) => setWilaya(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/50 text-slate-800 dark:text-zinc-100 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm transition"
                            >
                                <option value="Toutes">Toutes les wilayas</option>
                                {Wilaya.map((w) => (
                                    <option key={w.id} value={w.name}>
                                        {w.code} - {w.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800/40 border border-slate-200 dark:border-zinc-800">
                            <div>
                                <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 block">
                                    Objectif Actif
                                </span>
                                <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                                    Statut actuel de l&apos;offre
                                </span>
                            </div>
                            <input
                                type="checkbox"
                                checked={isActive}
                                onChange={(e) => setIsActive(e.target.checked)}
                                className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5">
                            Description & Instructions
                        </label>
                        <textarea
                            rows={3}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/50 text-slate-800 dark:text-zinc-100 font-medium text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none transition"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-zinc-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 font-semibold text-sm hover:bg-slate-100 dark:hover:bg-zinc-800 transition"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50"
                        >
                            <FaPen className="text-xs" />
                            {isSubmitting ? "Enregistrement..." : "Enregistrer les modifications"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
