"use client";

import React, { useState } from "react";
import {
    FaStore,
    FaTimes,
    FaEnvelope,
    FaLock,
    FaUser,
    FaMapMarkerAlt,
    FaPhoneAlt,
    FaSpinner,
    FaCheck,
    FaUtensils,
    FaTag,
    FaMapMarkedAlt,
    FaTrashAlt,
    FaGlobeAfrica
} from "react-icons/fa";
import { Wilaya } from "@/lib/tools/named";
import { createConfirmationMagasin } from "@/lib/confirmation_action";
import MapGl from "@/components/options/map_mark";
import toast from "react-hot-toast";

interface MagasinCreateModalProps {
    onClose: () => void;
    onCreated: () => void;
    initialWilaya?: string;
}

const STORE_TYPES = [
    "Restaurant",
    "Fast Food / Sandwicherie",
    "Pizzeria",
    "Supérette / Alimentation Générale",
    "Boulangerie / Pâtisserie",
    "Boucherie",
    "Fruits & Légumes",
    "Cafétéria / Salon de thé",
    "Poissonnerie",
    "Cosmétique & Beauté",
    "Autre Commerce"
];

// Approximate coordinates for Wilayas in Algeria to center map initially
const WILAYA_COORDS: Record<string, [number, number]> = {
    "Adrar": [27.8742, -0.2939],
    "Chlef": [36.1652, 1.3345],
    "Laghouat": [33.8000, 2.8651],
    "Oum El Bouaghi": [35.8755, 7.1135],
    "Batna": [35.5559, 6.1741],
    "Béjaïa": [36.7558, 5.0843],
    "Biskra": [34.8504, 5.7280],
    "Béchar": [31.6167, -2.2167],
    "Blida": [36.4700, 2.8300],
    "Bouira": [36.3749, 3.9020],
    "Tamanrasset": [22.7850, 5.5228],
    "Tébessa": [35.4042, 8.1242],
    "Tlemcen": [34.8783, -1.3150],
    "Tiaret": [35.3710, 1.3170],
    "Tizi Ouzou": [36.7118, 4.0459],
    "Alger": [36.7538, 3.0588],
    "Djelfa": [34.6728, 3.2630],
    "Jijel": [36.8205, 5.7667],
    "Sétif": [36.1911, 5.4137],
    "Saïda": [34.8303, 0.1517],
    "Skikda": [36.8792, 6.9070],
    "Sidi Bel Abbès": [35.1899, -0.6308],
    "Annaba": [36.9000, 7.7667],
    "Guelma": [36.4621, 7.4261],
    "Constantine": [36.3650, 6.6147],
    "Médéa": [36.2642, 2.7539],
    "Mostaganem": [35.9311, 0.0892],
    "M'Sila": [35.7058, 4.5419],
    "Mascara": [35.3966, 0.1403],
    "Ouargla": [31.9493, 5.3250],
    "Oran": [35.6987, -0.6349],
    "El Bayadh": [33.6832, 1.0193],
    "Illizi": [26.4833, 8.4667],
    "Bordj Bou Arreridj": [36.0732, 4.7611],
    "Boumerdès": [36.7667, 3.4772],
    "El Tarf": [36.7672, 8.3138],
    "Tindouf": [27.6711, -8.1474],
    "Tissemsilt": [35.6072, 1.8108],
    "El Oued": [33.3683, 6.8674],
    "Khenchela": [35.4358, 7.1433],
    "Souk Ahras": [36.2864, 7.9511],
    "Tipaza": [36.5897, 2.4475],
    "Mila": [36.4503, 6.2644],
    "Aïn Defla": [36.2644, 1.9678],
    "Naâma": [33.2667, -0.3167],
    "Aïn Témouchent": [35.2975, -1.1404],
    "Ghardaïa": [32.4909, 3.6735],
    "Relizane": [35.7373, 0.5559]
};

export default function MagasinCreateModal({
    onClose,
    onCreated,
    initialWilaya = ""
}: MagasinCreateModalProps) {
    const [nomMagasin, setNomMagasin] = useState("");
    const [typeMagasin, setTypeMagasin] = useState("Restaurant");
    const [customType, setCustomType] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [wilaya, setWilaya] = useState(initialWilaya || "Tlemcen");
    const [phone, setPhone] = useState("");
    const [address, setAddress] = useState("");
    
    // GPS Coordinates state
    const [latitude, setLatitude] = useState<number | null>(null);
    const [longitude, setLongitude] = useState<number | null>(null);
    const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);
    
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Dynamic preview of auto-generated email
    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "") || "magasin";
    const previewEmail = `${cleanUsername}XXXX@ltc.dz`;

    const selectedType = typeMagasin === "Autre Commerce" && customType.trim() ? customType.trim() : typeMagasin;

    // Determine initial center coordinates for map picker
    const getInitialMapCoords = (): number[] => {
        if (latitude !== null && longitude !== null) {
            return [latitude, longitude];
        }
        if (wilaya && WILAYA_COORDS[wilaya]) {
            return WILAYA_COORDS[wilaya];
        }
        return [35.6987, -0.6349]; // Oran default
    };

    const handleLocationSelect = ({ latitude: lat, longitude: lng }: { latitude: number; longitude: number }) => {
        setLatitude(lat);
        setLongitude(lng);
        setIsMapPickerOpen(false);
        toast.success(`Position GPS enregistrée : ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;

        if (!nomMagasin.trim()) {
            toast.error("Le nom du magasin est requis");
            return;
        }
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
        const res = await createConfirmationMagasin({
            nom_magasin: nomMagasin.trim(),
            username: username.trim(),
            password: password.trim(),
            type_magasin: selectedType,
            wilaya: wilaya.trim(),
            phone: phone.trim(),
            address: address.trim() || wilaya.trim(),
            latitude: latitude,
            longitude: longitude
        });
        setIsSubmitting(false);

        if (res.success) {
            onCreated();
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] transition-colors relative">
                {/* Header */}
                <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-6 relative shrink-0">
                    <button
                        onClick={onClose}
                        className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                        title="Fermer"
                    >
                        <FaTimes />
                    </button>

                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-400/30 flex items-center justify-center text-blue-400 text-xl shadow-inner">
                            <FaStore />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Création Rapide de Magasin</h2>
                            <p className="text-xs text-slate-300">
                                Création simplifiée avec position GPS Maps, catalogue & email auto
                            </p>
                        </div>
                    </div>
                </div>

                {/* Form Body with Scroll */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                    {/* Nom du Magasin */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                            Nom du Magasin / Restaurant *
                        </label>
                        <div className="relative">
                            <FaStore className="absolute left-3.5 top-3.5 text-slate-400 text-sm" />
                            <input
                                type="text"
                                placeholder="ex: Pizzeria Bella Napoli, Superette Salam"
                                value={nomMagasin}
                                onChange={(e) => setNomMagasin(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                                required
                            />
                        </div>
                    </div>

                    {/* Type / Catégorie du Magasin */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                            Type / Catégorie de Magasin
                        </label>
                        <div className="relative">
                            <FaUtensils className="absolute left-3.5 top-3.5 text-slate-400 text-sm" />
                            <select
                                value={typeMagasin}
                                onChange={(e) => setTypeMagasin(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {STORE_TYPES.map((type) => (
                                    <option key={type} value={type}>
                                        {type}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {typeMagasin === "Autre Commerce" && (
                            <div className="mt-2">
                                <input
                                    type="text"
                                    placeholder="Préciser le type (ex: Quincaillerie, Librairie...)"
                                    value={customType}
                                    onChange={(e) => setCustomType(e.target.value)}
                                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        )}
                    </div>

                    {/* Username & Password */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                                Username *
                            </label>
                            <div className="relative">
                                <FaUser className="absolute left-3.5 top-3.5 text-slate-400 text-sm" />
                                <input
                                    type="text"
                                    placeholder="ex: bella_tlemcen"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                                    required
                                />
                            </div>
                        </div>

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
                    </div>

                    {/* Wilaya & Phone */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                                Wilaya *
                            </label>
                            <div className="relative">
                                <FaMapMarkerAlt className="absolute left-3.5 top-3.5 text-slate-400 text-sm" />
                                <select
                                    value={wilaya}
                                    onChange={(e) => {
                                        const newWilaya = e.target.value;
                                        setWilaya(newWilaya);
                                        // Update default coords if not yet manually set
                                        if (latitude === null && WILAYA_COORDS[newWilaya]) {
                                            const coords = WILAYA_COORDS[newWilaya];
                                            setLatitude(coords[0]);
                                            setLongitude(coords[1]);
                                        }
                                    }}
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

                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                                Téléphone (Optionnel)
                            </label>
                            <div className="relative">
                                <FaPhoneAlt className="absolute left-3.5 top-3.5 text-slate-400 text-sm" />
                                <input
                                    type="tel"
                                    placeholder="ex: 0550000000"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Adresse */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                            Adresse (Optionnel)
                        </label>
                        <input
                            type="text"
                            placeholder="ex: Rue de la Paix, Centre Ville"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Localisation GPS / Google Maps Selector */}
                    <div className="bg-slate-50 dark:bg-slate-950/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                                <FaGlobeAfrica className="text-blue-500 text-sm" />
                                Position GPS & Carte
                            </label>
                            {latitude !== null && longitude !== null && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setLatitude(null);
                                        setLongitude(null);
                                    }}
                                    className="text-[11px] text-rose-500 hover:text-rose-600 font-semibold flex items-center gap-1 transition-colors"
                                >
                                    <FaTrashAlt className="text-[10px]" /> Réinitialiser
                                </button>
                            )}
                        </div>

                        {latitude !== null && longitude !== null ? (
                            <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 p-3 rounded-xl">
                                <div className="flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                                    <FaMapMarkerAlt className="text-emerald-600 text-base shrink-0 animate-bounce" />
                                    <div>
                                        <p className="font-bold">Position GPS sélectionnée</p>
                                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                                            Lat: {latitude.toFixed(6)} | Lng: {longitude.toFixed(6)}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsMapPickerOpen(true)}
                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all"
                                >
                                    Modifier sur la carte
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => setIsMapPickerOpen(true)}
                                className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold text-xs rounded-xl shadow-md hover:shadow-cyan-500/25 transition-all flex items-center justify-center gap-2"
                            >
                                <FaMapMarkedAlt className="text-base" />
                                Choisir la localisation sur Google Maps
                            </button>
                        )}
                    </div>

                    {/* Auto generated config preview */}
                    <div className="bg-blue-50 dark:bg-blue-950/40 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/50 space-y-2">
                        <div className="flex items-center gap-2 text-xs font-semibold text-blue-900 dark:text-blue-200">
                            <FaTag className="text-base text-blue-600" />
                            <span>
                                Type & Catalogue : <strong>{selectedType}</strong> (Configuré automatiquement)
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
                        💡 Vous pourrez gérer les photos, catalogues, produits et documents administratifs (RC, NIF) à tout moment depuis la liste des magasins.
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
                            Créer le Magasin
                        </button>
                    </div>
                </form>

                {/* Sub-Modal: Google Maps Location Picker */}
                {isMapPickerOpen && (
                    <div className="absolute inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex flex-col p-4 animate-fadeIn">
                        <div className="flex items-center justify-between pb-3 text-white border-b border-white/10 shrink-0">
                            <div className="flex items-center gap-2">
                                <FaMapMarkedAlt className="text-blue-400 text-lg" />
                                <h3 className="font-bold text-sm">Sélectionner la position exacte du magasin</h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsMapPickerOpen(false)}
                                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                            >
                                <FaTimes />
                            </button>
                        </div>

                        <div className="flex-1 mt-3 overflow-hidden rounded-2xl border border-white/10">
                            <MapGl
                                localisation={getInitialMapCoords()}
                                onSub={handleLocationSelect}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
