import React, { useEffect, useRef, useState } from "react";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8080";

export default function AssistantIA() {
  const [history, setHistory] = useState([
    {
      role: "model",
      text:
        "👋 Bonjour ! Je suis votre assistant IA dédié à la gestion de maintenance. Posez vos questions (clients, contrats, interventions, équipements, factures, etc.)."
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  const quickPrompts = [
    "Ajouter un client",
    "Créer une facture",
    "Planifier une intervention",
    "Ajouter un équipement",
    "Afficher le tableau de bord"
  ];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, loading]);

  async function send() {
    const msg = input.trim();
    if (!msg || loading) return;

    setInput("");
    setHistory((h) => [...h, { role: "user", text: msg }]);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, history })
      });
      const data = await res.json();
      if (data?.reply) {
        setHistory((h) => [...h, { role: "model", text: data.reply }]);
      } else {
        setHistory((h) => [...h, { role: "model", text: "Désolé, je n’ai pas pu répondre." }]);
      }
    } catch {
      setHistory((h) => [...h, { role: "model", text: "Erreur de communication avec le service IA." }]);
    } finally {
      setLoading(false);
    }
  }

  function onKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="p-6">
      <div className="max-w-3xl mx-auto">
        <div className="rounded-2xl shadow-md bg-white">
          <div className="p-6 border-b">
            <h1 className="text-3xl font-semibold text-center">Assistant IA</h1>
            <p className="text-center text-gray-600 mt-2">
              Discutez avec l’assistant pour obtenir de l’aide, des conseils,
              ou des informations sur votre activité.
            </p>

            {/* Suggestions rapides */}
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {quickPrompts.map((q) => (
                <button
                  key={q}
                  onClick={() => setInput(q)}
                  className="px-3 py-1 rounded-full border text-sm hover:bg-gray-50"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6 h-[55vh] overflow-y-auto space-y-4">
            {history.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm
                  ${m.role === "user" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"}`}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && <div className="text-gray-500 text-sm">L’assistant écrit…</div>}
            <div ref={bottomRef} />
          </div>

          <div className="p-4 border-t flex gap-3">
            <input
              className="flex-1 rounded-xl border px-4 py-3 outline-none focus:ring"
              placeholder="Écrivez votre question…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
            />
            <button
              onClick={send}
              disabled={loading}
              className="rounded-xl px-5 py-3 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
            >
              Envoyer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
