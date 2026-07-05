import * as yup from "yup";

export const LoginFormSchema = yup
    .object({
        email: yup.string().email("Invalid Email Address").required("email required to login"),
        password: yup.string().required("Password is required"),
    })
    .required("Please confirm the password");

export const RegisterFormSchema = yup
    .object({
        fullName: yup
            .string()
            .min(3, "Name should be atlest 3 character long")
            .max(50, "Name length should be between 3 to 50 character long")
            .required("name is Required"),
        email: yup.string().email().required("email address is required"),
        mobileNum: yup
            .string()
            .length(10, "Mobile number must be exactly 10 digits")
            .required("Mobile Number is address is required"),
        file: yup
            .mixed()
            .required("File is required")
            .test(
                "fileSize",
                "File too large",
                (value) => value && value[0]?.size <= 5000000
            )
            .test(
                "fileType",
                "Unsupported file format",
                (value) =>
                    value &&
                    ["image/jpeg", "image/png"].includes(value[0]?.type)
            ),
        password: yup.string().min(6).required("Password is required").max(100),
        confirmPassword: yup
            .string()
            .required("Confirm Password is required")
            .oneOf([yup.ref("password")], "Passwords must match"),
    })
    .required("Please confrim the password");
