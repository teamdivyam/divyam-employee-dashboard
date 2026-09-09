import Joi from "joi";
import {
  CATEGORY_OPTIONS,
  EXPENSE_FOR_OPTIONS,
  PAYMENT_SOURCE_OPTIONS,
} from "./expense.constants";

const MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024;
export const ALLOWED_ATTACHMENT_TYPES = ["image/png", "image/jpg", "image/jpeg", "image/heif", "image/heic"];

export const attachmentSchema = Joi.array()
  .items(Joi.any())
  .max(10)
  .custom((files, helpers) => {
    const oversizedFile = files.find((file) => file.size > MAX_ATTACHMENT_SIZE);
    if (oversizedFile) return helpers.message({ custom: `${oversizedFile.name} exceeds the 5 MB file limit` });
    const invalidFile = files.find((file) => !ALLOWED_ATTACHMENT_TYPES.includes(file.type));
    if (invalidFile) return helpers.message({ custom: `${invalidFile.name} is not a supported image format` });
    return files;
  })
  .messages({ "array.max": "A maximum of 10 attachments is allowed" });

const objectId = Joi.string().trim().hex().length(24);
const optionalText = Joi.string().trim().allow("", null);

export const expenseFormSchema = Joi.object({
  expenseName: Joi.string().trim().required().messages({ "string.empty": "Expense name is required", "any.required": "Expense name is required" }),
  expenseDate: Joi.date().iso().required().messages({ "date.base": "Enter a valid expense date", "date.format": "Enter a valid expense date", "any.required": "Expense date is required" }),
  monthPeriod: Joi.string().pattern(/^\d{4}-(0[1-9]|1[0-2])$/).required(),
  expenseFor: Joi.string().valid(...EXPENSE_FOR_OPTIONS.slice(1)).required().messages({ "any.only": "Select what this expense is for", "string.empty": "Expense for is required" }),
  linkedTo: Joi.when("expenseFor", {
    is: Joi.valid("Event", "Client"),
    then: objectId.required().messages({ "string.empty": "Select an event or client", "string.hex": "Select a valid event or client", "string.length": "Select a valid event or client", "any.required": "Select an event or client" }),
    otherwise: Joi.valid(null, ""),
  }),
  advanceExpense: Joi.when("paymentSource", {
    is: "Office Expense Advance",
    then: objectId.empty("").allow(null),
    otherwise: Joi.valid(null, ""),
  }),
  category: Joi.string().valid(...CATEGORY_OPTIONS.slice(1)).empty("").messages({ "any.only": "Select a valid category" }),
  paymentSource: Joi.string().valid(...PAYMENT_SOURCE_OPTIONS.slice(1)).required().messages({ "any.only": "Select a payment source", "string.empty": "Payment source is required" }),
  expenseAmount: Joi.number().min(0.01).required().messages({ "number.base": "Enter a valid expense amount", "number.min": "Expense amount must be at least 0.01", "any.required": "Expense amount is required" }),
  paidTo: optionalText,
  businessPurpose: optionalText,
  supportingNote: optionalText,
  attachments: attachmentSchema,
  status: Joi.string().valid("Draft").optional(),
});

export const editExpenseFormSchema = expenseFormSchema.keys({
  status: Joi.string().valid("Draft", "Pending Finance Review").optional(),
});
