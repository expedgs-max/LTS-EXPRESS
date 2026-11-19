import CaisseVtc from "@/components/caisse_app/caisse_vtc";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
    title: "Caisse VTC - LTC Express",
    description: "Gestion financière, taxes LTC et soldes des chauffeurs VTC",
};

export default function Page() {
    return <CaisseVtc />;
}
