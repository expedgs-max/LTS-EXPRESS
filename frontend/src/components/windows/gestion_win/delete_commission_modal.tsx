"use client";

import React, { useState } from "react";
import { MdClose } from "react-icons/md";
import { FaTrash, FaExclamationTriangle } from "react-icons/fa";
import { deleteCommissionVTC } from "@/lib/commission_vtc_action";

type Props = {
    commission: CommissionVTC;
    onClose: () => void;
    onSuccess: () => void;
};

export default function DeleteCommissionModal({ commission, onClose, onSuccess }: Props) {
    const [isDeleting, setIsDeleting] = useState<boolean>(false);

    const handleDelete = async () => {
        setIsDeleting(true);
        const success = await deleteCommissionVTC(commission.id);
        setIsDeleting(false);
        if (success) {
            onSuccess();
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
            <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 bg-red-600 text-white">
                    <div className="flex items-center gap-2">
                        <FaExclamationTriangle className="text-xl text-yellow-300" />
                        <h2 className="text-lg font-bold">Confirmer la suppression</h2>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-white/20">
                        <MdClose className="text-2xl" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <p className="text-sm text-slate-600 dark:text-zinc-300">
                        Êtes-vous sûr de vouloir supprimer la tarification pour la wilaya{" "}
                        <span className="font-bold text-slate-900 dark:text-white">
                            {commission.wilaya} ({commission.type_course})
                        </span>{" "}
                        ?
                    </p>

                    <div className="p-3 bg-red-50 dark:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300">
                        ⚠️ Cette action est irréversible. Les futures courses dans cette zone ne pourront plus utiliser cette règle de calcul de prix.
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            type="button"
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-500 active:scale-95 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-lg shadow-red-600/30 transition-all"
                        >
                            <FaTrash />
                            {isDeleting ? "Suppression..." : "Supprimer définitivement"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
