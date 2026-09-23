/* eslint-disable react/prop-types */
import { CalendarDays, CheckCircle2, ClipboardCheck, ImageIcon, UserRound } from 'lucide-react';
import TabComp from '@components/components/tab-comp';
import styles from './EventNestedTabs.module.css';

const tabs = [
  { value: 'functions', label: 'Functions', icon: CalendarDays },
  { value: 'services', label: 'Services', icon: ClipboardCheck },
  { value: 'guests', label: 'Guests & Hospitality', icon: UserRound },
  { value: 'preferences', label: 'Visual Preferences', icon: ImageIcon },
  { value: 'approvals', label: 'Client Approvals', icon: CheckCircle2 },
];

export default function EventPlanTabs({ activePlan, onSelect }) {
  return <TabComp tabs={tabs} value={activePlan} onValueChange={onSelect} className={styles.nestedTabs} variant="detail" distribution="content" density="compact" ariaLabel="Event plan sections" />;
}
