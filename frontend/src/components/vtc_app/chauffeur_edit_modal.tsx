"use client";

import { getImageUrl } from "@/lib/tools/tools";

import React, { useState } from "react";
import Image from "next/image";
import {
    FaTimes,
    FaUserEdit,
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
    FaCamera,
    FaTrash,
    FaSave,
    FaShieldAlt
} from "react-icons/fa";
import { VtcChauffeur, updateVtcChauffeur } from "@/lib/chauffeur_action";
import { Wilaya } from "@/lib/tools/named";
import toast from "react-hot-toast";

interface ChauffeurEditModalProps {
    chauffeur: VtcChauffeur;
    onClose: () => void;
    onUpdated: () => void;
}

export default function ChauffeurEditModal({
    chauffeur,
    onClose,
    onUpdated
}: ChauffeurEditModalProps) {
    const [tab, setTab] = useState<"compte" | "vehicule" | "documents">("compte");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Profile photo
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(
        chauffeur.image_url ? getImageUrl(chauffeur.image_url) : null
    );

    // Personal & Account Info
    const [firstName, setFirstName] = useState(chauffeur.first_name || "");
    const [lastName, setLastName] = useState(chauffeur.last_name || "");
    const [phone, setPhone] = useState(chauffeur.phone_number_1 || "");
    const [email, setEmail] = useState(chauffeur.email || "");
    const [wilaya, setWilaya] = useState(chauffeur.wilaya || "Alger");
    const [wilayaCode, setWilayaCode] = useState(chauffeur.wilaya_code || "16");
    const [password, setPassword] = useState("");

    // Vehicle
    const v = chauffeur.vehicule;
    const [typeVehicule, setTypeVehicule] = useState(v?.type_vehicule || "Classique");
    const [marque, setMarque] = useState(v?.marque || "");
    const [modele, setModele] = useState(v?.modele || "");
    const [matricule, setMatricule] = useState(v?.matricule || "");
    const [numAssurance, setNumAssurance] = useState(v?.num_assurance || "");
    const [numScanner, setNumScanner] = useState(v?.num_scanner || "");
    const [dateExpAssur, setDateExpAssur] = useState(v?.date_expiration_assurance || "");
    const [dateExpScan, setDateExpScan] = useState(v?.date_expiration_scanner || "");

    // Documents
    const docs = chauffeur.documents;
    const [cardNumber, setCardNumber] = useState(docs?.card_number || "");
    const [rc, setRc] = useState(docs?.RC || "");
    const [nif, setNif] = useState(docs?.Nif || "");
    const [numeroAct, setNumeroAct] = useState(docs?.numero_act || "");

    const handleWilayaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        setWilaya(val);
        const found = Wilaya.find((w) => w.name.toLowerCase() === val.toLowerCase());
        setWilayaCode(found ? String(found.id || found.code) : "");
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleRemoveImage = () => {
        setImageFile(null);
        setImagePreview(null);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const res = await updateVtcChauffeur({
            id: chauffeur.id,
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            phone_number_1: phone.trim(),
            email: email.trim(),
            wilaya: wilaya.trim(),
            wilaya_code: wilayaCode,
            password: password.trim() ? password.trim() : undefined,
            image: imageFile,
            type_vehicule: typeVehicule,
            marque: marque.trim(),
            modele: modele.trim(),
            matricule: matricule.trim(),
            num_assurance: numAssurance.trim(),
            num_scanner: numScanner.trim(),
            date_expiration_assurance: dateExpAssur,
            date_expiration_scanner: dateExpScan,
            card_number: cardNumber.trim(),
            RC: rc.trim(),
            Nif: nif.trim(),
            numero_act: numeroAct.trim()
        });

        setIsSubmitting(false);

        if (res.success) {
            onUpdated();
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-slate-900 w-full max-w-2xl max-h-[92vh] rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col transition-all">
                {/* Header */}
                <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-slate-900 text-white p-6 relative">
                    <button
                        onClick={onClose}
                        className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                        title="Fermer"
                    >
                        <FaTimes />
                    </button>

                    <div className="flex items-center gap-3 pr-12">
                        <div className="w-12 h-12 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center text-white text-2xl shadow-inner shrink-0">
                            <FaUserEdit />
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-xl sm:text-2xl font-bold truncate">Modifier le Chauffeur VTC</h2>
                            <p className="text-xs text-amber-100 truncate">
                                @{chauffeur.username} • {chauffeur.full_name || "Chauffeur"}
                            </p>
                        </div>
                    </div>

                    {/* Tabs */}
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
                            <FaUser /> Compte
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
                <form onSubmit={handleSave} className="p-6 overflow-y-auto flex-1 flex flex-col gap-5 text-slate-800 dark:text-slate-100">
                    {/* TAB 1: Compte & Profil */}
                    {tab === "compte" && (
                        <div className="space-y-4 animate-fadeIn">
                            {/* Photo de profil */}
                            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800">
                                <div className="relative w-16 h-16 rounded-2xl bg-slate-200 dark:bg-slate-700 overflow-hidden flex items-center justify-center text-slate-400">
                                    {imagePreview ? (
                                        <Image
                                            src={imagePreview}
                                            alt="Aperçu avatar"
                                            fill
                                            className="object-cover"
                                            unoptimized
                                        />
                                    ) : (
                                        <FaUser className="text-2xl" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Photo de profil</h4>
                                    <div className="flex items-center gap-2">
                                        <label className="cursor-pointer px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-sm">
                                            <FaCamera className="text-xs" />
                                            <span>Changer la photo</span>
                                            <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                                        </label>
                                        {imagePreview && (
                                            <button
                                                type="button"
                                                onClick={handleRemoveImage}
                                                className="p-1.5 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                                                title="Supprimer la photo"
                                            >
                                                <FaTrash className="text-xs" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1">
                                        Prénom
                                    </label>
                                    <input
                                        type="text"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        placeholder="Prénom"
                                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-amber-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1">
                                        Nom
                                    </label>
                                    <input
                                        type="text"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        placeholder="Nom"
                                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-amber-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1">
                                        Téléphone
                                    </label>
                                    <div className="relative">
                                        <FaPhoneAlt className="absolute left-3.5 top-3.5 text-slate-400 text-sm" />
                                        <input
                                            type="tel"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            placeholder="Numéro de téléphone"
                                            className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-amber-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1">
                                        Email
                                    </label>
                                    <div className="relative">
                                        <FaEnvelope className="absolute left-3.5 top-3.5 text-slate-400 text-sm" />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="Email"
                                            className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-amber-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1">
                                        Wilaya
                                    </label>
                                    <div className="relative">
                                        <FaMapMarkerAlt className="absolute left-3.5 top-3.5 text-slate-400 text-sm" />
                                        <select
                                            value={wilaya}
                                            onChange={handleWilayaChange}
                                            className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-amber-500"
                                        >
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
                                        Nouveau mot de passe (laisser vide si inchangé)
                                    </label>
                                    <div className="relative">
                                        <FaLock className="absolute left-3.5 top-3.5 text-slate-400 text-sm" />
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-amber-500"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 2: Véhicule VTC */}
                    {tab === "vehicule" && (
                        <div className="space-y-4 animate-fadeIn">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1">
                                        Type de Véhicule VTC
                                    </label>
                                    <select
                                        value={typeVehicule}
                                        onChange={(e) => setTypeVehicule(e.target.value)}
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
                                        Marque
                                    </label>
                                    <input
                                        type="text"
                                        value={marque}
                                        onChange={(e) => setMarque(e.target.value)}
                                        placeholder="ex: Peugeot, Renault"
                                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-amber-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1">
                                        Modèle
                                    </label>
                                    <input
                                        type="text"
                                        value={modele}
                                        onChange={(e) => setModele(e.target.value)}
                                        placeholder="ex: 301, Symbol, Accent"
                                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-amber-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1">
                                        Matricule
                                    </label>
                                    <input
                                        type="text"
                                        value={matricule}
                                        onChange={(e) => setMatricule(e.target.value)}
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
                                            value={numAssurance}
                                            onChange={(e) => setNumAssurance(e.target.value)}
                                            placeholder="Numéro police assurance"
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
                                            value={dateExpAssur}
                                            onChange={(e) => setDateExpAssur(e.target.value)}
                                            className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-amber-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1">
                                        N° Scanner / Contrôle Technique
                                    </label>
                                    <input
                                        type="text"
                                        value={numScanner}
                                        onChange={(e) => setNumScanner(e.target.value)}
                                        placeholder="Numéro scanner"
                                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-amber-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1">
                                        Expiration Scanner
                                    </label>
                                    <div className="relative">
                                        <FaCalendarAlt className="absolute left-3.5 top-3.5 text-slate-400 text-sm" />
                                        <input
                                            type="date"
                                            value={dateExpScan}
                                            onChange={(e) => setDateExpScan(e.target.value)}
                                            className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-amber-500"
                                        />
                                    </div>
                                </div>
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
                                            value={cardNumber}
                                            onChange={(e) => setCardNumber(e.target.value)}
                                            placeholder="N° CCP / Banque"
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
                                        value={numeroAct}
                                        onChange={(e) => setNumeroAct(e.target.value)}
                                        placeholder="Numéro d'acte"
                                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-amber-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1">
                                        Registre du Commerce (RC)
                                    </label>
                                    <input
                                        type="text"
                                        value={rc}
                                        onChange={(e) => setRc(e.target.value)}
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
                                        value={nif}
                                        onChange={(e) => setNif(e.target.value)}
                                        placeholder="Numéro NIF"
                                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-amber-500"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Footer buttons */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 mt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs sm:text-sm transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <>
                                    <FaSpinner className="animate-spin" /> Enregistrement...
                                </>
                            ) : (
                                <>
                                    <FaSave /> Enregistrer les modifications
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
