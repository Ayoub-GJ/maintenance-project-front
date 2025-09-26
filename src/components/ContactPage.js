import React from "react";

const EMAIL = "contact.gestioncdm@gmail.com"; // your email
const WHATSAPP_NUMBER = "212600000000";       // placeholder as requested

export default function ContactPage() {
  const mailto = `mailto:${EMAIL}?subject=${encodeURIComponent("Demande d'information")}`;
  const whatsapp = `https://wa.me/${WHATSAPP_NUMBER}`;

  return (
    <div className="p-6">
      <div className="max-w-xl mx-auto rounded-2xl shadow-md p-8 bg-white">
        <h1 className="text-3xl font-semibold text-center mb-2">Contactez-nous</h1>
        <p className="text-center text-gray-600 mb-6">
          Besoin d’aide ou d’information ? Notre équipe est à votre écoute.
        </p>

        <div className="space-y-4">
          <a
            href={mailto}
            className="block w-full text-center rounded-xl px-4 py-3 bg-blue-600 text-white hover:bg-blue-700 transition"
          >
            Envoyer un email
          </a>

          <a
            href={whatsapp}
            target="_blank"
            rel="noreferrer"
            className="block w-full text-center rounded-xl px-4 py-3 bg-green-500 text-white hover:bg-green-600 transition"
          >
            WhatsApp
          </a>
        </div>

        <p className="text-xs text-center text-gray-500 mt-4">
          Réponse rapide pendant les heures ouvrables.
        </p>
      </div>
    </div>
  );
}
