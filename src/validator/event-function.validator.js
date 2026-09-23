import * as yup from 'yup';

export const FUNCTION_STATUSES = ['Planned', 'Confirmed', 'In Progress', 'Completed', 'Cancelled'];
const nullableDate = yup.string().nullable().transform((value) => value === '' ? null : value)
  .test('date', 'Enter a valid date', (value) => value == null || (/^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value));
export const functionSchema = yup.object({
  name: yup.string().trim().min(1, 'Function name is required'),
  fromDate: nullableDate,
  toDate: nullableDate,
  startTime: yup.string().nullable(),
  endTime: yup.string().nullable(),
  venue: yup.string().trim().nullable(),
  guestCount: yup.number().nullable().transform((value, original) => original === '' ? null : value).typeError('Enter a valid guest count').min(0, 'Guest count cannot be negative'),
  linkedServices: yup.array().of(yup.string().required()).optional(),
  status: yup.string().oneOf(FUNCTION_STATUSES, 'Select a valid status'),
  notes: yup.string().trim().nullable(),
}).noUnknown();

const dateInput = (value) => value ? String(value).slice(0, 10) : '';
export const functionFormValues = (item = {}) => ({
  name: item.name || '',
  fromDate: dateInput(item.fromDate ?? item.date),
  toDate: dateInput(item.toDate),
  startTime: item.startTime ?? '',
  endTime: item.endTime ?? '',
  venue: item.venue ?? '',
  guestCount: item.guestCount ?? (item._id ? '' : 0),
  linkedServices: item.linkedServices || [],
  status: item.status || 'Planned',
  notes: item.notes ?? '',
});

export async function functionPayload(form, initial, editing) {
  const fields = editing
    ? Object.fromEntries(Object.entries(form).filter(([key, value]) => JSON.stringify(value) !== JSON.stringify(initial[key])))
    : form;
  if (!editing && !String(fields.name || '').trim()) {
    throw new yup.ValidationError('Function name is required', fields.name, 'name');
  }
  return functionSchema.validate(fields, { abortEarly: false, stripUnknown: true });
}
