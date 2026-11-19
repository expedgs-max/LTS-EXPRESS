import toast from "react-hot-toast";
import { apiRequest } from "./request";

export type CommissionFilterParams = {
    search?: string;
    wilaya?: string;
    type_course?: string;
    code_wilaya?: string;
};

/**
 * Récupère la liste des commissions / tarifs VTC depuis le backend
 */
export async function getCommissionsVTC(
    params?: CommissionFilterParams
): Promise<CommissionVTC[] | null> {
    try {
        const queryParams: Record<string, string> = {};
        if (params?.search) queryParams.search = params.search;
        if (params?.wilaya) queryParams.wilaya = params.wilaya;
        if (params?.type_course) queryParams.type_course = params.type_course;
        if (params?.code_wilaya) queryParams.code_wilaya = params.code_wilaya;

        const response = await apiRequest({
            method: "GET",
            url: "/api/v1/commission",
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
 * Crée une nouvelle commission VTC par wilaya / type
 */
export async function createCommissionVTC(
    data: Partial<CommissionVTC>
): Promise<boolean> {
    const loadingToastId = toast.loading("Création de la commission en cours...");
    try {
        const response = await apiRequest({
            method: "POST",
            url: "/api/v1/commission/create",
            data,
        });

        if (response.code === 201 || response.code === 200) {
            toast.success("Commission VTC créée avec succès", { id: loadingToastId });
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
 * Modifie une commission VTC existante
 */
export async function updateCommissionVTC(
    data: Partial<CommissionVTC> & { id: number }
): Promise<boolean> {
    const loadingToastId = toast.loading("Mise à jour de la commission...");
    try {
        const response = await apiRequest({
            method: "PUT",
            url: "/api/v1/commission/update",
            data,
        });

        if (response.code === 200) {
            toast.success("Commission VTC mise à jour avec succès", { id: loadingToastId });
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
 * Supprime une commission VTC
 */
export async function deleteCommissionVTC(id: number): Promise<boolean> {
    const loadingToastId = toast.loading("Suppression en cours...");
    try {
        const response = await apiRequest({
            method: "DELETE",
            url: `/api/v1/commission/delete/${id}`,
        });

        if (response.code === 200) {
            toast.success("Commission supprimée avec succès", { id: loadingToastId });
            return true;
        } else {
            toast.error(response.message || "Erreur lors de la suppression", { id: loadingToastId });
            return false;
        }
    } catch {
        toast.error("Problème de connexion au serveur", { id: loadingToastId });
        return false;
    }
}

/**
 * Récupère le taux global de commission plateforme chauffeur (tax_tawsile en %)
 */
export async function getChauffeurCommissionRate(): Promise<ChauffeurCommissionRate | null> {
    try {
        const response = await apiRequest({
            method: "GET",
            url: "/api/v1/commission/chauffeur/taux",
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
 * Met à jour le taux global de commission plateforme chauffeur (tax_tawsile en %)
 */
export async function updateChauffeurCommissionRate(
    tax_tawsile: number,
    description?: string
): Promise<boolean> {
    const loadingToastId = toast.loading("Mise à jour du taux chauffeur...");
    try {
        const response = await apiRequest({
            method: "PUT",
            url: "/api/v1/commission/chauffeur/taux",
            data: { tax_tawsile, description },
        });

        if (response.code === 200) {
            toast.success("Taux de commission chauffeur mis à jour", { id: loadingToastId });
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

/**
 * Récupère la liste des types de course VTC
 */
export async function getTypeCourses(): Promise<TypeCourseVTC[] | null> {
    try {
        const response = await apiRequest({
            method: "GET",
            url: "/api/v1/type_course",
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
 * Crée un nouveau type de course VTC
 */
export async function createTypeCourse(
    data: Partial<TypeCourseVTC>
): Promise<boolean> {
    const loadingToastId = toast.loading("Création du type de course...");
    try {
        const response = await apiRequest({
            method: "POST",
            url: "/api/v1/type_course/create",
            data,
        });

        if (response.code === 201 || response.code === 200) {
            toast.success("Type de course créé avec succès", { id: loadingToastId });
            return true;
        } else {
            const errMsg = (response.data && response.data.error) || response.message || "Erreur lors de la création";
            toast.error(errMsg, { id: loadingToastId });
            return false;
        }
    } catch {
        toast.error("Problème de connexion au serveur", { id: loadingToastId });
        return false;
    }
}

/**
 * Modifie un type de course VTC existant
 */
export async function updateTypeCourse(
    data: Partial<TypeCourseVTC> & { id: number }
): Promise<boolean> {
    const loadingToastId = toast.loading("Mise à jour du type de course...");
    try {
        const response = await apiRequest({
            method: "PUT",
            url: "/api/v1/type_course/update",
            data,
        });

        if (response.code === 200) {
            toast.success("Type de course mis à jour avec succès", { id: loadingToastId });
            return true;
        } else {
            const errMsg = (response.data && response.data.error) || response.message || "Erreur lors de la mise à jour";
            toast.error(errMsg, { id: loadingToastId });
            return false;
        }
    } catch {
        toast.error("Problème de connexion au serveur", { id: loadingToastId });
        return false;
    }
}

/**
 * Supprime un type de course VTC
 */
export async function deleteTypeCourse(id: number, force: boolean = false): Promise<boolean> {
    const loadingToastId = toast.loading("Suppression du type de course...");
    try {
        const response = await apiRequest({
            method: "DELETE",
            url: `/api/v1/type_course/delete/${id}${force ? "?force=true" : ""}`,
        });

        if (response.code === 200) {
            toast.success("Type de course supprimé avec succès", { id: loadingToastId });
            return true;
        } else {
            const errMsg = (response.data && response.data.error) || response.message || "Erreur lors de la suppression";
            toast.error(errMsg, { id: loadingToastId, duration: 4500 });
            return false;
        }
    } catch {
        toast.error("Problème de connexion au serveur", { id: loadingToastId });
        return false;
    }
}

