/* eslint-disable */
"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { MdSearch, MdClose, MdMyLocation, MdPlace, MdCheck } from "react-icons/md";
import { toast } from "react-hot-toast";

interface MapProps {
    localisation: number[];
    onSub: ({ latitude, longitude }: { latitude: number; longitude: number }) => void;
}

// Helper to safely parse and normalize coordinates
function parseCoordinates(rawCoords: number[]): { lat: number; lng: number } {
    const DEFAULT_LOCATION = { lat: 35.6987, lng: -0.6349 }; // Oran, Algérie

    if (!Array.isArray(rawCoords) || rawCoords.length < 2) {
        return DEFAULT_LOCATION;
    }

    let c0 = Number(rawCoords[0]);
    let c1 = Number(rawCoords[1]);

    if (isNaN(c0) || isNaN(c1) || (c0 === 0 && c1 === 0)) {
        return DEFAULT_LOCATION;
    }

    let lat = c0;
    let lng = c1;

    // Case 1: c0 cannot be a valid latitude (latitude must be between -90 and +90)
    // Example: [120.595, 27.963] -> c0 is clearly longitude!
    if (Math.abs(c0) > 90 && Math.abs(c1) <= 90) {
        lat = c1;
        lng = c0;
    }
    // Case 2: In Algeria/North Africa context:
    // Algeria latitudes are ~ 18° to 38°, longitudes are ~ -9° to 12°.
    // If c0 is longitude (< 15) and c1 is latitude (>= 18 && <= 38), swap [lng, lat]
    else if (Math.abs(c0) <= 15 && c1 >= 18 && c1 <= 38) {
        lat = c1;
        lng = c0;
    }
    // Case 3: If c0 is latitude (>= 18 && <= 38) and c1 is longitude (< 15)
    else if (c0 >= 18 && c0 <= 38 && Math.abs(c1) <= 15) {
        lat = c0;
        lng = c1;
    }

    // Safety fallback if still outside valid Earth projection bounds
    if (Math.abs(lat) > 85.05 || Math.abs(lng) > 180) {
        return DEFAULT_LOCATION;
    }

    return { lat, lng };
}

export default function MapGl({ localisation, onSub }: MapProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const mapInstanceRef = useRef<any>(null);
    const markerRef = useRef<any>(null);

    const [isClient, setIsClient] = useState(false);
    const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number }>(() =>
        parseCoordinates(localisation)
    );

    const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "AIzaSyADbCd4JrhQl2FKvXE2E--iXiCZSfXMjlY";

    // Update coordinates when `localisation` prop changes
    useEffect(() => {
        setIsClient(true);
        const parsed = parseCoordinates(localisation);
        setCurrentCoords(parsed);

        // If map is already initialized, pan to new position and move marker
        if (mapInstanceRef.current && markerRef.current && window.google?.maps) {
            const newPos = new window.google.maps.LatLng(parsed.lat, parsed.lng);
            mapInstanceRef.current.panTo(newPos);
            markerRef.current.setPosition(newPos);
            window.google.maps.event.trigger(mapInstanceRef.current, "resize");
        }
    }, [localisation]);

    // Initialize Google Maps
    useEffect(() => {
        if (!isClient || typeof window === "undefined") return;

        const scriptId = "google-maps-script";
        let script = document.getElementById(scriptId) as HTMLScriptElement;

        const initMap = () => {
            if (!mapContainerRef.current || !window.google || !window.google.maps) return;

            const initialCoords = parseCoordinates(localisation);
            const center = { lat: initialCoords.lat, lng: initialCoords.lng };

            const map = new window.google.maps.Map(mapContainerRef.current, {
                center: center,
                zoom: 14,
                mapTypeId: "roadmap",
                disableDefaultUI: false,
                zoomControl: true,
                streetViewControl: false,
                mapTypeControl: true,
                fullscreenControl: false,
                gestureHandling: "greedy",
                scrollwheel: true
            });

            mapInstanceRef.current = map;

            // Trigger resize after modal transition
            setTimeout(() => {
                if (mapInstanceRef.current && window.google?.maps) {
                    window.google.maps.event.trigger(mapInstanceRef.current, "resize");
                    mapInstanceRef.current.setCenter(center);
                }
            }, 200);

            // Create Draggable Pin
            const marker = new window.google.maps.Marker({
                position: center,
                map: map,
                draggable: true,
                animation: window.google.maps.Animation.DROP,
                title: "Déplacer pour choisir la position"
            });

            markerRef.current = marker;

            // Update on drag
            marker.addListener("dragend", () => {
                const pos = marker.getPosition();
                if (pos) {
                    setCurrentCoords({ lat: pos.lat(), lng: pos.lng() });
                }
            });

            // Click anywhere on map to move marker
            map.addListener("click", (e: any) => {
                if (e.latLng) {
                    marker.setPosition(e.latLng);
                    setCurrentCoords({ lat: e.latLng.lat(), lng: e.latLng.lng() });
                }
            });

            // Google Places Autocomplete
            if (searchInputRef.current && window.google.maps.places) {
                const autocomplete = new window.google.maps.places.Autocomplete(searchInputRef.current, {
                    componentRestrictions: { country: "dz" },
                    fields: ["geometry", "name", "formatted_address"]
                });

                autocomplete.bindTo("bounds", map);

                autocomplete.addListener("place_changed", () => {
                    const place = autocomplete.getPlace();
                    if (!place.geometry || !place.geometry.location) {
                        toast.error("Lieu introuvable");
                        return;
                    }

                    const loc = place.geometry.location;
                    map.panTo(loc);
                    map.setZoom(16);
                    marker.setPosition(loc);
                    setCurrentCoords({ lat: loc.lat(), lng: loc.lng() });
                });
            }
        };

        if (window.google && window.google.maps) {
            initMap();
        } else if (!script) {
            script = document.createElement("script");
            script.id = scriptId;
            script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_API_KEY}&libraries=places,geometry&callback=initGoogleMapPickerCallback`;
            script.async = true;
            script.defer = true;
            (window as any).initGoogleMapPickerCallback = () => {
                initMap();
            };
            document.head.appendChild(script);
        } else {
            script.addEventListener("load", initMap);
        }
    }, [isClient, GOOGLE_API_KEY]);

    // Handle Geolocation (Find my position)
    const handleGetMyPosition = () => {
        if (!navigator.geolocation) {
            toast.error("La géolocalisation n'est pas supportée par votre navigateur.");
            return;
        }

        toast.loading("Obtention de votre position GPS...", { id: "gps-loader" });
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                toast.dismiss("gps-loader");
                const userPos = {
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude
                };
                setCurrentCoords(userPos);

                if (mapInstanceRef.current && markerRef.current && window.google?.maps) {
                    const newLatLng = new window.google.maps.LatLng(userPos.lat, userPos.lng);
                    mapInstanceRef.current.panTo(newLatLng);
                    mapInstanceRef.current.setZoom(16);
                    markerRef.current.setPosition(newLatLng);
                }
                toast.success("Position GPS détectée !");
            },
            (err) => {
                toast.dismiss("gps-loader");
                toast.error("Impossible de récupérer votre position GPS.");
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    // Handle submit location
    const handleConfirmLocation = () => {
        if (markerRef.current) {
            const pos = markerRef.current.getPosition();
            if (pos) {
                onSub({ latitude: pos.lat(), longitude: pos.lng() });
                toast.success("Localisation définie avec succès !");
                return;
            }
        }
        onSub({ latitude: currentCoords.lat, longitude: currentCoords.lng });
        toast.success("Localisation définie avec succès !");
    };

    if (!isClient) {
        return null;
    }

    return (
        <div className="relative w-full h-[520px] rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 font-sans">
            {/* Map Container */}
            <div ref={mapContainerRef} className="w-full h-full" />

            {/* Google Places Search Box & GPS Button */}
            <div className="absolute top-3 left-3 right-3 z-10 flex items-center gap-2 max-w-lg">
                <div className="flex-1 flex items-center gap-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3 py-2 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700">
                    <MdSearch className="text-blue-500 text-lg shrink-0" />
                    <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Rechercher une adresse ou ville (Google Places)..."
                        className="w-full bg-transparent text-xs text-slate-800 dark:text-white placeholder:text-slate-400 outline-none font-medium"
                    />
                </div>

                {/* Current Position GPS Button */}
                <button
                    onClick={handleGetMyPosition}
                    title="Ma position actuelle"
                    className="p-2.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md text-slate-700 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 transition-all hover:scale-105 active:scale-95 shrink-0"
                >
                    <MdMyLocation className="text-lg" />
                </button>
            </div>

            {/* Floating GPS Info & Submit Button Bar at bottom */}
            <div className="absolute bottom-4 left-4 right-4 z-10 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <MdPlace className="text-rose-500 text-lg shrink-0" />
                    <span>
                        GPS : <strong className="text-slate-900 dark:text-white">{currentCoords.lat.toFixed(6)}, {currentCoords.lng.toFixed(6)}</strong>
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal hidden md:inline">
                        (Cliquez ou glissez le repère rouge pour ajuster)
                    </span>
                </div>

                <button
                    onClick={handleConfirmLocation}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg hover:shadow-blue-500/25 transition-all hover:scale-105 active:scale-95"
                >
                    <MdCheck className="text-base" />
                    Définir cette localisation
                </button>
            </div>
        </div>
    );
}

