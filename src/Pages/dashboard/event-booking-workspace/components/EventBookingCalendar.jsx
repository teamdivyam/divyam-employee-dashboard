export default function BookingCalendar({ bookings, month, onOpen }) {
  const leading = new Date(month.year, month.month - 1, 1).getDay();
  const totalDays = new Date(month.year, month.month, 0).getDate();
  const cells = Array.from({ length: leading + totalDays }, (_, index) => index < leading ? null : index - leading + 1);

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="grid grid-cols-7 border-b border-border bg-muted/50">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="px-2 py-2 text-center text-[11px] font-semibold text-muted-foreground">{day}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((day, index) => {
          const items = day ? bookings.filter((booking) => {
            const date = new Date(booking.eventDate);
            return date.getFullYear() === month.year && date.getMonth() === month.month - 1 && date.getDate() === day;
          }) : [];
          return (
            <div key={`${day || 'blank'}-${index}`} className="min-h-28 border-b border-r border-border p-1.5">
              {day ? <p className="mb-1 text-right text-[10px] text-muted-foreground">{day}</p> : null}
              {items.slice(0, 3).map((booking) => (
                <button
                  key={booking._id}
                  type="button"
                  onClick={() => onOpen(booking)}
                  className="mb-1 block w-full truncate rounded border border-blue-200 bg-blue-50 px-1.5 py-1 text-left text-[10px] font-medium text-blue-700 hover:bg-blue-100"
                >
                  {booking.customer?.name || booking.eventName}
                </button>
              ))}
              {items.length > 3 ? <p className="text-[9px] text-muted-foreground">+{items.length - 3} more</p> : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
