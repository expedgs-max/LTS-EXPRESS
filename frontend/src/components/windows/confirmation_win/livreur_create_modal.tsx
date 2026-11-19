"use client";

import React, { useState } from "react";
import {
    FaUserPlus,
    FaTimes,
    FaMotorcycle,
    FaEnvelope,
    FaLock,
    FaUser,
    FaMapMarkerAlt,
    FaPhoneAlt,
    FaSpinner,
    FaCheck
} from "react-icons/fa";
import { Wilaya } from "@/lib/tools/named";
import { createConfirmationLivreur } from "@/lib/confirmation_action";
import toast from "react-hot-toast";

interface LivreurCreateModalProps {
    onClose: () => void;
    onCreated: () => void;
    initialWilaya?: string;
}

export default function LivreurCreateModal({
    onClose,
    onCreated,
    initialWilaya = ""
}: LivreurCreateModalProps) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [wilaya, setWilaya] = useState(initialWilaya || "Tlemcen");
    const [phone, setPhone] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Dynamic preview of auto-generated email
    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "") || "livreur";
    const previewEmail = `${cleanUsername}XXXX@ltc.dz`;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!username.trim()) {
            toast.error("Le nom d'utilisateur est requis");
            return;
        }
        if (!password.trim()) {
            toast.error("Le mot de passe est requis");
            return;
        }
        if (password.length < 4) {
            toast.error("Le mot de passe doit comporter au moins 4 caractères");
            return;
        }
        if (!wilaya) {
            toast.error("La wilaya est requise");
            return;
        }

        setIsSubmitting(true);
        const res = await createConfirmationLivreur({
            username: username.trim(),
            password: password.trim(),
            wilaya: wilaya.trim(),
            phone: phone.trim()
        });
        setIsSubmitting(false);

        if (res.success) {
            onCreated();
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col transition-colors">
                {/* Header */}
                <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-6 relative">
                    <button
                        onClick={onClose}
                        className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                        title="Fermer"
                    >
                        <FaTimes />
                    </button>

                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-400/30 flex items-center justify-center text-blue-400 text-xl shadow-inner">
                            <FaUserPlus />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Création Rapide de Livreur</h2>
                            <p className="text-xs text-slate-300">
                                Création simplifiée avec véhicule Moto et email automatique
                            </p>
                        </div>
                    </div>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Username */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                            Nom d&apos;utilisateur (Username) *
                        </label>
                        <div className="relative">
                            <FaUser className="absolute left-3.5 top-3.5 text-slate-400 text-sm" />
                            <input
                                type="text"
                                placeholder="ex: amine_tlemcen"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                                required
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                            Mot de passe *
                        </label>
                        <div className="relative">
                            <FaLock className="absolute left-3.5 top-3.5 text-slate-400 text-sm" />
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                    </div>

                    {/* Wilaya Selector */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                            Wilaya *
                        </label>
                        <div className="relative">
                            <FaMapMarkerAlt className="absolute left-3.5 top-3.5 text-slate-400 text-sm" />
                            <select
                                value={wilaya}
                                onChange={(e) => setWilaya(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            >
                                <option value="">Sélectionner une wilaya</option>
                                {Wilaya.map((w) => (
                                    <option key={w.code} value={w.name}>
                                        {String(w.code).padStart(2, "0")} - {w.name} ({w.ar_name})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Phone (Optional) */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                            Numéro de Téléphone (Optionnel)
                        </label>
                        <div className="relative">
                            <FaPhoneAlt className="absolute left-3.5 top-3.5 text-slate-400 text-sm" />
                            <input
                                type="tel"
                                placeholder="ex: 0670000000"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* Automatic Config Information Box */}
                    <div className="bg-blue-50 dark:bg-blue-950/40 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/50 space-y-2">
                        <div className="flex items-center gap-2 text-xs font-semibold text-blue-900 dark:text-blue-200">
                            <FaMotorcycle className="text-base text-blue-600" />
                            <span>
                                Type de véhicule : <strong>Moto</strong> (Configuré automatiquement)
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-semibold text-blue-900 dark:text-blue-200">
                            <FaEnvelope className="text-base text-blue-600" />
                            <span>
                                Email généré : <strong>{previewEmail}</strong>
                            </span>
                        </div>
                    </div>

                    <p className="text-[11px] text-slate-400 italic">
                        💡 Vous pourrez compléter le profil, le registre de commerce (RC), le NIF et les détails du véhicule à tout moment depuis la liste des livreurs.
                    </p>

                    {/* Action Buttons */}
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
                            {isSubmitting ? <FaSpinner className="animate-spin" /> : <FaCheck />}
                            Créer le Livreur
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
