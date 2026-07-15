'use client';

import { useState } from 'react';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

// TODO: Fetch from SiteContent table
const initialContent = {
  hero: {
    title: 'Tu bienestar emocional merece un espacio seguro',
    subtitle:
      'En conAlma te acompañamos con empatía y profesionalismo en tu proceso de crecimiento personal. Porque cuidar tu salud mental es un acto de valentía.',
    ctaText: 'Quiero agendar mi cita',
  },
  about: {
    title: '¿Qué es conAlma?',
    body: 'Somos un espacio de acompañamiento emocional online creado para personas que buscan un refugio seguro donde explorar sus emociones y encontrar herramientas para su bienestar. Creemos que pedir ayuda es un acto de valentía.',
  },
  services: {
    title: 'Nuestros servicios',
    subtitle: 'Elige el tipo de acompañamiento que mejor se adapte a lo que necesitas en este momento.',
  },
  cta: {
    title: '¿Listo para dar el primer paso?',
    subtitle: 'No tienes que enfrentar esto solo. Estamos aquí para acompañarte con respeto, empatía y profesionalismo.',
    ctaText: 'Agendar mi primera cita',
  },
};

export default function ContenidoPage() {
  const [content, setContent] = useState(initialContent);
  const [saving, setSaving] = useState(false);

  function handleSave() {
    setSaving(true);
    // TODO: Save to database (SiteContent table)
    console.log('Saving content:', content);
    setTimeout(() => setSaving(false), 1000);
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
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </Button>
      </div>

      <div className="mt-6 space-y-6">
        {/* Hero */}
        <Card className="border-border/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-grape">Sección Hero (inicio)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm">Título principal</Label>
              <Input
                className="mt-1 h-11 text-base"
                value={content.hero.title}
                onChange={(e) =>
                  setContent({ ...content, hero: { ...content.hero, title: e.target.value } })
                }
              />
            </div>
            <div>
              <Label className="text-sm">Subtítulo</Label>
              <Textarea
                className="mt-1 min-h-[80px] text-base"
                value={content.hero.subtitle}
                onChange={(e) =>
                  setContent({ ...content, hero: { ...content.hero, subtitle: e.target.value } })
                }
              />
            </div>
            <div>
              <Label className="text-sm">Texto del botón CTA</Label>
              <Input
                className="mt-1 h-11 text-base"
                value={content.hero.ctaText}
                onChange={(e) =>
                  setContent({ ...content, hero: { ...content.hero, ctaText: e.target.value } })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* About */}
        <Card className="border-border/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-grape">Sección ¿Qué es conAlma?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm">Título</Label>
              <Input
                className="mt-1 h-11 text-base"
                value={content.about.title}
                onChange={(e) =>
                  setContent({ ...content, about: { ...content.about, title: e.target.value } })
                }
              />
            </div>
            <div>
              <Label className="text-sm">Descripción</Label>
              <Textarea
                className="mt-1 min-h-[100px] text-base"
                value={content.about.body}
                onChange={(e) =>
                  setContent({ ...content, about: { ...content.about, body: e.target.value } })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Services */}
        <Card className="border-border/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-grape">Sección Servicios</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm">Título</Label>
              <Input
                className="mt-1 h-11 text-base"
                value={content.services.title}
                onChange={(e) =>
                  setContent({
                    ...content,
                    services: { ...content.services, title: e.target.value },
                  })
                }
              />
            </div>
            <div>
              <Label className="text-sm">Subtítulo</Label>
              <Textarea
                className="mt-1 min-h-[80px] text-base"
                value={content.services.subtitle}
                onChange={(e) =>
                  setContent({
                    ...content,
                    services: { ...content.services, subtitle: e.target.value },
                  })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <Card className="border-border/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-grape">Sección CTA final</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm">Título</Label>
              <Input
                className="mt-1 h-11 text-base"
                value={content.cta.title}
                onChange={(e) =>
                  setContent({ ...content, cta: { ...content.cta, title: e.target.value } })
                }
              />
            </div>
            <div>
              <Label className="text-sm">Subtítulo</Label>
              <Textarea
                className="mt-1 min-h-[80px] text-base"
                value={content.cta.subtitle}
                onChange={(e) =>
                  setContent({ ...content, cta: { ...content.cta, subtitle: e.target.value } })
                }
              />
            </div>
            <div>
              <Label className="text-sm">Texto del botón</Label>
              <Input
                className="mt-1 h-11 text-base"
                value={content.cta.ctaText}
                onChange={(e) =>
                  setContent({ ...content, cta: { ...content.cta, ctaText: e.target.value } })
                }
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
