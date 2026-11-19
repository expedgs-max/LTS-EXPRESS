"use client";

import React, { useState } from "react";
import {
    FaTimes,
    FaPaperPlane,
    FaSpinner,
    FaBell,
    FaUser,
    FaPhoneAlt
} from "react-icons/fa";
import { CentreAppelCompte, sendNotificationToUser } from "@/lib/call_action";
import toast from "react-hot-toast";

interface SendNotificationModalProps {
    account: CentreAppelCompte;
    onClose: () => void;
    onSent?: () => void;
}

export default function SendNotificationModal({
    account,
    onClose,
    onSent
}: SendNotificationModalProps) {
    const [title, setTitle] = useState("Message du Centre d'Appel");
    const [message, setMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!message.trim()) {
            toast.error("Veuillez saisir un message de notification");
            return;
        }

        setIsSubmitting(true);
        const success = await sendNotificationToUser(account.id, title.trim(), message.trim());
        setIsSubmitting(false);

        if (success) {
            if (onSent) onSent();
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col transition-colors">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white p-6 relative">
                    <button
                        onClick={onClose}
                        className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                        title="Fermer"
                    >
                        <FaTimes />
                    </button>

                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white text-xl shadow-inner">
                            <FaBell />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Envoyer une Notification</h2>
                            <p className="text-xs text-blue-100">
                                Diffusion directe en temps réel et enregistrement
                            </p>
                        </div>
                    </div>
                </div>

                {/* Recipient info pill */}
                <div className="bg-slate-50 dark:bg-slate-950 p-4 mx-6 mt-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-600/10 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm">
                            <FaUser />
                        </div>
                        <div>
                            <p className="font-bold text-sm text-slate-900 dark:text-white">
                                {account.first_name || ""} {account.last_name || account.username}
                            </p>
                            <p className="text-xs text-slate-400">
                                @{account.username} • {account.type_label}
                            </p>
                        </div>
                    </div>

                    {account.phone && (
                        <span className="text-xs font-semibold px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                            <FaPhoneAlt className="text-[10px] text-emerald-500" />
                            {account.phone}
                        </span>
                    )}
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                            Titre de la notification *
                        </label>
                        <input
                            type="text"
                            placeholder="ex: Rappel important, Information..."
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                            Message / Contenu *
                        </label>
                        <textarea
                            rows={4}
                            placeholder="Rédigez le message à envoyer à cet utilisateur..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            required
                        />
                    </div>

                    {/* Action buttons */}
                    <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-xl transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2"
                        >
                            {isSubmitting ? <FaSpinner className="animate-spin" /> : <FaPaperPlane />}
                            Envoyer la Notification
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
