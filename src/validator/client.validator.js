import * as yup from "yup";

const objectIdRegex = /^[a-fA-F0-9]{24}$/;
const phoneRegex = /^[0-9]{10}$/;
const gstInRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const panNoRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

export const clientGenders = ["male", "female"];
export const clientLeadSources = ["Website", "Instagram", "Whatsapp", "Call"];
export const clientDecorPreferences = [
    "Need D I V Y A M® Guidance",
    "Traditional Royal Indian Decor",
    "Elegant Floral / Pastel Decor",
    "Heritage / Palace Theme Decor",
    "Modern Minimal Luxury Decor",
    "Custom Theme / To Be Discussed",
];
export const clientCateringPreferences = [
    "Pure Vegetarian",
    "Jain",
    "Satvik",
    "No Onion-No Garlic",
    "Regional Cuisine",
    "Family-Specific",
    "Not Sure Yet",
];
export const clientLeadStatuses = [
    "New",
    "Contacted",
    "Qualified",
    "Consultation Scheduled",
    "Proposal Pending",
    "Proposal Sent",
    "Follow-up Due",
    "Negotiation",
    "Booked",
    "Lost",
];
export const clientProposalStatuses = ["Pending", "Sent"];
export const clientTaskStatuses = ["Pending", "Completed", "Upcoming", "In Progress"];

const emptyToNull = (value, originalValue) => {
    return originalValue === "" ? null : value;
};

const emptyToUndefined = (value, originalValue) => {
    return originalValue === "" ? undefined : value;
};

const objectIdSchema = yup
    .string()
    .trim()
    .matches(objectIdRegex, "Must be a valid ObjectId");

const nullableObjectIdSchema = objectIdSchema
    .nullable()
    .transform(emptyToNull);

const phoneSchema = yup
    .string()
    .trim()
    .matches(phoneRegex, "Phone number must be exactly 10 digits");

const optionalNullableString = (max, message) => {
    let schema = yup
        .string()
        .nullable()
        .transform(emptyToNull)
        .trim();

    if (max) {
        schema = schema.max(max, message || `Must be at most ${max} characters`);
    }

    return schema;
};

const optionalNullableDate = yup
    .date()
    .nullable()
    .transform(emptyToNull);

const optionalNumber = yup
    .number()
    .transform(emptyToUndefined)
    .integer("Must be an integer")
    .min(0, "Must be at least 0");

export const ClientFollowupSchema = yup.object({
    date: yup.date().transform(emptyToUndefined),
    note: optionalNullableString(1000, "Note must be at most 1000 characters"),
    employeeId: nullableObjectIdSchema,
});

export const ClientTaskSchema = yup.object({
    task: optionalNullableString(500, "Task must be at most 500 characters"),
    assignedTo: nullableObjectIdSchema,
    dueDate: optionalNullableDate,
    status: yup
        .string()
        .oneOf(clientTaskStatuses, "Invalid task status"),
});

const customerFields = (requiredFields = true) => {
    const fields = {
        name: yup
            .string()
            .trim()
            .min(2, "Name must be at least 2 characters")
            .max(100, "Name must be at most 100 characters"),

        profileImage: yup
            .string()
            .nullable()
            .transform(emptyToNull)
            .trim()
            .url("Profile image must be a valid URL"),

        email: yup
            .string()
            .nullable()
            .transform(emptyToNull)
            .trim()
            .lowercase()
            .email("Invalid email address"),

        phone: phoneSchema,

        alternatePhone: phoneSchema
            .nullable()
            .transform(emptyToNull),

        gender: yup
            .string()
            .nullable()
            .transform(emptyToNull)
            .oneOf([...clientGenders, null], "Invalid gender"),

        address: optionalNullableString(500, "Address must be at most 500 characters"),

        pincode: yup
            .string()
            .nullable()
            .transform(emptyToNull)
            .trim()
            .matches(/^[0-9]{6}$/, {
                message: "Pincode must be exactly 6 digits",
                excludeEmptyString: true,
            }),

        dob: optionalNullableDate,

        verified: yup.boolean(),

        gstIn: yup
            .string()
            .nullable()
            .transform(emptyToNull)
            .trim()
            .uppercase()
            .matches(gstInRegex, {
                message: "GSTIN is not in the correct format",
                excludeEmptyString: true,
            }),

        panNo: yup
            .string()
            .nullable()
            .transform(emptyToNull)
            .trim()
            .uppercase()
            .matches(panNoRegex, {
                message: "PAN number is not in the correct format",
                excludeEmptyString: true,
            }),

        quotation: yup.array().of(objectIdSchema),
        checklist: yup.array().of(objectIdSchema),
        paymentId: yup.array().of(objectIdSchema),

        assignedEmployee: nullableObjectIdSchema,
        eventDate: optionalNullableDate,
        city: optionalNullableString(100, "City must be at most 100 characters"),
        guests: optionalNumber,
        functions: optionalNumber,

        leadSource: yup
            .string()
            .nullable()
            .transform(emptyToNull)
            .oneOf([...clientLeadSources, null], "Invalid lead source"),

        eventTitle: optionalNullableString(200, "Event title must be at most 200 characters"),
        eventType: optionalNullableString(100, "Event type must be at most 100 characters"),
        venue: optionalNullableString(200, "Venue must be at most 200 characters"),
        budgetRange: optionalNullableString(100, "Budget range must be at most 100 characters"),

        decorPreference: yup
            .string()
            .oneOf(clientDecorPreferences, "Invalid decor preference"),

        cateringPreference: yup
            .string()
            .oneOf(clientCateringPreferences, "Invalid catering preference"),

        followup: yup.array().of(ClientFollowupSchema),
        clientTask: yup.array().of(ClientTaskSchema),
        documents: yup.array().of(yup.string().trim()),

        leadStatus: yup
            .string()
            .oneOf(clientLeadStatuses, "Invalid lead status"),

        proposalStatus: yup
            .string()
            .oneOf(clientProposalStatuses, "Invalid proposal status"),

        proposalAmount: optionalNullableString(100, "Proposal amount must be at most 100 characters"),
        proposalSentDate: optionalNullableDate,
    };

    if (!requiredFields) {
        return fields;
    }

    return {
        ...fields,
        name: fields.name.required("Name is required"),
        phone: fields.phone.required("Phone number is required"),
    };
};

export const createCustomerSchema = () => yup.object(customerFields());

export const CustomerSchema = createCustomerSchema();

export const createCustomerUpdateSchema = () =>
    yup
        .object(customerFields(false))
        .test(
            "at-least-one-field",
            "At least one field is required",
            (value) => Boolean(value && Object.keys(value).some((key) => value[key] !== undefined))
        );

export const CustomerUpdateSchema = createCustomerUpdateSchema();
