import * as yup from "yup";

export const AddNewPackageSchema = yup.object({
    name: yup.string().required("Package Name is required."),
    capacity: yup.string().required("capacity is required."),
    price: yup.string().required("price is required."),
    description: yup.string().required("description is required."),
    notes: yup.string(),
    policy: yup.string(),
});

export const PackageItemSchema = yup
    .object({
        packageItem: yup
            .string("Please add an item lists of package")
            .min(5, "Package item name must have at least 5 characters")
            .required(),
    })
    .required("You can't submit without fill the form.");


export const PackageSchema = yup.object().shape({
  packageName: yup.string()
    .trim()
    .required("Package name is required"),

  products: yup.array()
    .of(
      yup.object().shape({
        productObjectId: yup.string()
          .required("Product ID is required"),

        variantId: yup.string()
          .nullable()
          .trim(),

        quantity: yup.number()
          .typeError("Quantity must be a number")
          .integer("Quantity must be an integer")
          .min(1, "Quantity must be at least 1")
          .required("Quantity is required"),
      })
    )
    .min(1, "At least one product is required")
    .required("Products are required"),

  description: yup.string()
    .trim()
    .required("Description is required"),

  tags: yup.array()
    .of(yup.string().trim())
    .typeError("Tags must be an array of strings"),

  discountPrice: yup.number()
    .typeError("Discount price must be a number")
    .min(0, "Discount price cannot be negative"),

  originalPrice: yup.number()
    .typeError("Original price must be a number")
    .min(0, "Original price cannot be negative")
    .required("Original price is required"),

  discountPercent: yup.number()
    .typeError("Discount percent must be a number")
    .min(0, "Discount percent cannot be negative")
    .max(100, "Discount percent cannot exceed 100"),

  packageClassId: yup.string()
    .required("Tier ID is required"),

  capacity: yup.number()
    .typeError("Capacity must be a number")
    .min(0, "Capacity cannot be negative")
    .required("Capacity is required"),

  isVisible: yup.boolean()
    .default(true)
    .typeError("isVisible must be true or false"),
});
