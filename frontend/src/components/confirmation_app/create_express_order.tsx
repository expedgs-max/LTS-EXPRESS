"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    MdArrowBack,
    MdPerson,
    MdPhone,
    MdStorefront,
    MdLocationOn,
    MdDeliveryDining,
    MdAttachMoney,
    MdDescription,
    MdCheckCircle,
    MdSearch,
    MdRoute,
    MdOutlineTimer,
} from "react-icons/md";
import { TbLoader3 } from "react-icons/tb";
import { Wilaya } from "@/lib/tools/named";
import {
    ConfirmationLivreur,
    ConfirmationMagasin,
    createExpressCommande,
    getConfirmationLivreurs,
    getConfirmationMagasins,
} from "@/lib/confirmation_action";
import { toast } from "react-hot-toast";

// Dynamic import for Leaflet map to prevent SSR issues
const MapPointPicker = dynamic(
    () => import("@/components/confirmation_app/map_point_picker"),
    {
        ssr: false,
        loading: () => (
            <div className="w-full h-[400px] bg-slate-100 dark:bg-slate-900 rounded-2xl flex flex-col items-center justify-center text-slate-400 gap-2 border border-slate-200 dark:border-slate-800">
                <TbLoader3 className="animate-spin text-3xl text-emerald-500" />
                <span className="text-xs font-semibold">Chargement de la carte interactive...</span>
            </div>
        ),
    }
);

export default function CreateExpressOrder() {
    const router = useRouter();

    // Form State: Client (Destination)
    const [clientName, setClientName] = useState("Client#1");
    const [clientPhone, setClientPhone] = useState("");
    const [clientAddress, setClientAddress] = useState("");
    const [clientWilaya, setClientWilaya] = useState("13 - Tlemcen");
    const [clientLat, setClientLat] = useState<number | undefined>(34.882);
    const [clientLng, setClientLng] = useState<number | undefined>(-1.315);

    // Form State: Point de Départ (Pickup)
    const [pickupType, setPickupType] = useState<"magasin" | "custom">("magasin");
    const [selectedMagasinId, setSelectedMagasinId] = useState<number | undefined>(undefined);
    const [pickupName, setPickupName] = useState("");
    const [pickupAddress, setPickupAddress] = useState("");
    const [pickupLat, setPickupLat] = useState<number | undefined>(34.878);
    const [pickupLng, setPickupLng] = useState<number | undefined>(-1.320);

    // Form State: Colis & Tarification
    const [specific, setSpecific] = useState("Colis Express");
    const [itemss, setItemss] = useState(1);
    const [totalPrice, setTotalPrice] = useState<number>(0);
    const [deliveryPrice, setDeliveryPrice] = useState<number>(250);
    const [typeLivraison, setTypeLivraison] = useState<"classique" | "premium">("classique");

    // Form State: Dispatch / Assignation
    const [dispatchMode, setDispatchMode] = useState<"direct" | "broadcast">("direct");
    const [selectedLivreurId, setSelectedLivreurId] = useState<number | undefined>(undefined);
    const [radiusKm, setRadiusKm] = useState<number>(3.0);

    // Interactive Map selection mode: "departure" | "destination"
    const [activeMapMode, setActiveMapMode] = useState<"departure" | "destination">("destination");

    // Auxiliary Data: Stores & Drivers
    const [magasins, setMagasins] = useState<ConfirmationMagasin[]>([]);
    const [livreurs, setLivreurs] = useState<ConfirmationLivreur[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [magasinSearch, setMagasinSearch] = useState("");
    const [livreurSearch, setLivreurSearch] = useState("");

    // Load Magasins & Livreurs
    useEffect(() => {
        const loadInitialData = async () => {
            setLoadingData(true);
            try {
                const [magRes, livRes] = await Promise.all([
                    getConfirmationMagasins({ page_size: "100" }),
                    getConfirmationLivreurs({ page_size: "100" }),
                ]);

                if (magRes?.result) {
                    setMagasins(magRes.result);
                    if (magRes.result.length > 0) {
                        const firstMag = magRes.result[0];
                        setSelectedMagasinId(firstMag.id);
                        setPickupName(firstMag.name);
                        setPickupAddress(firstMag.address || "");
                        if (firstMag.latitude && firstMag.longitude) {
                            setPickupLat(Number(firstMag.latitude));
                            setPickupLng(Number(firstMag.longitude));
                        }
                    }
                }

                if (livRes?.result) {
                    setLivreurs(livRes.result);
                    // Select first online driver by default if available
                    const firstOnline = livRes.result.find(l => l.is_available && !(l.is_blocked || l.user?.bloquer));
                    if (firstOnline) {
                        setSelectedLivreurId(firstOnline.id);
                    }
                }
            } catch (err) {
                console.error("Error loading stores/drivers:", err);
            } finally {
                setLoadingData(false);
            }
        };

        loadInitialData();
    }, []);

    // Handle Magasin Selection Change
    const handleSelectMagasin = (magId: number) => {
        setSelectedMagasinId(magId);
        const mag = magasins.find(m => m.id === magId);
        if (mag) {
            setPickupName(mag.name);
            setPickupAddress(mag.address || "");
            if (mag.latitude && mag.longitude) {
                setPickupLat(Number(mag.latitude));
                setPickupLng(Number(mag.longitude));
            }
        }
    };

    // Calculate approximate distance (Haversine)
    const distanceKm = useMemo(() => {
        if (!pickupLat || !pickupLng || !clientLat || !clientLng) return 0;
        const R = 6371; // Earth's radius in km
        const dLat = ((clientLat - pickupLat) * Math.PI) / 180;
        const dLng = ((clientLng - pickupLng) * Math.PI) / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((pickupLat * Math.PI) / 180) *
            Math.cos((clientLat * Math.PI) / 180) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return Math.round(R * c * 10) / 10;
    }, [pickupLat, pickupLng, clientLat, clientLng]);

    // Estimated duration (approx 4-5 min per km + 10 min prep)
    const estimatedTimeMin = useMemo(() => {
        if (distanceKm <= 0) return 15;
        return Math.max(10, Math.round(distanceKm * 4 + 8));
    }, [distanceKm]);

    // Map Point Callbacks
    const handleSelectDeparturePoint = useCallback((lat: number, lng: number) => {
        setPickupLat(Number(lat.toFixed(6)));
        setPickupLng(Number(lng.toFixed(6)));
        toast.success(`Point de départ défini : (${lat.toFixed(4)}, ${lng.toFixed(4)})`, { id: "dep_point" });
    }, []);

    const handleSelectDestinationPoint = useCallback((lat: number, lng: number) => {
        setClientLat(Number(lat.toFixed(6)));
        setClientLng(Number(lng.toFixed(6)));
        toast.success(`Point de livraison défini : (${lat.toFixed(4)}, ${lng.toFixed(4)})`, { id: "dest_point" });
    }, []);

    // Form Submission
    const handleSubmitOrder = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!clientPhone.trim()) {
            toast.error("Veuillez saisir le numéro de téléphone du client");
            return;
        }

        if (dispatchMode === "direct" && !selectedLivreurId) {
            toast.error("Veuillez sélectionner un livreur pour l'assignation directe, ou choisissez la diffusion");
            return;
        }

        setSubmitting(true);
        try {
            const res = await createExpressCommande({
                client_name: clientName,
                client_phone: clientPhone,
                client_address: clientAddress,
                client_wilaya: clientWilaya,
                client_lat: clientLat,
                client_lng: clientLng,
                pickup_type: pickupType,
                magasin_id: pickupType === "magasin" ? selectedMagasinId : undefined,
                pickup_name: pickupName,
                pickup_address: pickupAddress,
                pickup_lat: pickupLat,
                pickup_lng: pickupLng,
                specific: specific,
                itemss: Number(itemss) || 1,
                total_price: Number(totalPrice) || 0,
                delivery_price: Number(deliveryPrice) || 0,
                type_livraison: typeLivraison,
                dispatch_mode: dispatchMode,
                livreur_id: dispatchMode === "direct" ? selectedLivreurId : undefined,
                radius_km: radiusKm,
            });

            if (res?.success) {
                router.push("/dashboard/confirmation/dispatch");
            }
        } catch (err) {
            console.error("Submission error:", err);
        } finally {
            setSubmitting(false);
        }
    };

    // Filtered lists
    const filteredMagasins = useMemo(() => {
        if (!magasinSearch.trim()) return magasins;
        const q = magasinSearch.toLowerCase();
        return magasins.filter(m => m.name.toLowerCase().includes(q) || (m.address || "").toLowerCase().includes(q));
    }, [magasins, magasinSearch]);

    const filteredLivreurs = useMemo(() => {
        if (!livreurSearch.trim()) return livreurs;
        const q = livreurSearch.toLowerCase();
        return livreurs.filter(l =>
            (l.user?.first_name || "").toLowerCase().includes(q) ||
            (l.user?.last_name || "").toLowerCase().includes(q) ||
            (l.user?.username || "").toLowerCase().includes(q) ||
            (l.user?.phone || "").toLowerCase().includes(q)
        );
    }, [livreurs, livreurSearch]);

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-16">
            {/* Header Navigation & Title */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#111318] p-5 rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 shadow-xs">
                <div className="flex items-center gap-3">
                    <Link
                        href="/dashboard/confirmation/dispatch"
                        className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 flex items-center justify-center transition-all shrink-0"
                    >
                        <MdArrowBack className="text-xl" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-400/30 uppercase tracking-wider">
                                Dispatch Express
                            </span>
                            <span className="text-xs text-slate-400">• Centre de Confirmation</span>
                        </div>
                        <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
                            Créer une Nouvelle Commande Express
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Link
                        href="/dashboard/confirmation/commandes"
                        className="px-3 py-2 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 text-slate-700 dark:text-zinc-300 rounded-xl text-xs font-bold transition-all"
                    >
                        Liste Commandes
                    </Link>
                    <Link
                        href="/dashboard/confirmation/dispatch"
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                    >
                        <MdDeliveryDining className="text-base" />
                        Dispatch Live
                    </Link>
                </div>
            </div>

            {/* Main Interactive Form Grid */}
            <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                {/* Left Column: Form Details (7 Cols) */}
                <div className="lg:col-span-7 space-y-6">



                    {/* SECTION 2: POINT DE DÉPART (MAGASIN OU RAMASSAGE) */}
                    <div className="bg-white dark:bg-[#111318] p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 shadow-xs space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800/60">
                            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
                                <span className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 flex items-center justify-center text-xs">
                                    📦
                                </span>
                                <span>1. (Point A) Point de Départ / Ramassage</span>
                            </div>

                            <button
                                type="button"
                                onClick={() => setActiveMapMode("departure")}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${activeMapMode === "departure"
                                    ? "bg-emerald-500 text-white shadow-sm"
                                    : "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200"
                                    }`}
                            >
                                <span>Pointeur GPS</span>
                                {activeMapMode === "departure" && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                            </button>
                        </div>

                        {/* Pickup Type Toggle */}
                        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-zinc-900 rounded-xl">
                            <button
                                type="button"
                                onClick={() => setPickupType("magasin")}
                                className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${pickupType === "magasin"
                                    ? "bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-xs"
                                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                                    }`}
                            >
                                <MdStorefront className="text-base" />
                                Magasin / Restaurant Existant
                            </button>
                            <button
                                type="button"
                                onClick={() => setPickupType("custom")}
                                className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${pickupType === "custom"
                                    ? "bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-xs"
                                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                                    }`}
                            >
                                <MdLocationOn className="text-base" />
                                Ramassage Personnalisé (Adresse)
                            </button>
                        </div>

                        {pickupType === "magasin" ? (
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                                        Sélectionner un Magasin
                                    </label>
                                    <select
                                        value={selectedMagasinId || ""}
                                        onChange={(e) => handleSelectMagasin(Number(e.target.value))}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-900/60 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                                    >
                                        {filteredMagasins.map(m => (
                                            <option key={m.id} value={m.id}>
                                                {m.name} • {m.wilaya || "Algérie"} ({m.address || "Adresse"})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                                        Nom Expéditeur / Lieu de départ
                                    </label>
                                    <input
                                        type="text"
                                        value={pickupName}
                                        onChange={(e) => setPickupName(e.target.value)}
                                        placeholder="Ex: Maison Mère ou Dépôt Central"
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-900/60 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                                        Adresse de Ramassage
                                    </label>
                                    <input
                                        type="text"
                                        value={pickupAddress}
                                        onChange={(e) => setPickupAddress(e.target.value)}
                                        placeholder="Ex: Centre-ville, Tlemcen"
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-900/60 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Departure GPS Preview */}
                        <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/20 rounded-xl border border-emerald-200/60 dark:border-emerald-900/30 flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-300">
                            <div className="flex items-center gap-2">
                                <span className="font-bold">Coordonnées Départ :</span>
                                <span className="font-mono text-[11px] font-semibold">
                                    {pickupLat ? `${pickupLat.toFixed(5)}, ${pickupLng?.toFixed(5)}` : "Non positionné"}
                                </span>
                            </div>
                            <span className="text-[10px] text-emerald-500 font-semibold">(Cliquez sur la carte pour ajuster)</span>
                        </div>
                    </div>
                    {/* SECTION 1: DESTINATAIRE (CLIENT) */}
                    <div className="bg-white dark:bg-[#111318] p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 shadow-xs space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800/60">
                            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
                                <span className="w-6 h-6 rounded-lg bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 flex items-center justify-center text-xs">
                                    📍
                                </span>
                                <span>2. (Point B)Client & Destination (Arrivée)</span>
                            </div>

                            <button
                                type="button"
                                onClick={() => setActiveMapMode("destination")}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${activeMapMode === "destination"
                                    ? "bg-rose-500 text-white shadow-sm"
                                    : "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200"
                                    }`}
                            >
                                <span>Pointeur GPS</span>
                                {activeMapMode === "destination" && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                                    Nom / Identifiant Client <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative">
                                    <MdPerson className="absolute left-3 top-2.5 text-slate-400 text-base" />
                                    <input
                                        type="text"
                                        required
                                        value={clientName}
                                        onChange={(e) => setClientName(e.target.value)}
                                        placeholder="Ex: Client#1 ou Karim Benali"
                                        className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-zinc-900/60 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-rose-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                                    Numéro de Téléphone <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative">
                                    <MdPhone className="absolute left-3 top-2.5 text-slate-400 text-base" />
                                    <input
                                        type="tel"
                                        required
                                        value={clientPhone}
                                        onChange={(e) => setClientPhone(e.target.value)}
                                        placeholder="Ex: 0655123456"
                                        className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-zinc-900/60 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-rose-500"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                                    Wilaya
                                </label>
                                <select
                                    value={clientWilaya}
                                    onChange={(e) => setClientWilaya(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-900/60 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-rose-500"
                                >
                                    {Wilaya.map(w => (
                                        <option key={w.id} value={`${w.id} - ${w.name}`}>{w.id} - {w.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                                    Adresse / Repère Livraison
                                </label>
                                <div className="relative">
                                    <MdLocationOn className="absolute left-3 top-2.5 text-slate-400 text-base" />
                                    <input
                                        type="text"
                                        value={clientAddress}
                                        onChange={(e) => setClientAddress(e.target.value)}
                                        placeholder="Ex: Cité 500 logts, Bâtiment B, Tlemcen"
                                        className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-zinc-900/60 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-rose-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Client GPS Preview */}
                        <div className="p-3 bg-rose-50/60 dark:bg-rose-950/20 rounded-xl border border-rose-200/60 dark:border-rose-900/30 flex items-center justify-between text-xs text-rose-700 dark:text-rose-300">
                            <div className="flex items-center gap-2">
                                <span className="font-bold">Coordonnées GPS Client :</span>
                                <span className="font-mono text-[11px] font-semibold">
                                    {clientLat ? `${clientLat.toFixed(5)}, ${clientLng?.toFixed(5)}` : "Non positionné"}
                                </span>
                            </div>
                            <span className="text-[10px] text-rose-500 font-semibold">(Cliquez sur la carte pour ajuster)</span>
                        </div>
                    </div>
                    {/* SECTION 3: ARTICLES, COLIS & PRIX */}
                    <div className="bg-white dark:bg-[#111318] p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 shadow-xs space-y-4">
                        <div className="pb-3 border-b border-slate-100 dark:border-zinc-800/60 text-slate-900 dark:text-white font-bold text-sm flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 flex items-center justify-center text-xs">
                                💰
                            </span>
                            <span>3. Colis & Tarification</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                                    Description Colis / Articles
                                </label>
                                <div className="relative">
                                    <MdDescription className="absolute left-3 top-2.5 text-slate-400 text-base" />
                                    <input
                                        type="text"
                                        value={specific}
                                        onChange={(e) => setSpecific(e.target.value)}
                                        placeholder="Ex: 1x Pizza Royale + 1x Jus"
                                        className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-zinc-900/60 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                                    Type de Livraison
                                </label>
                                <select
                                    value={typeLivraison}
                                    onChange={(e) => setTypeLivraison(e.target.value as any)}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-900/60 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                                >
                                    <option value="classique">Classique (Standard)</option>
                                    <option value="premium">Premium (Prioritaire)</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                                    Nombre d&apos;articles
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={itemss}
                                    onChange={(e) => setItemss(Number(e.target.value))}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-900/60 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                                    Prix Marchandises (DZD)
                                </label>
                                <div className="relative">
                                    <MdAttachMoney className="absolute left-3 top-2.5 text-slate-400 text-base" />
                                    <input
                                        type="number"
                                        min="0"
                                        step="50"
                                        value={totalPrice}
                                        onChange={(e) => setTotalPrice(Number(e.target.value))}
                                        className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-zinc-900/60 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                                    Frais de Livraison (DZD)
                                </label>
                                <div className="relative">
                                    <MdAttachMoney className="absolute left-3 top-2.5 text-slate-400 text-base" />
                                    <input
                                        type="number"
                                        min="0"
                                        step="50"
                                        value={deliveryPrice}
                                        onChange={(e) => setDeliveryPrice(Number(e.target.value))}
                                        className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-zinc-900/60 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 4: ASSIGNATION LIVREUR & DISPATCH */}
                    <div className="bg-white dark:bg-[#111318] p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 shadow-xs space-y-4">
                        <div className="pb-3 border-b border-slate-100 dark:border-zinc-800/60 text-slate-900 dark:text-white font-bold text-sm flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 flex items-center justify-center text-xs">
                                🛵
                            </span>
                            <span>4. Assignation & Dispatch</span>
                        </div>

                        {/* Dispatch Mode Selector */}
                        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-zinc-900 rounded-xl">
                            <button
                                type="button"
                                onClick={() => setDispatchMode("direct")}
                                className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${dispatchMode === "direct"
                                    ? "bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-xs"
                                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                                    }`}
                            >
                                <MdCheckCircle />
                                Assigner Directement à un Livreur
                            </button>
                            <button
                                type="button"
                                onClick={() => setDispatchMode("broadcast")}
                                className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${dispatchMode === "broadcast"
                                    ? "bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-xs"
                                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                                    }`}
                            >
                                <MdRoute />
                                Diffuser aux Livreurs Proches (3 km)
                            </button>
                        </div>

                        {dispatchMode === "direct" ? (
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                                        Sélectionner le Livreur
                                    </label>
                                    <select
                                        value={selectedLivreurId || ""}
                                        onChange={(e) => setSelectedLivreurId(Number(e.target.value))}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-900/60 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                                    >
                                        <option value="">-- Choisir un livreur --</option>
                                        {filteredLivreurs.map(l => {
                                            const name = `${l.user?.first_name || ''} ${l.user?.last_name || l.user?.username || `Livreur #${l.id}`}`;
                                            const isOnline = l.is_available && !(l.is_blocked || l.user?.bloquer);
                                            const cmdCount = l.user?.nbr_commandes ?? l.delivered_orders_count ?? 0;
                                            return (
                                                <option key={l.id} value={l.id}>
                                                    {isOnline ? "🟢 EN LIGNE" : "⚪ HORS LIGNE"} • {name} ({l.user?.phone || 'Sans tel'}) • {cmdCount} cmd livrée(s)
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 bg-indigo-50/60 dark:bg-indigo-950/20 rounded-xl border border-indigo-200/60 dark:border-indigo-900/30 text-xs text-indigo-700 dark:text-indigo-300 space-y-1">
                                <p className="font-bold flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                                    Diffusion automatique dans la zone de 3 km
                                </p>
                                <p className="text-[11px] text-indigo-600/80 dark:text-indigo-300/80">
                                    La commande sera envoyée instantanément à tous les livreurs disponibles autour du point de départ. Le premier livreur à accepter sera assigné.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Interactive Map & Live Summary (5 Cols) */}
                <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24 min-w-0 max-w-full">

                    {/* Interactive Map Box */}
                    <div className="bg-white dark:bg-[#111318] p-4 rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 shadow-xs space-y-3 min-w-0 max-w-full overflow-hidden">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-blue-500" />
                                Carte de Trajet & Localisation
                            </h2>
                            <span className="text-[10px] text-slate-400 font-semibold">GPS Haute Précision</span>
                        </div>

                        {/* Interactive Leaflet Map Component */}
                        <div className="h-[380px] w-full min-w-0 max-w-full relative rounded-2xl overflow-hidden">
                            <MapPointPicker
                                departureLat={pickupLat}
                                departureLng={pickupLng}
                                departureLabel={pickupName}
                                destinationLat={clientLat}
                                destinationLng={clientLng}
                                destinationLabel={clientName}
                                activeMode={activeMapMode}
                                onSelectDeparture={handleSelectDeparturePoint}
                                onSelectDestination={handleSelectDestinationPoint}
                            />
                        </div>

                        {/* Route Distance & Duration Metric Badges */}
                        <div className="grid grid-cols-2 gap-3 pt-2">
                            <div className="p-3 bg-slate-50 dark:bg-zinc-900/60 rounded-xl border border-slate-200/60 dark:border-zinc-800 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 flex items-center justify-center text-base">
                                    <MdRoute />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Distance Trajet</p>
                                    <p className="text-sm font-black text-slate-900 dark:text-white">{distanceKm} km</p>
                                </div>
                            </div>

                            <div className="p-3 bg-slate-50 dark:bg-zinc-900/60 rounded-xl border border-slate-200/60 dark:border-zinc-800 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 flex items-center justify-center text-base">
                                    <MdOutlineTimer />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Temps Estimé</p>
                                    <p className="text-sm font-black text-slate-900 dark:text-white">{estimatedTimeMin} min</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Order Summary & Submit Button Box */}
                    <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-xl space-y-4 border border-slate-800">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                            <h3 className="text-sm font-bold tracking-tight">Récapitulatif de la Commande</h3>
                            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase">
                                En Direct
                            </span>
                        </div>

                        <div className="space-y-2 text-xs">
                            <div className="flex items-center justify-between text-slate-400">
                                <span>Client :</span>
                                <span className="font-bold text-white truncate max-w-[180px]">{clientName} ({clientPhone || "Sans tél"})</span>
                            </div>
                            <div className="flex items-center justify-between text-slate-400">
                                <span>Point de départ :</span>
                                <span className="font-bold text-emerald-400 truncate max-w-[180px]">{pickupName || "Départ"}</span>
                            </div>
                            <div className="flex items-center justify-between text-slate-400">
                                <span>Livreur :</span>
                                <span className="font-bold text-indigo-400 truncate max-w-[180px]">
                                    {dispatchMode === "direct"
                                        ? (livreurs.find(l => l.id === selectedLivreurId)?.user?.first_name || `Livreur #${selectedLivreurId || 'Non choisi'}`)
                                        : "Diffusion 3 km"}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-slate-400">
                                <span>Marchandises :</span>
                                <span className="font-bold text-white">{totalPrice} DZD</span>
                            </div>
                            <div className="flex items-center justify-between text-slate-400">
                                <span>Frais de livraison :</span>
                                <span className="font-bold text-white">{deliveryPrice} DZD</span>
                            </div>
                            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-sm">
                                <span className="font-extrabold text-slate-200">Total Commande :</span>
                                <span className="font-black text-emerald-400 text-base">{Number(totalPrice) + Number(deliveryPrice)} DZD</span>
                            </div>
                        </div>

                        {/* Submit Order Button */}
                        <button
                            type="submit"
                            disabled={submitting || loadingData}
                            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-sm rounded-xl shadow-lg transition-all transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                            {submitting ? (
                                <>
                                    <TbLoader3 className="animate-spin text-lg" />
                                    <span>Création & Assignation en cours...</span>
                                </>
                            ) : (
                                <>
                                    <MdCheckCircle className="text-lg" />
                                    <span>Créer & Valider la Commande</span>
                                </>
                            )}
                        </button>
                    </div>

                </div>

            </form>
        </div>
    );
}
