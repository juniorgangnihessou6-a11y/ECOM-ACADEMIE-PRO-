import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const ADVANTAGES = [
  { icon: "🎓", title: "Formation structurée", text: "Un parcours pas à pas, du premier produit à l'international." },
  { icon: "🚀", title: "Accompagnement pratique", text: "Des actions concrètes à chaque module, pas juste de la théorie." },
  { icon: "📚", title: "Modules complets", text: "Tout le cycle e-commerce couvert, mis à jour régulièrement." },
  { icon: "🎥", title: "Formations vidéo", text: "Des cours vidéo clairs, accessibles à ton rythme." },
  { icon: "📊", title: "Suivi de progression", text: "Sais toujours où tu en es et ce qu'il te reste à faire." },
  { icon: "👥", title: "Communauté d'entrepreneurs", text: "Échange avec d'autres élèves qui avancent comme toi." },
  { icon: "🧠", title: "Stratégies avancées", text: "Publicité, scaling, équipe : au-delà des bases." },
  { icon: "🌍", title: "Développement à l'international", text: "Prépare ton expansion vers de nouveaux marchés." },
];

export default async function HomePage() {
  const supabase = createClient();
  const { data: settings } = await supabase.from("settings").select("*").single();
  const platformName = settings?.platform_name || "Ecom Académie Pro";

  return (
    <main className="min-h-screen bg-[var(--bg-soft)]">
      <header className="max-w-6xl mx-auto flex items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg brand-gradient flex items-center justify-center text-white font-extrabold text-sm">EA</div>
          <span className="font-extrabold">{platformName}</span>
        </div>
        <Link href="/login" className="px-4 py-2 rounded-xl border border-[var(--line)] bg-white text-sm font-semibold hover:border-[var(--blue)] hover:text-[var(--blue)]">
          Se connecter
        </Link>
      </header>

      <section className="max-w-4xl mx-auto text-center px-6 pt-16 pb-20">
        <div className="inline-block text-xs font-bold uppercase tracking-wide text-[var(--blue)] bg-blue-50 px-3 py-1.5 rounded-full mb-5">
          Formation privée e-commerce
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-5">
          Passe au niveau supérieur<br />en e-commerce.
        </h1>
        <p className="text-[var(--gray)] text-base max-w-xl mx-auto mb-8">
          Un accompagnement structuré pour apprendre, lancer, optimiser et développer une activité e-commerce rentable.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link href="/login" className="px-6 py-3 rounded-xl brand-gradient text-white font-bold shadow-md">
            Se connecter
          </Link>
          <a href="#avantages" className="px-6 py-3 rounded-xl border border-[var(--line)] bg-white font-bold">
            Découvrir l'accompagnement
          </a>
        </div>
      </section>

      <section id="avantages" className="max-w-5xl mx-auto px-6 pb-24">
        <h2 className="text-2xl font-extrabold text-center mb-10">Pourquoi {platformName} ?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {ADVANTAGES.map((a) => (
            <div key={a.title} className="bg-white border border-[var(--line)] rounded-2xl p-5 shadow-card">
              <div className="text-2xl mb-2.5">{a.icon}</div>
              <h3 className="font-bold text-sm mb-1.5">{a.title}</h3>
              <p className="text-xs text-[var(--gray)]">{a.text}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="text-center text-xs text-[var(--gray)] py-8 border-t border-[var(--line)]">
        {platformName} — plateforme privée de formation
      </footer>
    </main>
  );
}
