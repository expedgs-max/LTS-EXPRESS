"use client";

import React, { useState } from "react";
import { MdClose } from "react-icons/md";
import { FaPen, FaMotorcycle, FaRoute, FaCoins } from "react-icons/fa";
import { updateCommissionLivreur } from "@/lib/commission_livreur_action";

type Props = {
    commission: CommissionLivreur;
    onClose: () => void;
    onSuccess: () => void;
};

export default function ModifyCommissionLivreurModal({ commission, onClose, onSuccess }: Props) {
    const [km, setKm] = useState<string>(String(commission.km));
    const [prix, setPrix] = useState<string>(String(commission.prix));
    const [description, setDescription] = useState<string>(commission.description || "");
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const numKm = parseFloat(km);
        const numPrix = parseFloat(prix);

        if (isNaN(numKm) || numKm <= 0) {
            alert("Veuillez saisir une distance valide supérieure à 0 km.");
            return;
        }

        if (isNaN(numPrix) || numPrix < 0) {
            alert("Veuillez saisir un tarif valide supérieur ou égal à 0 DA.");
            return;
        }

        setIsSubmitting(true);
        const success = await updateCommissionLivreur({
            id: commission.id,
            km: numKm,
            prix: numPrix,
            description: description.trim(),
        });
        setIsSubmitting(false);

        if (success) {
            onSuccess();
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
            <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-md">
                            <FaPen className="text-lg" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold">Modifier le Barème Livreur</h2>
                            <p className="text-xs text-emerald-100">Mettre à jour le palier #{commission.id} ({commission.km} km)</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full hover:bg-white/20 transition-colors text-white"
                    >
                        <MdClose className="text-2xl" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Distance KM */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                                Distance Palier (km) *
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-emerald-600">
                                    <FaRoute />
                                </div>
                                <input
                                    type="number"
                                    step="any"
                                    min="0"
                                    value={km}
                                    onChange={(e) => setKm(e.target.value)}
                                    required
                                    className="w-full pl-9 pr-12 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-zinc-100"
                                />
                                <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">
                                    KM
                                </span>
                            </div>
                        </div>

                        {/* Tarif DA */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                                Tarif Livraison (DA) *
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-amber-500">
                                    <FaCoins />
                                </div>
                                <input
                                    type="number"
                                    step="any"
                                    min="0"
                                    value={prix}
                                    onChange={(e) => setPrix(e.target.value)}
                                    required
                                    className="w-full pl-9 pr-12 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                />
                                <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">
                                    DA
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                            Description / Zone
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            placeholder="Description du palier..."
                            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-zinc-100"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-zinc-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50"
                        >
                            <FaPen className="text-xs" />
                            <span>{isSubmitting ? "Enregistrement..." : "Enregistrer les modifications"}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
