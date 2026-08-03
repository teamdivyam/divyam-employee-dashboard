import * as yup from 'yup';

const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;
const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

export const ALLOWANCE_REQUEST_STATUS = Object.freeze({
  PENDING_FINANCE_REVIEW: 'Pending Finance Review',
  CLARIFICATION_REQUESTED: 'Clarification Requested',
  PENDING_ADMIN_APPROVAL: 'Pending Admin Approval',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
  APPLIED: 'Applied',
});

export const ALLOWANCE_FINANCE_RECOMMENDATION = Object.freeze({
  PENDING: 'Pending',
  RECOMMENDED: 'Recommended',
  NOT_RECOMMENDED: 'Not Recommended',
});

export const PAYROLL_REQUEST_ATTACHMENT_RULES = Object.freeze({
  maxFiles: 5,
  maxFileSize: 5 * 1024 * 1024,
  acceptedMimeTypes: ['image/jpeg', 'image/png', 'application/pdf'],
});

const payrollAttachmentSchema = yup
  .mixed()
  .test(
    'file-type',
    'Only JPG, PNG, and PDF files are allowed',
    (file) => !file || PAYROLL_REQUEST_ATTACHMENT_RULES.acceptedMimeTypes.includes(file.type),
  )
  .test(
    'file-size',
    'Each attachment must be 5 MB or smaller',
    (file) => !file || file.size <= PAYROLL_REQUEST_ATTACHMENT_RULES.maxFileSize,
  );

const allowanceAttachmentsSchema = yup
  .array()
  .of(payrollAttachmentSchema)
  .max(PAYROLL_REQUEST_ATTACHMENT_RULES.maxFiles, 'A maximum of 5 attachments is allowed')
  .default([]);

export const createAllowanceRequestSchema = yup.object({
  requestMonth: yup
    .string()
    .required('Request month is required')
    .matches(MONTH_PATTERN, 'Request month must use YYYY-MM format'),
  requestedAmount: yup
    .number()
    .transform((value, originalValue) => (originalValue === '' ? undefined : value))
    .typeError('Requested amount must be a number')
    .moreThan(0, 'Requested amount must be greater than zero')
    .max(100000000, 'Requested amount cannot exceed 100000000')
    .required('Requested amount is required'),
  reason: yup
    .string()
    .trim()
    .min(3, 'Reason must contain at least 3 characters')
    .max(2000, 'Reason cannot exceed 2000 characters')
    .required('Reason is required'),
  supportingNote: yup
    .string()
    .trim()
    .max(2000, 'Supporting note cannot exceed 2000 characters')
    .nullable()
    .default(null),
  attachments: allowanceAttachmentsSchema,
});

export const allowanceRequestFiltersSchema = yup.object({
  requestMonth: yup
    .string()
    .required('Request month is required')
    .matches(MONTH_PATTERN, 'Request month must use YYYY-MM format'),
  status: yup
    .string()
    .oneOf([...Object.values(ALLOWANCE_REQUEST_STATUS), '', null])
    .nullable(),
  page: yup.number().integer().min(1).default(1),
  limit: yup.number().integer().min(1).max(100).default(20),
});

export const allowanceClarificationResponseSchema = yup.object({
  requestId: yup
    .string()
    .matches(OBJECT_ID_PATTERN, 'Invalid request ID')
    .required('Request ID is required'),
  clarificationId: yup
    .string()
    .matches(OBJECT_ID_PATTERN, 'Invalid clarification ID')
    .required('Clarification ID is required'),
  response: yup
    .string()
    .trim()
    .min(3, 'Clarification response must contain at least 3 characters')
    .max(2000, 'Clarification response cannot exceed 2000 characters')
    .required('Clarification response is required'),
  attachments: allowanceAttachmentsSchema,
});

export const allowanceRequestIdSchema = yup.object({
  requestId: yup
    .string()
    .matches(OBJECT_ID_PATTERN, 'Invalid request ID')
    .required('Request ID is required'),
});

export function canDeleteAllowanceRequest(request) {
  return request?.status === ALLOWANCE_REQUEST_STATUS.PENDING_FINANCE_REVIEW
    && request?.financeReview?.recommendation === ALLOWANCE_FINANCE_RECOMMENDATION.PENDING;
}

export function getOpenAllowanceClarification(request) {
  return request?.clarificationHistory?.find((item) => item.status === 'Open') || null;
}

export function getAllowanceApiErrorMessage(error, fallback = 'Unable to process the allowance request') {
  const message = error?.response?.data?.message
    || error?.response?.data?.msg
    || error?.message
    || fallback;

  return String(message).split('|')[0].trim() || fallback;
}
