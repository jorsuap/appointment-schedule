'use client';

import { useState } from 'react';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

interface SiteSection {
  id: string;
  section: string;
  title: string | null;
  subtitle: string | null;
  body: string | null;
  ctaText: string | null;
}

const SECTION_LABELS: Record<string, string> = {
  hero: 'Sección Hero (inicio)',
  about: 'Sección ¿Qué es conAlma?',
  services: 'Sección Servicios',
  cta: 'Sección CTA final',
};

export function ContentEditor({ initialContent }: { initialContent: SiteSection[] }) {
  const [content, setContent] = useState(initialContent);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function updateSection(section: string, field: string, value: string) {
    setContent((prev) =>
      prev.map((c) => (c.section === section ? { ...c, [field]: value } : c)),
    );
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    await fetch('/api/site-content', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sections: content }),
    });
    setSaving(false);
    setSaved(true);
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-grape sm:text-3xl">Contenido de la landing</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Edita los textos que se muestran en la página principal
          </p>
        </div>
        <Button className="gap-1" onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4" />
          {saving ? 'Guardando...' : saved ? '✓ Guardado' : 'Guardar cambios'}
        </Button>
      </div>

      <div className="mt-6 space-y-6">
        {content.map((section) => (
          <Card key={section.id} className="border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-grape">
                {SECTION_LABELS[section.section] || section.section}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {section.title !== null && (
                <div>
                  <Label className="text-sm">Título</Label>
                  <Input
                    className="mt-1 h-11 text-base"
                    value={section.title || ''}
                    onChange={(e) => updateSection(section.section, 'title', e.target.value)}
                  />
                </div>
              )}
              {section.subtitle !== null && (
                <div>
                  <Label className="text-sm">Subtítulo</Label>
                  <Textarea
                    className="mt-1 min-h-[80px] text-base"
                    value={section.subtitle || ''}
                    onChange={(e) => updateSection(section.section, 'subtitle', e.target.value)}
                  />
                </div>
              )}
              {section.body !== null && (
                <div>
                  <Label className="text-sm">Descripción</Label>
                  <Textarea
                    className="mt-1 min-h-[100px] text-base"
                    value={section.body || ''}
                    onChange={(e) => updateSection(section.section, 'body', e.target.value)}
                  />
                </div>
              )}
              {section.ctaText !== null && (
                <div>
                  <Label className="text-sm">Texto del botón</Label>
                  <Input
                    className="mt-1 h-11 text-base"
                    value={section.ctaText || ''}
                    onChange={(e) => updateSection(section.section, 'ctaText', e.target.value)}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
