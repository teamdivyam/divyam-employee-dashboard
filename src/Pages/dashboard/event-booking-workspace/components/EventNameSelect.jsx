/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react';
import { Input } from '@components/components/ui/input';
import { Label } from '@components/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/components/ui/select';

export default function EventNameSelect({ id, label, options, value, initialValue, resetKey, onChange, disabled, error, icon: Icon }) {
  const [custom, setCustom] = useState(Boolean(initialValue && !options.includes(initialValue)));
  useEffect(() => {
    setCustom(Boolean(initialValue && !options.includes(initialValue)));
  }, [initialValue, resetKey, options]);

  return (
    <div className="space-y-1.5">
      <Select value={custom ? 'Other' : value} disabled={disabled} onValueChange={(name) => {
        setCustom(name === 'Other');
        onChange(name === 'Other' ? '' : name);
      }}>
        <SelectTrigger id={id} className="h-9 gap-3 text-xs font-medium" aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined}>
          {Icon && <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />}
          <span className="flex-1 text-left"><SelectValue placeholder={`Select ${label.toLowerCase()}`} /></span>
        </SelectTrigger>
        <SelectContent>{options.filter((name) => name !== 'Other').map((name) => <SelectItem key={name} value={name} className="text-xs">{name}</SelectItem>)}<SelectItem value="Other" className="text-xs">Other</SelectItem></SelectContent>
      </Select>
      {custom && <div className="space-y-1.5">
        <Label htmlFor={`${id}-custom`} className="text-xs">Custom {label.toLowerCase()} <span className="text-destructive">*</span></Label>
        <Input id={`${id}-custom`} className="h-9 text-xs md:text-xs" placeholder={`Enter custom ${label.toLowerCase()}`} value={value} disabled={disabled} required onChange={(event) => onChange(event.target.value)} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} />
      </div>}
    </div>
  );
}

