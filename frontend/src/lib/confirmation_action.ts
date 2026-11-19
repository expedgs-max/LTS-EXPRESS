import { apiRequest } from "./request";
import toast from "react-hot-toast";

export type ConfirmationStats = {
    magasins: {
        total: number;
        ouverts: number;
        fermes: number;
    };
    livreurs: {
        total: number;
        en_ligne: number;
        offline: number;
    };
    commandes: {
        total: number;
        en_attente: number;
        confirmees: number;
        non_confirmees: number;
        en_livraison: number;
        livrees: number;
    };
};

export type ConfirmationMagasin = {
    id: number;
    name: string;
    address: string;
    contact: string | null;
    is_active: boolean;
    EtatOuverture: boolean;
    wilaya: string | null;
    latitude?: number | string | null;
    longitude?: number | string | null;
    rating: number;
    image: string | null;
    image_background?: string | null;
    descprition?: string | null;
    description?: string | null;
    owner: {
        id: number;
        username: string;
        first_name: string;
        last_name: string;
        phone: string;
        latitude?: number | string | null;
        longitude?: number | string | null;
    } | null;
    categories: string[];
    catalogues?: { id: number; name: string }[];
    ordre?: number | null;
    livraison_gratuite?: boolean;
    date_debut_livraison_gratuite?: string | null;
    date_fin_livraison_gratuite?: string | null;
    tarif_livraison?: number | null;
    pourcentage_commission?: number | null;
    pourcentage_remise?: number | null;
    is_livraison_gratuite_active?: boolean;
};

export type ConfirmationLivreur = {
    id: number;
    is_available: boolean;
    wilaya: string | null;
    active_orders_count: number;
    delivered_orders_count?: number;
    latitude?: number | null;
    longitude?: number | null;
    battery?: number | null;
    battery_level?: number | null;
    distance_km?: number | null;
    in_zone_3km?: boolean;
    is_blocked?: boolean;
    RC?: string;
    Nif?: string;
    card_number?: string;
    numero_act?: string;
    user: {
        id: number;
        username: string;
        first_name: string;
        last_name: string;
        phone: string;
        email?: string;
        rating: number;
        bloquer?: boolean;
        image_url?: string | null;
        nbr_commandes?: number;
    } | null;
    vehicule?: {
        type_vehicule?: string;
        marque?: string;
        modele?: string;
        matricule?: string;
        num_assurance?: string;
    } | null;
    magasin_name?: string | null;
    magasin?: { id: number; name: string } | null;
};

export async function getConfirmationStats(wilaya?: string): Promise<ConfirmationStats | null> {
    try {
        const response = await apiRequest({
            method: "GET",
            url: "/api/v1/confirmation/stats",
            params: wilaya ? { wilaya } : {}
        });

        if (response.code === 200 && response.data?.success) {
            return response.data.data;
        }
        return null;
    } catch {
        return null;
    }
}

export async function getConfirmationMagasins({
    wilaya,
    etat,
    search,
    page = "1",
    page_size = "20"
}: {
    wilaya?: string;
    etat?: string;
    search?: string;
    page?: string;
    page_size?: string;
}): Promise<{ result: ConfirmationMagasin[]; total: number; total_pages: number } | null> {
    try {
        const response = await apiRequest({
            method: "GET",
            url: "/api/v1/confirmation/magasins",
            params: {
                ...(wilaya ? { wilaya } : {}),
                ...(etat ? { etat } : {}),
                ...(search ? { search } : {}),
                page,
                page_size
            }
        });

        if (response.code === 200 && response.data?.success) {
            return {
                result: response.data.data,
                total: response.data.total,
                total_pages: response.data.total_pages
            };
        }
        return null;
    } catch {
        return null;
    }
}

export async function getConfirmationLivreurs({
    wilaya,
    available,
    search,
    commande_id,
    magasin_lat,
    magasin_lng,
    page = "1",
    page_size = "20"
}: {
    wilaya?: string;
    available?: string;
    search?: string;
    commande_id?: number | string;
    magasin_lat?: number | string;
    magasin_lng?: number | string;
    page?: string;
    page_size?: string;
}): Promise<{ result: ConfirmationLivreur[]; total: number; total_pages: number } | null> {
    try {
        const response = await apiRequest({
            method: "GET",
            url: "/api/v1/confirmation/livreurs",
            params: {
                ...(wilaya ? { wilaya } : {}),
                ...(available ? { available } : {}),
                ...(search ? { search } : {}),
                ...(commande_id ? { commande_id: String(commande_id) } : {}),
                ...(magasin_lat ? { magasin_lat: String(magasin_lat) } : {}),
                ...(magasin_lng ? { magasin_lng: String(magasin_lng) } : {}),
                page,
                page_size
            }
        });

        if (response.code === 200 && response.data?.success) {
            return {
                result: response.data.data,
                total: response.data.total,
                total_pages: response.data.total_pages
            };
        }
        return null;
    } catch {
        return null;
    }
}

export async function getConfirmationCommandes({
    wilaya,
    status,
    confirmation,
    search,
    date,
    date_start,
    date_end,
    page = "1",
    page_size = "20"
}: {
    wilaya?: string;
    status?: string;
    confirmation?: string;
    search?: string;
    date?: string;
    date_start?: string;
    date_end?: string;
    page?: string;
    page_size?: string;
}): Promise<{ result: Order[]; total: number; total_pages: number } | null> {
    try {
        const response = await apiRequest({
            method: "GET",
            url: "/api/v1/confirmation/commandes",
            params: {
                ...(wilaya ? { wilaya } : {}),
                ...(status ? { status } : {}),
                ...(confirmation ? { confirmation } : {}),
                ...(search ? { search } : {}),
                ...(date ? { date } : {}),
                ...(date_start ? { date_start } : {}),
                ...(date_end ? { date_end } : {}),
                page,
                page_size
            }
        });

        if (response.code === 200 && response.data?.success) {
            return {
                result: response.data.data,
                total: response.data.total,
                total_pages: response.data.total_pages
            };
        }
        return null;
    } catch {
        return null;
    }
}

export async function assignLivreurToOrder({
    commande_id,
    livreur_id,
    status = "confirmed"
}: {
    commande_id: number;
    livreur_id: number;
    status?: string;
}) {
    const loadingToastId = toast.loading("Assignation de la commande au livreur...");
    try {
        const response = await apiRequest({
            method: "POST",
            url: "/api/v1/confirmation/commande/assign",
            data: { commande_id, livreur_id, status }
        });

        if (response.code === 200 && response.data?.success) {
            toast.success(response.data.message || "Commande assignée avec succès !", { id: loadingToastId });
            return true;
        } else {
            toast.error(response.message || response.data?.message || "Erreur lors de l'assignation", { id: loadingToastId });
            return false;
        }
    } catch {
        toast.error("Problème de connexion au serveur", { id: loadingToastId });
        return false;
    }
}

export async function broadcastCommandeByCentre({
    commande_id,
    radius_km = 3.0
}: {
    commande_id: number;
    radius_km?: number;
}) {
    const loadingToastId = toast.loading(`Diffusion de la commande dans le cercle de ${radius_km} km...`);
    try {
        const response = await apiRequest({
            method: "POST",
            url: "/api/v1/confirmation/commande/broadcast",
            data: { commande_id, radius_km }
        });

        if (response.code === 200 && response.data?.success) {
            toast.success(response.data.message || `Commande diffusée aux livreurs dans un rayon de ${radius_km} km !`, { id: loadingToastId });
            return true;
        } else {
            toast.error(response.message || response.data?.message || "Erreur lors de la diffusion", { id: loadingToastId });
            return false;
        }
    } catch {
        toast.error("Problème de connexion au serveur", { id: loadingToastId });
        return false;
    }
}

export async function createExpressCommande(data: {
    client_name: string;
    client_phone: string;
    client_address: string;
    client_wilaya?: string;
    client_lat?: number;
    client_lng?: number;
    pickup_type: "magasin" | "custom";
    magasin_id?: number;
    pickup_name?: string;
    pickup_address?: string;
    pickup_lat?: number;
    pickup_lng?: number;
    specific?: string;
    itemss?: number;
    total_price?: number;
    delivery_price?: number;
    type_livraison?: "classique" | "premium";
    dispatch_mode: "direct" | "broadcast";
    livreur_id?: number;
    radius_km?: number;
}) {
    const loadingToastId = toast.loading("Création de la commande express...");
    try {
        const response = await apiRequest({
            method: "POST",
            url: "/api/v1/confirmation/commande/create-express",
            data
        });

        if (response.code === 201 && response.data?.success) {
            toast.success(response.data.message || "Commande Express créée avec succès !", { id: loadingToastId });
            return response.data;
        } else {
            toast.error(response.message || response.data?.message || "Erreur lors de la création de la commande", { id: loadingToastId });
            return null;
        }
    } catch {
        toast.error("Problème de connexion au serveur", { id: loadingToastId });
        return null;
    }
}

export async function confirmCommandeByCentre({
    commande_id
}: {
    commande_id: number;
}) {
    const loadingToastId = toast.loading("Confirmation de la commande...");
    try {
        const response = await apiRequest({
            method: "POST",
            url: "/api/v1/confirmation/commande/confirm",
            data: { commande_id }
        });

        if (response.code === 200 && response.data?.success) {
            toast.success(response.data.message || "Commande confirmée avec succès !", { id: loadingToastId });
            return true;
        } else {
            toast.error(response.message || response.data?.message || "Erreur lors de la confirmation", { id: loadingToastId });
            return false;
        }
    } catch {
        toast.error("Problème de connexion au serveur", { id: loadingToastId });
        return false;
    }
}

export async function cancelCommandeByCentre({
    commande_id,
    reason
}: {
    commande_id: number;
    reason: string;
}) {
    const loadingToastId = toast.loading("Annulation de la commande...");
    try {
        const response = await apiRequest({
            method: "POST",
            url: "/api/v1/confirmation/commande/cancel",
            data: { commande_id, reason }
        });

        if (response.code === 200 && response.data?.success) {
            toast.success(response.data.message || "Commande annulée avec succès !", { id: loadingToastId });
            return true;
        } else {
            toast.error(response.message || response.data?.message || "Erreur lors de l'annulation", { id: loadingToastId });
            return false;
        }
    } catch {
        toast.error("Problème de connexion au serveur", { id: loadingToastId });
        return false;
    }
}

export async function markCommandeDeliveredByCentre({
    commande_id
}: {
    commande_id: number;
}) {
    return updateCommandeStatusByCentre({
        commande_id,
        status: "delivered"
    });
}

export async function updateCommandeStatusByCentre({
    commande_id,
    status
}: {
    commande_id: number;
    status: string;
}) {
    const statusLabels: Record<string, string> = {
        in_progress: "En livraison",
        livreur_pret_commande: "En livraison",
        delivered: "Livrée",
        confirmed: "Confirmée",
        pending: "En attente",
        ready: "Prête",
        canceled: "Annulée"
    };
    const label = statusLabels[status] || status;
    const loadingToastId = toast.loading(`Mise à jour vers le statut ${label}...`);
    try {
        const response = await apiRequest({
            method: "POST",
            url: "/api/v1/confirmation/commande/status",
            data: { commande_id, status }
        });

        if (response.code === 200 && response.data?.success) {
            toast.success(response.data.message || `Commande mise à jour vers ${label} !`, { id: loadingToastId });
            return true;
        } else {
            toast.error(response.message || response.data?.message || "Erreur lors de la mise à jour", { id: loadingToastId });
            return false;
        }
    } catch {
        toast.error("Problème de connexion au serveur", { id: loadingToastId });
        return false;
    }
}

export async function toggleBlockLivreur({
    livreur_id,
    bloquer
}: {
    livreur_id: number;
    bloquer: boolean;
}) {
    const loadingToastId = toast.loading(bloquer ? "Blocage du livreur..." : "Déblocage du livreur...");
    try {
        const response = await apiRequest({
            method: "POST",
            url: "/api/v1/confirmation/livreur/toggle-block",
            data: { livreur_id, bloquer }
        });

        if (response.code === 200 && response.data?.success) {
            toast.success(response.data.message || (bloquer ? "Livreur bloqué !" : "Livreur débloqué !"), { id: loadingToastId });
            return true;
        } else {
            toast.error(response.message || response.data?.message || "Erreur lors de la modification du statut", { id: loadingToastId });
            return false;
        }
    } catch {
        toast.error("Problème de connexion au serveur", { id: loadingToastId });
        return false;
    }
}






export type ClientPhoneRequest = {
    commande_id: number;
    livreur_id?: number | null;
    livreur_name: string;
    livreur_phone: string;
    client_name: string;
    client_phone: string;
    magasin_name: string;
    reason: string;
    comment: string;
    timestamp: string;
};

export async function approveOrRejectClientPhone({
    commande_id,
    approved
}: {
    commande_id: number;
    approved: boolean;
}) {
    const loadingToastId = toast.loading(approved ? "Autorisation du numéro et passage En Route..." : "Refus de la demande...");
    try {
        const response = await apiRequest({
            method: "POST",
            url: "/api/v1/confirmation/commande/approve-phone",
            data: { commande_id, approved }
        });

        if (response.code === 200 && response.data?.success) {
            toast.success(response.data.message || (approved ? "Numéro débloqué et commande passée En Route !" : "Demande refusée"), { id: loadingToastId });
            return response.data;
        } else {
            toast.error(response.message || response.data?.message || "Erreur lors du traitement", { id: loadingToastId });
            return null;
        }
    } catch {
        toast.error("Problème de connexion au serveur", { id: loadingToastId });
        return null;
    }
}

export async function updateCommandeTripTimeByCentre({
    commande_id,
    trip_time,
    status
}: {
    commande_id: number;
    trip_time: string;
    status?: string;
}) {
    const loadingToastId = toast.loading("Mise à jour du temps de prise en charge...");
    try {
        const response = await apiRequest({
            method: "POST",
            url: "/api/v1/confirmation/commande/status",
            data: { 
                commande_id, 
                trip_time,
                status: status || "confirmed"
            }
        });

        if (response.code === 200 && response.data?.success) {
            toast.success(response.data.message || "Temps mis à jour avec succès !", { id: loadingToastId });
            return response.data;
        } else {
            toast.error(response.message || response.data?.message || "Erreur lors de la mise à jour", { id: loadingToastId });
            return null;
        }
    } catch {
        toast.error("Problème de connexion au serveur", { id: loadingToastId });
        return null;
    }
}

// ----------------------------------------------------
// MAGASIN MANAGEMENT: PHOTOS, CATALOGUES & PRODUCTS
// ----------------------------------------------------

export type StoreProduct = {
    id: number;
    name: string;
    description: string;
    price: number | string;
    disponibilite: boolean;
    image: string | null;
    catalogue?: number | null;
    catalogue_id?: number | null;
    catalogue_name?: string | null;
    rating?: number;
    valide_payment?: boolean;
    quantity_stock?: number;
    ordre?: number | null;
};

export type CatalogueItem = {
    id: number;
    name: string;
    description?: string;
    icone?: string | null;
    photo?: string | null;
};

export async function getStoreProducts(
    magasin_id: number,
    params?: { page?: string; name?: string; catalogue?: string }
): Promise<{ result: StoreProduct[]; total: number } | null> {
    try {
        const response = await apiRequest({
            method: "GET",
            url: "/api/v1/magasin/produis",
            params: {
                magasin_id,
                ...(params?.page ? { page: params.page } : {}),
                ...(params?.name ? { name: params.name } : {}),
                ...(params?.catalogue ? { catalogue: params.catalogue } : {})
            }
        });

        if (response.code === 200) {
            return {
                result: response.data.results || response.data.data || [],
                total: response.data.count || (response.data.results ? response.data.results.length : 0)
            };
        }
        return null;
    } catch {
        return null;
    }
}

export async function uploadStorePhotos(
    magasin_id: number,
    profileImg?: File | null,
    backgroundImg?: File | null
): Promise<{ success: boolean; message: string; image?: string; image_background?: string }> {
    const loadingToastId = toast.loading("Mise à jour des photos du magasin...");
    try {
        const formData = new FormData();
        formData.append("magasin_id", String(magasin_id));

        if (profileImg) {
            formData.append("image", profileImg);
        }
        if (backgroundImg) {
            formData.append("image_background", backgroundImg);
        }

        const response = await apiRequest({
            method: "PUT",
            url: "/api/v1/platfome/magasin/uploadimages",
            data: formData,
            headers: {
                "Content-Type": "multipart/form-data"
            }
        });

        if (response.code === 200) {
            toast.success(response.data?.message || "Photos mises à jour avec succès !", { id: loadingToastId });
            return {
                success: true,
                message: response.data?.message || "Photos mises à jour",
                image: response.data?.image,
                image_background: response.data?.image_background
            };
        } else {
            toast.error(response.message || response.data?.message || "Erreur de mise à jour", { id: loadingToastId });
            return { success: false, message: response.message || "Erreur" };
        }
    } catch {
        toast.error("Problème de connexion", { id: loadingToastId });
        return { success: false, message: "Problème de connexion" };
    }
}

export type UpdateConfirmationMagasinPayload = {
    magasin_id: number;
    name?: string;
    contact?: string;
    phone?: string;
    address?: string;
    adresse?: string;
    wilaya?: string;
    latitude?: number | string | null;
    longitude?: number | string | null;
    descprition?: string;
    description?: string;
    EtatOuverture?: boolean;
    is_active?: boolean;
    ordre?: number | string | null;
    owner_first_name?: string;
    owner_last_name?: string;
    owner_phone?: string;
    livraison_gratuite?: boolean;
    date_debut_livraison_gratuite?: string | null;
    date_fin_livraison_gratuite?: string | null;
    tarif_livraison?: number | string | null;
    pourcentage_commission?: number | string | null;
    pourcentage_remise?: number | string | null;
};

export async function updateConfirmationMagasin(
    payload: UpdateConfirmationMagasinPayload
): Promise<{ success: boolean; message: string; data?: any }> {
    const loadingToastId = toast.loading("Mise à jour des informations du magasin...");
    try {
        const response = await apiRequest({
            method: "POST",
            url: "/api/v1/confirmation/magasin/update",
            data: payload
        });

        if (response.code === 200 && response.data?.success) {
            toast.success(response.data?.message || "Magasin mis à jour avec succès !", { id: loadingToastId });
            return {
                success: true,
                message: response.data?.message || "Succès",
                data: response.data?.data
            };
        } else {
            toast.error(response.data?.message || response.message || "Erreur de mise à jour", { id: loadingToastId });
            return {
                success: false,
                message: response.data?.message || response.message || "Erreur"
            };
        }
    } catch {
        toast.error("Problème de connexion", { id: loadingToastId });
        return { success: false, message: "Problème de connexion" };
    }
}

export async function getAllCatalogues(): Promise<CatalogueItem[]> {
    try {
        const response = await apiRequest({
            method: "GET",
            url: "/api/v1/catalogues"
        });

        if (response.code === 200) {
            return response.data?.data || response.data || [];
        }
        return [];
    } catch {
        return [];
    }
}

export async function createCatalogue(
    name: string,
    description: string = "",
    magasin_id?: number
): Promise<{ success: boolean; catalogue?: CatalogueItem; message: string }> {
    const loadingToastId = toast.loading("Création du catalogue...");
    try {
        const response = await apiRequest({
            method: "POST",
            url: "/api/v1/catalogue/create",
            data: { name, description, ...(magasin_id ? { magasin_id } : {}) }
        });

        if (response.code === 200 || response.code === 201) {
            toast.success("Catalogue créé avec succès !", { id: loadingToastId });
            return { success: true, catalogue: response.data?.data, message: "Catalogue créé" };
        } else {
            toast.error(response.message || response.data?.message || "Erreur lors de la création", { id: loadingToastId });
            return { success: false, message: response.message || "Erreur" };
        }
    } catch {
        toast.error("Problème de connexion", { id: loadingToastId });
        return { success: false, message: "Problème de connexion" };
    }
}

export async function addCatalogueToStore(
    magasin_id: number,
    catalogue_id?: number,
    catalogue_name?: string
): Promise<{ success: boolean; message: string }> {
    const loadingToastId = toast.loading("Association du catalogue...");
    try {
        const response = await apiRequest({
            method: "POST",
            url: "/api/v1/magasin/catalogue/add",
            data: {
                magasin_id,
                ...(catalogue_id ? { catalogue_id } : {}),
                ...(catalogue_name ? { catalogue_name } : {})
            }
        });

        if (response.code === 200) {
            toast.success("Catalogue associé au magasin !", { id: loadingToastId });
            return { success: true, message: "Catalogue associé" };
        } else {
            toast.error(response.message || response.data?.message || "Erreur lors de l'association", { id: loadingToastId });
            return { success: false, message: response.message || "Erreur" };
        }
    } catch {
        toast.error("Problème de connexion", { id: loadingToastId });
        return { success: false, message: "Problème de connexion" };
    }
}

export async function removeCatalogueFromStore(
    magasin_id: number,
    catalogue_id: number
): Promise<{ success: boolean; message: string }> {
    const loadingToastId = toast.loading("Suppression du catalogue...");
    try {
        const response = await apiRequest({
            method: "POST",
            url: "/api/v1/magasin/catalogue/remove",
            data: { magasin_id, catalogue_id }
        });

        if (response.code === 200) {
            toast.success("Catalogue retiré du magasin", { id: loadingToastId });
            return { success: true, message: "Catalogue retiré" };
        } else {
            toast.error(response.message || response.data?.message || "Erreur de suppression", { id: loadingToastId });
            return { success: false, message: response.message || "Erreur" };
        }
    } catch {
        toast.error("Problème de connexion", { id: loadingToastId });
        return { success: false, message: "Problème de connexion" };
    }
}

export async function createStoreProduct(data: {
    magasin_id: number;
    name: string;
    price: number | string;
    description: string;
    catalogue_id: number | string;
    image: File;
    ordre?: number | string | null;
}): Promise<{ success: boolean; message: string }> {
    const loadingToastId = toast.loading("Ajout du produit avec photo...");
    try {
        const formData = new FormData();
        formData.append("magasin_id", String(data.magasin_id));
        formData.append("name", data.name);
        formData.append("price", String(data.price));
        formData.append("description", data.description);
        formData.append("catalogue_id", String(data.catalogue_id));
        formData.append("image", data.image);
        if (data.ordre !== undefined && data.ordre !== null && data.ordre !== "") {
            formData.append("ordre", String(data.ordre));
        }

        const response = await apiRequest({
            method: "POST",
            url: "/api/v1/magasin/create/produis",
            data: formData,
            headers: {
                "Content-Type": "multipart/form-data"
            }
        });

        if (response.code === 200 || response.code === 201) {
            toast.success(response.data?.message || "Produit créé avec succès !", { id: loadingToastId });
            return { success: true, message: response.data?.message || "Produit créé avec succès" };
        } else {
            toast.error(response.message || response.data?.message || "Erreur lors de l'ajout du produit", { id: loadingToastId });
            return { success: false, message: response.message || "Erreur" };
        }
    } catch {
        toast.error("Problème de connexion", { id: loadingToastId });
        return { success: false, message: "Problème de connexion" };
    }
}

export async function deleteStoreProduct(id: number): Promise<boolean> {
    const loadingToastId = toast.loading("Suppression du produit...");
    try {
        const response = await apiRequest({
            method: "DELETE",
            url: "/api/v1/produis/delete",
            data: { id }
        });

        if (response.code === 200) {
            toast.success("Produit supprimé avec succès !", { id: loadingToastId });
            return true;
        } else {
            toast.error(response.message || "Erreur lors de la suppression", { id: loadingToastId });
            return false;
        }
    } catch {
        toast.error("Problème de connexion", { id: loadingToastId });
        return false;
    }
}

export async function toggleStoreProductAvailability(id: number, disponibilite: boolean): Promise<boolean> {
    const loadingToastId = toast.loading("Mise à jour de la disponibilité...");
    try {
        const formData = new FormData();
        formData.append("id", String(id));
        formData.append("disponibilite", String(disponibilite));

        const response = await apiRequest({
            method: "PUT",
            url: "/api/v1/produis/update",
            data: formData,
            headers: {
                "Content-Type": "multipart/form-data"
            }
        });

        if (response.code === 200) {
            toast.success(disponibilite ? "Produit marqué comme Disponible" : "Produit marqué comme Indisponible", { id: loadingToastId });
            return true;
        } else {
            toast.error(response.message || "Erreur de mise à jour", { id: loadingToastId });
            return false;
        }
    } catch {
        toast.error("Problème de connexion", { id: loadingToastId });
        return false;
    }
}

export async function updateStoreProduct(data: {
    id: number;
    name?: string;
    price?: number | string;
    description?: string;
    catalogue_id?: number | string;
    disponibilite?: boolean;
    image?: File | null;
    ordre?: number | string | null;
}): Promise<{ success: boolean; message: string }> {
    const loadingToastId = toast.loading("Mise à jour du produit...");
    try {
        const formData = new FormData();
        formData.append("id", String(data.id));
        if (data.name !== undefined) formData.append("name", data.name);
        if (data.price !== undefined) formData.append("price", String(data.price));
        if (data.description !== undefined) formData.append("description", data.description);
        if (data.catalogue_id !== undefined) formData.append("catalogue_id", String(data.catalogue_id));
        if (data.disponibilite !== undefined) formData.append("disponibilite", String(data.disponibilite));
        if (data.image) formData.append("image", data.image);
        if (data.ordre !== undefined && data.ordre !== null && data.ordre !== "") {
            formData.append("ordre", String(data.ordre));
        }

        const response = await apiRequest({
            method: "PUT",
            url: "/api/v1/produis/update",
            data: formData,
            headers: { "Content-Type": "multipart/form-data" }
        });

        if (response.code === 200) {
            toast.success(response.data?.message || "Produit modifié avec succès !", { id: loadingToastId });
            return { success: true, message: response.data?.message || "Succès" };
        } else {
            toast.error(response.message || response.data?.message || "Erreur de mise à jour", { id: loadingToastId });
            return { success: false, message: response.message || "Erreur" };
        }
    } catch {
        toast.error("Problème de connexion", { id: loadingToastId });
        return { success: false, message: "Problème de connexion" };
    }
}

export async function reorderStoreProducts(
    items: { id: number; ordre: number }[]
): Promise<{ success: boolean; message: string }> {
    const loadingToastId = toast.loading("Mise à jour du classement...");
    try {
        const response = await apiRequest({
            method: "POST",
            url: "/api/v1/produis/reorder",
            data: items
        });

        if (response.code === 200) {
            toast.success("Classement mis à jour avec succès !", { id: loadingToastId });
            return { success: true, message: "Succès" };
        } else {
            toast.error(response.message || "Erreur de mise à jour du classement", { id: loadingToastId });
            return { success: false, message: "Erreur" };
        }
    } catch {
        toast.error("Problème de connexion", { id: loadingToastId });
        return { success: false, message: "Problème de connexion" };
    }
}

export async function reorderStores(
    items: { id: number; ordre: number }[]
): Promise<{ success: boolean; message: string }> {
    const loadingToastId = toast.loading("Mise à jour du classement des magasins...");
    try {
        const response = await apiRequest({
            method: "POST",
            url: "/api/v1/magasins/reorder",
            data: items
        });

        if (response.code === 200) {
            toast.success("Classement des magasins mis à jour avec succès !", { id: loadingToastId });
            return { success: true, message: "Succès" };
        } else {
            toast.error(response.message || "Erreur de mise à jour du classement", { id: loadingToastId });
            return { success: false, message: "Erreur" };
        }
    } catch {
        toast.error("Problème de connexion", { id: loadingToastId });
        return { success: false, message: "Problème de connexion" };
    }
}

// ----------------------------------------------------
// MAGASIN & LIVREUR CREATION & PROFILE MANAGEMENT
// ----------------------------------------------------

export async function createConfirmationMagasin(data: {
    username: string;
    password: string;
    nom_magasin: string;
    type_magasin?: string;
    wilaya: string;
    phone?: string;
    email?: string;
    address?: string;
    latitude?: number | string | null;
    longitude?: number | string | null;
}): Promise<{ success: boolean; message: string; data?: unknown }> {
    const loadingToastId = toast.loading("Création du magasin...");
    try {
        const response = await apiRequest({
            method: "POST",
            url: "/api/v1/confirmation/magasin/create",
            data
        });

        if (response.code === 200 || response.code === 201) {
            toast.success(response.data?.message || "Magasin créé avec succès !", { id: loadingToastId });
            return {
                success: true,
                message: response.data?.message || "Magasin créé avec succès",
                data: response.data?.data
            };
        } else {
            toast.error(response.message || response.data?.message || "Erreur lors de la création", { id: loadingToastId });
            return { success: false, message: response.message || response.data?.message || "Erreur" };
        }
    } catch {
        toast.error("Problème de connexion", { id: loadingToastId });
        return { success: false, message: "Problème de connexion" };
    }
}

export async function createConfirmationLivreur(data: {
    username: string;
    password: string;
    wilaya: string;
    phone?: string;
    email?: string;
    magasin_id?: number | null;
}): Promise<{ success: boolean; message: string; data?: unknown }> {
    const loadingToastId = toast.loading("Création du livreur...");
    try {
        const response = await apiRequest({
            method: "POST",
            url: "/api/v1/confirmation/livreur/create",
            data
        });

        if (response.code === 200 || response.code === 201) {
            toast.success(response.data?.message || "Livreur créé avec succès !", { id: loadingToastId });
            return {
                success: true,
                message: response.data?.message || "Livreur créé avec succès",
                data: response.data?.data
            };
        } else {
            toast.error(response.message || response.data?.message || "Erreur lors de la création", { id: loadingToastId });
            return { success: false, message: response.message || response.data?.message || "Erreur" };
        }
    } catch {
        toast.error("Problème de connexion", { id: loadingToastId });
        return { success: false, message: "Problème de connexion" };
    }
}

export async function updateConfirmationLivreurProfile(data: {
    livreur_id: number;
    first_name?: string;
    last_name?: string;
    phone?: string;
    email?: string;
    password?: string;
    wilaya?: string;
    image?: File | null;
    RC?: string;
    Nif?: string;
    card_number?: string;
    numero_act?: string;
    type_vehicule?: string;
    marque?: string;
    modele?: string;
    matricule?: string;
    num_assurance?: string;
    magasin_id?: number | null;
}): Promise<{ success: boolean; message: string; image_url?: string }> {
    const loadingToastId = toast.loading("Mise à jour du profil livreur...");
    try {
        let requestData: any = data;
        let headers: any = {};

        if (data.image) {
            const formData = new FormData();
            Object.entries(data).forEach(([key, value]) => {
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
            url: "/api/v1/confirmation/livreur/update-profile",
            data: requestData,
            headers
        });

        if (response.code === 200) {
            toast.success(response.data?.message || "Profil livreur mis à jour avec succès !", { id: loadingToastId });
            return {
                success: true,
                message: response.data?.message || "Profil mis à jour",
                image_url: response.data?.image_url
            };
        } else {
            toast.error(response.message || response.data?.message || "Erreur lors de la mise à jour", { id: loadingToastId });
            return { success: false, message: response.message || response.data?.message || "Erreur" };
        }
    } catch {
        toast.error("Problème de connexion", { id: loadingToastId });
        return { success: false, message: "Problème de connexion" };
    }
}

// ==========================================
// TYPES & API ACTIONS : CODES PROMO CONFIRMATION
// ==========================================

export type PromoCibleType =
    | "tous_clients"
    | "client_specifique"
    | "tous_livreurs"
    | "livreur_specifique"
    | "tous_magasins"
    | "magasin_specifique"
    | "tous_partenaires"
    | "partenaire_specifique";

export type ConfirmationPromoPartner = {
    id: number;
    name: string;
    username?: string;
    phone?: string;
    wilaya?: string;
    type_compte?: string;
};

export type ConfirmationPromoTargetUser = {
    id: number;
    name: string;
    username: string;
    phone: string;
    wilaya: string;
    role: string;
};

export type ConfirmationPromoTargetMagasin = {
    id: number;
    name: string;
    address: string;
    wilaya: string;
    contact?: string;
};

export type ConfirmationPromoPreviewUser = {
    id: number;
    name: string;
    phone?: string;
    type?: string;
};

export type ConfirmationPromo = {
    id: number;
    code_invitation: string;
    revunu: number;
    pourcentage: number;
    pourcentage_display: number;
    total_users_used: number;
    cible_type: PromoCibleType;
    cible_user?: ConfirmationPromoTargetUser | null;
    cible_magasin?: ConfirmationPromoTargetMagasin | null;
    max_utilisations: number;
    date_expiration: string | null;
    date_expiration_display?: string;
    is_active: boolean;
    is_expired: boolean;
    is_max_reached: boolean;
    status: "active" | "expired" | "max_reached" | "disabled";
    status_label: string;
    created_at?: string;
    partenneur: ConfirmationPromoPartner | null;
    users_preview: ConfirmationPromoPreviewUser[];
};

export type ConfirmationPromoStats = {
    total_promos: number;
    active_promos?: number;
    expired_promos?: number;
    total_revenue: number;
    total_users_used: number;
    avg_percentage: number;
};

export type ConfirmationPromoUser = {
    id: number;
    partenaire_id: number;
    username: string;
    first_name: string;
    last_name: string;
    full_name: string;
    phone: string;
    email: string;
    wilaya: string;
    type_compte: string;
    role: string;
    is_active: boolean;
    date_joined: string;
};

export type ConfirmationPromosResponse = {
    success: boolean;
    stats: ConfirmationPromoStats;
    data: ConfirmationPromo[];
    pagination: {
        total_items: number;
        total_pages: number;
        current_page: number;
        has_next: boolean;
        has_previous: boolean;
    };
};

export type ConfirmationPromoUsersResponse = {
    success: boolean;
    promo: {
        id: number;
        code_invitation: string;
        revunu: number;
        pourcentage: number;
        pourcentage_display: number;
        cible_type?: PromoCibleType;
        max_utilisations?: number;
        date_expiration?: string | null;
        is_active?: boolean;
        partner_name: string;
        partner_phone: string;
        total_users: number;
    };
    users: ConfirmationPromoUser[];
    pagination: {
        total_items: number;
        total_pages: number;
        current_page: number;
        has_next: boolean;
        has_previous: boolean;
    };
};

export async function getConfirmationPromos(params?: {
    search?: string;
    cible_type?: string;
    status?: string;
    page?: number | string;
    page_size?: number | string;
}): Promise<ConfirmationPromosResponse | null> {
    try {
        const response = await apiRequest({
            method: "GET",
            url: "/api/v1/confirmation/promos",
            params: {
                search: params?.search || "",
                cible_type: params?.cible_type || "",
                status: params?.status || "",
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

export async function getConfirmationPromoUsers(
    promoId: number,
    params?: { search?: string; page?: number | string; page_size?: number | string }
): Promise<ConfirmationPromoUsersResponse | null> {
    try {
        const response = await apiRequest({
            method: "GET",
            url: `/api/v1/confirmation/promos/${promoId}/users`,
            params: {
                search: params?.search || "",
                page: params?.page || 1,
                page_size: params?.page_size || 50
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

export async function createConfirmationPromo(data: {
    code_invitation?: string;
    pourcentage: number;
    revunu?: number;
    partenaire_id?: number | null;
    cible_type: PromoCibleType;
    cible_user_id?: number | null;
    cible_magasin_id?: number | null;
    max_utilisations?: number;
    date_expiration?: string | null;
    is_active?: boolean;
}): Promise<{ success: boolean; message: string; promo?: ConfirmationPromo }> {
    const loadingToastId = toast.loading("Création du code promo...");
    try {
        const response = await apiRequest({
            method: "POST",
            url: "/api/v1/confirmation/promos/create",
            data
        });

        if (response.code === 201 || response.code === 200) {
            toast.success(response.data?.message || "Code promo créé avec succès !", { id: loadingToastId });
            return { success: true, message: response.data?.message || "Succès", promo: response.data?.promo };
        } else {
            toast.error(response.message || response.data?.message || "Erreur lors de la création", { id: loadingToastId });
            return { success: false, message: response.message || response.data?.message || "Erreur" };
        }
    } catch {
        toast.error("Problème de connexion au serveur", { id: loadingToastId });
        return { success: false, message: "Problème de connexion" };
    }
}

export async function updateConfirmationPromo(
    promoId: number,
    data: {
        code_invitation?: string;
        pourcentage?: number;
        revunu?: number;
        partenaire_id?: number | null;
        cible_type?: PromoCibleType;
        cible_user_id?: number | null;
        cible_magasin_id?: number | null;
        max_utilisations?: number;
        date_expiration?: string | null;
        is_active?: boolean;
    }
): Promise<{ success: boolean; message: string; promo?: ConfirmationPromo }> {
    const loadingToastId = toast.loading("Mise à jour du code promo...");
    try {
        const response = await apiRequest({
            method: "POST",
            url: `/api/v1/confirmation/promos/${promoId}/update`,
            data
        });

        if (response.code === 200) {
            toast.success(response.data?.message || "Code promo mis à jour !", { id: loadingToastId });
            return { success: true, message: response.data?.message || "Succès", promo: response.data?.promo };
        } else {
            toast.error(response.message || response.data?.message || "Erreur lors de la mise à jour", { id: loadingToastId });
            return { success: false, message: response.message || response.data?.message || "Erreur" };
        }
    } catch {
        toast.error("Problème de connexion au serveur", { id: loadingToastId });
        return { success: false, message: "Problème de connexion" };
    }
}

export async function deleteConfirmationPromo(promoId: number): Promise<{ success: boolean; message: string }> {
    const loadingToastId = toast.loading("Suppression du code promo...");
    try {
        const response = await apiRequest({
            method: "POST",
            url: `/api/v1/confirmation/promos/${promoId}/delete`
        });

        if (response.code === 200) {
            toast.success(response.data?.message || "Code promo supprimé !", { id: loadingToastId });
            return { success: true, message: response.data?.message || "Succès" };
        } else {
            toast.error(response.message || response.data?.message || "Erreur lors de la suppression", { id: loadingToastId });
            return { success: false, message: response.message || response.data?.message || "Erreur" };
        }
    } catch {
        toast.error("Problème de connexion au serveur", { id: loadingToastId });
        return { success: false, message: "Problème de connexion" };
    }
}

export async function getConfirmationPromoPartners(search?: string): Promise<{ id: number; name: string; phone: string; wilaya: string; type_compte: string }[]> {
    try {
        const response = await apiRequest({
            method: "GET",
            url: "/api/v1/confirmation/promos/partners",
            params: { search: search || "" }
        });

        if (response.code === 200 && response.data?.success) {
            return response.data.partners || [];
        }
        return [];
    } catch {
        return [];
    }
}

export async function getConfirmationPromoTargetUsers(search?: string, role?: string): Promise<ConfirmationPromoTargetUser[]> {
    try {
        const response = await apiRequest({
            method: "GET",
            url: "/api/v1/confirmation/promos/target-users",
            params: { search: search || "", role: role || "" }
        });

        if (response.code === 200 && response.data?.success) {
            return response.data.users || [];
        }
        return [];
    } catch {
        return [];
    }
}

export async function getConfirmationPromoTargetMagasins(search?: string): Promise<ConfirmationPromoTargetMagasin[]> {
    try {
        const response = await apiRequest({
            method: "GET",
            url: "/api/v1/confirmation/promos/target-magasins",
            params: { search: search || "" }
        });

        if (response.code === 200 && response.data?.success) {
            return response.data.magasins || [];
        }
        return [];
    } catch {
        return [];
    }
}

// ==========================================
// TYPES & ACTIONS : PUBLICITÉS CONFIRMATION
// ==========================================

export type ConfirmationPubliciteMagasin = {
    id: number;
    name: string;
    address: string;
    wilaya: string;
    image?: string | null;
};

export type ConfirmationPublicite = {
    id: number;
    name: string;
    description: string;
    magasin: ConfirmationPubliciteMagasin | null;
    image?: string | null;
    image_url?: string | null;
    lien?: string | null;
    target?: "client" | "livreur" | "chauffeur";
    target_label?: string;
    badge_tag?: string | null;
    cta_text?: string | null;
    is_active: boolean;
    is_expired: boolean;
    status: "active" | "expired" | "inactive";
    status_label: string;
    date_creation: string;
    date_expires: string;
};

export type ConfirmationPubliciteStats = {
    total_publicites: number;
    active_publicites: number;
    expired_publicites: number;
    inactive_publicites: number;
    total_magasins_linked: number;
    client_publicites?: number;
    livreur_publicites?: number;
    chauffeur_publicites?: number;
};

export type ConfirmationPublicitesResponse = {
    success: boolean;
    stats: ConfirmationPubliciteStats;
    data: ConfirmationPublicite[];
    pagination: {
        total_items: number;
        total_pages: number;
        current_page: number;
        has_next: boolean;
        has_previous: boolean;
    };
};

export async function getConfirmationPublicites(params?: {
    search?: string;
    status?: string;
    wilaya?: string;
    target?: string;
    page?: number | string;
    page_size?: number | string;
}): Promise<ConfirmationPublicitesResponse | null> {
    try {
        const response = await apiRequest({
            method: "GET",
            url: "/api/v1/confirmation/publicites",
            params: {
                search: params?.search || "",
                status: params?.status || "",
                wilaya: params?.wilaya || "",
                target: params?.target || "",
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

export async function createConfirmationPublicite(
    formData: FormData
): Promise<{ success: boolean; message: string; publicite?: ConfirmationPublicite }> {
    const loadingToastId = toast.loading("Création de la publicité...");
    try {
        const response = await apiRequest({
            method: "POST",
            url: "/api/v1/confirmation/publicites/create",
            data: formData,
            headers: {
                "Content-Type": "multipart/form-data"
            }
        });

        if (response.code === 201 || response.code === 200) {
            toast.success(response.data?.message || "Publicité créée avec succès !", { id: loadingToastId });
            return { success: true, message: response.data?.message || "Succès", publicite: response.data?.publicite };
        } else {
            toast.error(response.message || response.data?.message || "Erreur lors de la création", { id: loadingToastId });
            return { success: false, message: response.message || response.data?.message || "Erreur" };
        }
    } catch {
        toast.error("Problème de connexion au serveur", { id: loadingToastId });
        return { success: false, message: "Problème de connexion" };
    }
}

export async function updateConfirmationPublicite(
    pubId: number,
    formData: FormData
): Promise<{ success: boolean; message: string; publicite?: ConfirmationPublicite }> {
    const loadingToastId = toast.loading("Mise à jour de la publicité...");
    try {
        const response = await apiRequest({
            method: "POST",
            url: `/api/v1/confirmation/publicites/${pubId}/update`,
            data: formData,
            headers: {
                "Content-Type": "multipart/form-data"
            }
        });

        if (response.code === 200) {
            toast.success(response.data?.message || "Publicité mise à jour !", { id: loadingToastId });
            return { success: true, message: response.data?.message || "Succès", publicite: response.data?.publicite };
        } else {
            toast.error(response.message || response.data?.message || "Erreur lors de la mise à jour", { id: loadingToastId });
            return { success: false, message: response.message || response.data?.message || "Erreur" };
        }
    } catch {
        toast.error("Problème de connexion au serveur", { id: loadingToastId });
        return { success: false, message: "Problème de connexion" };
    }
}

export async function deleteConfirmationPublicite(pubId: number): Promise<{ success: boolean; message: string }> {
    const loadingToastId = toast.loading("Suppression de la publicité...");
    try {
        const response = await apiRequest({
            method: "POST",
            url: `/api/v1/confirmation/publicites/${pubId}/delete`
        });

        if (response.code === 200) {
            toast.success(response.data?.message || "Publicité supprimée !", { id: loadingToastId });
            return { success: true, message: response.data?.message || "Succès" };
        } else {
            toast.error(response.message || response.data?.message || "Erreur lors de la suppression", { id: loadingToastId });
            return { success: false, message: response.message || response.data?.message || "Erreur" };
        }
    } catch {
        toast.error("Problème de connexion au serveur", { id: loadingToastId });
        return { success: false, message: "Problème de connexion" };
    }
}

export async function toggleConfirmationPubliciteStatus(pubId: number): Promise<{ success: boolean; message: string; is_active?: boolean }> {
    const loadingToastId = toast.loading("Changement de statut...");
    try {
        const response = await apiRequest({
            method: "POST",
            url: `/api/v1/confirmation/publicites/${pubId}/toggle-status`
        });

        if (response.code === 200) {
            toast.success(response.data?.message || "Statut modifié avec succès !", { id: loadingToastId });
            return { success: true, message: response.data?.message || "Succès", is_active: response.data?.is_active };
        } else {
            toast.error(response.message || response.data?.message || "Erreur lors du changement de statut", { id: loadingToastId });
            return { success: false, message: response.message || response.data?.message || "Erreur" };
        }
    } catch {
        toast.error("Problème de connexion au serveur", { id: loadingToastId });
        return { success: false, message: "Problème de connexion" };
    }
}

export async function getConfirmationPubliciteMagasins(search?: string): Promise<ConfirmationPubliciteMagasin[]> {
    try {
        const response = await apiRequest({
            method: "GET",
            url: "/api/v1/confirmation/publicites/magasins",
            params: { search: search || "" }
        });

        if (response.code === 200 && response.data?.success) {
            return response.data.magasins || [];
        }
        return [];
    } catch {
        return [];
    }
}

// ==========================================
// TYPES & ACTIONS : STORIES CONFIRMATION
// ==========================================

export type ConfirmationStoryView = {
    id?: number;
    user_id?: number;
    story_id?: number;
    item_id?: number;
    user?: {
        id: number;
        username?: string;
        first_name?: string;
        last_name?: string;
        phone?: string;
        image_url?: string | null;
        role?: string;
        wilaya?: string;
    } | null;
    user_name?: string;
    user_phone?: string;
    user_avatar?: string | null;
    user_role?: string;
    user_wilaya?: string;
    viewed_at: string;
    duration_watched?: number;
    completed?: boolean;
    clicked_action?: boolean;
    device?: string;
    ip_address?: string;
};

export type ConfirmationStoryItem = {
    id: number;
    story: number;
    image?: string | null;
    image_url?: string | null;
    duration: number;
    lien?: string | null;
    magasin?: number | null;
    magasin_details?: {
        id: number;
        name: string;
        wilaya: string;
        image?: string | null;
        is_active?: boolean;
        EtatOuverture?: boolean;
    } | null;
    title?: string | null;
    description?: string | null;
    order: number;
    is_active: boolean;
    date_creation: string;
    date_expires?: string | null;
    views_count?: number;
    unique_views_count?: number;
    clicks_count?: number;
    completion_rate?: number;
    views?: ConfirmationStoryView[];
};

export type ConfirmationStory = {
    id: number;
    title: string;
    image?: string | null;
    cover_url?: string | null;
    is_active: boolean;
    order: number;
    date_creation: string;
    date_expires?: string | null;
    items_count: number;
    is_expired: boolean;
    items: ConfirmationStoryItem[];
    total_views?: number;
    views_count?: number;
    unique_viewers_count?: number;
    total_clicks?: number;
    completion_rate?: number;
    views?: ConfirmationStoryView[];
};

export type ConfirmationStoryStats = {
    total_stories: number;
    active_stories: number;
    expired_stories: number;
    inactive_stories: number;
    total_items: number;
    total_views?: number;
    unique_viewers?: number;
    total_clicks?: number;
    avg_completion_rate?: number;
};

export type ConfirmationStoriesResponse = {
    success: boolean;
    stats: ConfirmationStoryStats;
    data: ConfirmationStory[];
    pagination: {
        total_items: number;
        total_pages: number;
        current_page: number;
        has_next: boolean;
        has_previous: boolean;
    };
};

export async function getConfirmationStories(params?: {
    search?: string;
    status?: string;
    page?: number | string;
    page_size?: number | string;
}): Promise<ConfirmationStoriesResponse | null> {
    try {
        const response = await apiRequest({
            method: "GET",
            url: "/api/v1/confirmation/stories",
            params: {
                search: params?.search || "",
                status: params?.status || "",
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

export async function createConfirmationStory(
    formData: FormData
): Promise<{ success: boolean; message: string; story?: ConfirmationStory }> {
    const loadingToastId = toast.loading("Création de la Story...");
    try {
        const response = await apiRequest({
            method: "POST",
            url: "/api/v1/confirmation/stories/create",
            data: formData,
            headers: {
                "Content-Type": "multipart/form-data"
            }
        });

        if (response.code === 201 || response.code === 200) {
            toast.success(response.data?.message || "Story créée avec succès !", { id: loadingToastId });
            return { success: true, message: response.data?.message || "Succès", story: response.data?.story };
        } else {
            toast.error(response.message || response.data?.message || "Erreur lors de la création", { id: loadingToastId });
            return { success: false, message: response.message || response.data?.message || "Erreur" };
        }
    } catch {
        toast.error("Problème de connexion au serveur", { id: loadingToastId });
        return { success: false, message: "Problème de connexion" };
    }
}

export async function updateConfirmationStory(
    storyId: number,
    formData: FormData
): Promise<{ success: boolean; message: string; story?: ConfirmationStory }> {
    const loadingToastId = toast.loading("Mise à jour de la Story...");
    try {
        const response = await apiRequest({
            method: "POST",
            url: `/api/v1/confirmation/stories/${storyId}/update`,
            data: formData,
            headers: {
                "Content-Type": "multipart/form-data"
            }
        });

        if (response.code === 200) {
            toast.success(response.data?.message || "Story mise à jour !", { id: loadingToastId });
            return { success: true, message: response.data?.message || "Succès", story: response.data?.story };
        } else {
            toast.error(response.message || response.data?.message || "Erreur lors de la mise à jour", { id: loadingToastId });
            return { success: false, message: response.message || response.data?.message || "Erreur" };
        }
    } catch {
        toast.error("Problème de connexion au serveur", { id: loadingToastId });
        return { success: false, message: "Problème de connexion" };
    }
}

export async function deleteConfirmationStory(storyId: number): Promise<{ success: boolean; message: string }> {
    const loadingToastId = toast.loading("Suppression de la Story...");
    try {
        const response = await apiRequest({
            method: "POST",
            url: `/api/v1/confirmation/stories/${storyId}/delete`
        });

        if (response.code === 200) {
            toast.success(response.data?.message || "Story supprimée !", { id: loadingToastId });
            return { success: true, message: response.data?.message || "Succès" };
        } else {
            toast.error(response.message || response.data?.message || "Erreur lors de la suppression", { id: loadingToastId });
            return { success: false, message: response.message || response.data?.message || "Erreur" };
        }
    } catch {
        toast.error("Problème de connexion au serveur", { id: loadingToastId });
        return { success: false, message: "Problème de connexion" };
    }
}

export async function toggleConfirmationStoryStatus(storyId: number): Promise<{ success: boolean; message: string; is_active?: boolean }> {
    const loadingToastId = toast.loading("Changement de statut...");
    try {
        const response = await apiRequest({
            method: "POST",
            url: `/api/v1/confirmation/stories/${storyId}/toggle-status`
        });

        if (response.code === 200) {
            toast.success(response.data?.message || "Statut modifié avec succès !", { id: loadingToastId });
            return { success: true, message: response.data?.message || "Succès", is_active: response.data?.is_active };
        } else {
            toast.error(response.message || response.data?.message || "Erreur lors du changement de statut", { id: loadingToastId });
            return { success: false, message: response.message || response.data?.message || "Erreur" };
        }
    } catch {
        toast.error("Problème de connexion au serveur", { id: loadingToastId });
        return { success: false, message: "Problème de connexion" };
    }
}

export async function addConfirmationStoryItem(
    storyId: number,
    formData: FormData
): Promise<{ success: boolean; message: string; item?: ConfirmationStoryItem }> {
    const loadingToastId = toast.loading("Ajout du slide...");
    try {
        const response = await apiRequest({
            method: "POST",
            url: `/api/v1/confirmation/stories/${storyId}/items/create`,
            data: formData,
            headers: {
                "Content-Type": "multipart/form-data"
            }
        });

        if (response.code === 201 || response.code === 200) {
            toast.success(response.data?.message || "Slide ajouté avec succès !", { id: loadingToastId });
            return { success: true, message: response.data?.message || "Succès", item: response.data?.item };
        } else {
            toast.error(response.message || response.data?.message || "Erreur lors de l'ajout du slide", { id: loadingToastId });
            return { success: false, message: response.message || response.data?.message || "Erreur" };
        }
    } catch {
        toast.error("Problème de connexion au serveur", { id: loadingToastId });
        return { success: false, message: "Problème de connexion" };
    }
}

export async function updateConfirmationStoryItem(
    itemId: number,
    formData: FormData
): Promise<{ success: boolean; message: string; item?: ConfirmationStoryItem }> {
    const loadingToastId = toast.loading("Mise à jour du slide...");
    try {
        const response = await apiRequest({
            method: "POST",
            url: `/api/v1/confirmation/stories/items/${itemId}/update`,
            data: formData,
            headers: {
                "Content-Type": "multipart/form-data"
            }
        });

        if (response.code === 200) {
            toast.success(response.data?.message || "Slide mis à jour !", { id: loadingToastId });
            return { success: true, message: response.data?.message || "Succès", item: response.data?.item };
        } else {
            toast.error(response.message || response.data?.message || "Erreur lors de la mise à jour", { id: loadingToastId });
            return { success: false, message: response.message || response.data?.message || "Erreur" };
        }
    } catch {
        toast.error("Problème de connexion au serveur", { id: loadingToastId });
        return { success: false, message: "Problème de connexion" };
    }
}

export async function deleteConfirmationStoryItem(itemId: number): Promise<{ success: boolean; message: string }> {
    const loadingToastId = toast.loading("Suppression du slide...");
    try {
        const response = await apiRequest({
            method: "POST",
            url: `/api/v1/confirmation/stories/items/${itemId}/delete`
        });

        if (response.code === 200) {
            toast.success(response.data?.message || "Slide supprimé !", { id: loadingToastId });
            return { success: true, message: response.data?.message || "Succès" };
        } else {
            toast.error(response.message || response.data?.message || "Erreur lors de la suppression", { id: loadingToastId });
            return { success: false, message: response.message || response.data?.message || "Erreur" };
        }
    } catch {
        toast.error("Problème de connexion au serveur", { id: loadingToastId });
        return { success: false, message: "Problème de connexion" };
    }
}

export async function getConfirmationStoryViews(params?: {
    storyId?: number;
    itemId?: number;
    search?: string;
    page?: number | string;
    page_size?: number | string;
}): Promise<{
    success: boolean;
    views: ConfirmationStoryView[];
    total_views: number;
    unique_viewers: number;
    completion_rate?: number;
    clicks_count?: number;
} | null> {
    try {
        const url = params?.storyId
            ? `/api/v1/confirmation/stories/${params.storyId}/views`
            : `/api/v1/confirmation/stories/views`;

        const response = await apiRequest({
            method: "GET",
            url,
            params: {
                ...(params?.itemId ? { item_id: params.itemId } : {}),
                ...(params?.search ? { search: params.search } : {}),
                page: params?.page || 1,
                page_size: params?.page_size || 50
            }
        });

        if (response.code === 200 && response.data?.success) {
            return {
                success: true,
                views: response.data.views || response.data.data || [],
                total_views: response.data.total_views ?? response.data.total ?? 0,
                unique_viewers: response.data.unique_viewers ?? 0,
                completion_rate: response.data.completion_rate,
                clicks_count: response.data.clicks_count
            };
        }
        return null;
    } catch {
        return null;
    }
}








