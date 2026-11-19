import toast from "react-hot-toast";
import { apiRequest } from "./request";

export type VtcVehicule = {
    id?: number;
    marque: string;
    modele: string;
    matricule: string;
    type_vehicule: string;
    num_assurance?: string;
    num_scanner?: string;
    date_expiration_assurance?: string | null;
    date_expiration_scanner?: string | null;
};

export type VtcDocuments = {
    card_number?: string;
    RC?: string;
    Nif?: string;
    numero_act?: string;
};

export type VtcStats = {
    total_courses: number;
    completed_courses: number;
    chiffre_affaires: number;
    tax_a_payer: number;
    tax_global?: number;
    rating: number;
};

export type VtcChauffeur = {
    id: number;
    user_id?: number;
    username: string;
    first_name?: string;
    last_name?: string;
    full_name: string;
    phone_number_1: string;
    email?: string;
    wilaya: string;
    wilaya_code?: string;
    image_url?: string;
    is_active: boolean;
    is_blocked: boolean;
    is_available: boolean;
    latitude?: number | null;
    longitude?: number | null;
    vehicule?: VtcVehicule | null;
    documents?: VtcDocuments;
    stats?: VtcStats;
};

export type VtcChauffeurFilterParams = {
    search?: string;
    wilaya?: string;
    status?: string;
    type_vehicule?: string;
    page?: string | number;
    page_size?: string | number;
};

export type VtcChauffeursResponse = {
    results: VtcChauffeur[];
    total: number;
    total_pages: number;
    current_page: number;
    stats_overview: {
        total: number;
        online: number;
        active: number;
        blocked: number;
    };
};

export type CreateVtcChauffeurPayload = {
    username: string;
    password?: string;
    pass?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    phone_number_1: string;
    phone_number_2?: string;
    wilaya: string;
    wilaya_code?: string;
    marque?: string;
    modele?: string;
    matricule?: string;
    type_vehicule?: string;
    num_assurance?: string;
    num_scanner?: string;
    date_expiration_assurance?: string;
    date_expiration_scanner?: string;
    card_number?: string;
    RC?: string;
    Nif?: string;
    numero_act?: string;
};

/**
 * Récupère la liste paginée et filtrée des chauffeurs VTC
 */
export async function getVtcChauffeurs(
    params?: VtcChauffeurFilterParams
): Promise<VtcChauffeursResponse | null> {
    try {
        const queryParams: Record<string, string> = {};
        if (params?.search) queryParams.search = params.search;
        if (params?.wilaya) queryParams.wilaya = params.wilaya;
        if (params?.status) queryParams.status = params.status;
        if (params?.type_vehicule) queryParams.type_vehicule = params.type_vehicule;
        if (params?.page) queryParams.page = String(params.page);
        if (params?.page_size) queryParams.page_size = String(params.page_size);

        const response = await apiRequest({
            method: "GET",
            url: "/api/v1/vtc/chauffeurs",
            params: queryParams,
        });

        if (response.code === 200 && response.data?.success && response.data?.data) {
            return response.data.data as VtcChauffeursResponse;
        }
        return null;
    } catch {
        return null;
    }
}

/**
 * Crée un nouveau compte chauffeur VTC avec son véhicule et documents
 */
export async function createVtcChauffeur(
    payload: CreateVtcChauffeurPayload
): Promise<{ success: boolean; message: string; data?: unknown }> {
    const loadingToastId = toast.loading("Création du chauffeur VTC en cours...");
    try {
        const response = await apiRequest({
            method: "POST",
            url: "/api/v1/vtc/chauffeurs/create",
            data: payload,
        });

        if (response.code === 201 || response.code === 200) {
            const message = response.data?.message || "Chauffeur VTC créé avec succès !";
            toast.success(message, { id: loadingToastId });
            return { success: true, message, data: response.data?.data };
        } else {
            const message = response.data?.message || response.message || "Erreur lors de la création";
            toast.error(message, { id: loadingToastId });
            return { success: false, message };
        }
    } catch {
        toast.error("Problème de connexion avec le serveur", { id: loadingToastId });
        return { success: false, message: "Problème de connexion avec le serveur" };
    }
}

/**
 * Modifie le statut d'un chauffeur VTC (bloquer / débloquer / activer / désactiver)
 */
export async function toggleVtcChauffeurStatus(
    id: number,
    action: "block" | "unblock" | "activate" | "deactivate"
): Promise<{ success: boolean; message: string; is_blocked?: boolean; is_active?: boolean }> {
    const loadingToastId = toast.loading("Mise à jour du statut...");
    try {
        const response = await apiRequest({
            method: "POST",
            url: "/api/v1/vtc/chauffeurs/toggle_status",
            data: { id, action },
        });

        if (response.code === 200 && response.data?.success) {
            const message = response.data?.message || "Statut mis à jour avec succès";
            toast.success(message, { id: loadingToastId });
            return {
                success: true,
                message,
                is_blocked: response.data?.is_blocked,
                is_active: response.data?.is_active,
            };
        } else {
            const message = response.data?.message || response.message || "Erreur lors de la mise à jour";
            toast.error(message, { id: loadingToastId });
            return { success: false, message };
        }
    } catch {
        toast.error("Problème de connexion", { id: loadingToastId });
        return { success: false, message: "Problème de connexion" };
    }
}

export async function updateVtcChauffeur(
    payload: { id: number; image?: File | null } & Partial<CreateVtcChauffeurPayload>
): Promise<{ success: boolean; message: string; image_url?: string }> {
    const loadingToastId = toast.loading("Mise à jour des informations...");
    try {
        let requestData: any = payload;
        let headers: Record<string, string> = {};

        if (payload.image && payload.image instanceof File) {
            const formData = new FormData();
            Object.entries(payload).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    if (key === "image" && value instanceof File) {
                        formData.append("image", value);
                    } else {
                        formData.append(key, String(value));
                    }
                }
            });
            requestData = formData;
            headers["Content-Type"] = "multipart/form-data";
        }

        const response = await apiRequest({
            method: "POST",
            url: "/api/v1/vtc/chauffeurs/update",
            data: requestData,
            headers
        });

        if (response.code === 200 && response.data?.success) {
            const message = response.data?.message || "Informations mises à jour";
            toast.success(message, { id: loadingToastId });
            return { success: true, message, image_url: response.data?.image_url };
        } else {
            const message = response.data?.message || response.message || "Erreur de mise à jour";
            toast.error(message, { id: loadingToastId });
            return { success: false, message };
        }
    } catch {
        toast.error("Problème de connexion", { id: loadingToastId });
        return { success: false, message: "Problème de connexion" };
    }
}

