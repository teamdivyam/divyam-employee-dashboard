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

export const expenseFormSchema = Joi.object({
  expenseName: Joi.string().trim().required().messages({ "string.empty": "Expense name is required", "any.required": "Expense name is required" }),
  expenseDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required().messages({ "string.empty": "Expense date is required", "string.pattern.base": "Enter a valid expense date", "any.required": "Expense date is required" }),
  monthPeriod: Joi.string().pattern(/^\d{4}-(0[1-9]|1[0-2])$/).required(),
  expenseFor: Joi.string().valid(...EXPENSE_FOR_OPTIONS.slice(1)).required().messages({ "any.only": "Select what this expense is for", "string.empty": "Expense for is required" }),
  linkedTo: Joi.string().trim().allow(""),
  category: Joi.string().valid(...CATEGORY_OPTIONS.slice(1)).allow("").messages({ "any.only": "Select a valid category" }),
  paymentSource: Joi.string().valid(...PAYMENT_SOURCE_OPTIONS.slice(1)).required().messages({ "any.only": "Select a payment source", "string.empty": "Payment source is required" }),
  expenseAmount: Joi.number().greater(0).required().messages({ "number.base": "Enter a valid expense amount", "number.greater": "Expense amount must be greater than zero", "any.required": "Expense amount is required" }),
  paidTo: Joi.string().trim().allow(""),
  businessPurpose: Joi.string().trim().allow(""),
  supportingNote: Joi.string().trim().allow(""),
  attachments: attachmentSchema,
  status: Joi.string().valid("Draft", "Pending Finance Review").optional(),
});
