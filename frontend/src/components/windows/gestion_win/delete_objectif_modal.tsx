"use client";

import React, { useState } from "react";
import { MdClose } from "react-icons/md";
import { FaTrash, FaExclamationTriangle } from "react-icons/fa";
import { deleteObjectif, Objectif } from "@/lib/objectifs_action";

type Props = {
    objectif: Objectif;
    onClose: () => void;
    onSuccess: () => void;
};

export default function DeleteObjectifModal({ objectif, onClose, onSuccess }: Props) {
    const [isDeleting, setIsDeleting] = useState<boolean>(false);

    const handleDelete = async () => {
        setIsDeleting(true);
        const success = await deleteObjectif(objectif.id);
        setIsDeleting(false);

        if (success) {
            onSuccess();
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
            <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 bg-red-600 text-white">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-md">
                            <FaTrash className="text-lg" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold">Supprimer l&apos;Objectif</h2>
                            <p className="text-xs text-red-100">Confirmation irréversible</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                    >
                        <MdClose className="text-2xl" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    <div className="flex items-start gap-3.5 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-amber-800 dark:text-amber-300 text-xs leading-relaxed">
                        <FaExclamationTriangle className="text-xl shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                        <div>
                            <span className="font-bold block mb-1">Attention</span>
                            Êtes-vous sûr de vouloir supprimer définitivement cet objectif ? Cette action supprimera également les données de suivi associées.
                        </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-800 space-y-2 text-xs">
                        <div className="flex justify-between">
                            <span className="text-slate-500 dark:text-zinc-400 font-medium">Titre :</span>
                            <span className="font-bold text-slate-800 dark:text-zinc-100 text-right max-w-[200px] truncate">{objectif.titre}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500 dark:text-zinc-400 font-medium">Public Cible :</span>
                            <span className="font-bold text-slate-800 dark:text-zinc-200">{objectif.cible_label}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500 dark:text-zinc-400 font-medium">Prime :</span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">{objectif.prime_montant} DA</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500 dark:text-zinc-400 font-medium">Participants engagés :</span>
                            <span className="font-bold text-slate-800 dark:text-zinc-200">{objectif.participants_count}</span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 font-semibold text-sm hover:bg-slate-100 dark:hover:bg-zinc-800 transition"
                        >
                            Annuler
                        </button>
                        <button
                            type="button"
                            disabled={isDeleting}
                            onClick={handleDelete}
                            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-lg shadow-red-600/30 transition-all disabled:opacity-50"
                        >
                            <FaTrash className="text-xs" />
                            {isDeleting ? "Suppression..." : "Supprimer définitivement"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
