/* eslint-disable react/prop-types */
import { BedDouble, CarFront, ConciergeBell, UserRound, UsersRound } from 'lucide-react';

const tabs = [
  { key: 'counts', label: 'Guest Counts', icon: UsersRound },
  { key: 'list', label: 'Guest List', icon: UserRound },
  { key: 'accommodation', label: 'Accommodation', icon: BedDouble },
  { key: 'transport', label: 'Transport', icon: CarFront },
  { key: 'hospitality', label: 'Hospitality', icon: ConciergeBell },
];

export default function EventGuestsNav({ active, onSelect, actions }) {
  return (
    <div className="flex flex-col items-start gap-3 border-b border-border px-4 py-2.5 2xl:flex-row 2xl:items-center 2xl:justify-between">
      <nav className="flex min-w-0 flex-1 gap-0 overflow-x-auto" aria-label="Guest planning sections">
        {tabs.map(({ key, label, icon: Icon }) => <button key={key} type="button" onClick={() => onSelect(key, label)} className={`flex min-w-max items-center gap-2 border-b-2 px-2.5 py-2 text-xs font-semibold ${key === active ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-foreground hover:text-emerald-700'}`}><Icon className="h-4 w-4" />{label}</button>)}
      </nav>
      {actions}
    </div>
  );
}
