/* eslint-disable react/prop-types */
import { useContext } from 'react';
import { createPortal } from 'react-dom';
import { EventSummaryContext } from './EventSummaryContext';

export default function EventSummarySlot({ children }) {
  const target = useContext(EventSummaryContext);
  if (target === undefined) return children;
  return target ? createPortal(children, target) : null;
}
