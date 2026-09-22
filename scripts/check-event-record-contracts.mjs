import assert from 'node:assert/strict';

import {
  getBookingStatus,
  getEventGuestNeeds,
  getEventServiceNames,
  normalizeEventHospitalityRequirement,
  normalizeEventTransportAssignment,
  normalizeEventVehicle,
  normalizeEventVisualPreference,
} from '../src/Pages/dashboard/event-booking-workspace/eventRecordAdapters.js';

assert.equal(getBookingStatus({ bookingStatus: 'Planning' }), 'Planning');
assert.deepEqual(getEventServiceNames({
  servicesRequired: ['Hospitality'],
  servicesSelected: [{ name: 'Catering' }, { service: 'Decor' }, { name: '' }],
}), ['Hospitality', 'Catering', 'Decor']);
assert.deepEqual(getEventGuestNeeds({ stayRequired: true, transportRequired: true, isVip: true, specialRequirements: 'Wheelchair' }), ['Stay Required', 'Pickup', 'VIP', 'Wheelchair']);

const preference = normalizeEventVisualPreference({ preferenceTitle: 'Stage', preferenceCategory: 'Decor', clientLikes: 'Warm lights', image: 'https://example.com/stage.jpg', functionAppliesTo: 'f1' }, [{ _id: 'f1', name: 'Reception' }]);
assert.deepEqual([preference.title, preference.category, preference.likes, preference.imageUrl, preference.functionName], ['Stage', 'Decor', 'Warm lights', 'https://example.com/stage.jpg', 'Reception']);

const hospitality = normalizeEventHospitalityRequirement({ requirementName: 'Welcome Desk', functionAppliesTo: ['f1'], guestSegments: 'All Guests', planningStatus: 'In Planning', specification: 'Near entry' });
assert.deepEqual([hospitality.requirement, hospitality.appliesToFunctions, hospitality.guestSegment, hospitality.status, hospitality.details], ['Welcome Desk', ['f1'], 'All Guests', 'In Planning', 'Near entry']);

const vehicle = normalizeEventVehicle({ vehicleName: 'Innova', registrationNo: 'UP70AB1234', seatingCapacity: 7, driverContactNo: '9999999999' });
assert.deepEqual([vehicle.name, vehicle.registrationNumber, vehicle.capacity, vehicle.driverContact], ['Innova', 'UP70AB1234', 7, '9999999999']);

const transport = normalizeEventTransportAssignment({ pickupLocatiion: 'Airport', dropLocation: 'Hotel', movementType: 'Pickup', guestTravelling: 4, date: '2026-09-22', time: '10:30' });
assert.deepEqual([transport.origin, transport.destination, transport.transferType, transport.guestCount, transport.scheduledAt], ['Airport', 'Hotel', 'Pickup', 4, '2026-09-22T10:30']);

console.log('Event record contracts are compatible with current and legacy API fields.');
