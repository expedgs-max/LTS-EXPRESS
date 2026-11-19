"use client";

import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { modifyGeo } from '@/lib/super_action';
import { getCity } from '@/lib/tutorial_api';
import { TbLoader3 } from 'react-icons/tb';
import { MdClose, MdMyLocation, MdMap, MdCheck } from 'react-icons/md';
import ShowMap from '../map_dialogue';

export default function AddGeo({ id, onEvent }: { id: number; onEvent: (value: false) => void }) {
    const [city, setCity] = useState<string>("");
    const [latitude, setLatitude] = useState<number | null>(null);
    const [longitude, setLongitude] = useState<number | null>(null);
    const [isLocating, setIsLocating] = useState<boolean>(false);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [isManual, setIsManual] = useState<number[] | null>(null);

    const router = useRouter();

    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            toast.error("La géolocalisation n'est pas supportée par ce navigateur.");
            return;
        }

        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude: lat, longitude: lng } = position.coords;
                setLatitude(lat);
                setLongitude(lng);

                try {
                    const res = await getCity({ latitude: lat, longitude: lng });
                    if (res?.city) {
                        setCity(res.city);
                    }
                    toast.success("Position GPS détectée !");
                } catch {
                    toast.error("Impossible de récupérer le nom de la ville.");
                } finally {
                    setIsLocating(false);
                }
            },
            () => {
                setIsLocating(false);
                toast.error("Permission de géolocalisation refusée.");
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const handleManualLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude: lat, longitude: lng } = position.coords;
                    setLatitude(lat);
                    setLongitude(lng);
                    setIsManual([lat, lng]);
                },
                () => {
                    const fallbackLat = latitude || 35.6987;
                    const fallbackLng = longitude || -0.6349;
                    setIsManual([fallbackLat, fallbackLng]);
                },
                { timeout: 5000 }
            );
        } else {
            const fallbackLat = latitude || 35.6987;
            const fallbackLng = longitude || -0.6349;
            setIsManual([fallbackLat, fallbackLng]);
        }
    };

    const handleManual = async ({ latitude: lat, longitude: lng }: { latitude: number; longitude: number }) => {
        try {
            setLatitude(lat);
            setLongitude(lng);
            setIsManual(null);
            setIsLocating(true);

            const cityRes = await getCity({ latitude: lat, longitude: lng });
            if (cityRes?.city) {
                setCity(cityRes.city);
            }
            toast.success("Position choisie sur la carte !");
        } catch {
            toast.error("Problème de connexion.");
        } finally {
            setIsLocating(false);
        }
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (latitude === null || longitude === null) {
            toast.error("Veuillez d'abord définir la localisation (Auto ou Manuelle).");
            return;
        }

        const finalCity = city.trim() || "Algérie";
        setIsSubmitting(true);

        try {
            const res = await modifyGeo({ id, long: longitude, lat: latitude, wilaya: finalCity });
            if (res) {
                toast.success("Localisation enregistrée avec succès !");
                router.refresh();
                onEvent(false);
            } else {
                toast.error("Échec de l'enregistrement de la localisation.");
            }
        } catch (error) {
            toast.error("Une erreur s'est produite lors de l'enregistrement.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const canSubmit = latitude !== null && longitude !== null && !isLocating && !isSubmitting;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
            <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 overflow-hidden">
                {/* Close Button */}
                <button
                    onClick={() => onEvent(false)}
                    className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all"
                >
                    <MdClose className="text-xl" />
                </button>

                <h1 className="text-xl font-bold text-slate-900 dark:text-white text-center mb-6">
                    Définir la localisation
                </h1>

                {/* Mode Switcher Buttons */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                    <button
                        type="button"
                        onClick={handleGetLocation}
                        disabled={isLocating}
                        className="flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-2xl shadow-lg hover:shadow-blue-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                    >
                        <MdMyLocation className="text-lg shrink-0" />
                        <span>{isLocating ? "Détection..." : "Auto (GPS)"}</span>
                    </button>
                    <button
                        type="button"
                        onClick={handleManualLocation}
                        disabled={isLocating}
                        className="flex items-center justify-center gap-2 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm rounded-2xl shadow-lg hover:shadow-slate-700/25 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                    >
                        <MdMap className="text-lg shrink-0" />
                        <span>Carte (Manuel)</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                                Latitude
                            </label>
                            <input
                                type="text"
                                readOnly
                                name="latitude"
                                placeholder="Latitude"
                                value={latitude !== null ? latitude : ""}
                                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                                Longitude
                            </label>
                            <input
                                type="text"
                                readOnly
                                name="longitude"
                                placeholder="Longitude"
                                value={longitude !== null ? longitude : ""}
                                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                            Wilaya / Ville
                        </label>
                        <input
                            type="text"
                            name="wilaya"
                            placeholder="Wilaya ou Ville (ex: Tlemcen, Alger, Oran)"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        />
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={!canSubmit}
                        className="w-full flex items-center justify-center gap-2 py-3 px-5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-400 text-white font-bold text-sm rounded-2xl shadow-xl hover:shadow-emerald-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:scale-100 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <div className="flex items-center gap-2">
                                <TbLoader3 className="animate-spin text-xl" />
                                <span>Enregistrement en cours...</span>
                            </div>
                        ) : isLocating ? (
                            <div className="flex items-center gap-2">
                                <TbLoader3 className="animate-spin text-xl" />
                                <span>Détection en cours...</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <MdCheck className="text-lg" />
                                <span>{latitude !== null ? "Valider la localisation" : "En attente de localisation..."}</span>
                            </div>
                        )}
                    </button>
                </form>
            </div>

            {isManual && (
                <ShowMap local={isManual} onSub={handleManual} />
            )}
        </div>
    );
}