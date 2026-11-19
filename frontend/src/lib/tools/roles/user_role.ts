import { ALL_PERMISSIONS_REGISTRY } from "@/lib/permissions_definitions";

function getBaseRoleUrls(role: string): string[] | null {
    switch (role.toLowerCase()) {
        case "admin":
            return [
                "/dashboard",
                "/dashboard/profile",
                "/dashboard/employees",
                "/dashboard/confirmation/employees",
                "/dashboard/tutorial",
                "/dashboard/confirmation",
                "/dashboard/confirmation/dispatch",
                "/dashboard/confirmation/create_commande",
                "/dashboard/confirmation/commandes",
                "/dashboard/confirmation/magasins",
                "/dashboard/confirmation/livreurs",
                "/dashboard/confirmation/promo",
                "/dashboard/confirmation/publicites",
                "/dashboard/confirmation/stories",
                "/dashboard/apple_center",
                "/dashboard/commission_vtc",
                "/dashboard/commission_livreur",
                "/dashboard/objectifs",
                "/dashboard/confirmation/objectifs",
                "/dashboard/transporteurs",
                "/dashboard/chauffeurs",
                "/dashboard/courses",
                "/dashboard/caisses",
                "/dashboard/caisse_vtc",
                "/dashboard/caisse_livreur",
                "/dashboard/vtc_dispatch",
            ];
        case "chef_bureau":
            return ["/dashboard", "/dashboard/profile", "/dashboard/employees", "/dashboard/actions", "/dashboard/agent_administratif", "/dashboard/ajoute_agent", "/dashboard/apple_center", "/dashboard/caisses", "/dashboard/deliveries", "/dashboard/tutorial", "/dashboard/commission_vtc", "/dashboard/commission_livreur", "/dashboard/transporteurs", "/dashboard/chauffeurs", "/dashboard/caisse_vtc", "/dashboard/caisse_livreur"];
        case "centre_appel":
            return ["/dashboard", "/dashboard/profile", "/dashboard/employees", "/dashboard/confirmation/employees", "/dashboard/apple_center", "/dashboard/groupes", "/dashboard/confirmation", "/dashboard/confirmation/dispatch", "/dashboard/confirmation/create_commande", "/dashboard/validation", "/dashboard/tutorial", "/dashboard/ajoute_livreur", "/dashboard/ajoute_magasin", "/dashboard/livreurs", "/dashboard/confirmation/promo", "/dashboard/confirmation/publicites", "/dashboard/confirmation/stories", "/dashboard/commission_livreur", "/dashboard/objectifs", "/dashboard/confirmation/objectifs", "/dashboard/transporteurs", "/dashboard/chauffeurs", "/dashboard/courses", "/dashboard/caisses", "/dashboard/caisse_vtc", "/dashboard/caisse_livreur"];
        case "agent_administratif":
            return ["/dashboard", "/dashboard/profile", "/dashboard/apple_center", "/dashboard/deliveries", "/dashboard/tutorial", "/dashboard/caisses", "/dashboard/caisse_vtc", "/dashboard/caisse_livreur"];
        case "superviseur":
            return ["/dashboard", "/dashboard/profile", "/dashboard/rapports", "/dashboard/validation", "/dashboard/recharge", "/dashboard/caisses", "/dashboard/caisse_vtc", "/dashboard/caisse_livreur"];
        case "gestion_commercial":
            return ["/dashboard", "/dashboard/profile", "/dashboard/employees", "/dashboard/modifie_superviseur", "/dashboard/agent_administratif", "/dashboard/ajoute_superviseur", "/dashboard/magasin", "/dashboard/partenaire", "/dashboard/caisses", "/dashboard/caisse_vtc", "/dashboard/caisse_livreur"];
        case "validation_vtc":
            return [
                "/dashboard",
                "/dashboard/profile",
                "/dashboard/vtc_dispatch",
                "/dashboard/courses",
                "/dashboard/vtc_rapide",
                "/dashboard/demande",
                "/dashboard/center_actions",
                "/dashboard/commission_vtc",
                "/dashboard/transporteurs",
                "/dashboard/chauffeurs",
                "/dashboard/caisses",
                "/dashboard/caisse_vtc",
            ];
        case "suivi_vtc":
            return ["/dashboard", "/dashboard/profile", "/dashboard/vtc_dispatch", "/dashboard/courses", "/dashboard/vtc_rapide", "/dashboard/demande", "/dashboard/center_actions", "/dashboard/transporteurs", "/dashboard/chauffeurs", "/dashboard/caisses", "/dashboard/caisse_vtc", "/dashboard/caisse_livreur"];
        case "comptable":
            return ["/dashboard", "/dashboard/profile", "/dashboard/comptable", "/dashboard/group_actions", "/dashboard/caisses", "/dashboard/caisse_vtc", "/dashboard/caisse_livreur", "/dashboard/commission_livreur"];
        case "confirmation":
            return [
                "/dashboard",
                "/dashboard/profile",
                "/dashboard/confirmation/dispatch",
                "/dashboard/confirmation",
                "/dashboard/confirmation/create_commande",
                "/dashboard/confirmation/commandes",
            ];
        case "partener":
            return ["/dashboard", "/dashboard/profile", "/dashboard/product_management", "/dashboard/commandes"];
        case "aide_comptable":
            return ["/dashboard", "/dashboard/profile", "/dashboard/caisses", "/dashboard/caisse_vtc", "/dashboard/caisse_livreur"];
        // Add more roles as needed
        default:
            return null;
    }
}

export function Role(role: string, user?: Partial<Users> | null): string[] | null {
    const urls = getBaseRoleUrls(role);
    if (!urls || role.toLowerCase() === "admin") {
        return urls;
    }

    let result = [...urls];
    if (user) {
        ALL_PERMISSIONS_REGISTRY.forEach((perm) => {
            const rawVal =
                (user as unknown as Record<string, unknown>)[perm.key] ??
                (perm.key === "permission_commission_vtc" ? user.commission_vtc : undefined) ??
                (perm.key === "permission_compte_vtc" ? user.compte_vtc : undefined) ??
                (perm.key === "permission_list_course" ? user.list_course : undefined) ??
                (perm.key === "permission_vtc_detaille" ? user.vtc_detaille : undefined);
            if (rawVal === false) {
                // Si la permission est expressément désactivée, retirer ses routes
                result = result.filter((u) => !perm.routes.includes(u));
            } else if (rawVal === true) {
                // Si la permission est accordée, s'assurer que ses routes sont accessibles
                perm.routes.forEach((r) => {
                    if (!result.includes(r)) result.push(r);
                });
            }
        });
    }

    return result;
}