import toast from "react-hot-toast";
import { apiRequest } from "./request";

export type CibleObjectif = "vtc" | "livreur" | "tous";
export type TypeObjectif = "courses" | "chiffre_affaires";
export type PeriodeObjectif = "journalier" | "weekend" | "hebdomadaire" | "mensuel" | "personnalise";
export type StatutPeriode = "en_cours" | "a_venir" | "expire" | "inactif";

export interface Objectif {
    id: number;
    titre: string;
    description?: string;
    cible: CibleObjectif;
    cible_label: string;
    type_objectif: TypeObjectif;
    type_objectif_label: string;
    valeur_cible: number;
    prime_montant: number | string;
    periode: PeriodeObjectif;
    periode_label: string;
    date_debut: string;
    date_fin: string;
    wilaya: string;
    is_active: boolean;
    participants_count: number;
    completed_count: number;
    primes_payees_count: number;
    taux_completion: number;
    statut_periode: StatutPeriode;
    created_at: string;
    updated_at: string;
}

export interface ProgressionObjectif {
    id: number;
    objectif: number;
    user: number;
    partenaire?: number | null;
    user_nom_complet: string;
    user_phone: string;
    valeur_actuelle: number;
    valeur_cible: number;
    prime_montant: number | string;
    est_atteint: boolean;
    date_atteint?: string | null;
    prime_versee: boolean;
    date_versement?: string | null;
    pourcentage: number;
    created_at: string;
    updated_at: string;
}

export interface ObjectifStats {
    total_objectifs: number;
    active_vtc_count: number;
    active_livreur_count: number;
    total_primes_budget: number;
    total_primes_versees: number;
    total_participants: number;
    total_completions: number;
}

export interface ObjectifFilterParams {
    cible?: string;
    statut?: string;
    search?: string;
    wilaya?: string;
}

export interface CreateObjectifPayload {
    titre: string;
    description?: string;
    cible: CibleObjectif;
    type_objectif: TypeObjectif;
    valeur_cible: number;
    prime_montant: number;
    periode: PeriodeObjectif;
    date_debut: string;
    date_fin: string;
    wilaya: string;
    is_active?: boolean;
}

export interface UpdateObjectifPayload extends Partial<CreateObjectifPayload> {}

/**
 * Récupère la liste des objectifs avec filtres et statistiques
 */
export async function getObjectifs(
    params?: ObjectifFilterParams
): Promise<{ objectifs: Objectif[]; stats: ObjectifStats } | null> {
    try {
        const queryParams: Record<string, string> = {};
        if (params?.cible && params.cible !== "tous") queryParams.cible = params.cible;
        if (params?.statut && params.statut !== "tous") queryParams.statut = params.statut;
        if (params?.search) queryParams.search = params.search;
        if (params?.wilaya && params.wilaya !== "Toutes") queryParams.wilaya = params.wilaya;

        const response = await apiRequest({
            method: "GET",
            url: "/api/v1/objectifs",
            params: queryParams,
        });

        if (response && response.code === 200 && response.data) {
            return {
                objectifs: response.data.objectifs || [],
                stats: response.data.stats || {
                    total_objectifs: 0,
                    active_vtc_count: 0,
                    active_livreur_count: 0,
                    total_primes_budget: 0,
                    total_primes_versees: 0,
                    total_participants: 0,
                    total_completions: 0,
                },
            };
        }
        return null;
    } catch {
        return null;
    }
}

/**
 * Crée un nouvel objectif
 */
export async function createObjectif(data: CreateObjectifPayload): Promise<boolean> {
    const loadingToast = toast.loading("Création de l'objectif en cours...");
    try {
        const response = await apiRequest({
            method: "POST",
            url: "/api/v1/objectifs/create",
            data,
        });

        if (response && (response.code === 201 || response.code === 200)) {
            toast.success("Objectif créé avec succès !", { id: loadingToast });
            return true;
        } else {
            toast.error(response?.message || "Erreur lors de la création", { id: loadingToast });
            return false;
        }
    } catch {
        toast.error("Erreur de connexion au serveur", { id: loadingToast });
        return false;
    }
}

/**
 * Modifie un objectif existant
 */
export async function updateObjectif(id: number, data: UpdateObjectifPayload): Promise<boolean> {
    const loadingToast = toast.loading("Mise à jour de l'objectif...");
    try {
        const response = await apiRequest({
            method: "POST",
            url: `/api/v1/objectifs/${id}/update`,
            data,
        });

        if (response && response.code === 200) {
            toast.success("Objectif mis à jour avec succès !", { id: loadingToast });
            return true;
        } else {
            toast.error(response?.message || "Erreur lors de la mise à jour", { id: loadingToast });
            return false;
        }
    } catch {
        toast.error("Erreur de connexion au serveur", { id: loadingToast });
        return false;
    }
}

/**
 * Supprime un objectif
 */
export async function deleteObjectif(id: number): Promise<boolean> {
    const loadingToast = toast.loading("Suppression de l'objectif...");
    try {
        const response = await apiRequest({
            method: "POST",
            url: `/api/v1/objectifs/${id}/delete`,
        });

        if (response && response.code === 200) {
            toast.success("Objectif supprimé avec succès", { id: loadingToast });
            return true;
        } else {
            toast.error(response?.message || "Erreur lors de la suppression", { id: loadingToast });
            return false;
        }
    } catch {
        toast.error("Erreur de connexion au serveur", { id: loadingToast });
        return false;
    }
}

/**
 * Active ou désactive un objectif
 */
export async function toggleObjectifStatus(id: number): Promise<boolean> {
    try {
        const response = await apiRequest({
            method: "POST",
            url: `/api/v1/objectifs/${id}/toggle`,
        });

        if (response && response.code === 200) {
            toast.success(response.data?.message || "Statut modifié avec succès");
            return true;
        }
        toast.error("Erreur lors de la modification du statut");
        return false;
    } catch {
        toast.error("Erreur réseau");
        return false;
    }
}

/**
 * Récupère la liste des progressions des chauffeurs / livreurs pour un objectif
 */
export async function getObjectifProgressions(id: number): Promise<ProgressionObjectif[] | null> {
    try {
        const response = await apiRequest({
            method: "GET",
            url: `/api/v1/objectifs/${id}/progressions`,
        });

        if (response && response.code === 200 && response.data) {
            return response.data.progressions || [];
        }
        return null;
    } catch {
        return null;
    }
}

/**
 * Valide et verse la prime pour un chauffeur ou livreur ayant atteint l'objectif
 */
export async function validerPrimeObjectif(progressionId: number): Promise<boolean> {
    const loadingToast = toast.loading("Validation et versement de la prime...");
    try {
        const response = await apiRequest({
            method: "POST",
            url: `/api/v1/objectifs/progression/${progressionId}/valider_prime`,
        });

        if (response && response.code === 200) {
            toast.success(response.data?.message || "Prime validée et créditée !", { id: loadingToast });
            return true;
        } else {
            toast.error(response?.data?.error || response?.message || "Impossible de verser la prime", { id: loadingToast });
            return false;
        }
    } catch {
        toast.error("Erreur réseau", { id: loadingToast });
        return false;
    }
}
