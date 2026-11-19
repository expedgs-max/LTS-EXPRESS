type ApiResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: Result[];
}

type Result = {
  id: number;
  client: Users;
  magasin: Magasin;
  livreur: Livreur;
  total_price: string;
  created_at: string;
  delivery_price: number;
  valide_payment: boolean;
  prix_de_tax: number;
  paye_par_livreur: boolean;
  status: string;
  emp_val: number;
  selected: boolean;
}

type Courses = {
  id: number;
  client: Users | null;
  partener: Partenaire | null;
  km: number;
  point_gbs_localisation_aller: string;
  point_gbs_localisation_arrive: string;
  latitude_depart: string | null;
  longitude_depart: string | null;
  latitude_arrive: string | null;
  longitude_arrive: string | null;
  etat: string;
  paye: boolean;
  paye_par_partener: boolean;
  prix: number;
  wilaya: string;
  facteur_bonus: number;
  tax_tawsile: number;
  date_creation: string;
  type_coursa?: string;
  agent: Users | null;
  selected: boolean;
}


type Magasin = {
  id: number;
  cataloguqe: Catalogue[];
  descprition: string;
  name: string;
  adresse: string;
  contact: string;
  is_active: boolean;
  wilaya: string;
  image: string | null;
  image_background: string | null;
  owner: Partenaire;
  EtatOuverture: boolean;
  rating: number;
}

type Catalogue = {
  id: number;
  name: string;
  description: string;
}

type Livreur = {
  id: number;
  partenneur: Partenaire;
  user?: Users;
  is_available: boolean;
  wilaya: string;
  delivered_orders_count?: number;
  nbr_commandes?: number;
}

type Vehicule = {
  id: number;
  modele: string | null;
  marque: string | null;
  matricule: string | null;
  num_assurance: string | null;
  num_scanner: string | null;
  Date_expiration_assurance: Date;
  Date_expiration_scanner: Date;
  type_vehicule: string | null;
}

type typeCompte = {
  descprtion: string;
  id: number;
  name: string;
  tax_tawsile: number;
}

type Groupes = {
  groupe: string;
  wilaya: string;
  groupe_name: string;
}

type Partenaire = {
  id: number;
  user: Users;
  vihucule: Vehicule;
  nom_de_magasin?: string | null;
  adresse: string | null;
  RC: string | null;
  Nif: string | null;
  numero_act: string | null;
  tax_a_payer: string | null;
  tax_global: string | null;
  chiffre_affaires: string | null;
  consement: string | null;
  randement: string | null;
  card_number: string | null;
  latitude: string | null;
  longitude: string | null;
  pre_en_charge: boolean;
  is_available: boolean;
  type_partener: string | null;
  type_compte: typeCompte;
  magasin_id: number | null;
  num_de_carte_prenneur: string | null; // RIB Number
}

type Users = {
  id: number;
  password: string;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  is_active: boolean;
  bloquer: boolean;
  date_de_naissance: string | null;
  role: string;
  lieux: string | null;
  sexe: string;
  phone_number_1: string;
  phone_number_2: string | null;
  image_url: string | null;
  wilaya: string;
  groupe: string | null;
  rendement: number;
  point: number;
  rating: number;
  permission_vlider: boolean;
  permission_commission_vtc?: boolean;
  permission_compte_vtc?: boolean;
  permission_list_course?: boolean;
  permission_vtc_detaille?: boolean;
  permission_transporteurs?: boolean;
  permission_demandes_vtc?: boolean;
  permission_actions_vtc?: boolean;
  permission_caisse_vtc?: boolean;
  permission_apple_center?: boolean;
  permission_magasins?: boolean;
  permission_livreurs?: boolean;
  permission_commandes?: boolean;
  permission_dispatch?: boolean;
  permission_dispatch_vtc?: boolean;
  permission_promo?: boolean;
  permission_objectifs?: boolean;
  permission_comptable?: boolean;
  permission_caisses?: boolean;
  permission_caisse_livreur?: boolean;
  permission_commission_livreur?: boolean;
  permission_deliveries?: boolean;
  permission_actions?: boolean;
  permission_partenaire?: boolean;
  permission_superviseurs?: boolean;
  permission_rapports?: boolean;
  permission_recharge?: boolean;
  permission_ajoute_agent?: boolean;
  commission_vtc?: boolean;
  compte_vtc?: boolean;
  list_course?: boolean;
  vtc_detaille?: boolean;
  is_superuser: boolean;
  date_joined: string;
  type_account: "premium" | "classique";
  wilaya_code: number;
  groupe_name: string;
  delivered_orders_count?: number;
  nbr_commandes?: number;
  type_compte_name?: string;
  partener_id?: number;
};

type actionData = {
  count: number;
  next: boolean;
  previous: boolean;
  results: Actions[];
};

type Actions = {
  id: number;
  agent: Users;
  date_action: string;
  total_amount: string;
  livreur: Livreur;
};

type MagasinType = {
  id: number
  name: string;
  description: string;
  tax_tawsile: number;
}

type DataType = {
  [key: string | number]: unknown
}

type Caisses = {
  id: number;
  chef_bu: Users;
  resut: number;
  date_creationn: string;
  etat: boolean;
  prix_reale: number;
  approuve: boolean;
  a_compte: number | null;
  manque: number | null;
}

type Context = {
  total_courses: number;
  total_users_chef_bureux: number;
  tolat_users_agents: number; // Note: Typo in the key name (should be "total_users_agents")
  total_users_centre_appel: number;
  total_users_superviseurs: number;
  total_users_validation: number;
  total_users_with_group: number;
  total_partners__choffeur: number;
  total_partners__magasin: number;
  total_partners__livreur: number; // Note: Double underscore in the key name
  partennneur_groupe: number;
  partenneur_commente: number;
  partenneur_active: number;
  paretnneur_en_attend: number;
};

type Demande = {
  id: number,
  superviseur: Users,
  date_de_creation: string,
  somme: number,
  wilaya: string,
  etat: "en_attente" | "refuse" | "accepte" | "annuler";
  appouvie_par_super_v: boolean;
}

type centerAction = {
  id: number;
  centre_appel: Users;
  superviseur: Users;
  etat: string;
  data_de_creation: string;
  prix: number;
  prix_a_envoye: number;
}

type Order = {
  id: number;
  confirmation: boolean;
  client_info: Users;
  magasin: number;
  magasin_info?: {
    id: number;
    name: string;
    image?: string | null;
    adresse?: string;
    address?: string;
    contact?: string;
    phone?: string;
    owner_name?: string;
    wilaya?: string;
    EtatOuverture?: boolean;
    rating?: number;
    owner?: {
      phone_number_1?: string;
      phone_number_2?: string;
      first_name?: string;
      last_name?: string;
    };
  };
  distination?: string;
  livreur?: Livreur;
  articles_commandes?: {
    id: number;
    quantity: number;
    subtotal: number | string;
    specific?: string | null;
    article: {
      id: number;
      name: string;
      price: number;
      image?: string | null;
      description?: string;
      quantity_stock?: number;
    };
  }[];
  total_price: string;
  created_at: string;
  delivery_price: string;
  valide_payment: boolean;
  paye_par_livreur: boolean;
  prix_de_tax: number;
  status: "pending" | "confirmed" | "search" | "ready" | "delivered" | "in_progress" | "annule_par_livreur" | "annule_par_client" | "canceled";
  emp_val: string | null;
  type_livraison: "classique" | "premium";
  type_service?: "food" | "colis" | "service_livreur" | string;
  order_type?: "food" | "colis" | "service_livreur" | string;
  is_colis?: boolean;
  colis_info?: {
    nom_produit?: string;
    image?: string | null;
    hauteur?: string | number;
    largeur?: string | number;
    poids?: string | number;
    est_fragile?: boolean;
    point_depart?: string;
    point_livraison?: string;
    adresse_depart?: string;
    adresse_livraison?: string;
    type_livraison?: "normal" | "rapide";
    distance_km?: number | string;
  };
  trip_time?: string | null;
  client_delivered_count?: number;
  livreur_delivered_count?: number;
}

type Variant = {
  id: number;
  prix: number;
  quantity: number;
}

type Article = {
  id: number;
  name: string;
  description: string;
  price: string;
  disponibilite: boolean;
  rating: number;
  image: string;
  magasin: number;
  catalogue: number;
  prixstar_shop: variant[];
}

type Produit = {
  id: number;
  image: string | null;
  name: string;
  description: string;
  price: string; // Assuming price is a string to handle decimals and formatting
  quantity_stock: number;
  disponibilite: boolean;
  rating: number;
  magasin: number;
  catalogue: number;
  prixstar_shop: Variant[];
  ordre?: number | null;
};

type OrderItem = {
  id: number;
  article: Article;
  commande: Order;
  quantity: number;
  subtotal: string;
  wilaya: string;
  specific: string | null;
}

type LivreurMagasine = {
  id: number;
  is_available: boolean,
  partenneur_first_name: string;
  partenneur_last_name: string;
  partenneur_phone_number_1: string;
}

type ReviewType = {
  id: number;
  client: Users;
  article: number;
  commentaire: string | null;
  star: number;
  created_at: string;
}

type GroupeVTC = {
  partener__id: number;
  partener__user__id: number;
  partener__user__first_name: string;
  partener__user__last_name: string;
  partener__user__wilaya: string;
  paye: boolean;
  partener__user__phone_number_1: string;
  total_tax_wi: number;
}

type Chart = {
  day: string;
  count: string;
}

type Categories = {
  id: number;
  name: string;
}

type Video = {
  id: number;
  name: string;
  description: string;
  image: string;
  time: string;
  lien: string;
  cataloguevideo: categories;
}

type CommissionVTC = {
  id: number;
  wilaya: string;
  code_wilaya?: number | null;
  type_course: string;
  prix_depart: number;
  prix_second: number;
  prix_km: number;
  prix_km_long: number;
  prix_nuit_second: number;
  description?: string | null;
}

type ChauffeurCommissionRate = {
  id: number;
  name: string;
  tax_tawsile: number;
  description?: string | null;
}

type TypeCourseVTC = {
  id: number;
  name: string;
  code: string;
  description?: string | null;
  icon?: string | null;
  is_active?: boolean;
  rules_count?: number;
  created_at?: string;
}

type CommissionLivreur = {
  id: number;
  km: number;
  prix: number;
  description?: string | null;
}

type LivreurCommissionRate = {
  id: number;
  name: string;
  tax_tawsile: number;
  description?: string | null;
}
