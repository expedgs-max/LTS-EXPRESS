import CaisseLivreur from "@/components/caisse_app/caisse_livreur";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
    title: "Caisse Livreurs - LTC Express",
    description: "Gestion financière, taxes LTC et soldes des livreurs food",
};

export default function Page() {
    return <CaisseLivreur />;
}
