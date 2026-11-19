import React from "react";
import CreateExpressOrder from "@/components/confirmation_app/create_express_order";

export const metadata = {
    title: "Créer une Commande Express | LTC Confirmation",
    description: "Création manuelle de commande, géolocalisation client et assignation livreur en temps réel.",
};

export default function CreateCommandePage() {
    return (
        <div className="p-2 sm:p-4 md:p-6">
            <CreateExpressOrder />
        </div>
    );
}
