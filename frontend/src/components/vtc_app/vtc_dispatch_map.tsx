/* eslint-disable */
"use client";

import React, { useEffect, useRef, useState } from "react";
import { VtcChauffeur } from "@/lib/chauffeur_action";
import { Wilaya } from "@/lib/tools/named";
import {
    MdMyLocation,
    MdLocalTaxi,
    MdPersonPinCircle,
    MdZoomIn,
    MdZoomOut,
    MdSearch,
    MdClose,
    MdAltRoute,
    MdPhone,
    MdStar,
    MdDirectionsCar,
    MdBlock,
    MdCheckCircle,
    MdLayers,
    MdRefresh
} from "react-icons/md";
import { toast } from "react-hot-toast";

// Algeria 58 Wilayas Coordinates
export const WILAYA_COORDS: Record<string, [number, number]> = {
    "01": [27.8742, -0.2939], "Adrar": [27.8742, -0.2939],
    "02": [36.1652, 1.3345], "Chlef": [36.1652, 1.3345],
    "03": [33.8000, 2.8650], "Laghouat": [33.8000, 2.8650],
    "04": [35.8753, 7.1135], "Oum El Bouaghi": [35.8753, 7.1135],
    "05": [35.5559, 6.1741], "Batna": [35.5559, 6.1741],
    "06": [36.7559, 5.0843], "Béjaïa": [36.7559, 5.0843], "Bejaia": [36.7559, 5.0843],
    "07": [34.8504, 5.7281], "Biskra": [34.8504, 5.7281],
    "08": [31.6167, -2.2167], "Béchar": [31.6167, -2.2167], "Bechar": [31.6167, -2.2167],
    "09": [36.4700, 2.8277], "Blida": [36.4700, 2.8277],
    "10": [36.3749, 3.9010], "Bouira": [36.3749, 3.9010],
    "11": [22.7850, 5.5228], "Tamanrasset": [22.7850, 5.5228],
    "12": [35.4042, 8.1242], "Tébessa": [35.4042, 8.1242], "Tebessa": [35.4042, 8.1242],
    "13": [34.8828, -1.3167], "Tlemcen": [34.8828, -1.3167],
    "14": [35.3710, 1.3170], "Tiaret": [35.3710, 1.3170],
    "15": [36.7118, 4.0459], "Tizi Ouzou": [36.7118, 4.0459],
    "16": [36.7538, 3.0588], "Alger": [36.7538, 3.0588], "Algiers": [36.7538, 3.0588],
    "17": [34.6728, 3.2630], "Djelfa": [34.6728, 3.2630],
    "18": [36.8206, 5.7667], "Jijel": [36.8206, 5.7667],
    "19": [36.1898, 5.4108], "Sétif": [36.1898, 5.4108], "Setif": [36.1898, 5.4108],
    "20": [34.8303, 0.1517], "Saïda": [34.8303, 0.1517], "Saida": [34.8303, 0.1517],
    "21": [36.8792, 6.9069], "Skikda": [36.8792, 6.9069],
    "22": [35.1899, -0.6308], "Sidi Bel Abbès": [35.1899, -0.6308], "Sidi Bel Abbes": [35.1899, -0.6308],
    "23": [36.9000, 7.7667], "Annaba": [36.9000, 7.7667],
    "24": [36.4622, 7.4261], "Guelma": [36.4622, 7.4261],
    "25": [36.3650, 6.6147], "Constantine": [36.3650, 6.6147],
    "26": [36.2642, 2.7539], "Médéa": [36.2642, 2.7539], "Medea": [36.2642, 2.7539],
    "27": [35.9312, 0.0892], "Mostaganem": [35.9312, 0.0892],
    "28": [35.7058, 4.5419], "M'Sila": [35.7058, 4.5419], "Msila": [35.7058, 4.5419],
    "29": [35.3966, 0.1403], "Mascara": [35.3966, 0.1403],
    "30": [31.9539, 5.3262], "Ouargla": [31.9539, 5.3262],
    "31": [35.6987, -0.6349], "Oran": [35.6987, -0.6349],
    "32": [33.6832, 1.0193], "El Bayadh": [33.6832, 1.0193],
    "33": [28.4478, 9.6378], "Illizi": [28.4478, 9.6378],
    "34": [36.0732, 4.7611], "Bordj Bou Arreridj": [36.0732, 4.7611],
    "35": [36.7598, 3.4735], "Boumerdès": [36.7598, 3.4735], "Boumerdes": [36.7598, 3.4735],
    "36": [36.7672, 8.3138], "El Tarf": [36.7672, 8.3138],
    "37": [27.6711, -8.1474], "Tindouf": [27.6711, -8.1474],
    "38": [35.6072, 1.8108], "Tissemsilt": [35.6072, 1.8108],
    "39": [33.3683, 6.8674], "El Oued": [33.3683, 6.8674],
    "40": [35.4358, 7.1433], "Khenchela": [35.4358, 7.1433],
    "41": [36.2864, 7.9511], "Souk Ahras": [36.2864, 7.9511],
    "42": [36.5897, 2.4475], "Tipaza": [36.5897, 2.4475],
    "43": [36.4503, 6.2644], "Mila": [36.4503, 6.2644],
    "44": [36.2642, 1.9679], "Aïn Defla": [36.2642, 1.9679], "Ain Defla": [36.2642, 1.9679],
    "45": [33.2667, -0.3167], "Naâma": [33.2667, -0.3167], "Naama": [33.2667, -0.3167],
    "46": [35.3039, -1.1403], "Aïn Témouchent": [35.3039, -1.1403], "Ain Temouchent": [35.3039, -1.1403],
    "47": [32.4909, 3.6736], "Ghardaïa": [32.4909, 3.6736], "Ghardaia": [32.4909, 3.6736],
    "48": [35.7372, 0.5558], "Relizane": [35.7372, 0.5558],
    "49": [31.5938, 2.4340], "Timimoun": [31.5938, 2.4340],
    "50": [22.3389, 3.1322], "Bordj Badji Mokhtar": [22.3389, 3.1322],
    "51": [34.4644, 4.9658], "Ouled Djellal": [34.4644, 4.9658],
    "52": [32.1833, -0.5833], "Béni Abbès": [32.1833, -0.5833], "Beni Abbes": [32.1833, -0.5833],
    "53": [21.3283, 0.9575], "In Salah": [21.3283, 0.9575],
    "54": [19.5667, 5.7667], "In Guezzam": [19.5667, 5.7667],
    "55": [33.1167, 6.0667], "Touggourt": [33.1167, 6.0667],
    "56": [24.5536, 9.4842], "Djanet": [24.5536, 9.4842],
    "57": [33.5833, 5.3333], "El M'Ghair": [33.5833, 5.3333], "El Meghaier": [33.5833, 5.3333],
    "58": [30.5667, 2.8833], "El Meniaa": [30.5667, 2.8833], "El Menia": [30.5667, 2.8833],
    "Default": [35.6987, -0.6349]
};

// Sleek Dark Theme for Google Maps
const GOOGLE_DARK_STYLE = [
    { elementType: "geometry", stylers: [{ color: "#111827" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#030712" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#9ca3af" }] },
    { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#f3f4f6" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#1f2937" }] },
    { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#111827" }] },
    { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca3af" }] },
    { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#374151" }] },
    { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#111827" }] },
    { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#fbbf24" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#0f172a" }] },
    { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#64748b" }] },
    { featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#0f172a" }] }
];

export function resolveWilayaCoords(input?: string | number | null): [number, number] | null {
    if (!input) return null;
    const str = String(input).trim();
    if (!str) return null;

    if (WILAYA_COORDS[str]) return WILAYA_COORDS[str];

    const digits = str.replace(/\D/g, "");
    if (digits) {
        const codeNum = parseInt(digits, 10);
        if (codeNum >= 1 && codeNum <= 58) {
            const padded = String(codeNum).padStart(2, "0");
            if (WILAYA_COORDS[padded]) return WILAYA_COORDS[padded];
        }
    }

    const cleanInput = str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    for (const [key, coords] of Object.entries(WILAYA_COORDS)) {
        const cleanKey = key.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        if (cleanKey === cleanInput || cleanInput.includes(cleanKey) || cleanKey.includes(cleanInput)) {
            return coords;
        }
    }
    return null;
}

function parseCoordinates(input: any): { lat: number; lng: number } | null {
    if (!input) return null;
    let lat: number | null = null;
    let lng: number | null = null;

    if (typeof input === "string") {
        const parts = input.split(",").map(p => parseFloat(p.trim()));
        if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
            lat = parts[0];
            lng = parts[1];
        }
    } else if (Array.isArray(input) && input.length >= 2) {
        const c0 = parseFloat(input[0]);
        const c1 = parseFloat(input[1]);
        if (!isNaN(c0) && !isNaN(c1)) {
            lat = c0;
            lng = c1;
        }
    } else if (typeof input === "object" && input !== null) {
        if ("lat" in input && "lng" in input) {
            lat = parseFloat(input.lat);
            lng = parseFloat(input.lng);
        } else if ("latitude" in input && "longitude" in input) {
            lat = parseFloat(input.latitude);
            lng = parseFloat(input.longitude);
        }
    }

    if (lat === null || lng === null || isNaN(lat) || isNaN(lng)) return null;

    // Algeria bounds swap check: lat ~ 18-38, lng ~ -9-12
    if (Math.abs(lat) <= 15 && lng >= 18 && lng <= 38) {
        const tmp = lat;
        lat = lng;
        lng = tmp;
    }

    if (Math.abs(lat) > 85.05 || Math.abs(lng) > 180) return null;
    return { lat, lng };
}

function getDeterministicOffset(id: number, center: [number, number]): [number, number] {
    const angle = (id * 137.5) * (Math.PI / 180);
    const radius = 0.012 + ((id % 8) * 0.004);
    return [
        center[0] + radius * Math.cos(angle),
        center[1] + radius * Math.sin(angle)
    ];
}

interface VtcDispatchMapProps {
    chauffeurs: VtcChauffeur[];
    courses?: Courses[];
    selectedWilaya?: string;
    selectedChauffeur?: VtcChauffeur | null;
    selectedCourse?: Courses | null;
    onSelectChauffeur?: (chauffeur: VtcChauffeur) => void;
    onSelectCourse?: (course: Courses) => void;
    onOpenChauffeurDetail?: (chauffeur: VtcChauffeur) => void;
    onToggleStatus?: (id: number, action: "block" | "unblock") => void;
    onRefresh?: () => void;
}

export default function VtcDispatchMap({
    chauffeurs,
    courses = [],
    selectedWilaya,
    selectedChauffeur,
    selectedCourse,
    onSelectChauffeur,
    onSelectCourse,
    onOpenChauffeurDetail,
    onToggleStatus,
    onRefresh
}: VtcDispatchMapProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);
    const markersRef = useRef<any[]>([]);
    const polylinesRef = useRef<any[]>([]);
    const infoWindowRef = useRef<any>(null);

    const [mapLoaded, setMapLoaded] = useState(false);
    const [mapStyle, setMapStyle] = useState<"dark" | "streets" | "satellite">("dark");
    const [showChauffeurs, setShowChauffeurs] = useState(true);
    const [showCourses, setShowCourses] = useState(true);
    const [showRoutes, setShowRoutes] = useState(true);
    const [centerCoords, setCenterCoords] = useState<[number, number]>(WILAYA_COORDS["Oran"]);

    const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "AIzaSyADbCd4JrhQl2FKvXE2E--iXiCZSfXMjlY";

    // Auto-center on Wilaya
    useEffect(() => {
        if (selectedWilaya) {
            const coords = resolveWilayaCoords(selectedWilaya);
            if (coords) {
                setCenterCoords(coords);
                if (mapInstanceRef.current && window.google) {
                    mapInstanceRef.current.panTo({ lat: coords[0], lng: coords[1] });
                    mapInstanceRef.current.setZoom(13);
                }
            }
        }
    }, [selectedWilaya]);

    // Pan when selectedChauffeur changes
    useEffect(() => {
        if (!selectedChauffeur || !mapInstanceRef.current || !window.google) return;
        const parsed = parseCoordinates([selectedChauffeur.latitude, selectedChauffeur.longitude]);
        let target: [number, number];
        if (parsed) {
            target = [parsed.lat, parsed.lng];
        } else {
            const wilCenter = resolveWilayaCoords(selectedChauffeur.wilaya) || centerCoords;
            target = getDeterministicOffset(selectedChauffeur.id, wilCenter);
        }
        mapInstanceRef.current.panTo({ lat: target[0], lng: target[1] });
        mapInstanceRef.current.setZoom(16);
    }, [selectedChauffeur]);

    // Pan when selectedCourse changes
    useEffect(() => {
        if (!selectedCourse || !mapInstanceRef.current || !window.google) return;
        const dep = parseCoordinates([selectedCourse.latitude_depart, selectedCourse.longitude_depart]);
        if (dep) {
            mapInstanceRef.current.panTo({ lat: dep.lat, lng: dep.lng });
            mapInstanceRef.current.setZoom(15);
        }
    }, [selectedCourse]);

    // Load Google Maps Script
    useEffect(() => {
        if (typeof window === "undefined") return;

        const scriptId = "google-maps-script";
        let script = document.getElementById(scriptId) as HTMLScriptElement;

        const onScriptLoad = () => {
            if (window.google && mapContainerRef.current && !mapInstanceRef.current) {
                initMap();
            }
        };

        if (!script) {
            script = document.createElement("script");
            script.id = scriptId;
            script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_API_KEY}&libraries=places,geometry`;
            script.async = true;
            script.defer = true;
            script.onload = onScriptLoad;
            document.head.appendChild(script);
        } else if (window.google) {
            initMap();
        } else {
            script.addEventListener("load", onScriptLoad);
        }

        return () => {
            if (script) {
                script.removeEventListener("load", onScriptLoad);
            }
        };
    }, []);

    const initMap = () => {
        if (!mapContainerRef.current || !window.google) return;

        const initialCenter = selectedWilaya ? (resolveWilayaCoords(selectedWilaya) || centerCoords) : centerCoords;

        const map = new window.google.maps.Map(mapContainerRef.current, {
            center: { lat: initialCenter[0], lng: initialCenter[1] },
            zoom: 13,
            mapTypeId: mapStyle === "satellite" ? "hybrid" : "roadmap",
            styles: mapStyle === "dark" ? GOOGLE_DARK_STYLE : [],
            disableDefaultUI: true,
            zoomControl: false,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            gestureHandling: "greedy",
        });

        mapInstanceRef.current = map;
        infoWindowRef.current = new window.google.maps.InfoWindow();

        // Close info window on map click
        map.addListener("click", () => {
            if (infoWindowRef.current) {
                infoWindowRef.current.close();
            }
        });

        setMapLoaded(true);
    };

    // Update Map Style
    useEffect(() => {
        if (!mapInstanceRef.current || !window.google) return;
        const map = mapInstanceRef.current;

        if (mapStyle === "satellite") {
            map.setMapTypeId("hybrid");
            map.setOptions({ styles: [] });
        } else if (mapStyle === "dark") {
            map.setMapTypeId("roadmap");
            map.setOptions({ styles: GOOGLE_DARK_STYLE });
        } else {
            map.setMapTypeId("roadmap");
            map.setOptions({ styles: [] });
        }
    }, [mapStyle, mapLoaded]);

    // Render Markers & Routes
    useEffect(() => {
        if (!mapLoaded || !mapInstanceRef.current || !window.google) return;
        const map = mapInstanceRef.current;

        // Clear existing markers & routes
        markersRef.current.forEach(m => m.setMap(null));
        markersRef.current = [];
        polylinesRef.current.forEach(p => p.setMap(null));
        polylinesRef.current = [];

        // 1. RENDER CHAUFFEURS VTC
        if (showChauffeurs && chauffeurs && chauffeurs.length > 0) {
            chauffeurs.forEach(ch => {
                const parsed = parseCoordinates([ch.latitude, ch.longitude]);
                let pos: [number, number];
                if (parsed) {
                    pos = [parsed.lat, parsed.lng];
                } else {
                    const wilCenter = resolveWilayaCoords(ch.wilaya) || centerCoords;
                    pos = getDeterministicOffset(ch.id, wilCenter);
                }

                // Status definitions:
                // Bloqué: Red
                // En ligne & dispo: Green/Emerald
                // Hors ligne / Inactif: Slate
                const isBlocked = ch.is_blocked;
                const isOnline = ch.is_available && ch.is_active && !isBlocked;
                const isSelected = selectedChauffeur?.id === ch.id;

                let pinColor = "#64748b"; // gray offline
                let pinLabel = "Hors ligne";
                if (isBlocked) {
                    pinColor = "#ef4444"; // red
                    pinLabel = "Bloqué";
                } else if (isOnline) {
                    pinColor = "#10b981"; // emerald green
                    pinLabel = "Disponible";
                }

                // Custom SVG Car Pin Marker
                const svgIcon = {
                    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                        <svg xmlns="http://www.w3.org/2000/svg" width="${isSelected ? 48 : 38}" height="${isSelected ? 48 : 38}" viewBox="0 0 40 40">
                            <defs>
                                <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                                    <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000" flood-opacity="0.45"/>
                                </filter>
                            </defs>
                            <circle cx="20" cy="20" r="18" fill="${pinColor}" stroke="#ffffff" stroke-width="${isSelected ? 3 : 2}" filter="url(#shadow)" />
                            ${isOnline ? '<circle cx="31" cy="9" r="5" fill="#22c55e" stroke="#ffffff" stroke-width="1.5" />' : ''}
                            <path d="M12 25 L12 23 C12 22.4 12.4 22 13 22 L27 22 C27.6 22 28 22.4 28 23 L28 25 C28 25.6 27.6 26 27 26 L26 26 L26 28 C26 28.6 25.6 29 25 29 L24 29 C23.4 29 23 28.6 23 28 L23 26 L17 26 L17 28 C17 28.6 16.6 29 16 29 L15 29 C14.4 29 14 28.6 14 28 L14 26 L13 26 C12.4 26 12 25.6 12 25 Z M14 18 L16 13 C16.2 12.4 16.8 12 17.5 12 L22.5 12 C23.2 12 23.8 12.4 24 13 L26 18 C26.3 18.5 26 19 25.5 19 L14.5 19 C14 19 13.7 18.5 14 18 Z" fill="#ffffff" />
                        </svg>
                    `)}`,
                    scaledSize: new window.google.maps.Size(isSelected ? 48 : 38, isSelected ? 48 : 38),
                    anchor: new window.google.maps.Point(isSelected ? 24 : 19, isSelected ? 24 : 19),
                };

                const marker = new window.google.maps.Marker({
                    position: { lat: pos[0], lng: pos[1] },
                    map,
                    icon: svgIcon,
                    title: `${ch.full_name} (${pinLabel})`,
                    zIndex: isSelected ? 999 : (isOnline ? 100 : 50),
                });

                marker.addListener("click", () => {
                    if (onSelectChauffeur) onSelectChauffeur(ch);

                    const vehiculeText = ch.vehicule
                        ? `${ch.vehicule.marque || ''} ${ch.vehicule.modele || ''} • <span style="color:#f59e0b;font-weight:bold;">${ch.vehicule.matricule || 'Sans matricule'}</span>`
                        : "Véhicule non renseigné";

                    const content = `
                        <div style="font-family: inherit; min-width: 260px; max-width: 320px; padding: 10px; color: #1e293b;">
                            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <div style="width: 32px; height: 32px; border-radius: 50%; background: #f1f5f9; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #3b82f6;">
                                        🚕
                                    </div>
                                    <div>
                                        <div style="font-weight: 700; font-size: 14px; color: #0f172a;">${ch.full_name}</div>
                                        <div style="font-size: 11px; color: #64748b;">Wilaya: <strong>${ch.wilaya || 'N/A'}</strong></div>
                                    </div>
                                </div>
                                <span style="font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 9999px; background: ${pinColor}20; color: ${pinColor}; border: 1px solid ${pinColor}40;">
                                    ${pinLabel}
                                </span>
                            </div>

                            <div style="font-size: 12px; margin-bottom: 8px; line-height: 1.5; color: #334155;">
                                <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
                                    <span>📞</span>
                                    <a href="tel:${ch.phone_number_1}" style="color: #2563eb; text-decoration: none; font-weight: 600;">${ch.phone_number_1}</a>
                                </div>
                                <div style="display: flex; align-items: center; gap: 6px;">
                                    <span>🚘</span>
                                    <span>${vehiculeText}</span>
                                </div>
                                ${ch.stats?.rating ? `
                                <div style="display: flex; align-items: center; gap: 4px; margin-top: 4px; color: #d97706; font-weight: bold;">
                                    <span>⭐ ${ch.stats.rating}</span>
                                    <span style="font-size: 10px; color: #64748b; font-weight: normal;">(${ch.stats.completed_courses || 0} courses)</span>
                                </div>` : ''}
                            </div>

                            <div style="display: flex; gap: 6px; margin-top: 10px;">
                                <button id="btn-chauffeur-details" style="flex: 1; padding: 6px 10px; background: #2563eb; color: white; border: none; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer;">
                                    Fiche Complète
                                </button>
                                <button id="btn-chauffeur-toggle" style="flex: 1; padding: 6px 10px; background: ${isBlocked ? '#10b981' : '#ef4444'}; color: white; border: none; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer;">
                                    ${isBlocked ? 'Débloquer' : 'Bloquer'}
                                </button>
                            </div>
                        </div>
                    `;

                    if (infoWindowRef.current) {
                        infoWindowRef.current.setContent(content);
                        infoWindowRef.current.open(map, marker);

                        window.google.maps.event.addListenerOnce(infoWindowRef.current, 'domready', () => {
                            const btnDetails = document.getElementById("btn-chauffeur-details");
                            if (btnDetails && onOpenChauffeurDetail) {
                                btnDetails.addEventListener("click", () => onOpenChauffeurDetail(ch));
                            }
                            const btnToggle = document.getElementById("btn-chauffeur-toggle");
                            if (btnToggle && onToggleStatus) {
                                btnToggle.addEventListener("click", () => {
                                    onToggleStatus(ch.id, isBlocked ? "unblock" : "block");
                                    infoWindowRef.current.close();
                                });
                            }
                        });
                    }
                });

                markersRef.current.push(marker);
            });
        }

        // 2. RENDER ACTIVE COURSES & ROUTES
        if (showCourses && courses && courses.length > 0) {
            courses.forEach(crs => {
                const dep = parseCoordinates([crs.latitude_depart, crs.longitude_depart]);
                const arr = parseCoordinates([crs.latitude_arrive, crs.longitude_arrive]);
                const isSelected = selectedCourse?.id === crs.id;

                if (dep) {
                    // Departure Marker (Green Flag Pin)
                    const depMarker = new window.google.maps.Marker({
                        position: { lat: dep.lat, lng: dep.lng },
                        map,
                        icon: {
                            url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                                <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24">
                                    <circle cx="12" cy="12" r="10" fill="#0284c7" stroke="#ffffff" stroke-width="2"/>
                                    <text x="12" y="16" font-size="11" font-weight="bold" fill="#ffffff" text-anchor="middle">D</text>
                                </svg>
                            `)}`,
                            scaledSize: new window.google.maps.Size(28, 28),
                            anchor: new window.google.maps.Point(14, 14),
                        },
                        title: `Départ Course #${crs.id}`,
                    });

                    depMarker.addListener("click", () => {
                        if (onSelectCourse) onSelectCourse(crs);
                    });
                    markersRef.current.push(depMarker);
                }

                if (arr) {
                    // Arrival Marker (Orange/Red Flag Pin)
                    const arrMarker = new window.google.maps.Marker({
                        position: { lat: arr.lat, lng: arr.lng },
                        map,
                        icon: {
                            url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                                <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24">
                                    <circle cx="12" cy="12" r="10" fill="#ea580c" stroke="#ffffff" stroke-width="2"/>
                                    <text x="12" y="16" font-size="11" font-weight="bold" fill="#ffffff" text-anchor="middle">A</text>
                                </svg>
                            `)}`,
                            scaledSize: new window.google.maps.Size(28, 28),
                            anchor: new window.google.maps.Point(14, 14),
                        },
                        title: `Arrivée Course #${crs.id}`,
                    });

                    arrMarker.addListener("click", () => {
                        if (onSelectCourse) onSelectCourse(crs);
                    });
                    markersRef.current.push(arrMarker);
                }

                // Polyline Connecting Route
                if (showRoutes && dep && arr) {
                    const polyline = new window.google.maps.Polyline({
                        path: [
                            { lat: dep.lat, lng: dep.lng },
                            { lat: arr.lat, lng: arr.lng },
                        ],
                        geodesic: true,
                        strokeColor: isSelected ? "#38bdf8" : "#f59e0b",
                        strokeOpacity: isSelected ? 0.95 : 0.65,
                        strokeWeight: isSelected ? 4 : 2,
                        map,
                    });

                    polyline.addListener("click", () => {
                        if (onSelectCourse) onSelectCourse(crs);
                    });
                    polylinesRef.current.push(polyline);
                }
            });
        }
    }, [mapLoaded, chauffeurs, courses, showChauffeurs, showCourses, showRoutes, selectedChauffeur, selectedCourse]);

    return (
        <div className="relative w-full h-full min-h-[500px] overflow-hidden rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-900 shadow-xl">
            {/* Map Canvas */}
            <div ref={mapContainerRef} className="w-full h-full min-h-[500px]" />

            {/* Top Bar Controls */}
            <div className="absolute top-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
                {/* Left: Quick Layers & Style Toggles */}
                <div className="flex items-center gap-2 pointer-events-auto bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-200/60 dark:border-zinc-700/60 shadow-lg">
                    {/* Style switcher */}
                    <div className="flex bg-slate-100 dark:bg-zinc-800 p-0.5 rounded-lg text-xs font-semibold">
                        <button
                            type="button"
                            onClick={() => setMapStyle("dark")}
                            className={`px-2.5 py-1 rounded-md transition-all ${mapStyle === "dark" ? "bg-amber-500 text-white shadow-sm" : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100"}`}
                        >
                            Sombre
                        </button>
                        <button
                            type="button"
                            onClick={() => setMapStyle("streets")}
                            className={`px-2.5 py-1 rounded-md transition-all ${mapStyle === "streets" ? "bg-amber-500 text-white shadow-sm" : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100"}`}
                        >
                            Clair
                        </button>
                        <button
                            type="button"
                            onClick={() => setMapStyle("satellite")}
                            className={`px-2.5 py-1 rounded-md transition-all ${mapStyle === "satellite" ? "bg-amber-500 text-white shadow-sm" : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100"}`}
                        >
                            Satellite
                        </button>
                    </div>

                    <div className="w-[1px] h-5 bg-slate-200 dark:bg-zinc-700 mx-1" />

                    {/* Toggle Chauffeurs */}
                    <button
                        type="button"
                        onClick={() => setShowChauffeurs(!showChauffeurs)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                            showChauffeurs
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                                : "text-slate-400 dark:text-zinc-500 hover:bg-slate-100 dark:hover:bg-zinc-800"
                        }`}
                        title="Afficher/Masquer les chauffeurs"
                    >
                        <MdLocalTaxi className="text-base" />
                        <span>Chauffeurs ({chauffeurs?.length || 0})</span>
                    </button>

                    {/* Toggle Courses */}
                    <button
                        type="button"
                        onClick={() => setShowCourses(!showCourses)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                            showCourses
                                ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30"
                                : "text-slate-400 dark:text-zinc-500 hover:bg-slate-100 dark:hover:bg-zinc-800"
                        }`}
                        title="Afficher/Masquer les courses"
                    >
                        <MdAltRoute className="text-base" />
                        <span>Courses ({courses?.length || 0})</span>
                    </button>

                    {/* Toggle Routes */}
                    <button
                        type="button"
                        onClick={() => setShowRoutes(!showRoutes)}
                        className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all ${
                            showRoutes
                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                : "text-slate-400 dark:text-zinc-500 hover:bg-slate-100 dark:hover:bg-zinc-800"
                        }`}
                        title="Tracés de trajectoires"
                    >
                        Trajets
                    </button>
                </div>

                {/* Right: Quick Zoom & Center */}
                <div className="flex items-center gap-2 pointer-events-auto">
                    {onRefresh && (
                        <button
                            type="button"
                            onClick={onRefresh}
                            className="p-2.5 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md rounded-xl border border-slate-200/60 dark:border-zinc-700/60 shadow-lg text-slate-700 dark:text-zinc-200 hover:text-amber-500 dark:hover:text-amber-400 transition-all"
                            title="Actualiser la carte"
                        >
                            <MdRefresh className="text-lg" />
                        </button>
                    )}

                    <div className="flex flex-col bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md rounded-xl border border-slate-200/60 dark:border-zinc-700/60 shadow-lg overflow-hidden">
                        <button
                            type="button"
                            onClick={() => {
                                if (mapInstanceRef.current) {
                                    mapInstanceRef.current.setZoom(mapInstanceRef.current.getZoom() + 1);
                                }
                            }}
                            className="p-2 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors border-b border-slate-200 dark:border-zinc-800"
                            title="Zoom avant"
                        >
                            <MdZoomIn className="text-lg" />
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                if (mapInstanceRef.current) {
                                    mapInstanceRef.current.setZoom(mapInstanceRef.current.getZoom() - 1);
                                }
                            }}
                            className="p-2 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                            title="Zoom arrière"
                        >
                            <MdZoomOut className="text-lg" />
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={() => {
                            if (mapInstanceRef.current && centerCoords) {
                                mapInstanceRef.current.panTo({ lat: centerCoords[0], lng: centerCoords[1] });
                                mapInstanceRef.current.setZoom(13);
                            }
                        }}
                        className="p-2.5 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md rounded-xl border border-slate-200/60 dark:border-zinc-700/60 shadow-lg text-slate-700 dark:text-zinc-200 hover:text-amber-500 dark:hover:text-amber-400 transition-all"
                        title="Recentrer sur la wilaya"
                    >
                        <MdMyLocation className="text-lg" />
                    </button>
                </div>
            </div>

            {/* Bottom Legend Badge */}
            <div className="absolute bottom-4 left-4 pointer-events-auto bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-200/60 dark:border-zinc-700/60 shadow-lg flex items-center gap-4 text-xs font-semibold">
                <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50 animate-pulse" />
                    <span className="text-slate-700 dark:text-zinc-300">Disponible</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-slate-400" />
                    <span className="text-slate-700 dark:text-zinc-300">Hors ligne</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-red-500 shadow-sm shadow-red-500/50" />
                    <span className="text-slate-700 dark:text-zinc-300">Bloqué</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-sky-500" />
                    <span className="text-slate-700 dark:text-zinc-300">Course active</span>
                </div>
            </div>
        </div>
    );
}
