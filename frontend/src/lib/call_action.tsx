// "use server"

import { CommentaireData } from "./type_module/center_type"
import { apiRequest } from "./request";
import { toast } from "react-hot-toast"

type Comment = {
    id: number;
    comment: string;
}

type apiRequestType = {
    result: Users[];
    totalAct: number;
}

type apiParteneur = {
    result: Partenaire[];
    totalAct: number;
}

export async function getParteners({ page, search, groupe }: { page: string, search: string, groupe: string }): Promise<apiParteneur | null> {
    try {
        const response = await apiRequest({
            method: "GET",
            url: "/api/v1/centreappel/parteners",
            params: { page, search, groupe }
        });

        return {
            result: response.data.results,
            totalAct: response.data.count
        }
    } catch {
        return null
    }
}

export async function getBlockedParteners({ page }: { page: string }): Promise<apiParteneur | null> {
    try {
        const response = await apiRequest({
            method: "GET",
            url: "/api/v1/partener/bloquers",
            params: { page }
        });
        if (response.code == 200) {
            return {
                result: response.data.results,
                totalAct: response.data.count
            };
        } else {
            return null;
        }
    } catch {
        return null;
    }
}

export async function AddComment({ id, comment }: Comment) {
    const loadingToastId = toast.loading('Submite Commande...');
    try {
        const data = await apiRequest({
            url: `/api/v1/centre_appel/comentaire/add`,
            method: "post",
            data: { "partener_id": id, "commentaire": comment }
        });
        if (data.code == 201) {
            toast.success('Comment added Succesfully', { id: loadingToastId });
            return true;
        } else {
            toast.error(data.message, { id: loadingToastId });
            return false;
        }
    } catch {
        toast.error("Problem de connection", { id: loadingToastId });
        return false
    }
}

export const getCommant = async (id: number): Promise<CommentaireData[] | null> => {
    try {
        const data = await apiRequest({
            url: `/api/v1/centre_appel/Comentaires/partener`,
            method: "GET",
            params: { id },
        });
        return data.data.data;
    } catch {
        return null
    }
};

export async function getChefCentre({ page, search }: { page: string, search: string }): Promise<apiParteneur | null> {
    try {
        const data = await apiRequest({
            url: `/api/v1/centreappelgroupe/pertener`,
            method: "GET",
            params: { page, search }
        });
        return {
            result: data.data.results,
            totalAct: data.data.count
        };
    } catch {
        return null
    }
}

export async function getAgents({ page, search }: { page: string, search: string }): Promise<apiRequestType | null> {
    try {
        const data = await apiRequest({
            url: `/api/v1/chefbureux/employers`,
            method: "GET",
            params: { page, search }
        });
        if (data.code == 200) {
            return {
                result: data.data.results,
                totalAct: data.data.count
            };
        } else {
            return null
        }
    } catch {
        return null
    }
}
// Define a more specific type for UpdateUser and UpdateDocument
type UpdateData = {
    id: string;
    [key: string]: unknown; // Allows additional dynamic properties
}

export async function UpdateUser(Data: UpdateData) {

    const loadingToastId = toast.loading('Submite Updating...');

    try {
        const data = await apiRequest({
            method: "PUT",
            url: `/api/v1/update/user`,
            data: Data
        });
        if (data.code == 200) {
            toast.success('Mise à jour avec succès', { id: loadingToastId });
            return true;
        } else {
            toast.error(data.message, { id: loadingToastId });
            return false;
        }
    } catch {
        toast.error("problem connection", { id: loadingToastId });
        return false;
    }
}

export async function UpdateDocument(Data: UpdateData) {

    const loadingToastId = toast.loading('Submite Documment...');

    try {
        const data = await apiRequest({
            method: "PUT",
            url: `/api/v1/chefbureux/completedossie`,
            data: Data
        });
        if (data.code == 200) {
            toast.success('Mise à jour avec succès', { id: loadingToastId });
            return true;
        } else {
            toast.error(data.message, { id: loadingToastId });
            return false;
        }
    } catch {
        toast.error("problem connection", { id: loadingToastId });
        return false;
    }
}

export async function UpdateGroup({ id, groupe, wilaya, code }: { id: number, groupe: string, wilaya: string, code: string }) {
    const loadingToastId = toast.loading('Submite Commande...');

    try {
        const data = await apiRequest({
            url: `/api/v1/user/add/groupe`,
            method: "PATCH",
            data: { id, groupe, wilaya, code }
        });
        if (data.code == 200) {
            toast.success('Commentaire ajouté Avec succès', { id: loadingToastId });
            return true;
        } else {
            toast.error(data.message, { id: loadingToastId });
            return false;
        }
    } catch {
        toast.error("problem connection", { id: loadingToastId });
        return false;
    }
}

export async function getAllChef({ page, search, wilaya, groupe }: { page: string, search: string, wilaya: string, groupe: string }): Promise<apiRequestType | null> {
    try {
        const data = await apiRequest({
            url: `/api/v1/user/chefbureux`,
            method: "GET",
            params: { page, search, wilaya, groupe }
        });
        return {
            result: data.data.results,
            totalAct: data.data.count
        };
    } catch {
        return null
    }
}

export async function ActiveUser({ user_id }: { user_id: number }) {

    const loadingToastId = toast.loading('Submite Activé...');
    try {
        const response = await apiRequest({
            method: "PATCH",
            url: "api/v1/user/activate",
            data: { user_id }
        });

        if (response.code == 200) {
            toast.success('Utilisateur activé avec succès', { id: loadingToastId });
            return true;
        } else {
            toast.error(response.message, { id: loadingToastId });
            return false;
        }
    } catch {
        toast.error("Problem connection", { id: loadingToastId });
        return false
    }
}

export async function DisableUser({ id }: { id: number }) {
    const loadingToastId = toast.loading('Submite Désactive...');
    try {
        const response = await apiRequest({
            method: "PATCH",
            url: "api/v1/user/desactiver",
            data: { id }
        });

        if (response.code == 200) {
            toast.success('Utilisateur désactivé avec succès', { id: loadingToastId });
            return true;
        } else {
            toast.error(response.message, { id: loadingToastId });
            return false;
        }
    } catch {
        toast.error("Problem connection", { id: loadingToastId });
        return false
    }
}

export async function AddLivreur(Data: { [k: string]: FormDataEntryValue; }) {
    const { pass, password, ...rest } = Data;
    const loadingToastId = toast.loading('Création livreur...');

    if (pass !== password) {
        toast.error('Le mot de passe ne correspond pas', { id: loadingToastId });
        return false;
    }

    try {
        const response = await apiRequest({
            method: "POST",
            url: "/api/v1/user/livreur/registre/",
            data: { ...rest, password }
        });
        if (response.code == 200 || response.code == 201) {
            toast.success("Le livreur a été créé avec succès", { id: loadingToastId });
            return true;
        } else {
            toast.error(response.message || "Erreur lors de la création", { id: loadingToastId });
            return false;
        }
    } catch {
        toast.error("Problème de connexion", { id: loadingToastId });
        return false;
    }
}

export async function AddMagasinUser(Data: { [k: string]: FormDataEntryValue; }) {
    const { pass, password, ...rest } = Data;
    const loadingToastId = toast.loading('Création magasin...');

    if (pass !== password) {
        toast.error('Le mot de passe ne correspond pas', { id: loadingToastId });
        return false;
    }

    try {
        const response = await apiRequest({
            method: "POST",
            url: "/api/v1/user/restaurant/registre/",
            data: { ...rest, password }
        });
        if (response.code == 201 || response.code == 200) {
            toast.success("Le magasin a été créé avec succès", { id: loadingToastId });
            return true;
        } else {
            toast.error(response.message || "Erreur lors de la création", { id: loadingToastId });
            return false;
        }
    } catch {
        toast.error("Problème de connexion", { id: loadingToastId });
        return false;
    }
}

// -------------------------------------------------------------------------
// CENTRE D'APPEL - GESTION DES COMPTES (CLIENTS, LIVREURS, MAGASINS)
// -------------------------------------------------------------------------

export type CentreAppelCompte = {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    date_de_naissance?: string;
    type_account?: "classique" | "premium" | string;
    phone: string;
    email: string;
    wilaya: string;
    wilaya_code?: number | string;
    role: string;
    account_type: "client" | "livreur" | "magasin" | "partenaire";
    type_label: string;
    nom_magasin: string;
    is_active: boolean;
    is_blocked: boolean;
    date_joined: string;
    rating: number;
    image_url?: string | null;
    rc?: string;
    partenaire_id?: number | null;
    nbr_commandes?: number;
    commandes_count?: number;
};

export async function getCentreAppelComptes(params: {
    type?: string;
    search?: string;
    wilaya?: string;
    status?: string;
    page?: string | number;
    page_size?: string | number;
}): Promise<{ results: CentreAppelCompte[]; total: number; total_pages: number } | null> {
    try {
        const response = await apiRequest({
            method: "GET",
            url: "/api/v1/centreappel/comptes",
            params: {
                ...(params.type && params.type !== "all" ? { type: params.type } : {}),
                ...(params.search ? { search: params.search } : {}),
                ...(params.wilaya ? { wilaya: params.wilaya } : {}),
                ...(params.status && params.status !== "all" ? { status: params.status } : {}),
                page: String(params.page || 1),
                page_size: String(params.page_size || 20)
            }
        });

        if (response.code === 200 && response.data?.success) {
            return {
                results: response.data.data,
                total: response.data.total,
                total_pages: response.data.total_pages
            };
        }
        return null;
    } catch {
        return null;
    }
}

export async function toggleBlockUserCentreAppel(userId: number, currentBlocked: boolean): Promise<boolean> {
    const loadingToastId = toast.loading(currentBlocked ? "Déblocage du compte..." : "Blocage du compte...");
    try {
        const response = await apiRequest({
            method: "POST",
            url: "/api/v1/centreappel/toggle-block-user",
            data: {
                user_id: userId,
                bloquer: !currentBlocked
            }
        });

        if (response.code === 200 && response.data?.success) {
            toast.success(response.data.message || (currentBlocked ? "Compte débloqué" : "Compte bloqué"), { id: loadingToastId });
            return true;
        } else {
            toast.error(response.message || response.data?.message || "Erreur lors du changement de statut", { id: loadingToastId });
            return false;
        }
    } catch {
        toast.error("Problème de connexion", { id: loadingToastId });
        return false;
    }
}

export async function deleteUserToCorbeille(userId: number): Promise<boolean> {
    const loadingToastId = toast.loading("Déplacement vers la Corbeille...");
    try {
        const response = await apiRequest({
            method: "POST",
            url: "/api/v1/centreappel/soft-delete",
            data: { user_id: userId }
        });

        if (response.code === 200 && response.data?.success) {
            toast.success(response.data.message || "Profil déplacé dans la Corbeille avec succès !", { id: loadingToastId });
            return true;
        } else {
            toast.error(response.message || response.data?.message || "Erreur lors de la suppression", { id: loadingToastId });
            return false;
        }
    } catch {
        toast.error("Problème de connexion", { id: loadingToastId });
        return false;
    }
}

export async function getDeletedUsers(params: {
    search?: string;
    page?: string | number;
    page_size?: string | number;
}): Promise<{ results: CentreAppelCompte[]; total: number; total_pages: number } | null> {
    try {
        const response = await apiRequest({
            method: "GET",
            url: "/api/v1/centreappel/corbeille",
            params: {
                ...(params.search ? { search: params.search } : {}),
                page: String(params.page || 1),
                page_size: String(params.page_size || 20)
            }
        });

        if (response.code === 200 && response.data?.success) {
            return {
                results: response.data.data,
                total: response.data.total,
                total_pages: response.data.total_pages
            };
        }
        return null;
    } catch {
        return null;
    }
}

export async function restoreDeletedUser(userId: number): Promise<boolean> {
    const loadingToastId = toast.loading("Restauration du profil...");
    try {
        const response = await apiRequest({
            method: "POST",
            url: "/api/v1/centreappel/restore",
            data: { user_id: userId }
        });

        if (response.code === 200 && response.data?.success) {
            toast.success(response.data.message || "Profil restauré avec succès !", { id: loadingToastId });
            return true;
        } else {
            toast.error(response.message || response.data?.message || "Erreur lors de la restauration", { id: loadingToastId });
            return false;
        }
    } catch {
        toast.error("Problème de connexion", { id: loadingToastId });
        return false;
    }
}

export async function sendNotificationToUser(userId: number, title: string, message: string): Promise<boolean> {
    const loadingToastId = toast.loading("Envoi de la notification...");
    try {
        const response = await apiRequest({
            method: "POST",
            url: "/api/v1/centreappel/send-notification",
            data: {
                user_id: userId,
                title,
                message
            }
        });

        if (response.code === 200 && response.data?.success) {
            toast.success(response.data.message || "Notification envoyée avec succès !", { id: loadingToastId });
            return true;
        } else {
            toast.error(response.message || response.data?.message || "Erreur lors de l'envoi", { id: loadingToastId });
            return false;
        }
    } catch {
        toast.error("Problème de connexion", { id: loadingToastId });
        return false;
    }
}

export type UpdateUserCentreAppelPayload = {
    user_id: number;
    first_name?: string;
    last_name?: string;
    date_de_naissance?: string;
    type_account?: "classique" | "premium" | string;
    phone?: string;
    phone_2?: string;
    email?: string;
    wilaya?: string;
    wilaya_code?: number | string;
    password?: string;
    is_blocked?: boolean;
    nom_magasin?: string;
    rc?: string;
};

export async function updateUserCentreAppel(payload: UpdateUserCentreAppelPayload): Promise<boolean> {
    const loadingToastId = toast.loading("Mise à jour de l'utilisateur...");
    try {
        const response = await apiRequest({
            method: "POST",
            url: "/api/v1/centreappel/update-user",
            data: payload
        });

        if (response.code === 200 && response.data?.success) {
            toast.success(response.data.message || "Utilisateur mis à jour avec succès !", { id: loadingToastId });
            return true;
        } else {
            toast.error(response.data?.message || response.message || "Erreur lors de la mise à jour", { id: loadingToastId });
            return false;
        }
    } catch {
        toast.error("Problème de connexion", { id: loadingToastId });
        return false;
    }
}

