import * as yup from "yup";

export const AddNewStockSchema = yup.object({
  name: yup
    .string()
    .trim()
    .required("Name is required")
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters"),

  category: yup
    .string()
    .required("Category is required")
    .oneOf(
      ["cooking", "dining", "serving", "decoration", "others"],
      "Please select a valid category"
    ),

  quantity: yup
    .number()
    .typeError("Quantity must be a number")
    .required("Quantity is required")
    .min(0, "Quantity cannot be negative")
    .integer("Quantity must be a whole number"),

  guestCapacity: yup
    .number()
    .typeError("Capacity must be a number")
    .nullable()
    .transform((value, originalValue) => (originalValue === "" ? null : value))
    .min(0, "Capacity cannot be negative")
    .test(
      "is-decimal",
      "Capacity can have up to 2 decimal places",
      (value) =>
        value === null ||
        value === undefined ||
        /^\d+(\.\d{1,2})?$/.test(value.toString())
    ),

  weightUnit: yup
    .string()
    .nullable()
    .transform((value) => (value === "" ? null : value))
    .test(
      "valid-unit",
      "Weight unit must be one of: kg, gram, or empty",
      (value) =>
        value === null ||
        value === undefined ||
        value === "" ||
        ["kg", "gram"].includes(value?.toLowerCase?.())
    ),

  sizeUnit: yup
    .string()
    .nullable()
    .transform((value) => (value === "" ? null : value))
    .test(
      "valid-unit",
      "Size unit must be one of: inch, cm, mm or empty",
      (value) =>
        value === null ||
        value === undefined ||
        value === "" ||
        ["inch", "cm", "mm"].includes(value?.toLowerCase?.())
    ),

  capacityUnit: yup
    .string()
    .nullable()
    .transform((value) => (value === "" ? null : value))
    .test(
      "valid-unit",
      "Capacity unit must be one of: ltr, ml",
      (value) =>
        value === null ||
        value === undefined ||
        value === "" ||
        ["ltr", "ml"].includes(value?.toLowerCase?.())
    ),

  weight: yup
    .string()
    .nullable()
    .transform((value) => (value === "" ? null : value))
    .max(20, "Weight cannot exceed 20 characters"),
  size: yup
    .string()
    .nullable()
    .transform((value) => (value === "" ? null : value))
    .max(50, "Size cannot exceed 20 characters"),
  capacity: yup
    .string()
    .nullable()
    .transform((value) => (value === "" ? null : value))
    .max(50, "Capacity cannot exceed 20 characters"),
});

export const AddNewStockVariantSchema = yup
  .object({
    parentStockId: yup
      .string()
      .nullable()
      .transform((value) => (value === "" ? null : value)),

    parentStockName: yup
      .string()
      .nullable()
      .transform((value) => (value === "" ? null : value))
      .max(100, "Parent stock name cannot exceed 100 characters"),

    parentStockCategory: yup
      .string()
      .nullable()
      .transform((value) => (value === "" ? null : value))
      .max(50, "Parent stock category cannot exceed 50 characters"),

    variantStockName: yup
      .string()
      .trim()
      .required("Variant name is required")
      .min(2, "Variant name must be at least 2 characters")
      .max(100, "Variant name cannot exceed 100 characters"),

    variantStockCategory: yup
      .string()
      .required("Variant category is required")
      .max(50, "Variant category cannot exceed 50 characters"),

    variantStockQuantity: yup
      .number()
      .typeError("Quantity must be a number")
      .required("Quantity is required")
      .min(0, "Quantity cannot be negative")
      .integer("Quantity must be a whole number"),

    variantStockWeightUnit: yup
      .string()
      .nullable()
      .transform((value) => (value === "" ? null : value))
      .test(
        "valid-unit",
        "Unit must be one of: kg, gram, or empty",
        (value) =>
          value === null ||
          value === undefined ||
          value === "" ||
          ["kg", "gram"].includes(value?.toLowerCase?.())
      ),

    variantStockSizeUnit: yup
      .string()
      .nullable()
      .transform((value) => (value === "" ? null : value))
      .test(
        "valid-unit",
        "Unit must be one of: inch, cm, mm, or empty",
        (value) =>
          value === null ||
          value === undefined ||
          value === "" ||
          ["inch", "cm", "mm"].includes(value?.toLowerCase?.())
      ),

    variantStockCapacityUnit: yup
      .string()
      .nullable()
      .transform((value) => (value === "" ? null : value))
      .test(
        "valid-unit",
        "Unit must be one of: ltr, ml, or empty",
        (value) =>
          value === null ||
          value === undefined ||
          value === "" ||
          ["ltr", "ml"].includes(value?.toLowerCase?.())
      ),

    variantStockWeight: yup
      .string()
      .nullable()
      .transform((value) => (value === "" ? null : value))
      .max(50, "Size/Weight cannot exceed 50 characters"),

    variantStockSize: yup
      .string()
      .nullable()
      .transform((value) => (value === "" ? null : value))
      .max(50, "Size/Weight cannot exceed 50 characters"),

    variantStockCapacity: yup
      .string()
      .nullable()
      .transform((value) => (value === "" ? null : value))
      .max(50, "Size/Weight cannot exceed 50 characters"),

    variantStockGuestCapacity: yup
      .number()
      .typeError("Capacity must be a number")
      .nullable()
      .transform((value, originalValue) =>
        originalValue === "" ? null : value
      )
      .min(0, "Capacity cannot be negative")
      .test(
        "is-decimal",
        "Capacity can have up to 2 decimal places",
        (value) =>
          value === null ||
          value === undefined ||
          /^\d+(\.\d{1,2})?$/.test(value.toString())
      ),
  })
  .test(
    "parent-stock-validation",
    "Either select a parent stock OR provide a new stock name & category",
    function (value) {
      const { parentStockId, parentStockName, parentStockCategory } = value;

      // Rule: either parentStockId is present OR (both name & category provided)
      if (parentStockId) return true;
      if (parentStockName && parentStockCategory) return true;

      return this.createError({
        path: "parentStockId",
        message:
          "Either select a parent stock OR provide a new stock name & category",
      });
    }
  )
  .test(
    "mutual-exclusion-validation",
    "Cannot provide both parent stock selection AND new parent details",
    function (value) {
      const { parentStockId, parentStockName, parentStockCategory } = value;

      // Rule: if parentStockId is provided, parentStockName and parentStockCategory should be empty/null
      if (parentStockId && (parentStockName || parentStockCategory)) {
        return this.createError({
          path: "parentStockId",
          message:
            "Clear parent stock selection if providing new parent details",
        });
      }

      return true;
    }
  );
