import toast from "react-hot-toast";
import { apiRequest } from "./request";

export type TransporteurVehicle = {
    id?: number;
    marque: string;
    modele: string;
    matricule: string;
    type_vehicule: string;
    num_assurance?: string;
    num_scanner?: string;
};

export type Transporteur = {
    id: number;
    user_id?: number;
    username: string;
    first_name?: string;
    last_name?: string;
    driver_name: string;
    phone_number_1: string;
    phone_number_2?: string;
    email?: string;
    wilaya: string;
    wilaya_code?: string;
    commune?: string;
    driver_photo?: string;
    driver_rating: number;
    is_active: boolean;
    is_blocked: boolean;
    is_available: boolean;
    is_deleted?: boolean;
    deleted_at?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    vehicle?: TransporteurVehicle | null;
    vehicle_name: string;
    vehicle_year: number;
    vehicle_image?: string;
    categories: string[];
    categories_raw: string;
    category_label: string;
    price_estimate: string;
    eta_minutes: number;
    description: string;
    badge: string;
    badge_color: string;
    card_number?: string;
    RC?: string;
    Nif?: string;
    numero_act?: string;
};

export type TransporteurFilterParams = {
    search?: string;
    wilaya?: string;
    commune?: string;
    category?: string;
    status?: string;
    is_deleted?: boolean | string;
    page?: string | number;
    page_size?: string | number;
};

export type TransporteursResponse = {
    results: Transporteur[];
    total: number;
    total_pages: number;
    current_page: number;
    stats_overview: {
        total: number;
        online: number;
        active: number;
        blocked: number;
        trash?: number;
        corbeille?: number;
    };
};

export type CreateTransporteurPayload = {
    username: string;
    password?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    phone_number_1: string;
    phone_number_2?: string;
    wilaya: string;
    wilaya_code?: string;
    commune?: string;
    marque?: string;
    modele?: string;
    matricule?: string;
    type_vehicule?: string;
    vehicle_year?: number;
    categories?: string | string[];
    category_label?: string;
    price_estimate?: string;
    eta_minutes?: number;
    description?: string;
    badge?: string;
    badge_color?: string;
    card_number?: string;
    RC?: string;
    Nif?: string;
    numero_act?: string;
};

/**
 * Récupère la liste paginée et filtrée des transporteurs (partenaires type Transport)
 */
export async function getTransporteurs(
    params?: TransporteurFilterParams
): Promise<TransporteursResponse | null> {
    try {
        const queryParams: Record<string, string> = {};
        if (params?.search) queryParams.search = params.search;
        if (params?.wilaya) queryParams.wilaya = params.wilaya;
        if (params?.category) queryParams.category = params.category;
        if (params?.status) queryParams.status = params.status;
        if (params?.is_deleted !== undefined) queryParams.is_deleted = String(params.is_deleted);
        if (params?.page) queryParams.page = String(params.page);
        if (params?.page_size) queryParams.page_size = String(params.page_size);

        const response = await apiRequest({
            method: "GET",
            url: "/api/v1/vtc/transporteurs",
            params: queryParams,
        });

        if (response.code === 200 && response.data?.success && response.data?.data) {
            return response.data.data as TransporteursResponse;
        }
        return null;
    } catch {
        return null;
    }
}

/**
 * Crée un nouveau transporteur avec son profil et ses photos éventuelles
 */
export async function createTransporteur(
    payload: CreateTransporteurPayload,
    driverPhoto?: File | null,
    vehicleImage?: File | null
): Promise<{ success: boolean; message: string; data?: unknown }> {
    const loadingToastId = toast.loading("Création du transporteur en cours...");
    try {
        let requestData: any = payload;
        let headers: Record<string, string> = {};

        if (driverPhoto || vehicleImage) {
            const formData = new FormData();
            Object.entries(payload).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    if (Array.isArray(value)) {
                        formData.append(key, value.join(","));
                    } else {
                        formData.append(key, String(value));
                    }
                }
            });
            if (driverPhoto) formData.append("driver_photo", driverPhoto);
            if (vehicleImage) formData.append("vehicle_image", vehicleImage);
            requestData = formData;
            headers["Content-Type"] = "multipart/form-data";
        }

        const response = await apiRequest({
            method: "POST",
            url: "/api/v1/vtc/transporteurs/create",
            data: requestData,
            headers,
        });

        if (response.code === 201 || response.code === 200) {
            const message = response.data?.message || "Transporteur créé avec succès !";
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
 * Met à jour les informations d'un transporteur existant
 */
export async function updateTransporteur(
    id: number,
    payload: Partial<CreateTransporteurPayload>,
    driverPhoto?: File | null,
    vehicleImage?: File | null
): Promise<{ success: boolean; message: string }> {
    const loadingToastId = toast.loading("Mise à jour du transporteur...");
    try {
        let requestData: any = { id, ...payload };
        let headers: Record<string, string> = {};

        if (driverPhoto || vehicleImage) {
            const formData = new FormData();
            formData.append("id", String(id));
            Object.entries(payload).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    if (Array.isArray(value)) {
                        formData.append(key, value.join(","));
                    } else {
                        formData.append(key, String(value));
                    }
                }
            });
            if (driverPhoto) formData.append("driver_photo", driverPhoto);
            if (vehicleImage) formData.append("vehicle_image", vehicleImage);
            requestData = formData;
            headers["Content-Type"] = "multipart/form-data";
        }

        const response = await apiRequest({
            method: "POST",
            url: `/api/v1/vtc/transporteurs/update/${id}`,
            data: requestData,
            headers,
        });

        if (response.code === 200 && response.data?.success) {
            const message = response.data?.message || "Transporteur mis à jour avec succès";
            toast.success(message, { id: loadingToastId });
            return { success: true, message };
        } else {
            const message = response.data?.message || response.message || "Erreur lors de la modification";
            toast.error(message, { id: loadingToastId });
            return { success: false, message };
        }
    } catch {
        toast.error("Problème de connexion", { id: loadingToastId });
        return { success: false, message: "Problème de connexion" };
    }
}

/**
 * Déplace un transporteur dans la corbeille (Soft delete)
 */
export async function deleteTransporteur(
    id: number
): Promise<{ success: boolean; message: string }> {
    const loadingToastId = toast.loading("Déplacement dans la corbeille...");
    try {
        const response = await apiRequest({
            method: "DELETE",
            url: `/api/v1/vtc/transporteurs/delete/${id}`,
        });

        if (response.code === 200 && response.data?.success) {
            const message = response.data?.message || "Transporteur déplacé dans la corbeille";
            toast.success(message, { id: loadingToastId });
            return { success: true, message };
        } else {
            const message = response.data?.message || response.message || "Erreur de suppression";
            toast.error(message, { id: loadingToastId });
            return { success: false, message };
        }
    } catch {
        toast.error("Problème de connexion", { id: loadingToastId });
        return { success: false, message: "Problème de connexion" };
    }
}

/**
 * Restaure un transporteur depuis la corbeille
 */
export async function restoreTransporteur(
    id: number
): Promise<{ success: boolean; message: string }> {
    const loadingToastId = toast.loading("Restauration du transporteur...");
    try {
        const response = await apiRequest({
            method: "POST",
            url: `/api/v1/vtc/transporteurs/restore/${id}`,
        });

        if (response.code === 200 && response.data?.success) {
            const message = response.data?.message || "Transporteur restauré avec succès";
            toast.success(message, { id: loadingToastId });
            return { success: true, message };
        } else {
            const message = response.data?.message || response.message || "Erreur de restauration";
            toast.error(message, { id: loadingToastId });
            return { success: false, message };
        }
    } catch {
        toast.error("Problème de connexion", { id: loadingToastId });
        return { success: false, message: "Problème de connexion" };
    }
}

/**
 * Supprime définitivement un transporteur de la base de données
 */
export async function hardDeleteTransporteur(
    id: number
): Promise<{ success: boolean; message: string }> {
    const loadingToastId = toast.loading("Suppression définitive...");
    try {
        const response = await apiRequest({
            method: "DELETE",
            url: `/api/v1/vtc/transporteurs/hard_delete/${id}`,
        });

        if (response.code === 200 && response.data?.success) {
            const message = response.data?.message || "Transporteur supprimé définitivement";
            toast.success(message, { id: loadingToastId });
            return { success: true, message };
        } else {
            const message = response.data?.message || response.message || "Erreur de suppression";
            toast.error(message, { id: loadingToastId });
            return { success: false, message };
        }
    } catch {
        toast.error("Problème de connexion", { id: loadingToastId });
        return { success: false, message: "Problème de connexion" };
    }
}

/**
 * Vide complètement la corbeille des transporteurs
 */
export async function emptyTrashTransporteurs(): Promise<{ success: boolean; message: string }> {
    const loadingToastId = toast.loading("Vidage de la corbeille...");
    try {
        const response = await apiRequest({
            method: "POST",
            url: "/api/v1/vtc/transporteurs/empty_trash",
        });

        if (response.code === 200 && response.data?.success) {
            const message = response.data?.message || "Corbeille vidée avec succès";
            toast.success(message, { id: loadingToastId });
            return { success: true, message };
        } else {
            const message = response.data?.message || response.message || "Erreur lors du vidage";
            toast.error(message, { id: loadingToastId });
            return { success: false, message };
        }
    } catch {
        toast.error("Problème de connexion", { id: loadingToastId });
        return { success: false, message: "Problème de connexion" };
    }
}

/**
 * Bascule la disponibilité ou le blocage d'un transporteur
 */
export async function toggleTransporteurStatus(
    id: number,
    action: "available" | "unavailable" | "block" | "unblock" | "activate" | "deactivate"
): Promise<{ success: boolean; message: string; is_available?: boolean; is_blocked?: boolean; is_active?: boolean }> {
    const loadingToastId = toast.loading("Mise à jour du statut...");
    try {
        const response = await apiRequest({
            method: "POST",
            url: "/api/v1/vtc/transporteurs/toggle_status",
            data: { id, action },
        });

        if (response.code === 200 && response.data?.success) {
            const message = response.data?.message || "Statut mis à jour";
            toast.success(message, { id: loadingToastId });
            return {
                success: true,
                message,
                is_available: response.data?.is_available,
                is_blocked: response.data?.is_blocked,
                is_active: response.data?.is_active,
            };
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

export type TransportCategoryItem = {
    id: number;
    slug: string;
    name: string;
    icon: string;
    color: string;
    is_active: boolean;
};

/**
 * Récupère toutes les catégories de transport (depuis l'API ou fallback)
 */
export async function getTransportCategories(): Promise<TransportCategoryItem[]> {
    try {
        const response = await apiRequest({
            method: "GET",
            url: "/api/v1/vtc/transport_categories",
        });

        if (response.code === 200 && response.data?.success && Array.isArray(response.data?.data)) {
            return response.data.data;
        }
    } catch {
        // Fallback silencieux
    }

    return [
        { id: 1, slug: "hilux", name: "Hilux / Pick-up", icon: "🛻", color: "#D97706", is_active: true },
        { id: 2, slug: "camion", name: "Camion & Fret", icon: "🚛", color: "#2563EB", is_active: true },
        { id: 3, slug: "utilitaire", name: "Utilitaire & Dokker", icon: "📦", color: "#059669", is_active: true },
        { id: 4, slug: "confort", name: "Confort VIP", icon: "👑", color: "#7C3AED", is_active: true },
        { id: 5, slug: "classique", name: "Classique Éco", icon: "🚗", color: "#0D9488", is_active: true },
    ];
}

/**
 * Crée une nouvelle catégorie de transport personnalisée
 */
export async function createTransportCategory(payload: {
    name: string;
    slug?: string;
    icon?: string;
    color?: string;
}): Promise<{ success: boolean; data?: TransportCategoryItem; message: string }> {
    const loadingToastId = toast.loading("Création de la catégorie...");
    try {
        const response = await apiRequest({
            method: "POST",
            url: "/api/v1/vtc/transport_categories/create",
            data: payload,
        });

        if ((response.code === 200 || response.code === 201) && response.data?.success) {
            toast.success(response.data?.message || "Catégorie créée !", { id: loadingToastId });
            return {
                success: true,
                data: response.data?.data,
                message: response.data?.message || "Succès",
            };
        } else {
            const msg = response.data?.message || response.message || "Erreur lors de la création";
            toast.error(msg, { id: loadingToastId });
            return { success: false, message: msg };
        }
    } catch {
        toast.error("Problème de connexion", { id: loadingToastId });
        return { success: false, message: "Problème de connexion" };
    }
}

/**
 * Supprime une catégorie de transport
 */
export async function deleteTransportCategory(
    id: number
): Promise<{ success: boolean; message: string }> {
    try {
        const response = await apiRequest({
            method: "DELETE",
            url: `/api/v1/vtc/transport_categories/delete/${id}`,
        });

        if (response.code === 200 && response.data?.success) {
            return { success: true, message: response.data?.message || "Catégorie supprimée" };
        }
        return { success: false, message: response.data?.message || "Erreur" };
    } catch {
        return { success: false, message: "Problème de connexion" };
    }
}

