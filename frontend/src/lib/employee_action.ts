import { apiRequest } from "./request";
import toast from "react-hot-toast";

export type UserRoleCategory = "client" | "chauffeur" | "livreur" | "employee";

export type RoleDefinition = {
    key: string;
    label: string;
    category: UserRoleCategory;
    description: string;
    badgeColor: string;
    bgSoft: string;
};

export const ALL_USER_ROLES: RoleDefinition[] = [
    {
        key: "client",
        label: "Client",
        category: "client",
        description: "Utilisateur client de l'application LTC Express",
        badgeColor: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800",
        bgSoft: "bg-blue-50/50 dark:bg-blue-950/20"
    },
    {
        key: "chauffeur",
        label: "Chauffeur VTC",
        category: "chauffeur",
        description: "Chauffeur VTC et transport de personnes/fret",
        badgeColor: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800",
        bgSoft: "bg-amber-50/50 dark:bg-amber-950/20"
    },
    {
        key: "livreur",
        label: "Livreur",
        category: "livreur",
        description: "Livreur express de courses, colis et repas",
        badgeColor: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
        bgSoft: "bg-emerald-50/50 dark:bg-emerald-950/20"
    },
    {
        key: "centre_appel",
        label: "Centre d'Appel",
        category: "employee",
        description: "Dispatch, suivi direct des livreurs, réclamations et assistance",
        badgeColor: "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300 border-sky-200 dark:border-sky-800",
        bgSoft: "bg-sky-50/50 dark:bg-sky-950/20"
    },
    {
        key: "confirmation",
        label: "Confirmation",
        category: "employee",
        description: "Confirmation des commandes clients, dispatch et coordination",
        badgeColor: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200 dark:border-rose-800",
        bgSoft: "bg-rose-50/50 dark:bg-rose-950/20"
    },
    {
        key: "validation_vtc",
        label: "Chargé VTC",
        category: "employee",
        description: "Validation des courses VTC, suivi des chauffeurs et commissions",
        badgeColor: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
        bgSoft: "bg-indigo-50/50 dark:bg-indigo-950/20"
    },
    {
        key: "suivi_vtc",
        label: "Employé VTC",
        category: "employee",
        description: "Suivi des courses VTC, gestion des chauffeurs, transporteurs et demandes",
        badgeColor: "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300 border-violet-200 dark:border-violet-800",
        bgSoft: "bg-violet-50/50 dark:bg-violet-950/20"
    },
    {
        key: "comptable",
        label: "Comptable",
        category: "employee",
        description: "Tenue des comptes, clôture des caisses et gestion financière",
        badgeColor: "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300 border-teal-200 dark:border-teal-800",
        bgSoft: "bg-teal-50/50 dark:bg-teal-950/20"
    },
    {
        key: "agent_administratif",
        label: "Agent Administratif",
        category: "employee",
        description: "Gestion administrative, livraisons et suivi des caisses",
        badgeColor: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800",
        bgSoft: "bg-blue-50/50 dark:bg-blue-950/20"
    },
    {
        key: "admin",
        label: "Administrateur",
        category: "employee",
        description: "Accès complet au système, gestion globale et paramétrages",
        badgeColor: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border-red-200 dark:border-red-800",
        bgSoft: "bg-red-50/50 dark:bg-red-950/20"
    },
    {
        key: "gestion_commercial",
        label: "Gestion Commercial",
        category: "employee",
        description: "Gestion des partenaires, magasins, superviseurs et prospection",
        badgeColor: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
        bgSoft: "bg-emerald-50/50 dark:bg-emerald-950/20"
    },
    {
        key: "superviseur",
        label: "Superviseur",
        category: "employee",
        description: "Validation terrain, supervision des équipes et rapports d'activité",
        badgeColor: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200 dark:border-purple-800",
        bgSoft: "bg-purple-50/50 dark:bg-purple-950/20"
    }
];

export const EMPLOYEE_ROLE_DEFINITIONS = ALL_USER_ROLES.filter((r) => r.category === "employee");

export type EmployeeStatsOverview = {
    total: number;
    active: number;
    blocked: number;
    avg_rendement: number;
    role_counts: Record<string, number>;
};

export type GetEmployeesParams = {
    page?: string | number;
    page_size?: string | number;
    role?: string;
    search?: string;
    wilaya?: string;
    bloquer?: string;
};

export type GetEmployeesResponse = {
    results: Users[];
    count: number;
    total_pages: number;
    stats_overview: EmployeeStatsOverview;
};

export async function getEmployees({
    page = 1,
    page_size = 20,
    role = "",
    search = "",
    wilaya = "",
    bloquer = ""
}: GetEmployeesParams): Promise<GetEmployeesResponse | null> {
    try {
        const params: Record<string, string> = {
            page: String(page),
            page_size: String(page_size),
        };

        if (role && role !== "all") params.role = role;
        if (search.trim()) params.search = search.trim();
        if (wilaya.trim()) params.wilaya = wilaya.trim();
        if (bloquer !== "") params.bloquer = bloquer;

        const response = await apiRequest({
            method: "GET",
            url: "/api/v1/users",
            params,
        });

        if (response.code === 200 && response.data) {
            const results = response.data.results || [];
            const count = response.data.count || results.length;
            const total_pages = response.data.total_pages || Math.ceil(count / Number(page_size)) || 1;
            const stats_overview = response.data.stats_overview || {
                total: count,
                active: results.filter((u: Users) => !u.bloquer).length,
                blocked: results.filter((u: Users) => u.bloquer).length,
                avg_rendement: 0,
                role_counts: {},
            };

            return {
                results,
                count,
                total_pages,
                stats_overview,
            };
        }
        return null;
    } catch {
        return null;
    }
}

export async function updateEmployee(data: { id: number | string; [key: string]: unknown }): Promise<boolean> {
    const loadingToast = toast.loading("Mise à jour en cours...");
    try {
        const response = await apiRequest({
            method: "PUT",
            url: "/api/v1/update/user",
            data,
        });

        if (response.code === 200) {
            toast.success("Mise à jour effectuée avec succès", { id: loadingToast });
            return true;
        } else {
            toast.error(response.message || "Erreur lors de la mise à jour", { id: loadingToast });
            return false;
        }
    } catch {
        toast.error("Erreur de connexion au serveur", { id: loadingToast });
        return false;
    }
}

export async function updateEmployeeRole(id: number, newRole: string): Promise<boolean> {
    return updateEmployee({ id, role: newRole });
}

export type EmployeePermissionsPayload = {
    permission_vlider?: boolean;
    permission_commission_vtc?: boolean;
    permission_compte_vtc?: boolean;
    permission_list_course?: boolean;
    permission_vtc_detaille?: boolean;
    commission_vtc?: boolean;
    compte_vtc?: boolean;
    list_course?: boolean;
    vtc_detaille?: boolean;
    confirmation?: boolean;
    [key: string]: unknown;
};

export async function updateEmployeePermissions(
    id: number,
    permissions: EmployeePermissionsPayload
): Promise<boolean> {
    return updateEmployee({
        id,
        ...permissions,
        commission_vtc: permissions.permission_commission_vtc ?? permissions.commission_vtc,
        compte_vtc: permissions.permission_compte_vtc ?? permissions.compte_vtc,
        list_course: permissions.permission_list_course ?? permissions.list_course,
        vtc_detaille: permissions.permission_vtc_detaille ?? permissions.vtc_detaille,
    });
}

export async function toggleEmployeeBlock(id: number, bloquer: boolean): Promise<boolean> {
    const actionLabel = bloquer ? "Compte bloqué avec succès" : "Compte débloqué avec succès";
    const loadingToast = toast.loading(bloquer ? "Blocage du compte..." : "Déblocage du compte...");
    try {
        const response = await apiRequest({
            method: "PUT",
            url: "/api/v1/update/user",
            data: { id, bloquer },
        });

        if (response.code === 200) {
            toast.success(actionLabel, { id: loadingToast });
            return true;
        } else {
            toast.error(response.message || "Impossible de modifier le statut", { id: loadingToast });
            return false;
        }
    } catch {
        toast.error("Erreur de connexion au serveur", { id: loadingToast });
        return false;
    }
}

export async function updateEmployeeRendement(id: number, rendement: number): Promise<boolean> {
    return updateEmployee({ id, rendement });
}

export async function updateEmployeePassword(id: number, password: string): Promise<boolean> {
    return updateEmployee({ id, password });
}

export async function updateEmployeeProfile(
    id: number,
    profileData: Partial<Users> & { password?: string }
): Promise<boolean> {
    return updateEmployee({ id, ...profileData });
}

export async function createEmployee(data: Record<string, unknown>): Promise<boolean> {
    const loadingToast = toast.loading("Création de l'employé en cours...");
    try {
        const response = await apiRequest({
            method: "POST",
            url: "/v1/users/employer/create/",
            data,
        });

        if (response.code === 201) {
            toast.success("Employé créé avec succès !", { id: loadingToast });
            return true;
        } else {
            toast.error(response.message || "Erreur lors de la création", { id: loadingToast });
            return false;
        }
    } catch {
        toast.error("Erreur de connexion au serveur", { id: loadingToast });
        return false;
    }
}
