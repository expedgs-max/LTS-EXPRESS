"use client";

import React, { useState } from "react";
import { MdClose } from "react-icons/md";
import { FaTrash, FaExclamationTriangle } from "react-icons/fa";
import { deleteCommissionLivreur } from "@/lib/commission_livreur_action";

type Props = {
    commission: CommissionLivreur;
    onClose: () => void;
    onSuccess: () => void;
};

export default function DeleteCommissionLivreurModal({ commission, onClose, onSuccess }: Props) {
    const [isDeleting, setIsDeleting] = useState<boolean>(false);

    const handleDelete = async () => {
        setIsDeleting(true);
        const success = await deleteCommissionLivreur(commission.id);
        setIsDeleting(false);

        if (success) {
            onSuccess();
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
            <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-red-600 to-rose-600 text-white">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-md">
                            <FaTrash className="text-lg" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold">Supprimer le Barème</h2>
                            <p className="text-xs text-rose-100">Confirmation de suppression</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full hover:bg-white/20 transition-colors text-white"
                    >
                        <MdClose className="text-2xl" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                    <div className="flex items-start gap-3 p-3.5 bg-rose-50 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300">
                        <FaExclamationTriangle className="text-xl shrink-0 mt-0.5" />
                        <div className="text-xs">
                            Êtes-vous sûr de vouloir supprimer ce palier de livraison ? Cette action est irréversible.
                        </div>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-zinc-800/60 rounded-xl border border-slate-200 dark:border-zinc-700 space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-slate-500 dark:text-zinc-400">Distance palier :</span>
                            <span className="font-bold text-slate-800 dark:text-zinc-100">{commission.km} km</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500 dark:text-zinc-400">Tarif appliqué :</span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">{commission.prix} DA</span>
                        </div>
                        {commission.description && (
                            <div className="flex flex-col pt-1 border-t border-slate-200 dark:border-zinc-700">
                                <span className="text-slate-500 dark:text-zinc-400 text-xs">Description :</span>
                                <span className="text-slate-700 dark:text-zinc-300 text-xs font-medium italic mt-0.5">{commission.description}</span>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            type="button"
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-lg shadow-red-600/30 transition-all disabled:opacity-50"
                        >
                            <FaTrash className="text-xs" />
                            <span>{isDeleting ? "Suppression..." : "Confirmer la suppression"}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
