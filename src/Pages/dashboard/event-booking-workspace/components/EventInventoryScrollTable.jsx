/* eslint-disable react/prop-types */
import { Children, cloneElement, useCallback, useRef } from 'react';
import { Table, TableHeader } from './EventTable';

// Native vertical stickiness; only horizontal scrolling is synchronized.
export default function EventInventoryScrollTable({ children, className }) {
  const headingRef = useRef(null);
  const containerRef = useCallback((container) => {
    const eventHeader = container?.closest('.crm-page')?.firstElementChild;
    if (!eventHeader) return;
    const update = () => container.style.setProperty(
      '--event-inventory-header-offset', `${eventHeader.getBoundingClientRect().height}px`,
    );
    update();
    const observer = new ResizeObserver(update);
    observer.observe(eventHeader);
    return () => observer.disconnect();
  }, []);
  const elements = Children.toArray(children);
  const heading = elements.find((child) => child.type === TableHeader);
  const columns = elements.find((child) => child.type === 'colgroup');

  return (
    <div ref={containerRef} className="min-w-0 max-w-full">
      <div ref={headingRef} className="sticky top-[var(--event-inventory-header-offset,0px)] z-10 overflow-hidden bg-muted [&>div]:overflow-hidden">
        <Table aria-hidden="true" className={className}>{columns}{heading}</Table>
      </div>
      <div onScrollCapture={(event) => {
        const viewport = headingRef.current?.firstElementChild;
        if (viewport) viewport.scrollLeft = event.target.scrollLeft;
      }}>
        <Table className={className}>
          {elements.map((child) => child === heading
            // Keep accessible column labels on the data table without a second visible row.
            ? cloneElement(child, { className: 'sr-only' })
            : child)}
        </Table>
      </div>
    </div>
  );
}
