import { apiRequest } from "./request";

type apiCommand = {
    result: Order[];
    totalAct: number;
}


export async function tutorialVideo(): Promise<Video[] | null> {
    try {
        const response = await apiRequest({
            method: "GET",
            url: "/api/v1/videototos",
        })
        if (response.code == 200) {
            return response.data.data
        } else {
            return null;
        }
    } catch {
        return null;
    }
}

export async function tutorialCatégorie(): Promise<Categories[] | null> {
    try {
        const response = await apiRequest({
            method: "GET",
            url: "/api/v1/cataloguevideo",
        })
        if (response.code == 200) {
            return response.data.data
        } else {
            return null;
        }
    } catch {
        return null;
    }
}

// Approximate coordinates for Algerian Wilayas (offline fallback)
const ALGERIA_WILAYAS: { name: string; lat: number; lng: number }[] = [
    { name: "Adrar", lat: 27.8742, lng: -0.2939 },
    { name: "Chlef", lat: 36.1652, lng: 1.3345 },
    { name: "Laghouat", lat: 33.8000, lng: 2.8650 },
    { name: "Oum El Bouaghi", lat: 35.8753, lng: 7.1135 },
    { name: "Batna", lat: 35.5559, lng: 6.1741 },
    { name: "Béjaïa", lat: 36.7559, lng: 5.0843 },
    { name: "Biskra", lat: 34.8504, lng: 5.7281 },
    { name: "Béchar", lat: 31.6167, lng: -2.2167 },
    { name: "Blida", lat: 36.4700, lng: 2.8277 },
    { name: "Bouira", lat: 36.3749, lng: 3.9010 },
    { name: "Tamanrasset", lat: 22.7850, lng: 5.5228 },
    { name: "Tébessa", lat: 35.4042, lng: 8.1242 },
    { name: "Tlemcen", lat: 34.8828, lng: -1.3167 },
    { name: "Tiaret", lat: 35.3710, lng: 1.3170 },
    { name: "Tizi Ouzou", lat: 36.7118, lng: 4.0459 },
    { name: "Alger", lat: 36.7538, lng: 3.0588 },
    { name: "Djelfa", lat: 34.6728, lng: 3.2630 },
    { name: "Jijel", lat: 36.8206, lng: 5.7667 },
    { name: "Sétif", lat: 36.1898, lng: 5.4108 },
    { name: "Saïda", lat: 34.8303, lng: 0.1517 },
    { name: "Skikda", lat: 36.8792, lng: 6.9069 },
    { name: "Sidi Bel Abbès", lat: 35.1899, lng: -0.6308 },
    { name: "Annaba", lat: 36.9000, lng: 7.7667 },
    { name: "Guelma", lat: 36.4622, lng: 7.4261 },
    { name: "Constantine", lat: 36.3650, lng: 6.6147 },
    { name: "Médéa", lat: 36.2642, lng: 2.7539 },
    { name: "Mostaganem", lat: 35.9312, lng: 0.0892 },
    { name: "M'Sila", lat: 35.7058, lng: 4.5419 },
    { name: "Mascara", lat: 35.3966, lng: 0.1403 },
    { name: "Ouargla", lat: 31.9539, lng: 5.3200 },
    { name: "Oran", lat: 35.6987, lng: -0.6349 },
    { name: "El Bayadh", lat: 33.6832, lng: 1.0193 },
    { name: "Illizi", lat: 26.4833, lng: 8.4667 },
    { name: "Bordj Bou Arreridj", lat: 36.0732, lng: 4.7611 },
    { name: "Boumerdès", lat: 36.7664, lng: 3.4772 },
    { name: "El Tarf", lat: 36.7672, lng: 8.3138 },
    { name: "Tindouf", lat: 27.6761, lng: -8.1478 },
    { name: "Tissemsilt", lat: 35.6072, lng: 1.8108 },
    { name: "El Oued", lat: 33.3683, lng: 6.8675 },
    { name: "Khenchela", lat: 35.4358, lng: 7.1433 },
    { name: "Souk Ahras", lat: 36.2864, lng: 7.9511 },
    { name: "Tipaza", lat: 36.5897, lng: 2.4475 },
    { name: "Mila", lat: 36.4503, lng: 6.2644 },
    { name: "Aïn Defla", lat: 36.2647, lng: 1.9679 },
    { name: "Naâma", lat: 33.2667, lng: -0.3167 },
    { name: "Aïn Témouchent", lat: 35.2975, lng: -1.1404 },
    { name: "Ghardaïa", lat: 32.4909, lng: 3.6736 },
    { name: "Relizane", lat: 35.7373, lng: 0.5558 }
];

function findNearestWilaya(lat: number, lng: number): string {
    let minDistance = Infinity;
    let nearest = "Algérie";

    for (const w of ALGERIA_WILAYAS) {
        const d = Math.hypot(w.lat - lat, w.lng - lng);
        if (d < minDistance) {
            minDistance = d;
            nearest = w.name;
        }
    }
    return nearest;
}

export async function getCity({
    latitude,
    longitude,
}: {
    latitude: number;
    longitude: number;
}): Promise<{ city: string; code: string | null } | null> {
    // 1. Try BigDataCloud reverse geocoding (Fast, free, no API key needed, no CORS issues)
    try {
        const bdcUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=fr`;
        const res = await fetch(bdcUrl);
        if (res.ok) {
            const data = await res.json();
            const city = data.principalSubdivision || data.city || data.locality;
            if (city) {
                return {
                    city: city.replace(/ Province| Wilaya/gi, ""),
                    code: data.postcode || null
                };
            }
        }
    } catch {
        // Continue to fallback
    }

    // 2. Try Nominatim (OpenStreetMap)
    try {
        const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=fr`;
        const res = await fetch(nominatimUrl, {
            headers: {
                "User-Agent": "YalidineExpressApp/1.0"
            }
        });
        if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            const city = addr.state || addr.city || addr.town || addr.village || addr.county;
            if (city) {
                return {
                    city: city.replace(/ Province| Wilaya/gi, ""),
                    code: addr.postcode || null
                };
            }
        }
    } catch {
        // Continue to fallback
    }

    // 3. Offline nearest Algerian Wilaya calculation (instant, 100% reliable)
    const nearestWilaya = findNearestWilaya(latitude, longitude);
    return {
        city: nearestWilaya,
        code: null
    };
}



export async function centreAppelConfirmation({ page, confirmation, search }: { page: string, confirmation: string, search: string }): Promise<apiCommand | null> {
    try {
        const response = await apiRequest({
            method: "GET",
            url: "/api/v1/centre/centreappel/commande",
            params: { page, confirmation, search }
        })
        if (response.code == 200) {
            return {
                result: response.data.data,
                totalAct: response.data.total_pages
            }
        } else {
            return null
        }
    } catch {
        return null
    }
}

export async function getTotalNoConfirmed() {
    try {
        const response = await apiRequest({
            method: "GET",
            url: "/api/commande/starshop/noconfimated",
        })

        if (response.code == 200) {
            return response.data.count
        } else {
            return null;
        }
    } catch {
        return null
    }
}