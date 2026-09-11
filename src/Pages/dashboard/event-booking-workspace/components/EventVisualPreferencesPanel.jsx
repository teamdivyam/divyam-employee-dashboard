/* eslint-disable react/prop-types */
import { Plus } from 'lucide-react';

import { Button } from '@components/components/ui/button';
import VisualPreferencesGallery from './VisualPreferencesGallery';

export default function EventVisualPreferencesPanel({ preferences = [], functions = [], onAdd }) {
  const functionNames = functions.map((item) => item.name).filter(Boolean);

  return (
    <section id="visual-preferences" className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Visual Preferences</h2>
          <p className="mt-0.5 text-[11px] text-muted-foreground">Client-approved references from CRM, organised function-wise for event execution.</p>
        </div>
        <Button type="button" size="sm" onClick={onAdd} className="h-8 gap-1.5 bg-pink-600 px-3 text-[11px] hover:bg-pink-700"><Plus className="h-3.5 w-3.5" />Add Preference</Button>
      </header>

      <VisualPreferencesGallery preferences={preferences} functionNames={functionNames} onAdd={onAdd} />
    </section>
  );
}
