const idOf = (value) => String(value?._id || value || '');

export const getBookingStatus = (booking) =>
  booking?.bookingStatus || 'Status not set';

export const getEventServiceName = (service) =>
  typeof service === 'string' ? service : service?.name || service?.service || '';

export const getEventServiceNames = (booking = {}) => {
  const values = [
    ...(booking.servicesRequired || []),
    ...(booking.servicesSelected || []).map(getEventServiceName),
  ].map((value) => String(value || '').trim()).filter(Boolean);
  return [...new Map(values.map((value) => [value.toLowerCase(), value])).values()];
};

export const normalizeEventFunction = (item = {}) => ({
  ...item,
  date: item.fromDate || item.date,
});

export const getEventGuestNeeds = (item = {}) => [...new Set([
  ...(item.hospitalityNeeds || []),
  ...(item.stayRequired ? ['Stay Required'] : []),
  ...(item.transportRequired ? ['Pickup'] : []),
  ...(item.isVip ? ['VIP'] : []),
  ...(item.specialRequirements ? [item.specialRequirements] : []),
])];

export const normalizeEventVisualPreference = (item = {}, functions = []) => ({
  ...item,
  title: item.preferenceTitle || item.title,
  category: item.preferenceCategory || item.category,
  likes: item.clientLikes ?? item.likes,
  imageUrl: item.image || item.imageUrl,
  functionName: functions.find((fn) => idOf(fn) === idOf(item.functionAppliesTo))?.name || item.functionName,
});

export const normalizeEventHospitalityRequirement = (item = {}) => ({
  ...item,
  requirement: item.requirementName || item.requirement,
  appliesToFunctions: item.functionAppliesTo || item.appliesToFunctions || [],
  guestSegment: item.guestSegments || item.guestSegment,
  owner: item.planningOwner || item.owner,
  status: item.planningStatus || item.status,
  details: item.specification || item.details,
  serviceStartAt: item.serviceWindowFromDate
    ? `${String(item.serviceWindowFromDate).slice(0, 10)}T${item.serviceWindowFromTime || '00:00'}`
    : item.serviceStartAt,
  serviceWindow: [String(item.serviceWindowToDate || '').slice(0, 10), item.serviceWindowToTime]
    .filter(Boolean).join(' ') || item.serviceWindow,
});

export const normalizeEventVehicle = (item = {}) => ({
  ...item,
  name: item.vehicleName ?? item.name,
  registrationNumber: item.registrationNo ?? item.registrationNumber,
  capacity: item.seatingCapacity ?? item.capacity,
  driverContact: item.driverContactNo ?? item.driverContact,
});

export const normalizeEventTransportAssignment = (item = {}) => ({
  ...item,
  origin: item.pickupLocatiion ?? item.origin,
  destination: item.dropLocation ?? item.destination,
  transferType: item.movementType ?? item.transferType,
  guestCount: item.guestTravelling ?? item.guestCount,
  scheduledAt: item.date && item.time
    ? `${String(item.date).slice(0, 10)}T${item.time}`
    : item.scheduledAt,
  notes: item.transportNote ?? item.notes,
  status: item.status || (item.vehicle ? 'Assigned' : 'Pending Assignment'),
});
