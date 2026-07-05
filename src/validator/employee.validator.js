import * as yup from "yup";

const objectIdRegex = /^[a-fA-F0-9]{24}$/;
const phoneRegex = /^[0-9]{10}$/;

export const employeeDepartments = ["Event"];
export const employeeDesignations = ["Event_Manager", "Event_Staff"];
export const employeePermissions = [
    "Dashboard_Access",
    "Events_Bookings",
    "Client_CRM",
    "Documents",
    "Task_Management",
    "Reports_Analytics",
    "Finance_Accounts",
];
export const employeeStatuses = ["Active", "On_Leave", "Inactive"];

const emptyToNull = (value, originalValue) => {
    return originalValue === "" ? null : value;
};

const roleSchema = (roleIds = [], isRequired = true) => {
    let schema = yup
        .string()
        .trim()
        .matches(objectIdRegex, "Role must be a valid ObjectId");

    if (roleIds.length) {
        schema = schema.oneOf(roleIds, "Invalid role");
    }

    return isRequired ? schema.required("Role is required") : schema.optional();
};

const employeeFields = (roleIds = [], requiredFields = true) => {
    const fields = {
        name: yup
            .string()
            .trim()
            .min(2, "Name must be at least 2 characters")
            .max(100, "Name must be at most 100 characters"),

        phoneNo: yup
            .string()
            .matches(phoneRegex, "Phone number must be exactly 10 digits"),

        emergencyContactNo: yup
            .string()
            .nullable()
            .transform(emptyToNull)
            .matches(phoneRegex, {
                message: "Emergency contact number must be exactly 10 digits",
                excludeEmptyString: true,
            }),

        email: yup
            .string()
            .trim()
            .lowercase()
            .email("Invalid email address"),

        password: yup
            .string()
            .min(6, "Password must be at least 6 characters")
            .max(50, "Password must be at most 50 characters"),

        role: roleSchema(roleIds, requiredFields),

        department: yup
            .string()
            .oneOf(employeeDepartments, "Invalid department"),

        designation: yup
            .string()
            .oneOf(employeeDesignations, "Invalid designation"),

        joiningDate: yup
            .date()
            .typeError("Joining date is required"),

        address: yup
            .string()
            .nullable()
            .transform(emptyToNull)
            .trim()
            .max(500, "Address must be at most 500 characters"),

        permissions: yup
            .array()
            .of(yup.string().oneOf(employeePermissions, "Invalid permission"))
            .ensure(),

        status: yup
            .string()
            .oneOf(employeeStatuses, "Invalid status"),
    };

    if (!requiredFields) {
        return fields;
    }

    return {
        ...fields,
        name: fields.name.required("Name is required"),
        phoneNo: fields.phoneNo.required("Phone number is required"),
        email: fields.email.required("Email is required"),
        password: fields.password.required("Password is required"),
        department: fields.department.required("Department is required"),
        designation: fields.designation.required("Designation is required"),
        joiningDate: fields.joiningDate.required("Joining date is required"),
    };
};

export const createEmployeeSchema = (roleIds = []) =>
    yup.object(employeeFields(roleIds));

export const EmployeeSchema = createEmployeeSchema();

export const EmployeeLoginSchema = yup.object({
    email: yup
        .string()
        .trim()
        .lowercase()
        .email("Invalid email address")
        .required("Email is required"),
    password: yup.string().required("Password is required"),
});

export const createEmployeeUpdateSchema = (roleIds = []) =>
    yup
        .object({
            ...employeeFields(roleIds, false),
            password: yup
                .mixed()
                .test(
                    "password-forbidden",
                    "Password cannot be updated from employee update",
                    (value) => value === undefined
                ),
        })
        .test(
            "at-least-one-field",
            "At least one field is required",
            (value) => Boolean(value && Object.keys(value).some((key) => value[key] !== undefined))
        );

export const EmployeeUpdateSchema = createEmployeeUpdateSchema();

export const EmployeePasswordSchema = yup.object({
    password: yup
        .string()
        .min(6, "Password must be at least 6 characters")
        .max(50, "Password must be at most 50 characters")
        .required("Password is required"),
});

export const getEmployeeValidationSchema = (isEditMode, roleIds = []) =>
    isEditMode ? createEmployeeUpdateSchema(roleIds) : createEmployeeSchema(roleIds);
