"use client";

import { getImageUrl } from "@/lib/tools/tools";

import React, { useState } from "react";
import Image from "next/image";
import {
    FaTimes,
    FaUserEdit,
    FaIdCard,
    FaMotorcycle,
    FaSave,
    FaSpinner,
    FaStore,
    FaLock,
    FaEye,
    FaEyeSlash,
    FaCheckCircle,
    FaTimesCircle,
    FaCamera,
    FaTrash,
    FaUser
} from "react-icons/fa";
import { ConfirmationLivreur, updateConfirmationLivreurProfile } from "@/lib/confirmation_action";
import { Wilaya } from "@/lib/tools/named";

interface LivreurProfileModalProps {
    livreur: ConfirmationLivreur;
    onClose: () => void;
    onUpdated: () => void;
}

export default function LivreurProfileModal({
    livreur,
    onClose,
    onUpdated
}: LivreurProfileModalProps) {
    const [activeTab, setActiveTab] = useState<"general" | "documents" | "vehicule">("general");

    // Profile Photo State
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(
        livreur.user?.image_url ? getImageUrl(livreur.user.image_url) : null
    );

    // Personal & Account Info
    const [firstName, setFirstName] = useState(livreur.user?.first_name || "");
    const [lastName, setLastName] = useState(livreur.user?.last_name || "");
    const [phone, setPhone] = useState(livreur.user?.phone || "");
    const [email, setEmail] = useState(livreur.user?.email || "");
    const [wilaya, setWilaya] = useState(livreur.wilaya || "Tlemcen");
    const [newPassword, setNewPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    // Commercial & Administrative Documents
    const [rc, setRc] = useState(livreur.RC || "");
    const [nif, setNif] = useState(livreur.Nif || "");
    const [numeroAct, setNumeroAct] = useState(livreur.numero_act || "");
    const [cardNumber, setCardNumber] = useState(livreur.card_number || "");

    // Vehicle Details
    const [typeVehicule, setTypeVehicule] = useState(livreur.vehicule?.type_vehicule || "Moto");
    const [marque, setMarque] = useState(livreur.vehicule?.marque || "");
    const [modele, setModele] = useState(livreur.vehicule?.modele || "");
    const [matricule, setMatricule] = useState(livreur.vehicule?.matricule || "");
    const [numAssurance, setNumAssurance] = useState(livreur.vehicule?.num_assurance || "");

    // Store assignment
    const [magasinName] = useState(livreur.magasin?.name || livreur.magasin_name || "");

    const [isSubmitting, setIsSubmitting] = useState(false);

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

        const res = await updateConfirmationLivreurProfile({
            livreur_id: livreur.id,
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            phone: phone.trim(),
            email: email.trim(),
            image: imageFile,
            password: newPassword.trim() ? newPassword.trim() : undefined,
            wilaya: wilaya.trim(),
            RC: rc.trim(),
            Nif: nif.trim(),
            numero_act: numeroAct.trim(),
            card_number: cardNumber.trim(),
            type_vehicule: typeVehicule.trim(),
            marque: marque.trim(),
            modele: modele.trim(),
            matricule: matricule.trim(),
            num_assurance: numAssurance.trim()
        });

        setIsSubmitting(false);

        if (res.success) {
            if (res.image_url && livreur.user) {
                livreur.user.image_url = res.image_url;
            }
            onUpdated();
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] transition-colors">
                {/* Header */}
                <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-6 relative">
                    <button
                        onClick={onClose}
                        className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                        title="Fermer"
                    >
                        <FaTimes />
                    </button>

                    <div className="flex items-center gap-4">
                        <div className="relative w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center font-extrabold text-xl text-white shadow-lg shadow-blue-600/30 shrink-0 overflow-hidden border-2 border-white/20">
                            {imagePreview ? (
                                <Image
                                    src={imagePreview}
                                    alt={livreur.user?.username || "Livreur"}
                                    fill
                                    className="object-cover"
                                    unoptimized
                                />
                            ) : (
                                <span>{livreur.user?.first_name?.[0] || livreur.user?.username?.[0] || "L"}</span>
                            )}
                        </div>

                        <div>
                            <div className="flex items-center gap-2.5 flex-wrap">
                                <h2 className="text-xl font-bold">
                                    {firstName || livreur.user?.first_name || ""} {lastName || livreur.user?.last_name || livreur.user?.username}
                                </h2>
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/10 text-slate-200">
                                    #{livreur.id}
                                </span>
                                {livreur.is_available ? (
                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                        En Ligne
                                    </span>
                                ) : (
                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-500/20 text-slate-300 border border-slate-500/30">
                                        Hors Ligne
                                    </span>
                                )}
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                                    📦 {livreur.user?.nbr_commandes ?? 0} Livrée(s)
                                </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-1">
                                Username : <strong className="text-slate-200">@{livreur.user?.username}</strong> • Wilaya : {wilaya || "N/A"}
                            </p>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex gap-2 mt-6 border-b border-white/10">
                        <button
                            type="button"
                            onClick={() => setActiveTab("general")}
                            className={`pb-3 px-4 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
                                activeTab === "general"
                                    ? "border-blue-500 text-blue-400"
                                    : "border-transparent text-slate-400 hover:text-slate-200"
                            }`}
                        >
                            <FaUserEdit /> Identité & Compte
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab("documents")}
                            className={`pb-3 px-4 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
                                activeTab === "documents"
                                    ? "border-blue-500 text-blue-400"
                                    : "border-transparent text-slate-400 hover:text-slate-200"
                            }`}
                        >
                            <FaIdCard /> RC & Documents
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab("vehicule")}
                            className={`pb-3 px-4 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
                                activeTab === "vehicule"
                                    ? "border-blue-500 text-blue-400"
                                    : "border-transparent text-slate-400 hover:text-slate-200"
                            }`}
                        >
                            <FaMotorcycle /> Véhicule & Flotte
                        </button>
                    </div>
                </div>

                {/* Form Content */}
                <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-5">
                    {/* TAB 1: IDENTITÉ & COMPTE */}
                    {activeTab === "general" && (
                        <div className="space-y-4 animate-fadeIn">
                            
                            {/* Photo de Profil du Livreur */}
                            <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-3.5">
                                    <div className="relative w-16 h-16 rounded-2xl bg-slate-200 dark:bg-slate-800 border-2 border-white dark:border-slate-700 shadow-md flex items-center justify-center overflow-hidden shrink-0">
                                        {imagePreview ? (
                                            <Image
                                                src={imagePreview}
                                                alt="Aperçu photo profil"
                                                fill
                                                className="object-cover"
                                                unoptimized
                                            />
                                        ) : (
                                            <FaUser className="text-2xl text-slate-400" />
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                                            <FaCamera className="text-blue-500 text-xs" /> Photo de Profil du Livreur
                                        </h4>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                            Format JPG, PNG (Max 5 Mo)
                                        </p>
                                        {imageFile && (
                                            <p className="text-[11px] text-emerald-600 font-semibold mt-0.5 truncate max-w-[200px]">
                                                {imageFile.name}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <label
                                        htmlFor="livreur-photo-input"
                                        className="py-2 px-3.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl cursor-pointer shadow-sm shadow-blue-500/20 transition-all flex items-center gap-1.5"
                                    >
                                        <FaCamera />
                                        <span>{imagePreview ? "Changer la photo" : "Ajouter une photo"}</span>
                                    </label>
                                    <input
                                        id="livreur-photo-input"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="hidden"
                                    />
                                    {imagePreview && (
                                        <button
                                            type="button"
                                            onClick={handleRemoveImage}
                                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
                                            title="Supprimer la photo"
                                        >
                                            <FaTrash className="text-xs" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                                        Prénom
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="ex: Amine"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                                        Nom de Famille
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="ex: Benali"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                                        Téléphone
                                    </label>
                                    <input
                                        type="tel"
                                        placeholder="ex: 0670000000"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        placeholder="ex: livreur@ltc.dz"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                                    Wilaya d&apos;activité
                                </label>
                                <select
                                    value={wilaya}
                                    onChange={(e) => setWilaya(e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Sélectionner une wilaya</option>
                                    {Wilaya.map((w) => (
                                        <option key={w.code} value={w.name}>
                                            {String(w.code).padStart(2, "0")} - {w.name} ({w.ar_name})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Change Password Section */}
                            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                    <FaLock className="text-blue-500" /> Modifier le Mot de passe
                                </label>
                                <div className="relative mt-2">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Nouveau mot de passe (laisser vide pour ne pas modifier)"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full pl-3.5 pr-10 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm"
                                        title={showPassword ? "Masquer" : "Afficher"}
                                    >
                                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                                    </button>
                                </div>
                                <p className="text-[11px] text-slate-400 mt-1.5">
                                    Renseignez un nouveau mot de passe uniquement si vous souhaitez le réinitialiser pour ce livreur.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* TAB 2: DOCUMENTS COMMERCIAUX & RC */}
                    {activeTab === "documents" && (
                        <div className="space-y-4 animate-fadeIn">
                            <div className="bg-amber-50 dark:bg-amber-950/30 p-3.5 rounded-2xl border border-amber-200 dark:border-amber-900/50 text-xs text-amber-800 dark:text-amber-300">
                                📋 Ces informations permettent de valider le profil légal et commercial du livreur partenaire.
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                                        N° Registre de Commerce (RC)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="ex: 13/00-1234567A89"
                                        value={rc}
                                        onChange={(e) => setRc(e.target.value)}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                                        NIF (Identification Fiscale)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="ex: 000123456789012"
                                        value={nif}
                                        onChange={(e) => setNif(e.target.value)}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                                        Numéro d&apos;Act / NIS
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="ex: NIS 0987654321"
                                        value={numeroAct}
                                        onChange={(e) => setNumeroAct(e.target.value)}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                                        N° Carte / Permis de conduire
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="ex: 13-0987654"
                                        value={cardNumber}
                                        onChange={(e) => setCardNumber(e.target.value)}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 3: VÉHICULE & TRANSPORT */}
                    {activeTab === "vehicule" && (
                        <div className="space-y-4 animate-fadeIn">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                                        Type de Véhicule
                                    </label>
                                    <select
                                        value={typeVehicule}
                                        onChange={(e) => setTypeVehicule(e.target.value)}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="Moto">Moto / Scooter</option>
                                        <option value="Voiture_livreur">Voiture de livraison</option>
                                        <option value="Velo">Vélo</option>
                                        <option value="Utilitaire">Utilitaire / Fourgonnette</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                                        Marque du Véhicule
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="ex: Yamaha, Peugeot, SYM"
                                        value={marque}
                                        onChange={(e) => setMarque(e.target.value)}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                                        Modèle
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="ex: Fiddle III, 208, TMAX"
                                        value={modele}
                                        onChange={(e) => setModele(e.target.value)}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                                        Matricule (Immatriculation)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="ex: 12345-119-13"
                                        value={matricule}
                                        onChange={(e) => setMatricule(e.target.value)}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                                    N° Police d&apos;Assurance
                                </label>
                                <input
                                    type="text"
                                    placeholder="ex: ASSUR-2026-998877"
                                    value={numAssurance}
                                    onChange={(e) => setNumAssurance(e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                                />
                            </div>

                            {magasinName && (
                                <div className="p-3.5 bg-blue-50 dark:bg-blue-950/30 rounded-2xl border border-blue-200 dark:border-blue-900/50 flex items-center gap-2 text-xs text-blue-800 dark:text-blue-300">
                                    <FaStore className="text-sm" />
                                    <span>Livreur rattaché au magasin : <strong>{magasinName}</strong></span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Footer Actions */}
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-500/25 flex items-center gap-2 transition-all"
                        >
                            {isSubmitting ? (
                                <>
                                    <FaSpinner className="animate-spin" />
                                    <span>Enregistrement...</span>
                                </>
                            ) : (
                                <>
                                    <FaSave />
                                    <span>Enregistrer les modifications</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
