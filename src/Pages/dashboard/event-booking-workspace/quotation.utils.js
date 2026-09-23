import { addDays, format } from 'date-fns';
import * as yup from 'yup';
const text = (max) => yup.string().trim().required('This field is required.').max(max);
const isoDate = () => text(30).test('iso-date', 'Enter a valid date.', (value) => /^\d{4}-\d{2}-\d{2}$/.test(value || '') && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value);
const ids = () => yup.array().of(yup.string().matches(/^[a-f\d]{24}$/i)).min(1, 'Select at least one option.').max(100).required();
export const quotationSchema = yup.object({
  quotationTitle: text(200), quotationType: text(100), issueDate: isoDate(),
  validUntil: isoDate().test('date', 'Valid until must be on or after issue date.', function (value) { return value >= this.parent.issueDate; }),
  functions: ids(), services: ids(), scope: text(1000),
  lineItems: yup.array().of(yup.object({ item: text(200), appliesTo: ids(), quantity: yup.number().typeError('Enter a quantity.').positive().max(1000000).required(), unit: text(50), rate: yup.number().typeError('Enter a rate.').min(0).max(100000000).required() })).min(1).max(100).required(),
  discount: yup.object({ type: yup.string().oneOf(['Percentage', 'Fixed']).required(), value: yup.number().typeError('Enter a discount.').min(0).max(100000000).required() }),
  gstRate: yup.number().typeError('Enter a GST rate.').min(0).max(100).required(),
  paymentTerms: text(5000), inclusions: text(5000), exclusions: yup.string().trim().max(5000), specialTerms: yup.string().trim().max(5000),
  pdfOptions: yup.object({ showItemWiseRates: yup.boolean(), showTermsAndConditions: yup.boolean() }),
});
export const roundMoney = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;
export function quotationPrice(form) {
  const subtotal = roundMoney((form.lineItems || []).reduce((sum, row) => sum + roundMoney(Number(row.quantity || 0) * Number(row.rate || 0)), 0));
  const discountAmount = roundMoney(form.discount?.type === 'Percentage' ? subtotal * Number(form.discount.value || 0) / 100 : Number(form.discount?.value || 0));
  const taxableValue = roundMoney(subtotal - discountAmount);
  const gstAmount = roundMoney(taxableValue * Number(form.gstRate || 0) / 100);
  return { subtotal, discountAmount, taxableValue, gstAmount, finalQuotationValue: roundMoney(taxableValue + gstAmount) };
}
export const emptyLine = () => ({ item: '', appliesTo: [], quantity: 1, unit: 'Pax', rate: 0 });
export function quotationForm(record) {
  return { quotationTitle: record?.quotationTitle || '', quotationType: record?.quotationType || 'Main Booking',
    issueDate: record?.issueDate?.slice(0, 10) || format(new Date(), 'yyyy-MM-dd'), validUntil: record?.validUntil?.slice(0, 10) || format(addDays(new Date(), 7), 'yyyy-MM-dd'),
    functions: record?.functions || [], services: record?.services || [], scope: record?.scope || '',
    lineItems: record?.lineItems?.map(({ item, appliesTo, quantity, unit, rate }) => ({ item, appliesTo, quantity, unit, rate })) || [emptyLine()],
    discount: record?.discount || { type: 'Percentage', value: 0 }, gstRate: record?.gstRate ?? 18,
    paymentTerms: record ? record.paymentTerms || '' : '40% advance, 40% before event, 20% within 7 days after event.',
    inclusions: record ? record.inclusions || '' : 'All items mentioned in the quotation, installation, execution and on-site support.',
    exclusions: record ? record.exclusions || '' : 'Any item not specifically mentioned in the quotation.',
    specialTerms: record ? record.specialTerms || '' : 'Custom requirements, if any, can be discussed separately.',
    pdfOptions: { showItemWiseRates: true, showTermsAndConditions: true, ...record?.pdfOptions },
  };
}
export function quotationPatch(before, after) {
  return Object.fromEntries(Object.entries(after).filter(([key, value]) => JSON.stringify(before[key]) !== JSON.stringify(value)));
}
