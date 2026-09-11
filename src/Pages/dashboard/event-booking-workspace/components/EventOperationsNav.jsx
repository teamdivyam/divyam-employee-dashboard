/* eslint-disable react/prop-types */
import { Boxes, ClipboardList, ContactRound, Store, Truck, UsersRound } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

const operationTabs = [
  { key: 'tasks', label: 'Team & Tasks', icon: UsersRound, tone: 'bg-blue-50 text-blue-700' },
  { key: 'vendors', label: 'Vendors', icon: Store, tone: 'bg-violet-50 text-violet-700' },
  { key: 'inventory', label: 'Inventory', icon: Boxes, tone: 'bg-cyan-50 text-cyan-700' },
  { key: 'logistics', label: 'Logistics', icon: Truck, tone: 'bg-orange-50 text-orange-700' },
  { key: 'run-sheet', label: 'Run Sheet & Checklist', icon: ClipboardList, tone: 'bg-pink-50 text-pink-700' },
  { key: 'roles', label: 'Roles & Responsibilities', icon: ContactRound, tone: 'bg-teal-50 text-teal-700' },
];

export default function EventOperationsNav({ active }) {
  const navigate = useNavigate();
  const { eventId } = useParams();

  const select = (key, label) => {
    if (key === 'tasks') navigate(`/dashboard/assigned-events/${eventId}/operations`);
    else if (key === 'vendors') navigate(`/dashboard/assigned-events/${eventId}/operations/vendors`);
    else if (key === 'inventory') navigate(`/dashboard/assigned-events/${eventId}/operations/inventory`);
    else if (key === 'logistics') navigate(`/dashboard/assigned-events/${eventId}/operations/logistics`);
    else if (key === 'run-sheet') navigate(`/dashboard/assigned-events/${eventId}/operations/run-sheet`);
    else if (key === 'roles') navigate(`/dashboard/assigned-events/${eventId}/operations/roles-responsibilities`);
    else toast.info(`${label} will be available in Operations.`);
  };

  return (
    <nav className="flex min-w-0 gap-0.5 overflow-x-auto pb-0.5" aria-label="Event operations sections">
      {operationTabs.map(({ key, label, icon: Icon, tone }) => (
        <button
          key={key}
          type="button"
          onClick={() => select(key, label)}
          className={`flex min-w-max items-center justify-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${key === active ? tone : 'bg-card text-foreground hover:bg-muted/60'}`}
        >
          <Icon className={`h-[18px] w-[18px] ${key === active ? '' : tone.split(' ').at(-1)}`} />
          {label}
        </button>
      ))}
    </nav>
  );
}
