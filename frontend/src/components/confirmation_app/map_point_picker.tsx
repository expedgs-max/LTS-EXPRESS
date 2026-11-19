"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MdFullscreen, MdClose, MdSearch, MdLocationOn } from "react-icons/md";
import { TbLoader3 } from "react-icons/tb";
import { toast } from "react-hot-toast";
import { Wilaya } from "@/lib/tools/named";
import { resolveWilayaCoords } from "@/components/confirmation_app/dispatch_map";
import "leaflet/dist/leaflet.css";

type MapPointPickerProps = {
    departureLat?: number;
    departureLng?: number;
    departureLabel?: string;
    destinationLat?: number;
    destinationLng?: number;
    destinationLabel?: string;
    activeMode: "departure" | "destination";
    onSelectDeparture: (lat: number, lng: number) => void;
    onSelectDestination: (lat: number, lng: number) => void;
};

// =========================================================================
// MODAL MAP PICKER (Rendered via React Portal directly at document.body level)
// =========================================================================
function ModalMapPicker({
    departureLat,
    departureLng,
    departureLabel,
    destinationLat,
    destinationLng,
    destinationLabel,
    activeMode: initialActiveMode,
    onSelectDeparture,
    onSelectDestination,
    onClose,
}: {
    departureLat?: number;
    departureLng?: number;
    departureLabel?: string;
    destinationLat?: number;
    destinationLng?: number;
    destinationLabel?: string;
    activeMode: "departure" | "destination";
    onSelectDeparture: (lat: number, lng: number) => void;
    onSelectDestination: (lat: number, lng: number) => void;
    onClose: () => void;
}) {
    const [currentMode, setCurrentMode] = useState<"departure" | "destination">(initialActiveMode);
    const [selectedWilaya, setSelectedWilaya] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);

    const modalContainerRef = useRef<HTMLDivElement>(null);
    const modalMapRef = useRef<any>(null);
    const depMarkerRef = useRef<any>(null);
    const destMarkerRef = useRef<any>(null);
    const polylineRef = useRef<any>(null);

    // Default center coords
    const defaultLat = destinationLat || departureLat || 34.8783;
    const defaultLng = destinationLng || departureLng || -1.3167;

    // Lock body scroll
    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = "unset";
        };
    }, []);

    // Handle Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    // Initialize Modal Leaflet Map with Google Maps
    useEffect(() => {
        if (!modalContainerRef.current) return;
        let isMounted = true;

        const init = async () => {
            const L = (await import("leaflet")).default;
            if (!isMounted || !modalContainerRef.current) return;

            delete (L.Icon.Default.prototype as any)._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
                iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
                shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
            });

            if (!modalMapRef.current) {
                const map = L.map(modalContainerRef.current, {
                    center: [defaultLat, defaultLng],
                    zoom: 14,
                    zoomControl: true,
                    attributionControl: false,
                });

                // Google Maps Roadmap Tiles
                L.tileLayer("https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}", {
                    maxZoom: 20,
                    subdomains: ["mt0", "mt1", "mt2", "mt3"],
                }).addTo(map);

                modalMapRef.current = map;

                setTimeout(() => {
                    if (modalMapRef.current) {
                        modalMapRef.current.invalidateSize();
                    }
                }, 150);
            }
        };

        init();

        return () => {
            isMounted = false;
            if (modalMapRef.current) {
                modalMapRef.current.remove();
                modalMapRef.current = null;
            }
        };
    }, []);

    // Handle map click: Places the active marker (Client or Departure)
    useEffect(() => {
        if (!modalMapRef.current) return;
        const map = modalMapRef.current;

        const handleMapClick = (e: any) => {
            const { lat, lng } = e.latlng;
            if (currentMode === "departure") {
                onSelectDeparture(lat, lng);
                toast.success(`Point de départ positionné : (${lat.toFixed(4)}, ${lng.toFixed(4)})`, { id: "pos_dep" });
            } else {
                onSelectDestination(lat, lng);
                toast.success(`Position client positionnée : (${lat.toFixed(4)}, ${lng.toFixed(4)})`, { id: "pos_dest" });
            }
        };

        map.on("click", handleMapClick);
        return () => {
            map.off("click", handleMapClick);
        };
    }, [currentMode, onSelectDeparture, onSelectDestination]);

    // Update Markers & Polyline
    useEffect(() => {
        if (!modalMapRef.current) return;

        const updateMarkers = async () => {
            const L = (await import("leaflet")).default;
            const map = modalMapRef.current;

            const greenIcon = L.divIcon({
                className: "custom-div-icon",
                html: `
                    <div style="background-color: #10b981; width: 38px; height: 38px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.35); font-size: 18px;">
                        📦
                    </div>
                `,
                iconSize: [38, 38],
                iconAnchor: [19, 38],
                popupAnchor: [0, -38],
            });

            const redIcon = L.divIcon({
                className: "custom-div-icon",
                html: `
                    <div style="background-color: #f43f5e; width: 38px; height: 38px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.35); font-size: 18px;">
                        📍
                    </div>
                `,
                iconSize: [38, 38],
                iconAnchor: [19, 38],
                popupAnchor: [0, -38],
            });

            // Departure Marker
            if (departureLat && departureLng) {
                if (depMarkerRef.current) {
                    depMarkerRef.current.setLatLng([departureLat, departureLng]);
                } else {
                    depMarkerRef.current = L.marker([departureLat, departureLng], {
                        icon: greenIcon,
                        draggable: true,
                    }).addTo(map);

                    depMarkerRef.current.on("dragend", (event: any) => {
                        const pos = event.target.getLatLng();
                        onSelectDeparture(pos.lat, pos.lng);
                    });
                }
                depMarkerRef.current.bindPopup(`<b>Départ :</b> ${departureLabel || 'Départ'}`).openPopup();
            } else if (depMarkerRef.current) {
                map.removeLayer(depMarkerRef.current);
                depMarkerRef.current = null;
            }

            // Destination Marker
            if (destinationLat && destinationLng) {
                if (destMarkerRef.current) {
                    destMarkerRef.current.setLatLng([destinationLat, destinationLng]);
                } else {
                    destMarkerRef.current = L.marker([destinationLat, destinationLng], {
                        icon: redIcon,
                        draggable: true,
                    }).addTo(map);

                    destMarkerRef.current.on("dragend", (event: any) => {
                        const pos = event.target.getLatLng();
                        onSelectDestination(pos.lat, pos.lng);
                    });
                }
                destMarkerRef.current.bindPopup(`<b>Arrivée (Client) :</b> ${destinationLabel || 'Client'}`).openPopup();
            } else if (destMarkerRef.current) {
                map.removeLayer(destMarkerRef.current);
                destMarkerRef.current = null;
            }

            // Draw connecting route polyline
            if (departureLat && departureLng && destinationLat && destinationLng) {
                const latlngs = [
                    [departureLat, departureLng],
                    [destinationLat, destinationLng],
                ];

                if (polylineRef.current) {
                    polylineRef.current.setLatLngs(latlngs);
                } else {
                    polylineRef.current = L.polyline(latlngs as any, {
                        color: "#3b82f6",
                        weight: 4,
                        dashArray: "6, 8",
                        opacity: 0.85,
                    }).addTo(map);
                }
            } else if (polylineRef.current) {
                map.removeLayer(polylineRef.current);
                polylineRef.current = null;
            }
        };

        updateMarkers();
    }, [departureLat, departureLng, destinationLat, destinationLng, departureLabel, destinationLabel, onSelectDeparture, onSelectDestination]);

    // Center map on selected Wilaya
    const handleWilayaSelect = (val: string) => {
        setSelectedWilaya(val);
        if (!val || !modalMapRef.current) return;
        const coords = resolveWilayaCoords(val);
        if (coords) {
            modalMapRef.current.setView(coords, 13);
            toast.success(`Centré sur la wilaya : ${val}`, { id: "wilaya_center" });
        }
    };

    // Address / Place Search
    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        setIsSearching(true);
        try {
            const query = `${searchQuery.trim()}, Algérie`;
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&accept-language=fr,ar`);
            const data = await res.json();

            if (data && data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lon = parseFloat(data[0].lon);
                if (modalMapRef.current) {
                    modalMapRef.current.setView([lat, lon], 16);
                }
                const name = data[0].display_name.split(",")[0];
                toast.success(`Lieu trouvé : ${name}`, { id: "place_found" });
            } else {
                toast.error("Aucun lieu trouvé pour cette recherche en Algérie.", { id: "place_err" });
            }
        } catch (err) {
            console.error("Search error:", err);
            toast.error("Erreur lors de la recherche du lieu.", { id: "place_err" });
        } finally {
            setIsSearching(false);
        }
    };

    // Fit Route
    const handleFitRoute = async () => {
        if (!modalMapRef.current || !departureLat || !departureLng || !destinationLat || !destinationLng) return;
        const L = (await import("leaflet")).default;
        const bounds = L.latLngBounds([
            [departureLat, departureLng],
            [destinationLat, destinationLng],
        ]);
        modalMapRef.current.fitBounds(bounds, { padding: [60, 60] });
    };

    // Geolocation: My Location
    const handleUseMyLocation = () => {
        if (!navigator.geolocation) {
            alert("La géolocalisation n'est pas supportée par votre navigateur.");
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                if (currentMode === "departure") {
                    onSelectDeparture(latitude, longitude);
                } else {
                    onSelectDestination(latitude, longitude);
                }
                if (modalMapRef.current) {
                    modalMapRef.current.setView([latitude, longitude], 16);
                }
            },
            (err) => alert(`Erreur de géolocalisation: ${err.message}`),
            { enableHighAccuracy: true }
        );
    };

    return (
        <div className="fixed inset-0 z-[999999] bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 md:p-7 animate-in fade-in duration-200">
            <style jsx global>{`
                .leaflet-control-attribution {
                    display: none !important;
                }
                .target-placement-active,
                .target-placement-active .leaflet-container,
                .target-placement-active .leaflet-grab,
                .target-placement-active .leaflet-pane {
                    cursor: crosshair !important;
                }
            `}</style>

            <div className="w-full max-w-6xl h-[90vh] bg-white dark:bg-[#111318] rounded-3xl shadow-2xl border border-slate-200 dark:border-zinc-800 flex flex-col overflow-hidden">
                {/* Header Bar */}
                <div className="px-5 py-3.5 bg-white dark:bg-[#111318] border-b border-slate-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 flex items-center justify-center text-xl shrink-0">
                            🗺️
                        </div>
                        <div>
                            <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                                Fenêtre Carte — Mode Agrandie
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                                    Google Maps
                                </span>
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Utilisez la barre de recherche ou cliquez directement pour positionner
                            </p>
                        </div>
                    </div>

                    {/* Mode Toggle & Navigation Tools */}
                    <div className="flex items-center gap-2.5 flex-wrap">
                        {/* Search Bar */}
                        <form onSubmit={handleSearch} className="relative flex items-center">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Rechercher rue, quartier, ville..."
                                className="pl-8 pr-7 py-1.5 bg-slate-100 dark:bg-zinc-800 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 w-44 sm:w-56 focus:outline-none focus:border-indigo-500 transition-all"
                            />
                            <MdSearch className="absolute left-2.5 text-slate-400 text-base" />
                            {isSearching ? (
                                <TbLoader3 className="absolute right-2.5 text-indigo-500 animate-spin text-sm" />
                            ) : searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery("")}
                                    className="absolute right-2 text-slate-400 hover:text-slate-600 text-xs"
                                >
                                    ✕
                                </button>
                            )}
                        </form>

                        {/* Wilaya Selector Dropdown */}
                        <select
                            value={selectedWilaya}
                            onChange={(e) => handleWilayaSelect(e.target.value)}
                            className="px-2.5 py-1.5 bg-slate-100 dark:bg-zinc-800 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                        >
                            <option value="">-- Wilaya --</option>
                            {Wilaya.map((w) => (
                                <option key={w.id} value={`${w.id} - ${w.name}`}>
                                    {w.id} - {w.name} ({w.ar_name})
                                </option>
                            ))}
                        </select>

                        {/* Selection Mode Switcher */}
                        <div className="flex items-center p-1 bg-slate-100 dark:bg-zinc-800 rounded-xl border border-slate-200 dark:border-zinc-700">
                            <button
                                type="button"
                                onClick={() => setCurrentMode("departure")}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                                    currentMode === "departure"
                                        ? "bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-400/40"
                                        : "text-slate-600 dark:text-zinc-400 hover:text-slate-900"
                                }`}
                            >
                                <span>📦 Départ</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setCurrentMode("destination")}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                                    currentMode === "destination"
                                        ? "bg-rose-600 text-white shadow-sm ring-2 ring-rose-400/40"
                                        : "text-slate-600 dark:text-zinc-400 hover:text-slate-900"
                                }`}
                            >
                                <span>📍 Client (Arrivée)</span>
                            </button>
                        </div>

                        {departureLat && destinationLat && (
                            <button
                                type="button"
                                onClick={handleFitRoute}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 font-semibold rounded-xl text-xs transition-all flex items-center gap-1"
                            >
                                🔍 Trajet
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={handleUseMyLocation}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-1 shadow-xs"
                        >
                            📍 Ma position
                        </button>

                        <button
                            type="button"
                            onClick={onClose}
                            className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 rounded-xl transition-all"
                            title="Fermer la fenêtre (Échap)"
                        >
                            <MdClose className="text-xl" />
                        </button>
                    </div>
                </div>

                {/* Map Area */}
                <div className="relative flex-1 w-full h-full min-h-0 overflow-hidden target-placement-active">
                    <div ref={modalContainerRef} className="w-full h-full z-0 cursor-crosshair" />

                    {/* Active Mode Notice Banner */}
                    <div className="absolute top-3 left-3 z-[400] bg-slate-900/90 backdrop-blur-md text-white px-3.5 py-2 rounded-xl text-xs shadow-lg border border-slate-700/80 flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full animate-ping ${currentMode === 'departure' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                        <span className="font-semibold">
                            {currentMode === "departure"
                                ? "🟢 Mode DÉPART actif — Cliquez sur la carte pour définir le point de ramassage"
                                : "🔴 Mode CLIENT actif — Le pointeur (+) est prêt, cliquez sur la carte pour placer la position du client"}
                        </span>
                    </div>

                    {/* Bottom Floating Bar */}
                    <div className="absolute bottom-3 left-3 right-3 z-[400] flex flex-wrap items-center justify-between gap-3 pointer-events-none">
                        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-lg border border-slate-200 dark:border-slate-800 pointer-events-auto flex items-center gap-4">
                            <div className="flex items-center gap-1.5">
                                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                                <span>Départ : {departureLat ? `(${departureLat.toFixed(4)}, ${departureLng?.toFixed(4)})` : "Non défini"}</span>
                            </div>
                            <span className="text-slate-300 dark:text-zinc-700">|</span>
                            <div className="flex items-center gap-1.5">
                                <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
                                <span>Client : {destinationLat ? `(${destinationLat.toFixed(4)}, ${destinationLng?.toFixed(4)})` : "Non défini"}</span>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            className="pointer-events-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-1.5"
                        >
                            ✓ Valider & Retourner
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// =========================================================================
// INLINE MAP COMPONENT (Always fits in its form column)
// =========================================================================
export default function MapPointPicker({
    departureLat,
    departureLng,
    departureLabel = "Départ",
    destinationLat,
    destinationLng,
    destinationLabel = "Client / Arrivée",
    activeMode,
    onSelectDeparture,
    onSelectDestination,
}: MapPointPickerProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);
    const depMarkerRef = useRef<any>(null);
    const destMarkerRef = useRef<any>(null);
    const polylineRef = useRef<any>(null);
    const [leafletLoaded, setLeafletLoaded] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Initial default center: Tlemcen or provided point
    const defaultLat = departureLat || destinationLat || 34.8783;
    const defaultLng = departureLng || destinationLng || -1.3167;

    useEffect(() => {
        if (typeof window === "undefined" || !mapContainerRef.current) return;

        let isMounted = true;

        const initMap = async () => {
            const L = (await import("leaflet")).default;
            if (!isMounted || !mapContainerRef.current) return;

            delete (L.Icon.Default.prototype as any)._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
                iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
                shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
            });

            if (!mapInstanceRef.current) {
                const map = L.map(mapContainerRef.current, {
                    center: [defaultLat, defaultLng],
                    zoom: 13,
                    zoomControl: true,
                    attributionControl: false,
                });

                // Google Maps Roadmap Tiles
                L.tileLayer("https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}", {
                    maxZoom: 20,
                    subdomains: ["mt0", "mt1", "mt2", "mt3"],
                }).addTo(map);

                mapInstanceRef.current = map;
                setLeafletLoaded(true);
            }
        };

        initMap();

        return () => {
            isMounted = false;
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, []);

    // Handle map click events based on active selection mode
    useEffect(() => {
        if (!mapInstanceRef.current || !leafletLoaded) return;

        const map = mapInstanceRef.current;

        const handleMapClick = (e: any) => {
            const { lat, lng } = e.latlng;
            if (activeMode === "departure") {
                onSelectDeparture(lat, lng);
                toast.success(`Point de départ positionné : (${lat.toFixed(4)}, ${lng.toFixed(4)})`, { id: "pos_dep_inline" });
            } else {
                onSelectDestination(lat, lng);
                toast.success(`Position client positionnée : (${lat.toFixed(4)}, ${lng.toFixed(4)})`, { id: "pos_dest_inline" });
            }
        };

        map.on("click", handleMapClick);

        return () => {
            map.off("click", handleMapClick);
        };
    }, [leafletLoaded, activeMode, onSelectDeparture, onSelectDestination]);

    // Update Markers & Polyline
    useEffect(() => {
        if (!mapInstanceRef.current || !leafletLoaded) return;

        const updateMarkers = async () => {
            const L = (await import("leaflet")).default;
            const map = mapInstanceRef.current;

            // Departure Icon (Emerald Green)
            const greenIcon = L.divIcon({
                className: "custom-div-icon",
                html: `
                    <div style="background-color: #10b981; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; border: 3px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.3); font-size: 16px;">
                        📦
                    </div>
                `,
                iconSize: [34, 34],
                iconAnchor: [17, 34],
                popupAnchor: [0, -34],
            });

            // Destination Icon (Rose Red)
            const redIcon = L.divIcon({
                className: "custom-div-icon",
                html: `
                    <div style="background-color: #f43f5e; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; border: 3px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.3); font-size: 16px;">
                        📍
                    </div>
                `,
                iconSize: [34, 34],
                iconAnchor: [17, 34],
                popupAnchor: [0, -34],
            });

            // Handle Departure Marker
            if (departureLat && departureLng) {
                if (depMarkerRef.current) {
                    depMarkerRef.current.setLatLng([departureLat, departureLng]);
                } else {
                    depMarkerRef.current = L.marker([departureLat, departureLng], {
                        icon: greenIcon,
                        draggable: true,
                    }).addTo(map);

                    depMarkerRef.current.on("dragend", (event: any) => {
                        const position = event.target.getLatLng();
                        onSelectDeparture(position.lat, position.lng);
                    });
                }
                depMarkerRef.current.bindPopup(`<b>Départ :</b> ${departureLabel}`).openPopup();
            } else if (depMarkerRef.current) {
                map.removeLayer(depMarkerRef.current);
                depMarkerRef.current = null;
            }

            // Handle Destination Marker
            if (destinationLat && destinationLng) {
                if (destMarkerRef.current) {
                    destMarkerRef.current.setLatLng([destinationLat, destinationLng]);
                } else {
                    destMarkerRef.current = L.marker([destinationLat, destinationLng], {
                        icon: redIcon,
                        draggable: true,
                    }).addTo(map);

                    destMarkerRef.current.on("dragend", (event: any) => {
                        const position = event.target.getLatLng();
                        onSelectDestination(position.lat, position.lng);
                    });
                }
                destMarkerRef.current.bindPopup(`<b>Arrivée (Client) :</b> ${destinationLabel}`).openPopup();
            } else if (destMarkerRef.current) {
                map.removeLayer(destMarkerRef.current);
                destMarkerRef.current = null;
            }

            // Draw line connecting Departure and Destination (WITHOUT auto fitBounds)
            if (departureLat && departureLng && destinationLat && destinationLng) {
                const latlngs = [
                    [departureLat, departureLng],
                    [destinationLat, destinationLng],
                ];

                if (polylineRef.current) {
                    polylineRef.current.setLatLngs(latlngs);
                } else {
                    polylineRef.current = L.polyline(latlngs as any, {
                        color: "#3b82f6",
                        weight: 4,
                        dashArray: "6, 8",
                        opacity: 0.8,
                    }).addTo(map);
                }
            } else if (polylineRef.current) {
                map.removeLayer(polylineRef.current);
                polylineRef.current = null;
            }
        };

        updateMarkers();
    }, [leafletLoaded, departureLat, departureLng, destinationLat, destinationLng, departureLabel, destinationLabel, onSelectDeparture, onSelectDestination]);

    // Manual Fit Route Action
    const handleFitRoute = async () => {
        if (!mapInstanceRef.current || !departureLat || !departureLng || !destinationLat || !destinationLng) return;
        const L = (await import("leaflet")).default;
        const latlngs = [
            [departureLat, departureLng],
            [destinationLat, destinationLng],
        ];
        const bounds = L.latLngBounds(latlngs as any);
        mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
    };

    // Current Geolocation Button Action
    const handleUseMyLocation = () => {
        if (!navigator.geolocation) {
            alert("La géolocalisation n'est pas supportée par votre navigateur.");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                if (activeMode === "departure") {
                    onSelectDeparture(latitude, longitude);
                } else {
                    onSelectDestination(latitude, longitude);
                }
                if (mapInstanceRef.current) {
                    mapInstanceRef.current.setView([latitude, longitude], 15);
                }
            },
            (err) => {
                alert(`Erreur de géolocalisation : ${err.message}`);
            },
            { enableHighAccuracy: true }
        );
    };

    return (
        <>
            <style jsx global>{`
                .leaflet-control-attribution {
                    display: none !important;
                }
                .target-placement-active,
                .target-placement-active .leaflet-container,
                .target-placement-active .leaflet-grab,
                .target-placement-active .leaflet-pane {
                    cursor: crosshair !important;
                }
            `}</style>
            <div className="relative w-full h-full min-h-[380px] max-w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-inner target-placement-active">
                {/* Map Container */}
                <div ref={mapContainerRef} className="w-full h-full min-h-[380px] z-0 cursor-crosshair" />

                {/* Instruction Overlay Banner */}
                <div className="absolute top-3 left-3 right-3 z-[400] flex items-center justify-between gap-2 bg-slate-900/90 backdrop-blur-md text-white px-3.5 py-2 rounded-xl text-xs shadow-lg border border-slate-700/80">
                    <div className="flex items-center gap-2 truncate">
                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 animate-ping ${activeMode === 'departure' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                        <span className="font-semibold truncate text-[11px]">
                            {activeMode === "departure" 
                                ? "🟢 Cliquez pour le DÉPART" 
                                : "🔴 Pointeur CLIENT (+) : Cliquez pour placer"}
                        </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                        <button
                            type="button"
                            onClick={() => setIsFullscreen(true)}
                            title="Agrandir dans une fenêtre"
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-all flex items-center gap-1 text-[11px] shadow-xs"
                        >
                            <MdFullscreen className="text-sm" />
                            <span>Agrandir</span>
                        </button>

                        {departureLat && destinationLat && (
                            <button
                                type="button"
                                onClick={handleFitRoute}
                                title="Voir tout le trajet"
                                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg transition-all text-[11px] border border-slate-600/60"
                            >
                                🔍 Trajet
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={handleUseMyLocation}
                            title="Utiliser ma position GPS"
                            className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-all text-[11px]"
                        >
                            📍 GPS
                        </button>
                    </div>
                </div>

                {/* Legend Overlay at Bottom */}
                <div className="absolute bottom-3 left-3 z-[400] bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1 rounded-xl text-[11px] font-semibold text-slate-700 dark:text-slate-200 shadow-md border border-slate-200 dark:border-slate-800 flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                        <span>Départ {departureLat ? "✓" : "—"}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                        <span>Arrivée {destinationLat ? "✓" : "—"}</span>
                    </div>
                </div>
            </div>

            {/* Enlarged Modal Window (Rendered at Root body via Portal to prevent layout clipping) */}
            {isFullscreen && mounted && typeof document !== "undefined" && createPortal(
                <ModalMapPicker
                    departureLat={departureLat}
                    departureLng={departureLng}
                    departureLabel={departureLabel}
                    destinationLat={destinationLat}
                    destinationLng={destinationLng}
                    destinationLabel={destinationLabel}
                    activeMode={activeMode}
                    onSelectDeparture={onSelectDeparture}
                    onSelectDestination={onSelectDestination}
                    onClose={() => setIsFullscreen(false)}
                />,
                document.body
            )}
        </>
    );
}
