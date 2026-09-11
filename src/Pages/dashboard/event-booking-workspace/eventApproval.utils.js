export const approvalStatuses = ['Pending', 'Approved', 'Change Requested', 'Ready to Finalise'];

export const approvalTypes = ['Decor', 'Catering', 'Visual Preference', 'Guest Planning', 'Event Plan', 'Logistics', 'Hospitality', 'Other'];

export const approvalStatusTone = (status) => ({
  Approved: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  Pending: 'border-orange-200 bg-orange-50 text-orange-700',
  'Change Requested': 'border-rose-200 bg-rose-50 text-rose-700',
  'Ready to Finalise': 'border-blue-200 bg-blue-50 text-blue-700',
}[status] || 'border-slate-200 bg-slate-50 text-slate-700');
