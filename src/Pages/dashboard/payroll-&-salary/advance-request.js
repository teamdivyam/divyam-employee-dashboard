import * as yup from 'yup';

const PERIOD_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;
const OBJECT_ID_REGEX = /^[a-f\d]{24}$/i;

export const ADVANCE_REQUEST_STATUS = Object.freeze({
  PENDING_FINANCE_REVIEW: 'Pending Finance Review',
  CLARIFICATION_REQUESTED: 'Clarification Requested',
  PENDING_ADMIN_APPROVAL: 'Pending Admin Approval',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
  APPLIED: 'Applied',
});

export const FINANCE_RECOMMENDATION = Object.freeze({
  PENDING: 'Pending',
  RECOMMENDED: 'Recommended',
  NOT_RECOMMENDED: 'Not Recommended',
});

export const CLARIFICATION_STATUS = Object.freeze({
  OPEN: 'Open',
  RESPONDED: 'Responded',
  CLOSED: 'Closed',
});

export const ADVANCE_ATTACHMENT_RULES = Object.freeze({
  maxFiles: 5,
  maxFileSize: 5 * 1024 * 1024,
  acceptedMimeTypes: ['image/jpeg', 'image/png', 'application/pdf'],
});

const attachmentsSchema = yup
  .array()
  .of(
    yup
      .mixed()
      .test(
        'file-type',
        'Only JPG, PNG, and PDF files are allowed',
        (file) => !file || ADVANCE_ATTACHMENT_RULES.acceptedMimeTypes.includes(file.type),
      )
      .test(
        'file-size',
        'Each file must be 5 MB or smaller',
        (file) => !file || file.size <= ADVANCE_ATTACHMENT_RULES.maxFileSize,
      ),
  )
  .max(ADVANCE_ATTACHMENT_RULES.maxFiles, 'A maximum of 5 attachments is allowed')
  .default([]);

export const advanceRequestSchema = yup.object({
  requestMonth: yup
    .string()
    .required('Request month is required')
    .matches(PERIOD_REGEX, 'Request month must use YYYY-MM format'),
  requestedAmount: yup
    .number()
    .typeError('Requested amount must be a number')
    .moreThan(0, 'Requested amount must be greater than zero')
    .max(100000000, 'Requested amount is too large')
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
  attachments: attachmentsSchema,
});

export const advanceRequestFiltersSchema = yup.object({
  requestMonth: yup
    .string()
    .required('Request month is required')
    .matches(PERIOD_REGEX, 'Request month must use YYYY-MM format'),
  status: yup
    .string()
    .oneOf([...Object.values(ADVANCE_REQUEST_STATUS), '', null])
    .nullable(),
  page: yup.number().integer().min(1).default(1),
  limit: yup.number().integer().min(1).max(100).default(20),
});

export const clarificationResponseSchema = yup.object({
  requestId: yup
    .string()
    .matches(OBJECT_ID_REGEX, 'Invalid request ID')
    .required('Request ID is required'),
  clarificationId: yup
    .string()
    .matches(OBJECT_ID_REGEX, 'Invalid clarification ID')
    .required('Clarification ID is required'),
  response: yup
    .string()
    .trim()
    .min(3, 'Response must contain at least 3 characters')
    .max(2000, 'Response cannot exceed 2000 characters')
    .required('Clarification response is required'),
  attachments: attachmentsSchema,
});

export function canDeleteAdvanceRequest(request) {
  return request?.status === ADVANCE_REQUEST_STATUS.PENDING_FINANCE_REVIEW
    && request?.financeReview?.recommendation === FINANCE_RECOMMENDATION.PENDING;
}

export function getOpenClarification(request) {
  return request?.clarificationHistory?.find(
    (item) => item.status === CLARIFICATION_STATUS.OPEN,
  ) || null;
}

export function getApiErrorMessage(error, fallback = 'Something went wrong') {
  const message = error?.response?.data?.message
    || error?.response?.data?.msg
    || error?.message
    || fallback;

  return String(message).split('|')[0].trim() || fallback;
}
