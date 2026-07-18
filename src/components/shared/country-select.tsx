'use client';

import { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// Full list of countries with Colombia first
const ALL_COUNTRIES = [
  'Colombia',
  'Afganistán', 'Albania', 'Alemania', 'Andorra', 'Angola', 'Argentina', 'Armenia',
  'Australia', 'Austria', 'Azerbaiyán', 'Bahamas', 'Bangladés', 'Bélgica', 'Belice',
  'Bolivia', 'Bosnia y Herzegovina', 'Brasil', 'Bulgaria', 'Camboya', 'Camerún', 'Canadá',
  'Chile', 'China', 'Chipre', 'Corea del Sur', 'Costa Rica', 'Croacia', 'Cuba', 'Dinamarca',
  'Ecuador', 'Egipto', 'El Salvador', 'Emiratos Árabes Unidos', 'Eslovaquia', 'Eslovenia',
  'España', 'Estados Unidos', 'Estonia', 'Etiopía', 'Filipinas', 'Finlandia', 'Francia',
  'Georgia', 'Ghana', 'Grecia', 'Guatemala', 'Guinea', 'Haití', 'Honduras', 'Hungría',
  'India', 'Indonesia', 'Irak', 'Irán', 'Irlanda', 'Islandia', 'Israel', 'Italia',
  'Jamaica', 'Japón', 'Jordania', 'Kazajistán', 'Kenia', 'Kuwait', 'Letonia', 'Líbano',
  'Lituania', 'Luxemburgo', 'Malasia', 'Marruecos', 'México', 'Moldavia', 'Mónaco',
  'Montenegro', 'Mozambique', 'Nicaragua', 'Nigeria', 'Noruega', 'Nueva Zelanda',
  'Países Bajos', 'Pakistán', 'Panamá', 'Paraguay', 'Perú', 'Polonia', 'Portugal',
  'Puerto Rico', 'Reino Unido', 'República Checa', 'República Dominicana', 'Rumania',
  'Rusia', 'Senegal', 'Serbia', 'Singapur', 'Sudáfrica', 'Suecia', 'Suiza', 'Tailandia',
  'Taiwán', 'Tanzania', 'Turquía', 'Ucrania', 'Uruguay', 'Venezuela', 'Vietnam',
];

interface CountrySelectProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function CountrySelect({
  value,
  onChange,
  placeholder = 'Buscar país...',
}: CountrySelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = search
    ? ALL_COUNTRIES.filter((c) => c.toLowerCase().includes(search.toLowerCase()))
    : ALL_COUNTRIES;

  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        className="h-12 w-full justify-between text-base font-normal"
        onClick={() => setOpen(!open)}
      >
        <span className={cn(!value && 'text-muted-foreground')}>
          {value || placeholder}
        </span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-white shadow-lg">
          <div className="p-2">
            <Input
              placeholder="Buscar país..."
              className="h-10 text-base"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          <div className="max-h-60 overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <p className="px-3 py-2 text-sm text-muted-foreground">No se encontró el país</p>
            ) : (
              filtered.map((country) => (
                <button
                  key={country}
                  type="button"
                  className={cn(
                    'flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-left text-sm transition-colors hover:bg-secondary',
                    value === country && 'bg-secondary font-medium',
                  )}
                  onClick={() => {
                    onChange(country);
                    setOpen(false);
                    setSearch('');
                  }}
                >
                  {value === country && <Check className="h-4 w-4 text-grape" />}
                  <span className={cn(value !== country && 'ml-6')}>{country}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
