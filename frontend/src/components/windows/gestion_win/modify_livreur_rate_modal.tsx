"use client";

import React, { useState } from "react";
import { MdClose } from "react-icons/md";
import { FaPercentage, FaSave, FaInfoCircle, FaMotorcycle } from "react-icons/fa";
import { updateLivreurCommissionRate } from "@/lib/commission_livreur_action";

type Props = {
    rate: LivreurCommissionRate;
    onClose: () => void;
    onSuccess: (newRate?: number, newDesc?: string) => void;
};

export default function ModifyLivreurRateModal({ rate, onClose, onSuccess }: Props) {
    const [taxRate, setTaxRate] = useState<string>(String(rate.tax_tawsile ?? 10));
    const [description, setDescription] = useState<string>(rate.description || "");
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const numRate = parseInt(taxRate, 10);
        if (isNaN(numRate) || numRate < 0 || numRate > 100) {
            alert("Le taux de commission doit être un pourcentage entre 0 et 100 %.");
            return;
        }

        setIsSubmitting(true);
        const success = await updateLivreurCommissionRate(numRate, description.trim());
        setIsSubmitting(false);

        if (success) {
            onSuccess(numRate, description.trim());
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
                            <FaPercentage className="text-xl" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold">Commission Plateforme Livreur</h2>
                            <p className="text-xs text-emerald-100">Prélèvement de la plateforme sur chaque livraison terminée</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-white/20 text-white">
                        <MdClose className="text-2xl" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2.5">
                        <FaInfoCircle className="text-base shrink-0 mt-0.5" />
                        <div>
                            Ce pourcentage est appliqué pour calculer la part de taxe revenant à l'entreprise (<code className="font-mono font-bold">tax_tawsile</code>) sur les courses ou revenus du livreur.
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                            Pourcentage de commission plateforme (%) *
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                min="0"
                                max="100"
                                step="1"
                                value={taxRate}
                                onChange={(e) => setTaxRate(e.target.value)}
                                required
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl text-lg font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                            />
                            <div className="absolute right-4 top-3 text-slate-400 font-bold text-lg">
                                %
                            </div>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
                            Exemple : 10% signifie que pour une livraison de 300 DA, la commission sera de 30 DA.
                        </p>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                            Description / Intitulé
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={2}
                            placeholder="Ex: Commission standard livreur partenaire"
                            className="w-full px-3 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-zinc-100"
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
                            <FaSave />
                            <span>{isSubmitting ? "Enregistrement..." : "Enregistrer"}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
