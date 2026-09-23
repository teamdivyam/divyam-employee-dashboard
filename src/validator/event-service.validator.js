import * as yup from 'yup';
export const SERVICE_STATUSES = ['Client Confirmed', 'Under Discussion', 'Tentative'];
export const serviceIdOf = (value) => String(value?._id || value || '');
const objectId = yup.string().matches(/^[a-f\d]{24}$/i, 'Select a valid record');
const schema = yup.object({
  name: yup.string().trim().min(1, 'Service name is required'),
  scope: yup.string().trim().nullable(),
  assignedLead: objectId.nullable().transform((value) => value === '' ? null : value),
  linkedFunctions: yup.array().of(objectId.required()),
  status: yup.string().oneOf(SERVICE_STATUSES, 'Select a valid status'),
}).noUnknown();
export const serviceFormValues = (item = {}) => ({
  name: item.name ?? item.service ?? '',
  scope: item.scope ?? item.details ?? '',
  assignedLead: serviceIdOf(item.assignedLead),
  linkedFunctions: (item.linkedFunctions || []).map(serviceIdOf),
  status: item.status || 'Under Discussion',
});
export async function servicePayload(form, initial, editing) {
  const fields = editing ? Object.fromEntries(Object.entries(form).filter(([key, value]) => JSON.stringify(value) !== JSON.stringify(initial[key]))) : form;
  if (!editing && !String(fields.name || '').trim()) throw new yup.ValidationError('Service name is required', fields.name, 'name');
  return schema.validate(fields, { abortEarly: false, stripUnknown: true });
}
