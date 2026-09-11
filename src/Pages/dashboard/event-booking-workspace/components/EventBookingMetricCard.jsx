export default function MetricCard({ label, value, icon: Icon, tone, onOpen }) {
  const iconStyle = {
    blue: { backgroundColor: '#eaf3ff', color: '#0867e8' },
    green: { backgroundColor: '#ecf9f2', color: '#109a52' },
    amber: { backgroundColor: '#fff3e8', color: '#ff6b1a' },
    violet: { backgroundColor: '#f2eaff', color: '#6d28d9' },
    red: { backgroundColor: '#fff0f1', color: '#ef233c' },
  }[tone];

  return (
    <button type="button" className="event-booking-metric-card group text-left outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={onOpen}>
      <span className="admin-task-metric-icon" style={iconStyle}>
        <Icon aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="admin-task-metric-label">{label}</p>
        <p className="event-booking-metric-value">{value ?? 0}</p>
      </div>
    </button>
  );
}
