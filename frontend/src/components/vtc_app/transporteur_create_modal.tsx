"use client";

import React, { useState, useEffect } from "react";
import {
    FaTimes,
    FaTruck,
    FaUser,
    FaLock,
    FaPhoneAlt,
    FaMapMarkerAlt,
    FaEnvelope,
    FaCalendarAlt,
    FaSpinner,
    FaTag,
    FaMoneyBillWave,
    FaClock,
    FaImage,
    FaCheck,
    FaInfoCircle,
    FaPlus,
    FaMapPin
} from "react-icons/fa";
import { Wilaya } from "@/lib/tools/named";
import { getCommunesByWilaya } from "@/lib/tools/communes";
import {
    createTransporteur,
    updateTransporteur,
    Transporteur,
    CreateTransporteurPayload,
    getTransportCategories,
    createTransportCategory,
    TransportCategoryItem
} from "@/lib/transporteur_action";
import toast from "react-hot-toast";

interface TransporteurCreateModalProps {
    onClose: () => void;
    onSaved: () => void;
    initialData?: Transporteur | null;
    initialWilaya?: string;
}

const DEFAULT_CATEGORY_OPTIONS = [
    { id: "hilux", label: "Hilux / Pick-up", icon: "🛻", defaultColor: "#D97706" },
    { id: "camion", label: "Camion & Fret", icon: "🚛", defaultColor: "#2563EB" },
    { id: "utilitaire", label: "Utilitaire & Dokker", icon: "📦", defaultColor: "#059669" },
    { id: "confort", label: "Confort VIP", icon: "👑", defaultColor: "#7C3AED" },
    { id: "classique", label: "Classique Éco", icon: "🚗", defaultColor: "#0D9488" },
];

const PRESET_COLORS = [
    "#D97706", "#2563EB", "#059669", "#7C3AED", "#EA580C", "#1E40AF", "#0D9488", "#DC2626"
];

export default function TransporteurCreateModal({
    onClose,
    onSaved,
    initialData,
    initialWilaya = ""
}: TransporteurCreateModalProps) {
    const isEdit = Boolean(initialData);
    const [tab, setTab] = useState<"compte" | "vehicule" | "service">("compte");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Dynamic Category Options
    const [categoryOptions, setCategoryOptions] = useState<
        { id: string; label: string; icon: string; defaultColor: string }[]
    >(DEFAULT_CATEGORY_OPTIONS);

    // Category Creation Sub-state
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [newCatName, setNewCatName] = useState("");
    const [newCatIcon, setNewCatIcon] = useState("🛻");
    const [newCatColor, setNewCatColor] = useState("#D97706");
    const [isSavingCategory, setIsSavingCategory] = useState(false);

    // Load available categories dynamically
    useEffect(() => {
        let isMounted = true;
        getTransportCategories().then((cats) => {
            if (isMounted && cats && cats.length > 0) {
                setCategoryOptions(
                    cats.map((c) => ({
                        id: c.slug,
                        label: c.name,
                        icon: c.icon || "🛻",
                        defaultColor: c.color || "#D97706",
                    }))
                );
            }
        });
        return () => {
            isMounted = false;
        };
    }, []);

    // Selected categories
    const initialCategories = initialData?.categories || ["hilux", "utilitaire"];
    const [selectedCategories, setSelectedCategories] = useState<string[]>(initialCategories);

    // Image files and previews
    const [driverPhotoFile, setDriverPhotoFile] = useState<File | null>(null);
    const [driverPhotoPreview, setDriverPhotoPreview] = useState<string>(initialData?.driver_photo || "");
    const [vehicleImageFile, setVehicleImageFile] = useState<File | null>(null);
    const [vehicleImagePreview, setVehicleImagePreview] = useState<string>(initialData?.vehicle_image || "");

    // Form state
    const [formData, setFormData] = useState<CreateTransporteurPayload>({
        username: initialData?.username || "",
        password: "",
        first_name: initialData?.first_name || "",
        last_name: initialData?.last_name || "",
        phone_number_1: initialData?.phone_number_1 || "",
        phone_number_2: initialData?.phone_number_2 || "",
        email: initialData?.email || "",
        wilaya: initialData?.wilaya || initialWilaya || "Alger",
        wilaya_code: initialData?.wilaya_code || "16",
        commune: initialData?.commune || "",
        marque: initialData?.vehicle?.marque || (initialData?.vehicle_name?.split(" ")[0] || "Toyota"),
        modele: initialData?.vehicle?.modele || (initialData?.vehicle_name?.split(" ").slice(1).join(" ") || "Hilux"),
        matricule: initialData?.vehicle?.matricule || "",
        type_vehicule: initialData?.vehicle?.type_vehicule || "Utilitaire",
        vehicle_year: initialData?.vehicle_year || 2023,
        category_label: initialData?.category_label || "Hilux / Pick-up",
        price_estimate: initialData?.price_estimate || "Dès 800 DA",
        eta_minutes: initialData?.eta_minutes || 5,
        description: initialData?.description || "Transport et fret de marchandises avec disponibilité rapide",
        badge: initialData?.badge || "Robuste 4x4",
        badge_color: initialData?.badge_color || "#D97706",
        card_number: initialData?.card_number || "",
        RC: initialData?.RC || "",
        Nif: initialData?.Nif || "",
        numero_act: initialData?.numero_act || "",
    });

    const handleWilayaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        const found = Wilaya.find((w) => w.name.toLowerCase() === val.toLowerCase());
        setFormData((prev) => ({
            ...prev,
            wilaya: val,
            wilaya_code: found ? String(found.code) : prev.wilaya_code,
            commune: ""
        }));
    };

    const communesList = getCommunesByWilaya(formData.wilaya_code || formData.wilaya);

    const toggleCategory = (catId: string) => {
        let updated: string[];
        if (selectedCategories.includes(catId)) {
            updated = selectedCategories.filter((c) => c !== catId);
            if (updated.length === 0) updated = [catId]; // Keep at least one
        } else {
            updated = [...selectedCategories, catId];
        }
        setSelectedCategories(updated);

        // Auto-update label if matching primary
        const primaryCat = categoryOptions.find((c) => c.id === updated[0]);
        if (primaryCat && !formData.category_label) {
            setFormData((prev) => ({ ...prev, category_label: primaryCat.label }));
        }
    };

    const handleCreateNewCategory = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const trimmed = newCatName.trim();
        if (!trimmed) {
            toast.error("Veuillez saisir un nom pour la catégorie");
            return;
        }

        setIsSavingCategory(true);
        const res = await createTransportCategory({
            name: trimmed,
            icon: newCatIcon,
            color: newCatColor,
        });
        setIsSavingCategory(false);

        if (res.success && res.data) {
            const newSlug = res.data.slug;
            const newOpt = {
                id: newSlug,
                label: res.data.name,
                icon: res.data.icon || newCatIcon,
                defaultColor: res.data.color || newCatColor,
            };

            setCategoryOptions((prev) => {
                if (prev.some((c) => c.id === newSlug)) return prev;
                return [...prev, newOpt];
            });

            // Automatically select this new category for current transporteur
            setSelectedCategories((prev) => Array.from(new Set([...prev, newSlug])));
            setFormData((prev) => ({
                ...prev,
                category_label: trimmed,
                badge_color: newCatColor,
            }));

            setNewCatName("");
            setIsAddingCategory(false);
            toast.success(`Catégorie "${trimmed}" ajoutée et sélectionnée !`);
        }
    };

    const handleDriverPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setDriverPhotoFile(file);
            setDriverPhotoPreview(URL.createObjectURL(file));
        }
    };

    const handleVehicleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setVehicleImageFile(file);
            setVehicleImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.username || formData.username.length < 3) {
            toast.error("Veuillez saisir un nom d'utilisateur (min 3 caractères)");
            setTab("compte");
            return;
        }

        if (!isEdit && (!formData.password || formData.password.length < 4)) {
            toast.error("Veuillez saisir un mot de passe (min 4 caractères)");
            setTab("compte");
            return;
        }

        if (!formData.phone_number_1) {
            toast.error("Veuillez saisir un numéro de téléphone");
            setTab("compte");
            return;
        }

        setIsSubmitting(true);
        const payload: CreateTransporteurPayload = {
            ...formData,
            categories: selectedCategories.join(","),
        };

        if (isEdit && initialData?.id) {
            const res = await updateTransporteur(
                initialData.id,
                payload,
                driverPhotoFile,
                vehicleImageFile
            );
            setIsSubmitting(false);
            if (res.success) {
                onSaved();
                onClose();
            }
        } else {
            const res = await createTransporteur(
                payload,
                driverPhotoFile,
                vehicleImageFile
            );
            setIsSubmitting(false);
            if (res.success) {
                onSaved();
                onClose();
            }
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
            <div className="relative w-full max-w-3xl bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden my-8">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-zinc-800 bg-gradient-to-r from-amber-500/10 via-amber-600/5 to-transparent">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
                            <FaTruck className="text-xl" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800 dark:text-zinc-100">
                                {isEdit ? "Modifier le Transporteur" : "Nouveau Transporteur"}
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-zinc-400">
                                Compte partenaire (Type Transport) pour Hilux, Camion, Fret & Marchandises
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition"
                    >
                        <FaTimes className="text-base" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-100 dark:border-zinc-800 px-6 bg-slate-50/50 dark:bg-zinc-900/50">
                    <button
                        type="button"
                        onClick={() => setTab("compte")}
                        className={`py-3.5 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition ${
                            tab === "compte"
                                ? "border-amber-500 text-amber-600 dark:text-amber-400"
                                : "border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-700"
                        }`}
                    >
                        <FaUser /> 1. Chauffeur & Contact
                    </button>
                    <button
                        type="button"
                        onClick={() => setTab("vehicule")}
                        className={`py-3.5 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition ${
                            tab === "vehicule"
                                ? "border-amber-500 text-amber-600 dark:text-amber-400"
                                : "border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-700"
                        }`}
                    >
                        <FaTruck /> 2. Véhicule
                    </button>
                    <button
                        type="button"
                        onClick={() => setTab("service")}
                        className={`py-3.5 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition ${
                            tab === "service"
                                ? "border-amber-500 text-amber-600 dark:text-amber-400"
                                : "border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-700"
                        }`}
                    >
                        <FaTag /> 3. Service & Tarifs
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[72vh] overflow-y-auto">
                    {/* TAB 1: COMPTE CHAUFFEUR */}
                    {tab === "compte" && (
                        <div className="space-y-4 animate-fade-in">
                            <div className="flex items-center gap-4 p-3.5 bg-amber-500/10 rounded-2xl border border-amber-500/20">
                                <div className="relative group shrink-0">
                                    <div className="w-16 h-16 rounded-2xl bg-slate-200 dark:bg-zinc-800 border-2 border-dashed border-amber-500/40 flex items-center justify-center overflow-hidden">
                                        {driverPhotoPreview ? (
                                            <img
                                                src={driverPhotoPreview}
                                                alt="Aperçu chauffeur"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <FaUser className="text-2xl text-slate-400" />
                                        )}
                                    </div>
                                    <label className="absolute inset-0 cursor-pointer flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 rounded-2xl transition text-xs font-semibold">
                                        Photo
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleDriverPhotoChange}
                                            className="hidden"
                                        />
                                    </label>
                                </div>
                                <div className="flex-1 text-xs">
                                    <p className="font-bold text-slate-800 dark:text-zinc-200">
                                        Photo du transporteur
                                    </p>
                                    <p className="text-slate-500 dark:text-zinc-400">
                                        Sera affichée dans l&apos;application mobile avec le badge de disponibilité.
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                                        Nom d&apos;utilisateur *
                                    </label>
                                    <div className="relative">
                                        <FaUser className="absolute left-3.5 top-3 text-slate-400 text-xs" />
                                        <input
                                            type="text"
                                            value={formData.username}
                                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                            placeholder="ex: mohamed_hilux"
                                            disabled={isEdit}
                                            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                                        {isEdit ? "Nouveau mot de passe (laisser vide si inchangé)" : "Mot de passe *"}
                                    </label>
                                    <div className="relative">
                                        <FaLock className="absolute left-3.5 top-3 text-slate-400 text-xs" />
                                        <input
                                            type="password"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            placeholder={isEdit ? "••••••••" : "Min 4 caractères"}
                                            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                                        Prénom
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.first_name}
                                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                        placeholder="Mohamed"
                                        className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                                        Nom
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.last_name}
                                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                        placeholder="Amine"
                                        className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                                        Téléphone principal (Appel direct app) *
                                    </label>
                                    <div className="relative">
                                        <FaPhoneAlt className="absolute left-3.5 top-3 text-slate-400 text-xs" />
                                        <input
                                            type="text"
                                            value={formData.phone_number_1}
                                            onChange={(e) => setFormData({ ...formData, phone_number_1: e.target.value })}
                                            placeholder="0550 12 34 56"
                                            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                                        Téléphone 2 (Optionnel)
                                    </label>
                                    <div className="relative">
                                        <FaPhoneAlt className="absolute left-3.5 top-3 text-slate-400 text-xs" />
                                        <input
                                            type="text"
                                            value={formData.phone_number_2}
                                            onChange={(e) => setFormData({ ...formData, phone_number_2: e.target.value })}
                                            placeholder="0661 ..."
                                            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                                            Wilaya d&apos;activité
                                        </label>
                                        <div className="relative">
                                            <FaMapMarkerAlt className="absolute left-3.5 top-3 text-slate-400 text-xs" />
                                            <select
                                                value={formData.wilaya}
                                                onChange={handleWilayaChange}
                                                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/40 capitalize"
                                            >
                                                {Wilaya.map((w) => (
                                                    <option key={w.code} value={w.name}>
                                                        {w.code} - {w.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                                            Commune d&apos;activité
                                        </label>
                                        <div className="relative">
                                            <FaMapPin className="absolute left-3.5 top-3 text-slate-400 text-xs" />
                                            <input
                                                type="text"
                                                list="communes-list"
                                                value={formData.commune}
                                                onChange={(e) => setFormData({ ...formData, commune: e.target.value })}
                                                placeholder={communesList.length > 0 ? "Choisir ou saisir commune..." : "Saisir une commune..."}
                                                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                                            />
                                            <datalist id="communes-list">
                                                {communesList.map((c) => (
                                                    <option key={c} value={c} />
                                                ))}
                                            </datalist>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                                        Email (Optionnel)
                                    </label>
                                    <div className="relative">
                                        <FaEnvelope className="absolute left-3.5 top-3 text-slate-400 text-xs" />
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            placeholder="transport@example.com"
                                            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 2: VÉHICULE */}
                    {tab === "vehicule" && (
                        <div className="space-y-4 animate-fade-in">
                            <div className="flex items-center gap-4 p-3.5 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                                <div className="relative group shrink-0">
                                    <div className="w-24 h-16 rounded-2xl bg-slate-200 dark:bg-zinc-800 border-2 border-dashed border-blue-500/40 flex items-center justify-center overflow-hidden">
                                        {vehicleImagePreview ? (
                                            <img
                                                src={vehicleImagePreview}
                                                alt="Aperçu véhicule"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <FaImage className="text-2xl text-slate-400" />
                                        )}
                                    </div>
                                    <label className="absolute inset-0 cursor-pointer flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 rounded-2xl transition text-xs font-semibold">
                                        Photo
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleVehicleImageChange}
                                            className="hidden"
                                        />
                                    </label>
                                </div>
                                <div className="flex-1 text-xs">
                                    <p className="font-bold text-slate-800 dark:text-zinc-200">
                                        Photo du véhicule de transport
                                    </p>
                                    <p className="text-slate-500 dark:text-zinc-400">
                                        Affichée directement sur la carte transporteur dans l&apos;application.
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                                        Marque du véhicule
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.marque}
                                        onChange={(e) => setFormData({ ...formData, marque: e.target.value })}
                                        placeholder="Toyota, Renault, Dacia..."
                                        className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                                        Modèle & Format
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.modele}
                                        onChange={(e) => setFormData({ ...formData, modele: e.target.value })}
                                        placeholder="Hilux Double Cabine, Master 20m³..."
                                        className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                                        Année du véhicule
                                    </label>
                                    <div className="relative">
                                        <FaCalendarAlt className="absolute left-3.5 top-3 text-slate-400 text-xs" />
                                        <input
                                            type="number"
                                            value={formData.vehicle_year}
                                            onChange={(e) => setFormData({ ...formData, vehicle_year: parseInt(e.target.value) || 2023 })}
                                            min={1990}
                                            max={2030}
                                            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                                        Immatriculation (Matricule)
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.matricule}
                                        onChange={(e) => setFormData({ ...formData, matricule: e.target.value })}
                                        placeholder="16-12345-00"
                                        className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 3: SERVICE, CATEGORIES & TARIFS */}
                    {tab === "service" && (
                        <div className="space-y-4 animate-fade-in">
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300">
                                        Catégories de transport applicables
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => setIsAddingCategory((prev) => !prev)}
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl transition"
                                    >
                                        <FaPlus className="text-[10px]" />
                                        <span>{isAddingCategory ? "Fermer" : "+ Ajouter une catégorie"}</span>
                                    </button>
                                </div>

                                {/* Formulaire d'ajout rapide d'une catégorie */}
                                {isAddingCategory && (
                                    <div className="mb-3 p-3.5 bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/30 rounded-2xl animate-fade-in space-y-3">
                                        <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
                                            <span className="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                                                <FaTag className="text-xs" />
                                                Créer une nouvelle catégorie personnalisée
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => setIsAddingCategory(false)}
                                                className="text-slate-400 hover:text-slate-600 text-xs"
                                            >
                                                <FaTimes />
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                                            <div className="sm:col-span-6">
                                                <label className="block text-[11px] font-semibold text-slate-600 dark:text-zinc-400 mb-1">
                                                    Nom de la catégorie *
                                                </label>
                                                <input
                                                    type="text"
                                                    value={newCatName}
                                                    onChange={(e) => setNewCatName(e.target.value)}
                                                    placeholder="ex: Frigorifique, Dépanneuse, Plateau, Benne..."
                                                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") {
                                                            e.preventDefault();
                                                            handleCreateNewCategory();
                                                        }
                                                    }}
                                                />
                                            </div>

                                            <div className="sm:col-span-3">
                                                <label className="block text-[11px] font-semibold text-slate-600 dark:text-zinc-400 mb-1">
                                                    Icône / Emoji
                                                </label>
                                                <div className="flex items-center gap-1">
                                                    <input
                                                        type="text"
                                                        value={newCatIcon}
                                                        onChange={(e) => setNewCatIcon(e.target.value)}
                                                        maxLength={4}
                                                        className="w-10 px-1 py-1 text-center text-sm bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl focus:outline-none shrink-0"
                                                    />
                                                    <div className="flex gap-1 overflow-x-auto py-0.5 no-scrollbar">
                                                        {["🛻", "🚛", "📦", "❄️", "🏗️", "🏍️", "🛢️", "🚜", "🚚"].map((emoji) => (
                                                            <button
                                                                key={emoji}
                                                                type="button"
                                                                onClick={() => setNewCatIcon(emoji)}
                                                                className={`w-6 h-6 shrink-0 flex items-center justify-center rounded-lg text-xs hover:bg-white dark:hover:bg-zinc-800 transition ${
                                                                    newCatIcon === emoji ? "ring-2 ring-amber-500 bg-white dark:bg-zinc-800" : ""
                                                                }`}
                                                            >
                                                                {emoji}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="sm:col-span-3">
                                                <label className="block text-[11px] font-semibold text-slate-600 dark:text-zinc-400 mb-1">
                                                    Couleur
                                                </label>
                                                <div className="flex items-center gap-1.5 py-1">
                                                    {["#D97706", "#2563EB", "#059669", "#7C3AED", "#DC2626", "#0D9488"].map((c) => (
                                                        <button
                                                            key={c}
                                                            type="button"
                                                            onClick={() => setNewCatColor(c)}
                                                            style={{ backgroundColor: c }}
                                                            className={`w-5 h-5 rounded-full transition ${
                                                                newCatColor === c ? "ring-2 ring-offset-2 ring-slate-400 scale-110" : "opacity-75 hover:opacity-100"
                                                            }`}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex justify-end gap-2 pt-1 border-t border-amber-500/10">
                                            <button
                                                type="button"
                                                onClick={() => setIsAddingCategory(false)}
                                                className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-zinc-300"
                                            >
                                                Annuler
                                            </button>
                                            <button
                                                type="button"
                                                disabled={isSavingCategory}
                                                onClick={handleCreateNewCategory}
                                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl hover:from-amber-600 hover:to-amber-700 shadow-xs transition"
                                            >
                                                {isSavingCategory ? <FaSpinner className="animate-spin text-xs" /> : <FaPlus className="text-[10px]" />}
                                                <span>Enregistrer la catégorie</span>
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {categoryOptions.map((cat) => {
                                        const isSelected = selectedCategories.includes(cat.id);
                                        return (
                                            <div
                                                key={cat.id}
                                                onClick={() => toggleCategory(cat.id)}
                                                className={`cursor-pointer p-3 rounded-2xl border transition flex items-center justify-between ${
                                                    isSelected
                                                        ? "border-amber-500 bg-amber-500/10 text-slate-800 dark:text-zinc-100 shadow-sm"
                                                        : "border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800/60 text-slate-600 dark:text-zinc-400"
                                                }`}
                                            >
                                                <div className="flex items-center gap-2 truncate">
                                                    <span className="text-lg shrink-0">{cat.icon}</span>
                                                    <span className="text-xs font-bold truncate">{cat.label}</span>
                                                </div>
                                                {isSelected && (
                                                    <div className="w-4 h-4 shrink-0 rounded-full bg-amber-500 text-white flex items-center justify-center text-[9px]">
                                                        <FaCheck />
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}

                                    {/* Carte raccourci pour ajouter */}
                                    <div
                                        onClick={() => setIsAddingCategory(true)}
                                        className="cursor-pointer p-3 rounded-2xl border-2 border-dashed border-amber-500/40 hover:border-amber-500 bg-amber-500/5 hover:bg-amber-500/10 transition flex items-center justify-center gap-2 text-amber-600 dark:text-amber-400"
                                    >
                                        <FaPlus className="text-xs" />
                                        <span className="text-xs font-bold">+ Autre catégorie</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                                        Libellé affiché de la catégorie
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.category_label}
                                        onChange={(e) => setFormData({ ...formData, category_label: e.target.value })}
                                        placeholder="ex: Hilux / Pick-up, Camion Fret..."
                                        className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                                        Estimation de tarif
                                    </label>
                                    <div className="relative">
                                        <FaMoneyBillWave className="absolute left-3.5 top-3 text-slate-400 text-xs" />
                                        <input
                                            type="text"
                                            value={formData.price_estimate}
                                            onChange={(e) => setFormData({ ...formData, price_estimate: e.target.value })}
                                            placeholder="Dès 800 DA"
                                            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                                        Badge affiché sur la carte
                                    </label>
                                    <div className="relative">
                                        <FaTag className="absolute left-3.5 top-3 text-slate-400 text-xs" />
                                        <input
                                            type="text"
                                            value={formData.badge}
                                            onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                                            placeholder="Robuste 4x4, Gros Fret..."
                                            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                                        Couleur du badge
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="color"
                                            value={formData.badge_color}
                                            onChange={(e) => setFormData({ ...formData, badge_color: e.target.value })}
                                            className="w-9 h-9 rounded-xl border border-slate-200 dark:border-zinc-700 cursor-pointer p-0.5 bg-transparent"
                                        />
                                        <div className="flex gap-1">
                                            {PRESET_COLORS.map((c) => (
                                                <div
                                                    key={c}
                                                    onClick={() => setFormData({ ...formData, badge_color: c })}
                                                    className="w-6 h-6 rounded-lg cursor-pointer transition hover:scale-110"
                                                    style={{ backgroundColor: c }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                                        Temps d&apos;arrivée estimé (Minutes)
                                    </label>
                                    <div className="relative">
                                        <FaClock className="absolute left-3.5 top-3 text-slate-400 text-xs" />
                                        <input
                                            type="number"
                                            value={formData.eta_minutes}
                                            onChange={(e) => setFormData({ ...formData, eta_minutes: parseInt(e.target.value) || 5 })}
                                            min={1}
                                            max={60}
                                            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                                        Aperçu visuel du badge
                                    </label>
                                    <div className="pt-1.5">
                                        <span
                                            className="inline-block px-3 py-1 text-xs font-bold rounded-full border shadow-sm"
                                            style={{
                                                backgroundColor: `${formData.badge_color}20`,
                                                color: formData.badge_color,
                                                borderColor: `${formData.badge_color}50`
                                            }}
                                        >
                                            {formData.badge || "Badge Transport"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                                    Description des prestations & capacités
                                </label>
                                <textarea
                                    rows={2}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Benne spacieuse • Tout-terrain • Transport de matériel & charges..."
                                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                                />
                            </div>
                        </div>
                    )}

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-zinc-800">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400">
                            <FaInfoCircle className="text-amber-500" />
                            <span>Les modifications apparaîtront immédiatement dans l&apos;application.</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition"
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="px-6 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 rounded-xl shadow-md shadow-amber-500/25 transition flex items-center gap-2 disabled:opacity-50"
                            >
                                {isSubmitting && <FaSpinner className="animate-spin text-sm" />}
                                {isEdit ? "Enregistrer les modifications" : "Créer le Transporteur"}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
