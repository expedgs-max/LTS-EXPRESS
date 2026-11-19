"use client";

import React, { useState } from "react";
import {
    FaTimes,
    FaCar,
    FaUser,
    FaLock,
    FaPhoneAlt,
    FaMapMarkerAlt,
    FaEnvelope,
    FaIdCard,
    FaFileAlt,
    FaCalendarAlt,
    FaSpinner,
    FaShieldAlt,
    FaTaxi
} from "react-icons/fa";
import { Wilaya } from "@/lib/tools/named";
import { createVtcChauffeur, CreateVtcChauffeurPayload } from "@/lib/chauffeur_action";
import toast from "react-hot-toast";

interface ChauffeurCreateModalProps {
    onClose: () => void;
    onCreated: () => void;
    initialWilaya?: string;
}

export default function ChauffeurCreateModal({
    onClose,
    onCreated,
    initialWilaya = ""
}: ChauffeurCreateModalProps) {
    const [tab, setTab] = useState<"compte" | "vehicule" | "documents">("compte");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form states
    const [formData, setFormData] = useState<CreateVtcChauffeurPayload>({
        username: "",
        password: "",
        pass: "",
        first_name: "",
        last_name: "",
        phone_number_1: "",
        phone_number_2: "",
        email: "",
        wilaya: initialWilaya || "Alger",
        wilaya_code: "16",
        // Véhicule
        type_vehicule: "Classique",
        marque: "",
        modele: "",
        matricule: "",
        num_assurance: "",
        num_scanner: "",
        date_expiration_assurance: "",
        date_expiration_scanner: "",
        // Documents
        card_number: "",
        RC: "",
        Nif: "",
        numero_act: ""
    });

    const handleWilayaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        const found = Wilaya.find((w) => w.name.toLowerCase() === val.toLowerCase());
        setFormData((prev) => ({
            ...prev,
            wilaya: val,
            wilaya_code: found ? String(found.id || found.code) : ""
        }));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Basic validations
        if (!formData.username.trim() || formData.username.trim().length < 3) {
            toast.error("Le nom d'utilisateur doit comporter au moins 3 caractères");
            setTab("compte");
            return;
        }

        if (!formData.password || formData.password.length < 6) {
            toast.error("Le mot de passe doit comporter au moins 6 caractères");
            setTab("compte");
            return;
        }

        if (formData.pass && formData.pass !== formData.password) {
            toast.error("Les mots de passe ne correspondent pas");
            setTab("compte");
            return;
        }

        if (!formData.phone_number_1.trim()) {
            toast.error("Le numéro de téléphone est obligatoire");
            setTab("compte");
            return;
        }

        if (!formData.wilaya) {
            toast.error("Veuillez sélectionner une wilaya");
            setTab("compte");
            return;
        }

        setIsSubmitting(true);

        // Format phone: remove leading zero
        const cleanPhone = formData.phone_number_1.replace(/^0+/, "");
        const formattedPhone = cleanPhone.startsWith("+213") ? cleanPhone : `+213${cleanPhone}`;

        const payload: CreateVtcChauffeurPayload = {
            ...formData,
            phone_number_1: formattedPhone,
            email: formData.email?.trim() || `${formData.username.trim().toLowerCase()}@vtc.dz`
        };

        const res = await createVtcChauffeur(payload);
        setIsSubmitting(false);

        if (res.success) {
            onCreated();
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-slate-900 w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col transition-all">
                {/* Header */}
                <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-slate-900 text-white p-6 relative">
                    <button
                        onClick={onClose}
                        className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                        title="Fermer"
                    >
                        <FaTimes />
                    </button>

                    <div className="flex items-center gap-3 pr-12">
                        <div className="w-12 h-12 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center text-white text-2xl shadow-inner shrink-0">
                            <FaTaxi />
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-xl sm:text-2xl font-bold truncate">Nouveau Compte Chauffeur VTC</h2>
                            <p className="text-xs text-amber-100 truncate">
                                Enregistrement d&apos;un chauffeur, de son véhicule et de ses documents
                            </p>
                        </div>
                    </div>

                    {/* Tabs Navigation */}
                    <div className="flex items-center gap-2 mt-5 border-b border-white/20 pb-1">
                        <button
                            type="button"
                            onClick={() => setTab("compte")}
                            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all ${
                                tab === "compte"
                                    ? "bg-white text-slate-900 shadow-md"
                                    : "text-white/80 hover:text-white hover:bg-white/10"
                            }`}
                        >
                            <FaUser /> Compte Chauffeur
                        </button>
                        <button
                            type="button"
                            onClick={() => setTab("vehicule")}
                            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all ${
                                tab === "vehicule"
                                    ? "bg-white text-slate-900 shadow-md"
                                    : "text-white/80 hover:text-white hover:bg-white/10"
                            }`}
                        >
                            <FaCar /> Véhicule VTC
                        </button>
                        <button
                            type="button"
                            onClick={() => setTab("documents")}
                            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all ${
                                tab === "documents"
                                    ? "bg-white text-slate-900 shadow-md"
                                    : "text-white/80 hover:text-white hover:bg-white/10"
                            }`}
                        >
                            <FaFileAlt /> Documents
                        </button>
                    </div>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 flex flex-col gap-4 text-slate-800 dark:text-slate-100">
                    {/* TAB 1: Compte Chauffeur */}
                    {tab === "compte" && (
                        <div className="space-y-4 animate-fadeIn">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1">
                                        Nom d&apos;utilisateur <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <FaUser className="absolute left-3.5 top-3.5 text-slate-400 text-sm" />
                                        <input
                                            type="text"
                                            name="username"
                                            value={formData.username}
                                            onChange={handleChange}
                                            placeholder="ex: chauffeur_karim"
                                            className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-amber-500"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1">
                                        Wilaya <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <FaMapMarkerAlt className="absolute left-3.5 top-3.5 text-slate-400 text-sm" />
                                        <select
                                            value={formData.wilaya}
                                            onChange={handleWilayaChange}
                                            className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-amber-500"
                                            required
                                        >
                                            <option value="">Choisir une wilaya</option>
                                            {Wilaya.map((w) => (
                                                <option key={w.id} value={w.name}>
                                                    {w.id} - {w.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1">
                                        Prénom
                                    </label>
                                    <input
                                        type="text"
                                        name="first_name"
                                        value={formData.first_name}
                                        onChange={handleChange}
                                        placeholder="ex: Karim"
                                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-amber-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1">
                                        Nom
                                    </label>
                                    <input
                                        type="text"
                                        name="last_name"
                                        value={formData.last_name}
                                        onChange={handleChange}
                                        placeholder="ex: Mansouri"
                                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-amber-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1">
                                        Téléphone principal <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <FaPhoneAlt className="absolute left-3.5 top-3.5 text-slate-400 text-sm" />
                                        <input
                                            type="tel"
                                            name="phone_number_1"
                                            value={formData.phone_number_1}
                                            onChange={handleChange}
                                            placeholder="ex: 0550123456"
                                            className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-amber-500"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1">
                                        Email (optionnel)
                                    </label>
                                    <div className="relative">
                                        <FaEnvelope className="absolute left-3.5 top-3.5 text-slate-400 text-sm" />
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            placeholder="ex: chauffeur@email.com"
                                            className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-amber-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1">
                                        Mot de passe <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <FaLock className="absolute left-3.5 top-3.5 text-slate-400 text-sm" />
                                        <input
                                            type="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            placeholder="Min 6 caractères"
                                            className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-amber-500"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1">
                                        Confirmer le mot de passe <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <FaLock className="absolute left-3.5 top-3.5 text-slate-400 text-sm" />
                                        <input
                                            type="password"
                                            name="pass"
                                            value={formData.pass}
                                            onChange={handleChange}
                                            placeholder="Répéter le mot de passe"
                                            className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-amber-500"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end pt-2">
                                <button
                                    type="button"
                                    onClick={() => setTab("vehicule")}
                                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm transition-colors flex items-center gap-2"
                                >
                                    Suivant : Véhicule &rarr;
                                </button>
                            </div>
                        </div>
                    )}

                    {/* TAB 2: Véhicule VTC */}
                    {tab === "vehicule" && (
                        <div className="space-y-4 animate-fadeIn">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1">
                                        Type de Véhicule VTC <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        name="type_vehicule"
                                        value={formData.type_vehicule}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                                    >
                                        <option value="Classique">🚗 Classique (Standard)</option>
                                        <option value="Comfort">✨ Comfort (Berline récente)</option>
                                        <option value="Black">🖤 Black (Luxe / VIP)</option>
                                        <option value="XXL">🚐 XXL (7 places & Minivan)</option>
                                        <option value="Moto">🏍️ Moto (Transport rapide)</option>
                                        <option value="Utilitaire">📦 Utilitaire</option>
                                        <option value="Harim">🌸 Harim (Chauffeur Femme)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1">
                                        Marque du véhicule
                                    </label>
                                    <input
                                        type="text"
                                        name="marque"
                                        value={formData.marque}
                                        onChange={handleChange}
                                        placeholder="ex: Peugeot, Renault, Hyundai"
                                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-amber-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1">
                                        Modèle
                                    </label>
                                    <input
                                        type="text"
                                        name="modele"
                                        value={formData.modele}
                                        onChange={handleChange}
                                        placeholder="ex: 301, Symbol, Accent"
                                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-amber-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1">
                                        Matricule (Immatriculation)
                                    </label>
                                    <input
                                        type="text"
                                        name="matricule"
                                        value={formData.matricule}
                                        onChange={handleChange}
                                        placeholder="ex: 01234-116-16"
                                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1">
                                        Numéro d&apos;assurance
                                    </label>
                                    <div className="relative">
                                        <FaShieldAlt className="absolute left-3.5 top-3.5 text-slate-400 text-sm" />
                                        <input
                                            type="text"
                                            name="num_assurance"
                                            value={formData.num_assurance}
                                            onChange={handleChange}
                                            placeholder="ex: ASSUR-2026-99"
                                            className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-amber-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1">
                                        Expiration Assurance
                                    </label>
                                    <div className="relative">
                                        <FaCalendarAlt className="absolute left-3.5 top-3.5 text-slate-400 text-sm" />
                                        <input
                                            type="date"
                                            name="date_expiration_assurance"
                                            value={formData.date_expiration_assurance}
                                            onChange={handleChange}
                                            className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-amber-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1">
                                        Expiration Contrôle Technique (Scanner)
                                    </label>
                                    <div className="relative">
                                        <FaCalendarAlt className="absolute left-3.5 top-3.5 text-slate-400 text-sm" />
                                        <input
                                            type="date"
                                            name="date_expiration_scanner"
                                            value={formData.date_expiration_scanner}
                                            onChange={handleChange}
                                            className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-amber-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-between pt-2">
                                <button
                                    type="button"
                                    onClick={() => setTab("compte")}
                                    className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm transition-colors"
                                >
                                    &larr; Précédent
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setTab("documents")}
                                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm transition-colors flex items-center gap-2"
                                >
                                    Suivant : Documents &rarr;
                                </button>
                            </div>
                        </div>
                    )}

                    {/* TAB 3: Documents Administratifs */}
                    {tab === "documents" && (
                        <div className="space-y-4 animate-fadeIn">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1">
                                        N° Carte Bancaire / CCP
                                    </label>
                                    <div className="relative">
                                        <FaIdCard className="absolute left-3.5 top-3.5 text-slate-400 text-sm" />
                                        <input
                                            type="text"
                                            name="card_number"
                                            value={formData.card_number}
                                            onChange={handleChange}
                                            placeholder="ex: 000799999000000000"
                                            className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1">
                                        Numéro d&apos;acte / Décision
                                    </label>
                                    <input
                                        type="text"
                                        name="numero_act"
                                        value={formData.numero_act}
                                        onChange={handleChange}
                                        placeholder="ex: ACT-2026-VTC-01"
                                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-amber-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1">
                                        Registre du Commerce (RC)
                                    </label>
                                    <input
                                        type="text"
                                        name="RC"
                                        value={formData.RC}
                                        onChange={handleChange}
                                        placeholder="Numéro RC"
                                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-amber-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1">
                                        NIF (Identifiant Fiscal)
                                    </label>
                                    <input
                                        type="text"
                                        name="Nif"
                                        value={formData.Nif}
                                        onChange={handleChange}
                                        placeholder="Numéro NIF"
                                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-amber-500"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setTab("vehicule")}
                                    className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm transition-colors"
                                >
                                    &larr; Précédent
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <FaSpinner className="animate-spin" /> Enregistrement...
                                        </>
                                    ) : (
                                        <>
                                            <FaCar /> Créer le Compte Chauffeur
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}
