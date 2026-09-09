"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FormRow, inputClass } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { createClient } from "@/lib/supabase/client";
import { FileUploader } from "@/components/FileUploader";
import { SettingsRow } from "@/lib/types";

export function SettingsClient({ initialSettings }: { initialSettings: SettingsRow }) {
  const [settings, setSettings] = useState(initialSettings);
  const toast = useToast();
  const supabase = createClient();

  async function handleSave() {
    const { error } = await supabase.from("settings").update({
      platform_name: settings.platform_name,
      description: settings.description,
      logo_url: settings.logo_url,
      favicon_url: settings.favicon_url,
      cover_url: settings.cover_url,
      primary_color: settings.primary_color,
    }).eq("id", 1);
    if (error) { toast("⚠️ " + error.message); return; }
    toast("✅ Modifications enregistrées");
  }

  async function toggleTheme() {
    const next = settings.theme === "dark" ? "light" : "dark";
    await supabase.from("settings").update({ theme: next }).eq("id", 1);
    setSettings({ ...settings, theme: next });
    document.documentElement.classList.toggle("dark", next === "dark");
    toast(next === "dark" ? "🌙 Mode sombre activé" : "☀️ Mode clair activé");
  }

  function uploadLogoTo(field: "logo_url" | "favicon_url" | "cover_url") {
    return (
      <FileUploader accept="image" multiple={false} onUploaded={(res) => {
        const { data } = supabase.storage.from(res.bucket).getPublicUrl(res.path);
        setSettings((s) => ({ ...s, [field]: data.publicUrl }));
        toast("✅ Image importée — clique sur Enregistrer pour valider");
      }} />
    );
  }

  return (
    <div>
      <div className="mb-6"><h1 className="text-2xl font-extrabold mb-1">Paramètres</h1><p className="text-sm text-[var(--gray)]">Informations générales de la plateforme.</p></div>

      <Card className="mb-4">
        <h3 className="font-bold text-sm mb-3.5">Informations de la plateforme</h3>
        <FormRow label="Nom"><input className={inputClass} value={settings.platform_name} onChange={(e) => setSettings({ ...settings, platform_name: e.target.value })} /></FormRow>
        <FormRow label="Description"><textarea className={inputClass} rows={2} value={settings.description} onChange={(e) => setSettings({ ...settings, description: e.target.value })} /></FormRow>
        <FormRow label="Logo">
          {settings.logo_url && <img src={settings.logo_url} alt="Logo" className="w-14 h-14 rounded-lg object-cover mb-2" />}
          {uploadLogoTo("logo_url")}
        </FormRow>
        <FormRow label="Favicon">
          {settings.favicon_url && <img src={settings.favicon_url} alt="Favicon" className="w-8 h-8 rounded mb-2" />}
          {uploadLogoTo("favicon_url")}
        </FormRow>
        <FormRow label="Image de couverture">
          {settings.cover_url && <img src={settings.cover_url} alt="Couverture" className="w-full h-24 rounded-lg object-cover mb-2" />}
          {uploadLogoTo("cover_url")}
        </FormRow>
        <Button variant="primary" onClick={handleSave}>Enregistrer</Button>
      </Card>

      <Card className="mb-4">
        <h3 className="font-bold text-sm mb-3.5">Apparence</h3>
        <div className="flex items-center gap-3 mb-3">
          <span className="text-sm">Mode {settings.theme === "dark" ? "sombre" : "clair"} actif</span>
          <Button onClick={toggleTheme}>{settings.theme === "dark" ? "☀️ Mode clair" : "🌙 Mode sombre"}</Button>
        </div>
        <FormRow label="Couleur principale">
          <input type="color" value={settings.primary_color} onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })} className="w-16 h-10 rounded-lg border border-[var(--line)]" />
        </FormRow>
      </Card>
    </div>
  );
}
