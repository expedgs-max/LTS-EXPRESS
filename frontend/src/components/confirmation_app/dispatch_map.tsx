/* eslint-disable */
"use client";

import React, { useEffect, useRef, useState } from "react";
import { ConfirmationLivreur } from "@/lib/confirmation_action";
import { Wilaya } from "@/lib/tools/named";
import { 
    MdMyLocation, 
    MdDeliveryDining, 
    MdStorefront, 
    MdPersonPinCircle, 
    MdZoomIn, 
    MdZoomOut,
    MdSearch,
    MdClose,
    MdTune,
    MdCheck,
    MdRestaurant,
    MdHotel,
    MdShoppingBag,
    MdLocalHospital,
    MdDirectionsBus,
    MdAccountBalance,
    MdPark,
    MdSchool,
    MdAltRoute,
    MdLocationCity,
    MdVisibility,
    MdVisibilityOff
} from "react-icons/md";
import { toast } from "react-hot-toast";

// Algeria Wilaya Coordinates Mapping (Full 58 Wilayas)
const WILAYA_COORDS: Record<string, [number, number]> = {
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
    "Default": [35.6987, -0.6349]
};

// Sleek Dark Theme Base for Google Maps
const GOOGLE_DARK_BASE = [
    { elementType: "geometry", stylers: [{ color: "#1f2937" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#111827" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#9ca3af" }] },
    { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#e5e7eb" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#374151" }] },
    { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#1f2937" }] },
    { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca3af" }] },
    { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#4b5563" }] },
    { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#1f2937" }] },
    { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#f3f4f6" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#0f172a" }] },
    { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#64748b" }] },
    { featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#0f172a" }] }
];

export interface MapLayerFilters {
    roadNumbers: boolean;    // 🛣️ Numéros et noms des routes
    restaurants: boolean;    // 🍽️ Restaurants & Cafés
    hotels: boolean;         // 🏨 Hôtels & Hébergements
    shops: boolean;          // 🛍️ Magasins & Commerces
    medical: boolean;        // 🏥 Hôpitaux & Santé
    transit: boolean;        // 🚌 Transports & Gares
    banks: boolean;          // 🏦 Banques & Finances
    parks: boolean;          // 🌳 Parcs & Espaces verts
    government: boolean;     // 🏛️ Établissements publics & Écoles
    cities: boolean;         // 🏷️ Noms des villes & Wilayas
}

const DEFAULT_LAYER_FILTERS: MapLayerFilters = {
    roadNumbers: true,
    restaurants: false,
    hotels: false,
    shops: false,
    medical: false,
    transit: false,
    banks: false,
    parks: false,
    government: false,
    cities: true
};


export function resolveWilayaCoords(input?: string | number | null): [number, number] | null {
    if (!input) return null;
    const str = String(input).trim();
    if (!str) return null;

    // 1. Direct match (e.g. "13", "Tlemcen", "Oran")
    if (WILAYA_COORDS[str]) return WILAYA_COORDS[str];

    // 2. Numeric code (e.g. 13 -> "13", 1 -> "01")
    const digits = str.replace(/\D/g, "");
    if (digits) {
        const num = parseInt(digits, 10);
        if (!isNaN(num) && num >= 1 && num <= 58) {
            const code = String(num).padStart(2, "0");
            if (WILAYA_COORDS[code]) return WILAYA_COORDS[code];
        }
    }

    // 3. Normalized string search (lowercase, remove accents)
    const normalized = str
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    for (const [key, coords] of Object.entries(WILAYA_COORDS)) {
        if (key === "Default") continue;
        const normKey = key
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");

        if (normKey.length > 2 && (normalized.includes(normKey) || normKey.includes(normalized))) {
            return coords;
        }
    }

    return null;
}

// Robust coordinate normalizer supporting [lat, lng], [lng, lat], strings, numbers, and Algeria bounds
export function parseCoordinates(rawCoords: any[] | { lat?: any; lng?: any; latitude?: any; longitude?: any } | undefined | null): { lat: number; lng: number } | null {
    if (!rawCoords) return null;

    let c0: number = NaN;
    let c1: number = NaN;

    if (Array.isArray(rawCoords) && rawCoords.length >= 2) {
        c0 = Number(rawCoords[0]);
        c1 = Number(rawCoords[1]);
    } else if (typeof rawCoords === "object") {
        const rawObj = rawCoords as any;
        const latVal = rawObj.lat ?? rawObj.latitude;
        const lngVal = rawObj.lng ?? rawObj.longitude ?? rawObj.long;
        if (latVal !== undefined && lngVal !== undefined) {
            c0 = Number(latVal);
            c1 = Number(lngVal);
        }
    }

    if (isNaN(c0) || isNaN(c1) || (c0 === 0 && c1 === 0)) {
        return null;
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

    // Safety check for valid geographic coordinates
    if (Math.abs(lat) > 85.05 || Math.abs(lng) > 180) {
        return null;
    }

    return { lat, lng };
}

function getDeterministicOffset(id: number, center: [number, number]): [number, number] {
    const angle = (id * 137.5) * (Math.PI / 180);
    const radius = 0.015 + ((id % 7) * 0.005);
    return [
        center[0] + radius * Math.cos(angle),
        center[1] + radius * Math.sin(angle)
    ];
}

interface DispatchMapProps {
    livreurs: ConfirmationLivreur[];
    commandes: Order[];
    selectedWilaya?: string;
    selectedOrder?: Order | null;
    selectedLivreur?: ConfirmationLivreur | null;
    onSelectOrder?: (order: Order) => void;
    onSelectLivreur?: (livreur: ConfirmationLivreur) => void;
    onAssignOrder?: (order: Order) => void;
    onToggleBlockLivreur?: (livreur: ConfirmationLivreur) => void;
}

export default function DispatchMap({
    livreurs,
    commandes,
    selectedWilaya,
    selectedOrder,
    selectedLivreur,
    onSelectOrder,
    onSelectLivreur,
    onAssignOrder,
    onToggleBlockLivreur
}: DispatchMapProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const mapInstanceRef = useRef<any>(null);
    const markersRef = useRef<any[]>([]);
    const polylinesRef = useRef<any[]>([]);
    const infoWindowRef = useRef<any>(null);
    const searchedPlaceMarkerRef = useRef<any>(null);

    const [mapLoaded, setMapLoaded] = useState(false);
    const [mapStyle, setMapStyle] = useState<"dark" | "streets" | "satellite">("dark");
    const [showLivreurs, setShowLivreurs] = useState(true);
    const [showCommandes, setShowCommandes] = useState(true);
    const [showMagasins, setShowMagasins] = useState(true);
    const [centerCoords, setCenterCoords] = useState<[number, number]>(WILAYA_COORDS["Oran"]);
    const [searchedPlaceName, setSearchedPlaceName] = useState<string>("");
    
    // Granular Layer Filters state
    const [layerFilters, setLayerFilters] = useState<MapLayerFilters>(DEFAULT_LAYER_FILTERS);
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);

    const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "AIzaSyADbCd4JrhQl2FKvXE2E--iXiCZSfXMjlY";

    // Count of active layers
    const activeLayersCount = Object.values(layerFilters).filter(Boolean).length;

    // Determine current center based on Wilaya or active orders
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
        } else if (commandes && commandes.length > 0) {
            // Auto-center on the first order's wilaya
            const firstCmd = commandes[0];
            const detectedCoords = resolveWilayaCoords(firstCmd.magasin_info?.wilaya)
                || resolveWilayaCoords(firstCmd.magasin_info?.address)
                || resolveWilayaCoords(firstCmd.magasin_info?.name)
                || resolveWilayaCoords(firstCmd.client_info?.wilaya_code)
                || resolveWilayaCoords(firstCmd.distination);
            if (detectedCoords) {
                setCenterCoords(detectedCoords);
                if (mapInstanceRef.current && window.google) {
                    mapInstanceRef.current.panTo({ lat: detectedCoords[0], lng: detectedCoords[1] });
                }
            }
        }
    }, [selectedWilaya, commandes]);

    // Pan map when selectedOrder changes
    useEffect(() => {
        if (!selectedOrder || !mapInstanceRef.current || !window.google) return;
        const magLat = (selectedOrder.magasin_info as any)?.latitude ?? (selectedOrder.magasin_info as any)?.owner?.latitude;
        const magLon = (selectedOrder.magasin_info as any)?.longitude ?? (selectedOrder.magasin_info as any)?.owner?.longitude;
        const parsed = parseCoordinates([magLat, magLon]);
        let target: [number, number];
        if (parsed) {
            target = [parsed.lat, parsed.lng];
        } else {
            const orderCenter = resolveWilayaCoords(selectedOrder.magasin_info?.wilaya)
                || resolveWilayaCoords(selectedOrder.magasin_info?.address)
                || resolveWilayaCoords(selectedOrder.magasin_info?.name)
                || resolveWilayaCoords(selectedOrder.client_info?.wilaya_code)
                || resolveWilayaCoords(selectedOrder.distination)
                || centerCoords;
            target = getDeterministicOffset(selectedOrder.id + 50, orderCenter);
        }
        mapInstanceRef.current.panTo({ lat: target[0], lng: target[1] });
        mapInstanceRef.current.setZoom(15);
    }, [selectedOrder]);

    // Pan map when selectedLivreur changes
    useEffect(() => {
        if (!selectedLivreur || !mapInstanceRef.current || !window.google) return;
        const parsed = parseCoordinates([selectedLivreur.latitude, selectedLivreur.longitude]);
        let target: [number, number];
        if (parsed) {
            target = [parsed.lat, parsed.lng];
        } else {
            const livCenter = resolveWilayaCoords(selectedLivreur.wilaya) || centerCoords;
            target = getDeterministicOffset(selectedLivreur.id, livCenter);
        }
        mapInstanceRef.current.panTo({ lat: target[0], lng: target[1] });
        mapInstanceRef.current.setZoom(16);
    }, [selectedLivreur]);

    // Load Google Maps Script
    useEffect(() => {
        if (typeof window === "undefined") return;

        const scriptId = "google-maps-script";
        let script = document.getElementById(scriptId) as HTMLScriptElement;

        const initGoogleMap = () => {
            if (!mapContainerRef.current || !window.google || !window.google.maps) return;

            const map = new window.google.maps.Map(mapContainerRef.current, {
                center: { lat: centerCoords[0], lng: centerCoords[1] },
                zoom: 13,
                mapTypeId: mapStyle === "satellite" ? "hybrid" : "roadmap",
                styles: GOOGLE_DARK_BASE,
                disableDefaultUI: true,
                zoomControl: false,
                mapTypeControl: false,
                streetViewControl: false,
                fullscreenControl: false,
                gestureHandling: "greedy",
                scrollwheel: true
            });

            infoWindowRef.current = new window.google.maps.InfoWindow();
            mapInstanceRef.current = map;
            setMapLoaded(true);

            // Setup Google Places Autocomplete
            if (searchInputRef.current && window.google.maps.places) {
                const autocomplete = new window.google.maps.places.Autocomplete(searchInputRef.current, {
                    componentRestrictions: { country: "dz" },
                    fields: ["geometry", "name", "formatted_address", "place_id"]
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

                    // Clear previous searched marker
                    if (searchedPlaceMarkerRef.current) {
                        searchedPlaceMarkerRef.current.setMap(null);
                    }

                    // Add searched pin
                    const searchedMarker = new window.google.maps.Marker({
                        position: loc,
                        map: map,
                        title: place.name || "Lieu recherché",
                        animation: window.google.maps.Animation.DROP,
                        icon: {
                            path: window.google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
                            scale: 6,
                            fillColor: "#ef4444",
                            fillOpacity: 1,
                            strokeColor: "#ffffff",
                            strokeWeight: 2
                        }
                    });

                    searchedPlaceMarkerRef.current = searchedMarker;
                    setSearchedPlaceName(place.name || place.formatted_address || "Lieu sélectionné");

                    if (infoWindowRef.current) {
                        infoWindowRef.current.setContent(`
                            <div style="padding: 8px; font-family: sans-serif; color: #1e293b;">
                                <h4 style="font-weight: bold; margin: 0 0 4px 0; color: #0f172a;">📍 ${place.name || "Lieu"}</h4>
                                <p style="font-size: 12px; margin: 0; color: #64748b;">${place.formatted_address || ""}</p>
                            </div>
                        `);
                        infoWindowRef.current.open(map, searchedMarker);
                    }
                });
            }
        };

        if (window.google && window.google.maps) {
            initGoogleMap();
        } else if (!script) {
            script = document.createElement("script");
            script.id = scriptId;
            script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_API_KEY}&libraries=places,geometry&callback=initGoogleMapDispatchCallback`;
            script.async = true;
            script.defer = true;
            (window as any).initGoogleMapDispatchCallback = () => {
                initGoogleMap();
            };
            document.head.appendChild(script);
        }
    }, [GOOGLE_API_KEY]);

    // Update map style and apply granular Layer Filters
    useEffect(() => {
        if (!mapInstanceRef.current || !window.google) return;
        const map = mapInstanceRef.current;

        if (mapStyle === "satellite") {
            map.setMapTypeId("hybrid");
            map.setOptions({ styles: [], gestureHandling: "greedy", scrollwheel: true });
            return;
        }

        map.setMapTypeId("roadmap");

        let styles: any[] = [];
        if (mapStyle === "dark") {
            styles = [...GOOGLE_DARK_BASE];
        }

        // Apply Granular Layer Rules:
        // 1. Road Numbers & Road Names
        styles.push({
            featureType: "road",
            elementType: "labels",
            stylers: [{ visibility: layerFilters.roadNumbers ? "on" : "off" }]
        });

        // 2. City & Wilaya names
        styles.push({
            featureType: "administrative",
            elementType: "labels",
            stylers: [{ visibility: layerFilters.cities ? "on" : "off" }]
        });

        // 3. Restaurants / Cafés & Food
        styles.push({
            featureType: "poi.business",
            elementType: "all",
            stylers: [{ visibility: (layerFilters.restaurants || layerFilters.hotels || layerFilters.shops || layerFilters.banks) ? "on" : "off" }]
        });

        // 4. Hospitals & Medical
        styles.push({
            featureType: "poi.medical",
            elementType: "all",
            stylers: [{ visibility: layerFilters.medical ? "on" : "off" }]
        });

        // 5. Transit & Bus / Train Stations
        styles.push({
            featureType: "transit",
            elementType: "all",
            stylers: [{ visibility: layerFilters.transit ? "on" : "off" }]
        });

        // 6. Parks & Greenery
        styles.push({
            featureType: "poi.park",
            elementType: "all",
            stylers: [{ visibility: layerFilters.parks ? "on" : "off" }]
        });

        // 7. Government & Schools
        styles.push({
            featureType: "poi.government",
            elementType: "all",
            stylers: [{ visibility: layerFilters.government ? "on" : "off" }]
        });
        styles.push({
            featureType: "poi.school",
            elementType: "all",
            stylers: [{ visibility: layerFilters.government ? "on" : "off" }]
        });
        styles.push({
            featureType: "poi.place_of_worship",
            elementType: "all",
            stylers: [{ visibility: layerFilters.government ? "on" : "off" }]
        });
        styles.push({
            featureType: "poi.attraction",
            elementType: "all",
            stylers: [{ visibility: layerFilters.hotels ? "on" : "off" }]
        });

        map.setOptions({ styles, gestureHandling: "greedy", scrollwheel: true });
    }, [mapStyle, layerFilters, mapLoaded]);

    // Pan when centerCoords change
    useEffect(() => {
        if (mapInstanceRef.current && centerCoords) {
            mapInstanceRef.current.panTo({ lat: centerCoords[0], lng: centerCoords[1] });
        }
    }, [centerCoords]);

    // Fly to Selected Livreur
    useEffect(() => {
        if (!mapInstanceRef.current || !selectedLivreur || !window.google) return;
        let pos: [number, number] = centerCoords;
        if (selectedLivreur.latitude && selectedLivreur.longitude && !isNaN(Number(selectedLivreur.latitude)) && Number(selectedLivreur.latitude) !== 0) {
            pos = [Number(selectedLivreur.latitude), Number(selectedLivreur.longitude)];
        } else if (selectedLivreur.wilaya && (WILAYA_COORDS[selectedLivreur.wilaya] || WILAYA_COORDS[String(selectedLivreur.wilaya).padStart(2, '0')])) {
            const wilCenter = WILAYA_COORDS[selectedLivreur.wilaya] || WILAYA_COORDS[String(selectedLivreur.wilaya).padStart(2, '0')];
            pos = getDeterministicOffset(selectedLivreur.id, wilCenter);
        } else {
            pos = getDeterministicOffset(selectedLivreur.id, centerCoords);
        }
        mapInstanceRef.current.panTo({ lat: pos[0], lng: pos[1] });
        mapInstanceRef.current.setZoom(16);
    }, [selectedLivreur, centerCoords]);

    // Fly to Selected Order
    useEffect(() => {
        if (!mapInstanceRef.current || !selectedOrder || !window.google) return;
        let pos: [number, number] = centerCoords;
        const magLat = (selectedOrder.magasin_info as any)?.latitude ?? (selectedOrder.magasin_info as any)?.owner?.latitude;
        const magLon = (selectedOrder.magasin_info as any)?.longitude ?? (selectedOrder.magasin_info as any)?.owner?.longitude;

        if (magLat !== undefined && magLat !== null && magLon !== undefined && magLon !== null && !isNaN(Number(magLat)) && !isNaN(Number(magLon)) && (Number(magLat) !== 0 || Number(magLon) !== 0)) {
            pos = [Number(magLat), Number(magLon)];
        } else {
            pos = getDeterministicOffset(selectedOrder.id + 50, centerCoords);
        }
        mapInstanceRef.current.panTo({ lat: pos[0], lng: pos[1] });
        mapInstanceRef.current.setZoom(16);
    }, [selectedOrder, centerCoords]);

    // Render Markers on Google Maps
    useEffect(() => {
        if (!mapLoaded || !mapInstanceRef.current || !window.google) return;
        const map = mapInstanceRef.current;

        // Clear existing markers & polylines
        markersRef.current.forEach(m => m.setMap(null));
        markersRef.current = [];
        polylinesRef.current.forEach(p => p.setMap(null));
        polylinesRef.current = [];

        // 1. RENDER LIVREURS MARKERS (🛵 Color-coded Motorcycle Pins)
        if (showLivreurs && livreurs && livreurs.length > 0) {
            livreurs.forEach((liv) => {
                const parsedLivreur = parseCoordinates([liv.latitude, liv.longitude]);
                let coords: [number, number];
                if (parsedLivreur) {
                    coords = [parsedLivreur.lat, parsedLivreur.lng];
                } else {
                    const livCenter = resolveWilayaCoords(liv.wilaya) || centerCoords;
                    coords = getDeterministicOffset(liv.id, livCenter);
                }

                const isOnline = liv.is_available;
                const isBlocked = Boolean(liv.is_blocked || liv.user?.bloquer);
                const isBusy = (liv.active_orders_count || 0) > 0;
                const isSelected = selectedLivreur?.id === liv.id;

                // Color code rules requested by user:
                // 🔴 Rouge: Bloqué
                // 🟡 Jaune: En livraison (a pris commande / active_orders_count > 0)
                // 🟢 Vert: En ligne disponible (courses = 0)
                // ⚫ Gris: Hors ligne
                let pinFill = "#10b981"; // Vert
                let pinText = "#ffffff";
                let statusLabel = "🟢 En ligne (libre)";

                if (isBlocked) {
                    pinFill = "#dc2626"; // Rouge
                    pinText = "#ffffff";
                    statusLabel = "🔴 Bloqué";
                } else if (isBusy) {
                    pinFill = "#f59e0b"; // Jaune / Amber
                    pinText = "#0f172a";
                    statusLabel = `🟡 En livraison (${liv.active_orders_count})`;
                } else if (!isOnline) {
                    pinFill = "#64748b"; // Gris
                    pinText = "#ffffff";
                    statusLabel = "⚫ Hors ligne";
                }

                // Custom SVG Motorcycle Pin for Google Maps Marker
                const svgIcon = {
                    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                        <svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44">
                            <circle cx="22" cy="22" r="18" fill="${pinFill}" stroke="#ffffff" stroke-width="2.5"/>
                            <g transform="translate(10, 10) scale(1)">
                                <path fill="${pinText}" d="M19.44 9.03L15.41 5H11v2h3.59l2 2H5c-2.8 0-5 2.2-5 5s2.2 5 5 5c2.46 0 4.45-1.69 4.9-4h4.2c.45 2.31 2.44 4 4.9 4 2.8 0 5-2.2 5-5 0-2.46-1.69-4.45-4-4.9-.18-.04-.37-.07-.56-.07zM5 17c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm14 0c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm-6-5h-2.12c-.44-.6-1.1-1-1.88-1H7.83c.59-1.22 1.84-2 3.17-2h1.5l1.5 3z"/>
                            </g>
                        </svg>
                    `)}`,
                    scaledSize: new window.google.maps.Size(isSelected ? 48 : 38, isSelected ? 48 : 38),
                    anchor: new window.google.maps.Point(19, 19)
                };

                const marker = new window.google.maps.Marker({
                    position: { lat: coords[0], lng: coords[1] },
                    map: map,
                    title: liv.user?.first_name || `Livreur #${liv.id}`,
                    icon: svgIcon,
                    zIndex: isSelected ? 99 : 10
                });

                marker.addListener("click", () => {
                    if (onSelectLivreur) onSelectLivreur(liv);

                    if (infoWindowRef.current) {
                        const bat = liv.battery ?? (liv as any).battery_level;
                        const batHtml = bat !== undefined && bat !== null && !isNaN(bat)
                            ? `<p style="margin: 2px 0;"><strong>Batterie :</strong> <span style="display: inline-flex; align-items: center; gap: 4px; font-weight: bold; color: ${bat <= 20 ? '#e11d48' : bat <= 50 ? '#d97706' : '#16a34a'};">${bat <= 20 ? '🪫' : '🔋'} ${Math.round(bat)}%</span></p>`
                            : '';

                        infoWindowRef.current.setContent(`
                            <div style="padding: 10px; font-family: sans-serif; min-width: 220px; color: #0f172a;">
                                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 8px;">
                                    <h4 style="font-weight: bold; margin: 0; font-size: 14px;">🛵 ${liv.user?.first_name || ""} ${liv.user?.last_name || liv.user?.username || `Livreur #${liv.id}`}</h4>
                                    <span style="font-size: 11px; font-weight: bold; color: #d97706;">⭐ ${liv.user?.rating ? liv.user.rating.toFixed(1) : "5.0"}</span>
                                </div>
                                <div style="font-size: 12px; line-height: 1.5; color: #475569; margin-bottom: 8px;">
                                    <p style="margin: 2px 0;"><strong>Statut :</strong> ${statusLabel}</p>
                                    ${batHtml}
                                    <p style="margin: 2px 0;"><strong>Wilaya :</strong> ${liv.wilaya || "Algérie"}</p>
                                    <p style="margin: 2px 0;"><strong>Téléphone :</strong> <a href="tel:${liv.user?.phone || ''}" style="color: #2563eb; font-weight: bold;">${liv.user?.phone || 'Non renseigné'}</a></p>
                                    <p style="margin: 2px 0;"><strong>Courses en cours :</strong> <span style="font-weight: bold; color: #0f172a;">${liv.active_orders_count}</span></p>
                                </div>
                            </div>
                        `);
                        infoWindowRef.current.open(map, marker);
                    }
                });

                markersRef.current.push(marker);
            });
        }

        // 2. RENDER STORE & CLIENT MARKERS
        if ((showMagasins || showCommandes) && commandes && commandes.length > 0) {
            commandes.forEach((cmd) => {
                const isSelected = selectedOrder?.id === cmd.id;
                
                // Exact store coordinates retrieved from Partenneur owner (table partenneur)
                const magLat = (cmd.magasin_info as any)?.latitude ?? (cmd.magasin_info as any)?.owner?.latitude;
                const magLon = (cmd.magasin_info as any)?.longitude ?? (cmd.magasin_info as any)?.owner?.longitude;
                const parsedStore = parseCoordinates([magLat, magLon]);
                let storeCoords: [number, number];

                if (parsedStore) {
                    storeCoords = [parsedStore.lat, parsedStore.lng];
                } else {
                    const storeCenter = resolveWilayaCoords(cmd.magasin_info?.wilaya)
                        || resolveWilayaCoords(cmd.magasin_info?.address)
                        || resolveWilayaCoords(cmd.magasin_info?.name)
                        || resolveWilayaCoords(cmd.client_info?.wilaya_code)
                        || resolveWilayaCoords(cmd.distination)
                        || (selectedWilaya ? resolveWilayaCoords(selectedWilaya) : null)
                        || centerCoords;
                    storeCoords = getDeterministicOffset(cmd.id + 50, storeCenter);
                }

                // Exact client coordinates
                const cliLat = (cmd.client_info as any)?.latitude;
                const cliLon = (cmd.client_info as any)?.longitude;
                const parsedClient = parseCoordinates([cliLat, cliLon]);
                let clientCoords: [number, number];

                if (parsedClient) {
                    clientCoords = [parsedClient.lat, parsedClient.lng];
                } else {
                    const clientCenter = resolveWilayaCoords(cmd.client_info?.wilaya_code)
                        || resolveWilayaCoords(cmd.distination)
                        || resolveWilayaCoords(cmd.client_info?.wilaya)
                        || storeCoords;
                    clientCoords = getDeterministicOffset(cmd.id + 120, clientCenter);
                }

                // Store Marker (🏬)
                if (showMagasins) {
                    const storeSvg = {
                        url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
                                <circle cx="18" cy="18" r="16" fill="#4f46e5" stroke="#ffffff" stroke-width="2"/>
                                <g transform="translate(6, 6) scale(1)">
                                    <path fill="#ffffff" d="M20 4H4v2h16V4zm1 10v-2l-1-5H4l-1 5v2h1v6h10v-6h4v6h2v-6h1zm-9 4H6v-4h6v4z"/>
                                </g>
                            </svg>
                        `)}`,
                        scaledSize: new window.google.maps.Size(32, 32),
                        anchor: new window.google.maps.Point(16, 16)
                    };

                    const cmdDateStr = cmd.created_at ? ` (${new Date(cmd.created_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })})` : '';

                    const storeMarker = new window.google.maps.Marker({
                        position: { lat: storeCoords[0], lng: storeCoords[1] },
                        map: map,
                        title: `${cmd.magasin_info?.name || "Restaurant"} - Commande #${cmd.id}${cmdDateStr}`,
                        icon: storeSvg
                    });

                    storeMarker.addListener("click", () => {
                        if (onSelectOrder) onSelectOrder(cmd);
                    });

                    markersRef.current.push(storeMarker);
                }

                // Client Destination Marker (📍)
                if (showCommandes) {
                    const clientSvg = {
                        url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
                                <circle cx="18" cy="18" r="16" fill="#06b6d4" stroke="#ffffff" stroke-width="2"/>
                                <g transform="translate(6, 6) scale(1)">
                                    <path fill="#ffffff" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                                </g>
                            </svg>
                        `)}`,
                        scaledSize: new window.google.maps.Size(32, 32),
                        anchor: new window.google.maps.Point(16, 16)
                    };

                    const cmdDateStr = cmd.created_at ? ` (${new Date(cmd.created_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })})` : '';

                    const clientMarker = new window.google.maps.Marker({
                        position: { lat: clientCoords[0], lng: clientCoords[1] },
                        map: map,
                        title: `Commande #${cmd.id} - ${cmd.client_info?.first_name || 'Client'}${cmdDateStr}`,
                        icon: clientSvg
                    });

                    clientMarker.addListener("click", () => {
                        if (onSelectOrder) onSelectOrder(cmd);
                    });

                    markersRef.current.push(clientMarker);
                }

                // If this order is selected, draw route polyline
                if (isSelected) {
                    let livCoords: [number, number] | null = null;
                    if (cmd.livreur) {
                        const livObj = livreurs.find(l => l.id === cmd.livreur?.id);
                        if (livObj && livObj.latitude && livObj.longitude) {
                            livCoords = [Number(livObj.latitude), Number(livObj.longitude)];
                        }
                    }

                    const path = livCoords
                        ? [
                            { lat: storeCoords[0], lng: storeCoords[1] },
                            { lat: livCoords[0], lng: livCoords[1] },
                            { lat: clientCoords[0], lng: clientCoords[1] }
                        ]
                        : [
                            { lat: storeCoords[0], lng: storeCoords[1] },
                            { lat: clientCoords[0], lng: clientCoords[1] }
                        ];

                    const polyline = new window.google.maps.Polyline({
                        path: path,
                        geodesic: true,
                        strokeColor: "#38bdf8",
                        strokeOpacity: 0.85,
                        strokeWeight: 4
                    });

                    polyline.setMap(map);
                    polylinesRef.current.push(polyline);
                }
            });
        }
    }, [mapLoaded, livreurs, commandes, showLivreurs, showCommandes, showMagasins, selectedOrder, selectedLivreur, centerCoords, onSelectLivreur, onSelectOrder]);

    // Toggle individual layer filter
    const toggleLayer = (key: keyof MapLayerFilters) => {
        setLayerFilters(prev => ({ ...prev, [key]: !prev[key] }));
    };

    // Quick Action: Hide everything (Focus Livreurs)
    const handleHideAllLayers = () => {
        setLayerFilters({
            roadNumbers: true, // Keep roads visible for navigation
            restaurants: false,
            hotels: false,
            shops: false,
            medical: false,
            transit: false,
            banks: false,
            parks: false,
            government: false,
            cities: false
        });
        toast.success("Mode Focus activé : Lieux masqués pour isoler les livreurs");
    };

    // Quick Action: Show everything
    const handleShowAllLayers = () => {
        setLayerFilters({
            roadNumbers: true,
            restaurants: true,
            hotels: true,
            shops: true,
            medical: true,
            transit: true,
            banks: true,
            parks: true,
            government: true,
            cities: true
        });
        toast.success("Tous les lieux et numéros de routes sont affichés");
    };

    // Zoom & Pan Actions
    const handleZoomIn = () => {
        if (mapInstanceRef.current) {
            mapInstanceRef.current.setZoom(mapInstanceRef.current.getZoom() + 1);
        }
    };

    const handleZoomOut = () => {
        if (mapInstanceRef.current) {
            mapInstanceRef.current.setZoom(mapInstanceRef.current.getZoom() - 1);
        }
    };

    const handleResetCenter = () => {
        if (mapInstanceRef.current && centerCoords) {
            mapInstanceRef.current.panTo({ lat: centerCoords[0], lng: centerCoords[1] });
            mapInstanceRef.current.setZoom(13);
        }
    };

    // Fit all drivers on the map
    const handleFitAllFleet = () => {
        if (!mapInstanceRef.current || !window.google) return;
        const bounds = new window.google.maps.LatLngBounds();
        let hasPoints = false;

        livreurs.forEach(l => {
            if (l.latitude && l.longitude && Number(l.latitude) !== 0) {
                bounds.extend({ lat: Number(l.latitude), lng: Number(l.longitude) });
                hasPoints = true;
            } else if (l.wilaya && WILAYA_COORDS[l.wilaya]) {
                const c = getDeterministicOffset(l.id, WILAYA_COORDS[l.wilaya]);
                bounds.extend({ lat: c[0], lng: c[1] });
                hasPoints = true;
            }
        });

        if (hasPoints) {
            mapInstanceRef.current.fitBounds(bounds);
            toast.success("Vue ajustée sur l'ensemble de la flotte !");
        } else {
            handleResetCenter();
        }
    };

    return (
        <div className="relative w-full h-full min-h-[550px] bg-slate-950 overflow-hidden flex flex-col font-sans">
            {/* Google Maps Container */}
            <div ref={mapContainerRef} className="w-full h-full flex-1 z-0" />

            {/* Top Google Places Search Bar & Layer Control Bar */}
            <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
                {/* Google Places Autocomplete Search Box */}
                <div className="flex items-center gap-2 bg-slate-900/95 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-slate-700 shadow-2xl pointer-events-auto min-w-[260px] max-w-[380px] flex-1">
                    <MdSearch className="text-blue-400 text-lg shrink-0" />
                    <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Rechercher resto, adresse, lieu (Google Places)..."
                        className="w-full bg-transparent text-xs text-white placeholder:text-slate-400 outline-none font-medium"
                    />
                    {searchedPlaceName && (
                        <button
                            onClick={() => {
                                setSearchedPlaceName("");
                                if (searchInputRef.current) searchInputRef.current.value = "";
                                if (searchedPlaceMarkerRef.current) searchedPlaceMarkerRef.current.setMap(null);
                            }}
                            className="text-slate-400 hover:text-white"
                        >
                            <MdClose className="text-sm" />
                        </button>
                    )}
                </div>

                {/* Right controls: Layer toggles, Granular POI Filter Dropdown & Style switcher */}
                <div className="flex items-center gap-2 pointer-events-auto relative">
                    {/* Layer Toggles (Fleet / Orders / Stores) */}
                    <div className="hidden md:flex items-center gap-1 bg-slate-900/90 backdrop-blur-md p-1 rounded-2xl border border-slate-800 shadow-xl">
                        <button
                            onClick={() => setShowLivreurs(!showLivreurs)}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold transition-all ${
                                showLivreurs 
                                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" 
                                    : "text-slate-400 hover:text-slate-200"
                            }`}
                        >
                            <MdDeliveryDining className="text-sm" />
                            Motos ({livreurs.length})
                        </button>

                        <button
                            onClick={() => setShowCommandes(!showCommandes)}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold transition-all ${
                                showCommandes 
                                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" 
                                    : "text-slate-400 hover:text-slate-200"
                            }`}
                        >
                            <MdPersonPinCircle className="text-sm" />
                            Clients ({commandes.length})
                        </button>

                        <button
                            onClick={() => setShowMagasins(!showMagasins)}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold transition-all ${
                                showMagasins 
                                    ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30" 
                                    : "text-slate-400 hover:text-slate-200"
                            }`}
                        >
                            <MdStorefront className="text-sm" />
                            Magasins
                        </button>
                    </div>

                    {/* Granular POI & Map Layer Filters Button */}
                    <div className="relative">
                        <button
                            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                            title="Personnaliser les informations affichées sur la carte (Routes, Hôtels, Restaurants, etc.)"
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-semibold backdrop-blur-md shadow-xl transition-all ${
                                showFilterDropdown || activeLayersCount < 5
                                    ? "bg-blue-600 text-white border border-blue-400 shadow-blue-500/30"
                                    : "bg-slate-900/90 text-slate-300 hover:text-white border border-slate-800"
                            }`}
                        >
                            <MdTune className="text-base text-blue-300" />
                            <span>Calques & Lieux</span>
                            <span className="bg-slate-800 px-1.5 py-0.5 rounded-md text-[10px] font-bold text-blue-300">
                                {activeLayersCount}/10
                            </span>
                        </button>

                        {/* Floating POI Filter Popover Menu */}
                        {showFilterDropdown && (
                            <div className="absolute right-0 top-11 w-72 bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-3xl p-4 shadow-2xl z-50 text-slate-200 animate-fadeIn space-y-3">
                                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                                    <div className="flex items-center gap-2">
                                        <MdTune className="text-blue-400 text-lg" />
                                        <h4 className="font-bold text-xs text-white uppercase tracking-wider">Éléments de carte</h4>
                                    </div>
                                    <button 
                                        onClick={() => setShowFilterDropdown(false)}
                                        className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
                                    >
                                        <MdClose className="text-sm" />
                                    </button>
                                </div>

                                {/* Quick Presets */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleHideAllLayers}
                                        className="flex-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-amber-400 text-[11px] font-semibold rounded-xl border border-amber-500/20 transition-all flex items-center justify-center gap-1"
                                    >
                                        <MdVisibilityOff className="text-sm" /> Focus Livreurs
                                    </button>
                                    <button
                                        onClick={handleShowAllLayers}
                                        className="flex-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 text-[11px] font-semibold rounded-xl border border-emerald-500/20 transition-all flex items-center justify-center gap-1"
                                    >
                                        <MdVisibility className="text-sm" /> Tout Afficher
                                    </button>
                                </div>

                                {/* Granular Checkboxes List */}
                                <div className="space-y-1 max-h-64 overflow-y-auto pr-1 custom-scroll text-xs">
                                    {/* 1. Routes & Autoroutes */}
                                    <label className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-800/70 cursor-pointer transition-colors">
                                        <div className="flex items-center gap-2.5 text-slate-200 font-medium">
                                            <MdAltRoute className="text-amber-400 text-base" />
                                            <span>Numéros & Noms des routes</span>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={layerFilters.roadNumbers}
                                            onChange={() => toggleLayer("roadNumbers")}
                                            className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                                        />
                                    </label>

                                    {/* 2. Restaurants & Cafés */}
                                    <label className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-800/70 cursor-pointer transition-colors">
                                        <div className="flex items-center gap-2.5 text-slate-200 font-medium">
                                            <MdRestaurant className="text-orange-400 text-base" />
                                            <span>Restaurants & Cafés</span>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={layerFilters.restaurants}
                                            onChange={() => toggleLayer("restaurants")}
                                            className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                                        />
                                    </label>

                                    {/* 3. Hôtels & Hébergements */}
                                    <label className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-800/70 cursor-pointer transition-colors">
                                        <div className="flex items-center gap-2.5 text-slate-200 font-medium">
                                            <MdHotel className="text-indigo-400 text-base" />
                                            <span>Hôtels & Hébergements</span>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={layerFilters.hotels}
                                            onChange={() => toggleLayer("hotels")}
                                            className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                                        />
                                    </label>

                                    {/* 4. Magasins & Commerces */}
                                    <label className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-800/70 cursor-pointer transition-colors">
                                        <div className="flex items-center gap-2.5 text-slate-200 font-medium">
                                            <MdShoppingBag className="text-pink-400 text-base" />
                                            <span>Magasins & Commerces</span>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={layerFilters.shops}
                                            onChange={() => toggleLayer("shops")}
                                            className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                                        />
                                    </label>

                                    {/* 5. Hôpitaux & Santé */}
                                    <label className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-800/70 cursor-pointer transition-colors">
                                        <div className="flex items-center gap-2.5 text-slate-200 font-medium">
                                            <MdLocalHospital className="text-rose-400 text-base" />
                                            <span>Hôpitaux & Santé</span>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={layerFilters.medical}
                                            onChange={() => toggleLayer("medical")}
                                            className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                                        />
                                    </label>

                                    {/* 6. Transports & Stations */}
                                    <label className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-800/70 cursor-pointer transition-colors">
                                        <div className="flex items-center gap-2.5 text-slate-200 font-medium">
                                            <MdDirectionsBus className="text-cyan-400 text-base" />
                                            <span>Transports & Stations</span>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={layerFilters.transit}
                                            onChange={() => toggleLayer("transit")}
                                            className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                                        />
                                    </label>

                                    {/* 7. Banques & Finances */}
                                    <label className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-800/70 cursor-pointer transition-colors">
                                        <div className="flex items-center gap-2.5 text-slate-200 font-medium">
                                            <MdAccountBalance className="text-emerald-400 text-base" />
                                            <span>Banques & Finances</span>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={layerFilters.banks}
                                            onChange={() => toggleLayer("banks")}
                                            className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                                        />
                                    </label>

                                    {/* 8. Parcs & Espaces verts */}
                                    <label className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-800/70 cursor-pointer transition-colors">
                                        <div className="flex items-center gap-2.5 text-slate-200 font-medium">
                                            <MdPark className="text-green-400 text-base" />
                                            <span>Parcs & Espaces verts</span>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={layerFilters.parks}
                                            onChange={() => toggleLayer("parks")}
                                            className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                                        />
                                    </label>

                                    {/* 9. Établissements & Écoles */}
                                    <label className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-800/70 cursor-pointer transition-colors">
                                        <div className="flex items-center gap-2.5 text-slate-200 font-medium">
                                            <MdSchool className="text-purple-400 text-base" />
                                            <span>Écoles & Établissements</span>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={layerFilters.government}
                                            onChange={() => toggleLayer("government")}
                                            className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                                        />
                                    </label>

                                    {/* 10. Villes & Wilayas */}
                                    <label className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-800/70 cursor-pointer transition-colors">
                                        <div className="flex items-center gap-2.5 text-slate-200 font-medium">
                                            <MdLocationCity className="text-blue-400 text-base" />
                                            <span>Villes & Wilayas</span>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={layerFilters.cities}
                                            onChange={() => toggleLayer("cities")}
                                            className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                                        />
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Style switcher */}
                    <div className="flex items-center gap-1 bg-slate-900/90 backdrop-blur-md p-1 rounded-2xl border border-slate-800 shadow-xl">
                        <button
                            onClick={() => setMapStyle("dark")}
                            className={`px-2.5 py-1 rounded-xl text-xs font-medium transition-all ${
                                mapStyle === "dark" ? "bg-slate-700 text-white font-bold" : "text-slate-400 hover:text-white"
                            }`}
                        >
                            🌙 Nuit
                        </button>
                        <button
                            onClick={() => setMapStyle("streets")}
                            className={`px-2.5 py-1 rounded-xl text-xs font-medium transition-all ${
                                mapStyle === "streets" ? "bg-slate-700 text-white font-bold" : "text-slate-400 hover:text-white"
                            }`}
                        >
                            🗺️ Plan
                        </button>
                        <button
                            onClick={() => setMapStyle("satellite")}
                            className={`px-2.5 py-1 rounded-xl text-xs font-medium transition-all ${
                                mapStyle === "satellite" ? "bg-slate-700 text-white font-bold" : "text-slate-400 hover:text-white"
                            }`}
                        >
                            🛰️ Satellite
                        </button>
                    </div>
                </div>
            </div>

            {/* Bottom-Left Motorcycle Status Legend */}
            <div className="absolute bottom-4 left-3 z-10 bg-slate-900/95 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-800 shadow-2xl hidden sm:flex items-center gap-3 text-[11px] font-semibold text-slate-300 pointer-events-auto">
                <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Flotte Motos :</span>
                <span className="flex items-center gap-1 text-emerald-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm" />
                    🟢 En ligne (Libre)
                </span>
                <span className="flex items-center gap-1 text-amber-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm" />
                    🟡 En livraison
                </span>
                <span className="flex items-center gap-1 text-slate-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-500 shadow-sm" />
                    ⚫ Hors ligne
                </span>
                <span className="flex items-center gap-1 text-red-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-600 shadow-sm" />
                    🔴 Bloqué
                </span>
            </div>

            {/* Bottom Right Actions (Zoom, Recenter & Fit Fleet) */}
            <div className="absolute bottom-4 right-3 z-10 flex flex-col gap-2 pointer-events-auto">
                <button
                    onClick={handleFitAllFleet}
                    title="Voir toute la flotte sur la carte"
                    className="p-2.5 bg-slate-900/90 backdrop-blur-md hover:bg-slate-800 text-emerald-400 rounded-xl border border-slate-700/60 shadow-xl transition-all hover:scale-105 active:scale-95 text-xs font-bold flex items-center justify-center"
                >
                    🛵 Flotte
                </button>
                <button
                    onClick={handleResetCenter}
                    title="Recentrer sur la zone"
                    className="p-2.5 bg-slate-900/90 backdrop-blur-md hover:bg-slate-800 text-slate-200 rounded-xl border border-slate-700/60 shadow-xl transition-all hover:scale-105 active:scale-95"
                >
                    <MdMyLocation className="text-lg text-blue-400" />
                </button>
                <div className="flex flex-col bg-slate-900/90 backdrop-blur-md rounded-xl border border-slate-700/60 shadow-xl overflow-hidden">
                    <button
                        onClick={handleZoomIn}
                        title="Zoom avant"
                        className="p-2.5 hover:bg-slate-800 text-slate-200 border-b border-slate-800 transition-colors"
                    >
                        <MdZoomIn className="text-lg" />
                    </button>
                    <button
                        onClick={handleZoomOut}
                        title="Zoom arrière"
                        className="p-2.5 hover:bg-slate-800 text-slate-200 transition-colors"
                    >
                        <MdZoomOut className="text-lg" />
                    </button>
                </div>
            </div>

            {/* Selected Driver or Order Floating Bar */}
            {(selectedOrder || selectedLivreur) && (
                <div className="absolute bottom-4 left-3 right-20 z-10 bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl p-3 shadow-2xl animate-slideUp text-white flex items-center justify-between gap-4 pointer-events-auto">
                    {selectedOrder ? (
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="p-2.5 bg-cyan-500/20 text-cyan-400 rounded-xl border border-cyan-500/30 text-xl shrink-0">
                                <MdPersonPinCircle />
                            </div>
                            <div className="truncate">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-sm text-cyan-300">Commande #{selectedOrder.id}</span>
                                    <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold bg-slate-800 text-slate-300">
                                        {selectedOrder.status}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-300 truncate mt-0.5">
                                    🏬 {selectedOrder.magasin_info?.name || "Restaurant"} ➔ 📍 {selectedOrder.distination || "Client"}
                                </p>
                            </div>
                        </div>
                    ) : selectedLivreur ? (
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className={`p-2.5 rounded-xl text-xl shrink-0 ${
                                selectedLivreur.is_blocked || selectedLivreur.user?.bloquer
                                    ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                                    : (selectedLivreur.active_orders_count || 0) > 0
                                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                    : selectedLivreur.is_available
                                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                    : "bg-slate-800 text-slate-400"
                            }`}>
                                <MdDeliveryDining />
                            </div>
                            <div className="truncate">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-sm text-emerald-300">
                                        {selectedLivreur.user?.first_name || ""} {selectedLivreur.user?.last_name || selectedLivreur.user?.username || `Livreur #${selectedLivreur.id}`}
                                    </span>
                                    <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold bg-slate-800 text-slate-300">
                                        {selectedLivreur.is_blocked || selectedLivreur.user?.bloquer ? "🔴 Bloqué" : (selectedLivreur.active_orders_count || 0) > 0 ? `🟡 En livraison (${selectedLivreur.active_orders_count})` : selectedLivreur.is_available ? "🟢 En ligne (Libre)" : "⚫ Hors ligne"}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-300 truncate mt-0.5">
                                    📞 {selectedLivreur.user?.phone || "N/A"} • 📦 {selectedLivreur.active_orders_count} course(s) en cours
                                </p>
                            </div>
                        </div>
                    ) : null}

                    <div className="flex items-center gap-2 shrink-0">
                        {selectedOrder && onAssignOrder && !selectedOrder.livreur && (
                            <button
                                onClick={() => onAssignOrder(selectedOrder)}
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-md transition-colors"
                            >
                                Assigner
                            </button>
                        )}
                        {selectedLivreur && onToggleBlockLivreur && (
                            <button
                                onClick={() => onToggleBlockLivreur(selectedLivreur)}
                                className={`px-3 py-1.5 font-semibold text-xs rounded-xl shadow-md transition-colors ${
                                    selectedLivreur.is_blocked || selectedLivreur.user?.bloquer
                                        ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                                        : "bg-rose-600 hover:bg-rose-500 text-white"
                                }`}
                            >
                                {selectedLivreur.is_blocked || selectedLivreur.user?.bloquer ? "Débloquer" : "Bloquer"}
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
