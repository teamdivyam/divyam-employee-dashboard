import * as yup from "yup";
import { ProductCategory } from "../utils/constant";

export const ProductSchema = yup.object({
  productStockId: yup.string().required("Choose one of stock"),
  sku: yup.string().required("Choose one of stock"),
  productName: yup
    .string()
    .min(4, "Product name must be greater than 4 characters")
    .required("Product name is required"),
  productCategory: yup
    .string()
    .oneOf(
      [...ProductCategory.map((p) => p.value)],
      "Select Product Category"
    )
    .required("Product category must be required"),
  productDescription: yup
    .string()
    .min(40, "Product description must be greater than 40 characters")
    .required("Product description is required"),
  productTags: yup.array(),
  productVariants: yup.array(),
  productStatus: yup.string().oneOf(["active", "inactive"]),
});