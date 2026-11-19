import toast from "react-hot-toast";
import { apiRequest } from "./request";

export type CommissionLivreurFilterParams = {
    search?: string;
};

/**
 * Récupère la liste des barèmes / paliers de commission livreur depuis le backend
 */
export async function getCommissionsLivreur(
    params?: CommissionLivreurFilterParams
): Promise<CommissionLivreur[] | null> {
    try {
        const queryParams: Record<string, string> = {};
        if (params?.search) queryParams.search = params.search;

        const response = await apiRequest({
            method: "GET",
            url: "/api/v1/commission/livreur",
            params: queryParams,
        });

        if (response.code === 200 && Array.isArray(response.data)) {
            return response.data;
        }
        return null;
    } catch {
        return null;
    }
}

/**
 * Crée un nouveau barème de livraison pour livreurs (km, prix, description)
 */
export async function createCommissionLivreur(
    data: Partial<CommissionLivreur>
): Promise<boolean> {
    const loadingToastId = toast.loading("Création du barème livreur en cours...");
    try {
        const response = await apiRequest({
            method: "POST",
            url: "/api/v1/commission/livreur/create",
            data,
        });

        if (response.code === 201 || response.code === 200) {
            toast.success("Barème livreur créé avec succès", { id: loadingToastId });
            return true;
        } else {
            toast.error(response.message || "Erreur lors de la création", { id: loadingToastId });
            return false;
        }
    } catch {
        toast.error("Problème de connexion au serveur", { id: loadingToastId });
        return false;
    }
}

/**
 * Modifie un barème de livraison existant
 */
export async function updateCommissionLivreur(
    data: Partial<CommissionLivreur> & { id: number }
): Promise<boolean> {
    const loadingToastId = toast.loading("Mise à jour du barème livreur...");
    try {
        const response = await apiRequest({
            method: "PUT",
            url: "/api/v1/commission/livreur/update",
            data,
        });

        if (response.code === 200) {
            toast.success("Barème livreur mis à jour avec succès", { id: loadingToastId });
            return true;
        } else {
            toast.error(response.message || "Erreur lors de la mise à jour", { id: loadingToastId });
            return false;
        }
    } catch {
        toast.error("Problème de connexion au serveur", { id: loadingToastId });
        return false;
    }
}

/**
 * Supprime un barème de livraison livreur
 */
export async function deleteCommissionLivreur(id: number): Promise<boolean> {
    const loadingToastId = toast.loading("Suppression du barème en cours...");
    try {
        let response = await apiRequest({
            method: "DELETE",
            url: `/api/v1/commission/livreur/delete/${id}`,
            data: { id },
        });

        // Fallback if URL param had an issue
        if (!response || response.code !== 200) {
            const fallbackResponse = await apiRequest({
                method: "DELETE",
                url: `/api/v1/commission/livreur/delete`,
                data: { id },
            });
            if (fallbackResponse && fallbackResponse.code === 200) {
                response = fallbackResponse;
            }
        }

        if (response && response.code === 200) {
            toast.success("Barème supprimé avec succès", { id: loadingToastId });
            return true;
        } else {
            toast.error(response?.message || "Erreur lors de la suppression", { id: loadingToastId });
            return false;
        }
    } catch {
        toast.error("Problème de connexion au serveur", { id: loadingToastId });
        return false;
    }
}

/**
 * Récupère le taux de commission plateforme livreur (tax_tawsile en %)
 */
export async function getLivreurCommissionRate(): Promise<LivreurCommissionRate | null> {
    try {
        const response = await apiRequest({
            method: "GET",
            url: "/api/v1/commission/livreur/taux",
        });

        if (response.code === 200 && response.data) {
            return response.data;
        }
        return null;
    } catch {
        return null;
    }
}

/**
 * Met à jour le taux de commission plateforme livreur (tax_tawsile en %)
 */
export async function updateLivreurCommissionRate(
    tax_tawsile: number,
    description?: string
): Promise<boolean> {
    const loadingToastId = toast.loading("Mise à jour du taux livreur...");
    try {
        const response = await apiRequest({
            method: "PUT",
            url: "/api/v1/commission/livreur/taux",
            data: { tax_tawsile, description },
        });

        if (response.code === 200) {
            toast.success("Taux de commission livreur mis à jour", { id: loadingToastId });
            return true;
        } else {
            toast.error(response.message || "Erreur de mise à jour", { id: loadingToastId });
            return false;
        }
    } catch {
        toast.error("Problème de connexion au serveur", { id: loadingToastId });
        return false;
    }
}
