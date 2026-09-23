import { object, string, number } from 'yup';

const objectId = string().matches(/^[a-f\d]{24}$/i, 'Select a valid event record.');
export const eventTransportSchema = object({
  guest: objectId.required('Select a guest / family.'),
  guestTravelling: number().typeError('Enter the number of guests travelling.').integer('Guests travelling must be a whole number.').positive('At least one guest must travel.').required().test('member-count', 'Guests travelling cannot exceed the selected guest’s total members.', function (value) { return value <= Number(this.options.context?.memberCount || 0); }),
  movementType: string().trim().required('Enter a movement type.'),
  linkedFunction: objectId.nullable().default(null),
  pickupLocatiion: string().trim().required('Enter the pickup location.'),
  dropLocation: string().trim().required('Enter the drop location.'),
  date: string().required('Select a date.').test('calendar-date', 'Enter a valid date in YYYY-MM-DD format.', (value) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '') || value.startsWith('0000')) return false;
    const parsed = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
  }),
  time: string().required('Select a time.').matches(/^([01]\d|2[0-3]):[0-5]\d$/, 'Enter a valid time in HH:mm format.'),
  vehicle: objectId.nullable().default(null),
  transportNote: string().trim().nullable().max(200, 'Transport note cannot exceed 200 characters.'),
});

