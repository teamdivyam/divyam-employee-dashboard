/* eslint-disable react/prop-types */
import { Plus } from 'lucide-react';

import { Button } from '@components/components/ui/button';
import VisualPreferencesGallery from './VisualPreferencesGallery';

export default function EventVisualPreferencesPanel({ preferences = [], functions = [], onAdd }) {
  return (
    <section id="visual-preferences" className="min-w-0">
      <VisualPreferencesGallery className="min-w-0" showSort={false} toolbarAction={<Button type="button" variant="custom" size="sm" className="gap-2" onClick={onAdd}><Plus className="h-4 w-4" />Add Preference</Button>} preferences={preferences} functionNames={functions.map((item) => item.name).filter(Boolean)} onAdd={onAdd} />
    </section>
  );
}
