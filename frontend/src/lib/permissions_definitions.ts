export type PermissionKey =
    // VTC
    | "permission_dispatch_vtc"
    | "permission_commission_vtc"
    | "permission_compte_vtc"
    | "permission_list_course"
    | "permission_vtc_detaille"
    | "permission_transporteurs"
    | "permission_demandes_vtc"
    | "permission_actions_vtc"
    | "permission_caisse_vtc"
    // Centre d'Appel & Confirmation
    | "permission_apple_center"
    | "permission_magasins"
    | "permission_livreurs"
    | "permission_commandes"
    | "permission_dispatch"
    | "permission_vlider"
    | "permission_promo"
    | "permission_objectifs"
    // Comptabilité
    | "permission_comptable"
    | "permission_caisses"
    | "permission_caisse_livreur"
    | "permission_commission_livreur"
    | "permission_actions"
    // Commercial & Superviseur
    | "permission_deliveries"
    | "permission_partenaire"
    | "permission_superviseurs"
    | "permission_rapports"
    | "permission_recharge"
    | "permission_ajoute_agent";

export type RoleCategory =
    | "vtc"
    | "centre_appel"
    | "confirmation"
    | "comptabilite"
    | "commercial"
    | "administratif"
    | "superviseur"
    | "general";

export interface PermissionDefinition {
    key: PermissionKey;
    label: string;
    description: string;
    category: RoleCategory;
    roles: string[]; // List of roles where this permission is natively relevant
    routes: string[]; // Dashboard paths unlocked by this permission
    badgeColor?: string;
}

export const ALL_PERMISSIONS_REGISTRY: PermissionDefinition[] = [
    // ==========================================
    // 🚖 RÔLE : CHARGÉ VTC & SUIVI VTC (VTC & Transport)
    // ==========================================
    {
        key: "permission_dispatch_vtc",
        label: "Live Dispatch & Carte Chauffeurs VTC",
        description: "Supervision géographique en temps réel des chauffeurs VTC, suivi des courses et localisation GPS.",
        category: "vtc",
        roles: ["validation_vtc", "suivi_vtc", "admin"],
        routes: ["/dashboard/vtc_dispatch"],
        badgeColor: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
    },
    {
        key: "permission_list_course",
        label: "List Course (Courses VTC)",
        description: "Accès à la liste globale des courses VTC, suivi des trajets et historique.",
        category: "vtc",
        roles: ["validation_vtc", "suivi_vtc", "admin"],
        routes: ["/dashboard/courses"],
    },
    {
        key: "permission_compte_vtc",
        label: "Compte VTC (Chauffeurs)",
        description: "Accès aux profils chauffeurs, véhicules, soldes et comptes VTC.",
        category: "vtc",
        roles: ["validation_vtc", "suivi_vtc", "admin"],
        routes: ["/dashboard/chauffeurs"],
    },
    {
        key: "permission_commission_vtc",
        label: "Commission VTC",
        description: "Accès au paramétrage des commissions, pourcentages et calculs VTC.",
        category: "vtc",
        roles: ["validation_vtc", "admin"],
        routes: ["/dashboard/commission_vtc"],
    },
    {
        key: "permission_vtc_detaille",
        label: "VTC par Détail & Rapide",
        description: "Accès aux détails approfondis des courses, VTC par groupe et dispatch.",
        category: "vtc",
        roles: ["validation_vtc", "suivi_vtc", "admin"],
        routes: ["/dashboard/vtc_rapide"],
    },
    {
        key: "permission_transporteurs",
        label: "Transporteurs & Fret",
        description: "Gestion des flottes de transporteurs, camions et fret inter-wilayas.",
        category: "vtc",
        roles: ["validation_vtc", "suivi_vtc", "admin"],
        routes: ["/dashboard/transporteurs"],
    },
    {
        key: "permission_demandes_vtc",
        label: "Demandes VTC",
        description: "Consultation et traitement des nouvelles demandes et inscriptions de chauffeurs.",
        category: "vtc",
        roles: ["validation_vtc", "suivi_vtc", "admin"],
        routes: ["/dashboard/demande"],
    },
    {
        key: "permission_actions_vtc",
        label: "Actions & Journal VTC",
        description: "Historique des interventions et opérations effectuées sur le module VTC.",
        category: "vtc",
        roles: ["validation_vtc", "suivi_vtc", "admin"],
        routes: ["/dashboard/center_actions"],
    },
    {
        key: "permission_caisse_vtc",
        label: "Caisse VTC",
        description: "Consultation et clôture de la caisse spécifique aux chauffeurs VTC.",
        category: "vtc",
        roles: ["validation_vtc", "suivi_vtc", "comptable", "aide_comptable", "admin"],
        routes: ["/dashboard/caisse_vtc"],
    },

    // ==========================================
    // 🎧 RÔLE : CENTRE D'APPEL
    // ==========================================
    {
        key: "permission_apple_center",
        label: "Centre d'Appel (Support & Réclamations)",
        description: "Gestion des appels clients, tickets d'assistance et suivi des réclamations.",
        category: "centre_appel",
        roles: ["centre_appel", "confirmation", "agent_administratif", "chef_bureau", "admin"],
        routes: ["/dashboard/apple_center"],
    },
    {
        key: "permission_commandes",
        label: "Gestion des Commandes",
        description: "Création, modification et suivi des commandes clients en temps réel.",
        category: "centre_appel",
        roles: ["centre_appel", "confirmation", "admin"],
        routes: ["/dashboard/confirmation/commandes", "/dashboard/confirmation/create_commande"],
    },
    {
        key: "permission_magasins",
        label: "Magasins Partenaires",
        description: "Consultation, approbation et gestion des fiches magasins et catalogues.",
        category: "centre_appel",
        roles: ["centre_appel", "confirmation", "gestion_commercial", "admin"],
        routes: ["/dashboard/confirmation/magasins", "/dashboard/magasin"],
    },
    {
        key: "permission_livreurs",
        label: "Gestion des Livreurs",
        description: "Suivi des livreurs actifs, affectation des courses et vérification des comptes.",
        category: "centre_appel",
        roles: ["centre_appel", "confirmation", "admin"],
        routes: ["/dashboard/confirmation/livreurs", "/dashboard/livreurs"],
    },
    {
        key: "permission_dispatch",
        label: "Dispatch & Carte Live",
        description: "Supervision géographique des livreurs et répartition des commandes en direct.",
        category: "centre_appel",
        roles: ["centre_appel", "confirmation", "admin"],
        routes: ["/dashboard/confirmation/dispatch"],
    },
    {
        key: "permission_vlider",
        label: "Validation des Commandes",
        description: "Autorisation de valider, clôturer et approuver définitivement les commandes.",
        category: "centre_appel",
        roles: ["centre_appel", "confirmation", "superviseur", "admin"],
        routes: ["/dashboard/validation"],
    },
    {
        key: "permission_promo",
        label: "Codes Promo, Pubs & Stories",
        description: "Gestion des codes de réduction, bannières publicitaires et stories mobiles.",
        category: "centre_appel",
        roles: ["centre_appel", "confirmation", "admin"],
        routes: ["/dashboard/confirmation/promo", "/dashboard/confirmation/publicites", "/dashboard/confirmation/stories"],
    },
    {
        key: "permission_commission_livreur",
        label: "Commission Livreur",
        description: "Consultation et application des commissions et pourcentages livreurs.",
        category: "centre_appel",
        roles: ["centre_appel", "confirmation", "comptable", "admin"],
        routes: ["/dashboard/commission_livreur"],
    },

    // ==========================================
    // 📋 RÔLE : CONFIRMATION
    // ==========================================
    {
        key: "permission_objectifs",
        label: "Objectifs & Primes",
        description: "Suivi des primes de rendement, paliers de livraison et objectifs d'équipe.",
        category: "confirmation",
        roles: ["confirmation", "centre_appel", "admin"],
        routes: ["/dashboard/objectifs", "/dashboard/confirmation/objectifs"],
    },

    // ==========================================
    // 💼 RÔLE : COMPTABILITÉ & FINANCES
    // ==========================================
    {
        key: "permission_comptable",
        label: "Tableau Comptable",
        description: "Accès au bilan financier, clôtures de caisses et journal comptable.",
        category: "comptabilite",
        roles: ["comptable", "aide_comptable", "admin"],
        routes: ["/dashboard/comptable"],
    },
    {
        key: "permission_caisses",
        label: "Caisse Globale",
        description: "Visualisation et validation de la caisse générale de l'entreprise.",
        category: "comptabilite",
        roles: ["validation_vtc", "suivi_vtc", "comptable", "chef_bureau", "admin"],
        routes: ["/dashboard/caisses"],
    },
    {
        key: "permission_caisse_livreur",
        label: "Caisse Livreur",
        description: "Gestion des encaissements, versements et soldes des livreurs.",
        category: "comptabilite",
        roles: ["validation_vtc", "suivi_vtc", "comptable", "aide_comptable", "chef_bureau", "admin"],
        routes: ["/dashboard/caisse_livreur"],
    },
    {
        key: "permission_actions",
        label: "Actions Financières & Clôtures",
        description: "Suivi des mouvements d'espèces et opérations de trésorerie.",
        category: "comptabilite",
        roles: ["comptable", "chef_bureau", "admin"],
        routes: ["/dashboard/group_actions"],
    },

    // ==========================================
    // 📑 RÔLE : AGENT ADMINISTRATIF & CHEF DE BUREAU
    // ==========================================
    {
        key: "permission_deliveries",
        label: "Suivi des Livraisons",
        description: "Vue d'ensemble et contrôle de l'ensemble des livraisons exécutées.",
        category: "administratif",
        roles: ["agent_administratif", "chef_bureau", "admin"],
        routes: ["/dashboard/deliveries"],
    },
    {
        key: "permission_ajoute_agent",
        label: "Ajout & Gestion des Agents",
        description: "Création et affectation des agents administratifs sur le terrain.",
        category: "administratif",
        roles: ["chef_bureau", "admin"],
        routes: ["/dashboard/ajoute_agent", "/dashboard/agent_administratif"],
    },

    // ==========================================
    // 📈 RÔLE : GESTION COMMERCIALE
    // ==========================================
    {
        key: "permission_partenaire",
        label: "Gestion des Partenaires",
        description: "Création et suivi des partenariats commerciaux et grandes enseignes.",
        category: "commercial",
        roles: ["gestion_commercial", "admin"],
        routes: ["/dashboard/partenaire"],
    },
    {
        key: "permission_superviseurs",
        label: "Superviseurs & Équipes",
        description: "Coordination et attribution des zones aux superviseurs commerciaux.",
        category: "commercial",
        roles: ["gestion_commercial", "admin"],
        routes: ["/dashboard/ajoute_superviseur", "/dashboard/modifie_superviseur"],
    },

    // ==========================================
    // 🔍 RÔLE : SUPERVISEUR
    // ==========================================
    {
        key: "permission_rapports",
        label: "Rapports d'Activité",
        description: "Génération et consultation des comptes-rendus terrain et statistiques.",
        category: "superviseur",
        roles: ["superviseur", "admin"],
        routes: ["/dashboard/rapports"],
    },
    {
        key: "permission_recharge",
        label: "Recharge Solde",
        description: "Opérations de recharge et crédit des comptes livreurs/chauffeurs.",
        category: "superviseur",
        roles: ["superviseur", "admin"],
        routes: ["/dashboard/recharge"],
    },
];

/**
 * Normalise un nom de rôle pour la recherche des permissions.
 */
export function normalizeRoleKey(role: string = ""): string {
    const r = role.toLowerCase().trim();
    if (r === "charge_vtc" || r === "chargé_vtc" || r === "charge vtc") return "validation_vtc";
    if (r === "employee_vtc" || r === "employe_vtc" || r === "employé_vtc") return "suivi_vtc";
    return r;
}

/**
 * Détermine si une permission est active par défaut pour un rôle lors de sa création ou si la valeur en base est indéfinie.
 * Pour le rôle "confirmation", les pages de base par défaut sont :
 * - Dispatch & Carte Live ("permission_dispatch")
 * - Commandes par wilaya & Ajouter commande ("permission_commandes")
 * Toutes les autres pages (magasins, livreurs, centre d'appel, promo, caisses, etc.)
 * sont désactivées par défaut et configurables par l'administrateur.
 */
export function isDefaultActiveForRole(permKey: string, role: string = ""): boolean {
    const norm = normalizeRoleKey(role);
    if (!norm || norm === "admin") return true;
    if (norm === "confirmation") {
        return permKey === "permission_dispatch" || permKey === "permission_commandes";
    }
    if (norm === "validation_vtc") {
        return (
            permKey === "permission_dispatch_vtc" ||
            permKey === "permission_list_course" ||
            permKey === "permission_compte_vtc" ||
            permKey === "permission_commission_vtc" ||
            permKey === "permission_vtc_detaille" ||
            permKey === "permission_transporteurs" ||
            permKey === "permission_demandes_vtc" ||
            permKey === "permission_actions_vtc" ||
            permKey === "permission_caisse_vtc"
        );
    }
    if (norm === "suivi_vtc") {
        return (
            permKey === "permission_dispatch_vtc" ||
            permKey === "permission_list_course" ||
            permKey === "permission_compte_vtc" ||
            permKey === "permission_vtc_detaille" ||
            permKey === "permission_transporteurs" ||
            permKey === "permission_demandes_vtc" ||
            permKey === "permission_actions_vtc" ||
            permKey === "permission_caisse_vtc"
        );
    }
    const perm = ALL_PERMISSIONS_REGISTRY.find((p) => p.key === permKey);
    return perm ? perm.roles.includes(norm) : false;
}

/**
 * Récupère uniquement les permissions pertinentes pour un rôle donné.
 */
export function getPermissionsForRole(role: string = ""): PermissionDefinition[] {
    const norm = normalizeRoleKey(role);
    if (!norm || norm === "admin") {
        return ALL_PERMISSIONS_REGISTRY;
    }
    return ALL_PERMISSIONS_REGISTRY.filter((p) => p.roles.includes(norm));
}

/**
 * Récupère le nom affiché et la couleur du rôle.
 */
export function getRoleDisplayInfo(role: string = ""): { label: string; badgeColor: string } {
    const norm = normalizeRoleKey(role);
    switch (norm) {
        case "validation_vtc":
            return { label: "Chargé VTC", badgeColor: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300" };
        case "suivi_vtc":
            return { label: "Employé VTC", badgeColor: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300" };
        case "centre_appel":
            return { label: "Centre d'Appel", badgeColor: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300" };
        case "confirmation":
            return { label: "Confirmation", badgeColor: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300" };
        case "comptable":
            return { label: "Comptable", badgeColor: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300" };
        case "agent_administratif":
            return { label: "Agent Administratif", badgeColor: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" };
        case "chef_bureau":
            return { label: "Chef de Bureau", badgeColor: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300" };
        case "gestion_commercial":
            return { label: "Gestion Commerciale", badgeColor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" };
        case "superviseur":
            return { label: "Superviseur", badgeColor: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300" };
        case "admin":
            return { label: "Administrateur", badgeColor: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" };
        default:
            return { label: role || "Personnel", badgeColor: "bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300" };
    }
}
