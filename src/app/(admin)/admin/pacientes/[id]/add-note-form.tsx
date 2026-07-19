'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export function AddNoteForm({ patientId }: { patientId: string }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!content.trim()) return;
    setSaving(true);

    await fetch(`/api/patients/${patientId}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });

    setContent('');
    setShowForm(false);
    setSaving(false);
    router.refresh();
  }

  if (!showForm) {
    return (
      <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => setShowForm(true)}>
        <Plus className="h-3 w-3" />
        Agregar nota
      </Button>
    );
  }

  return (
    <div className="rounded-lg border border-plum/30 bg-secondary/30 p-3">
      <Textarea
        placeholder="Escribe tu nota de progreso..."
        className="min-h-[100px] border-0 bg-transparent text-sm focus-visible:ring-0"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        autoFocus
      />
      <div className="mt-2 flex gap-2">
        <Button size="sm" onClick={handleSave} disabled={!content.trim() || saving}>
          {saving ? 'Guardando...' : 'Guardar'}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => { setShowForm(false); setContent(''); }}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}
