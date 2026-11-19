import { apiRequest } from "./request";
import toast from "react-hot-toast";

// ==========================================
// TYPES : CAISSE VTC & CAISSE LIVREUR
// ==========================================

export type CaisseKPIs = {
    total_ca?: number;
    total_commandes?: number;
    total_livraison?: number;
    total_benefice_chauffeurs?: number;
    total_benefice_livreurs?: number;
    total_tax_ltc: number;
    total_solde_impaye: number;
    total_encaisse: number;
    total_chauffeurs?: number;
    total_livreurs?: number;
    chauffeurs_en_dette?: number;
    livreurs_en_dette?: number;
    chauffeurs_a_jour?: number;
    livreurs_a_jour?: number;
};

export type CaisseVtcChauffeur = {
    id: number;
    user_id: number | null;
    name: string;
    username: string;
    phone: string;
    wilaya: string;
    image_url: string | null;
    vehicule: {
        marque?: string;
        modele?: string;
        matricule?: string;
        type?: string;
    } | null;
    total_courses: number;
    chiffre_affaires: number;
    benefice_chauffeur: number;
    tax_ltc_total: number;
    solde_a_payer: number;
    statut_solde: "debt" | "settled";
    dernier_versement: {
        id: number;
        montant: number;
        date: string;
        mode_paiement: string;
        reference?: string;
    } | null;
};

export type CaisseLivreurItem = {
    id: number;
    user_id: number | null;
    name: string;
    username: string;
    phone: string;
    wilaya: string;
    image_url: string | null;
    vehicule: {
        marque?: string;
        type?: string;
        matricule?: string;
    } | null;
    total_commandes: number;
    total_livraison: number;
    benefice_livreur: number;
    tax_ltc_total: number;
    solde_a_payer: number;
    statut_solde: "debt" | "settled";
    dernier_versement: {
        id: number;
        montant: number;
        date: string;
        mode_paiement: string;
        reference?: string;
    } | null;
};

export type VersementHistoryItem = {
    id: number;
    montant: number;
    solde_avant: number;
    solde_apres: number;
    mode_paiement: string;
    reference: string;
    observation: string;
    agent_name: string;
    date: string;
};

// ==========================================
// ACTIONS : CAISSE VTC
// ==========================================

export async function getCaisseVtcChauffeurs(params?: {
    search?: string;
    wilaya?: string;
    status?: string;
    page?: number;
    page_size?: number;
}): Promise<{
    success: boolean;
    kpis: CaisseKPIs;
    results: CaisseVtcChauffeur[];
    total: number;
    page: number;
    total_pages: number;
} | null> {
    try {
        const response = await apiRequest({
            method: "GET",
            url: "/api/v1/caisse/vtc/chauffeurs",
            params: {
                search: params?.search || "",
                wilaya: params?.wilaya || "",
                status: params?.status || "all",
                page: params?.page || 1,
                page_size: params?.page_size || 20
            }
        });

        if (response.code === 200 && response.data?.success) {
            return response.data;
        }
        return null;
    } catch {
        return null;
    }
}

export async function solderCompteChauffeur(payload: {
    chauffeur_id: number;
    montant?: number;
    mode_paiement?: string;
    reference?: string;
    observation?: string;
}): Promise<{ success: boolean; message: string; solde_apres?: number }> {
    const loadingToastId = toast.loading("Enregistrement du versement en cours...");
    try {
        const response = await apiRequest({
            method: "POST",
            url: "/api/v1/caisse/vtc/solder",
            data: payload
        });

        if (response.code === 200 && response.data?.success) {
            toast.success(response.data.message || "Versement enregistré avec succès !", { id: loadingToastId });
            return { success: true, message: response.data.message, solde_apres: response.data.solde_apres };
        } else {
            toast.error(response.data?.message || response.message || "Erreur lors du versement", { id: loadingToastId });
            return { success: false, message: response.data?.message || response.message || "Erreur" };
        }
    } catch {
        toast.error("Problème de connexion au serveur", { id: loadingToastId });
        return { success: false, message: "Problème de connexion" };
    }
}

export async function getVersementsChauffeur(chauffeurId: number): Promise<VersementHistoryItem[]> {
    try {
        const response = await apiRequest({
            method: "GET",
            url: `/api/v1/caisse/vtc/versements/${chauffeurId}`
        });

        if (response.code === 200 && response.data?.success) {
            return response.data.versements || [];
        }
        return [];
    } catch {
        return [];
    }
}

// ==========================================
// ACTIONS : CAISSE LIVREUR
// ==========================================

export async function getCaisseLivreurs(params?: {
    search?: string;
    wilaya?: string;
    status?: string;
    page?: number;
    page_size?: number;
}): Promise<{
    success: boolean;
    kpis: CaisseKPIs;
    results: CaisseLivreurItem[];
    total: number;
    page: number;
    total_pages: number;
} | null> {
    try {
        const response = await apiRequest({
            method: "GET",
            url: "/api/v1/caisse/livreur/livreurs",
            params: {
                search: params?.search || "",
                wilaya: params?.wilaya || "",
                status: params?.status || "all",
                page: params?.page || 1,
                page_size: params?.page_size || 20
            }
        });

        if (response.code === 200 && response.data?.success) {
            return response.data;
        }
        return null;
    } catch {
        return null;
    }
}

export async function solderCompteLivreur(payload: {
    livreur_id: number;
    montant?: number;
    mode_paiement?: string;
    reference?: string;
    observation?: string;
}): Promise<{ success: boolean; message: string; solde_apres?: number }> {
    const loadingToastId = toast.loading("Enregistrement du versement en cours...");
    try {
        const response = await apiRequest({
            method: "POST",
            url: "/api/v1/caisse/livreur/solder",
            data: payload
        });

        if (response.code === 200 && response.data?.success) {
            toast.success(response.data.message || "Versement enregistré avec succès !", { id: loadingToastId });
            return { success: true, message: response.data.message, solde_apres: response.data.solde_apres };
        } else {
            toast.error(response.data?.message || response.message || "Erreur lors du versement", { id: loadingToastId });
            return { success: false, message: response.data?.message || response.message || "Erreur" };
        }
    } catch {
        toast.error("Problème de connexion au serveur", { id: loadingToastId });
        return { success: false, message: "Problème de connexion" };
    }
}

export async function getVersementsLivreur(livreurId: number): Promise<VersementHistoryItem[]> {
    try {
        const response = await apiRequest({
            method: "GET",
            url: `/api/v1/caisse/livreur/versements/${livreurId}`
        });

        if (response.code === 200 && response.data?.success) {
            return response.data.versements || [];
        }
        return [];
    } catch {
        return [];
    }
}

// ==========================================
// TYPES ET ACTIONS CAISSE GLOBALE ANALYTICS
// ==========================================

export interface CaisseGlobalePeriodStats {
    ca_global: number;
    benefice_global: number;
    ca_vtc: number;
    benefice_vtc: number;
    part_chauffeurs: number;
    courses_count: number;
    ca_food_livraison: number;
    benefice_food: number;
    part_livreurs: number;
    valeur_marchandise_food: number;
    commandes_count: number;
    total_versements: number;
    versements_vtc: number;
    versements_livreur: number;
}

export interface CaisseGlobaleDailyTrend {
    date: string;
    date_display: string;
    date_full: string;
    day_name: string;
    ca_global: number;
    benefice_global: number;
    ca_vtc: number;
    benefice_vtc: number;
    courses_count: number;
    ca_food: number;
    benefice_food: number;
    commandes_count: number;
    total_versements: number;
    growth_vs_previous: number;
    is_today: boolean;
}

export interface CaisseGlobaleRecentVersement {
    id: number;
    type_caisse: 'VTC' | 'LIVREUR';
    person_name: string;
    montant: number;
    mode_paiement: string;
    reference: string;
    date: string;
    agent_name: string;
}

export interface CaisseGlobaleAnalyticsResponse {
    success: boolean;
    period: 'day' | 'week' | 'month' | 'year';
    date_ref: string;
    labels: {
        current: string;
        previous: string;
        curr_range: string;
        prev_range: string;
    };
    current: CaisseGlobalePeriodStats;
    previous: CaisseGlobalePeriodStats;
    growth: {
        ca_global: number;
        benefice_global: number;
        ca_vtc: number;
        benefice_vtc: number;
        courses_count: number;
        ca_food: number;
        benefice_food: number;
        commandes_count: number;
        total_versements: number;
    };
    ratios: {
        vtc_percent: number;
        food_percent: number;
    };
    daily_trends: CaisseGlobaleDailyTrend[];
    recent_versements: CaisseGlobaleRecentVersement[];
}

export async function getCaisseGlobaleAnalytics(params?: {
    period?: 'day' | 'week' | 'month' | 'year';
    date_ref?: string;
}): Promise<CaisseGlobaleAnalyticsResponse | null> {
    try {
        const response = await apiRequest({
            method: "GET",
            url: "/api/v1/caisse/globale/analytics",
            params: {
                period: params?.period || "day",
                date_ref: params?.date_ref || ""
            }
        });

        if (response.code === 200 && response.data?.success) {
            return response.data;
        }
        return null;
    } catch {
        return null;
    }
}
