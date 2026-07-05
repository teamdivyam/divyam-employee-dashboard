import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Input } from "@components/components/ui/input";
import { Label } from "@components/components/ui/label";
import { Button } from "@components/components/ui/button";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { Toaster } from "@components/components/ui/sonner";
import { toast } from "sonner";
import { config } from "../../../config.js";
import {
  Navigate,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";

const ChangePasswordValidationSchema = yup
  .object({
    password: yup
      .string()
      .min(6, "Password must be minimum 6 character Long")
      .required("Password  is required"),
    confirmPassword: yup
      .string()
      .oneOf([yup.ref("password")])
      .required("Enter your new password"),
  })
  .required("Please confirm the password");

const ResetPassword = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [error, setError] = useState();
  const hash = params.get("hash");

  if (!hash) {
    <Navigate to="/login" />;
  }

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    mode: "all",
    resolver: yupResolver(ChangePasswordValidationSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = (data) => {
    console.log(data.password);
    const payload = { hash, password: data.password };

    (async () => {
      try {
        const res = await fetch(
          `${config.BACKEND_URL}/api/admin/set-password`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          }
        );

        const result = await res.json();
        console.log(result);
      } catch (error) {
        console.log(error);
      }
    })();
  };

  useEffect(() => {
    (async () => {
      try {
        // call and verify hash
        const res = await fetch(
          `${config.BACKEND_URL}/api/admin/verify-reset-password/${hash}`,
          {
            method: "GET",
          }
        );

        const result = await res.json();

        console.log(result);
      } catch (error) {
        navigate("/login");
      }
    })();
  }, []);

  return (
    <div className=" h-screen">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mx-auto max-w-sm mt-[200px] bg-neutral-100 p-12 border rounded-md"
      >
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Type new password"
              required
              className="h-12"
              {...register("password")}
            />
            <div
              className={`${
                errors?.password
                  ? "block text-red-400 text-sm errMsgStyle"
                  : "text-red-400 text-sm errMsgStyle hidden"
              } `}
            >
              {errors?.password ? errors.password?.message : "."}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Retype new password"
              required
              className="h-12"
              {...register("confirmPassword")}
            />
            <div
              className={`${
                errors?.confirmPassword
                  ? "block text-red-400 text-sm errMsgStyle"
                  : "text-red-400 text-sm errMsgStyle hidden"
              } `}
            >
              {errors?.confirmPassword ? errors.confirmPassword?.message : "."}
            </div>
          </div>
        </div>
        <div className="change-password-action flex justify-end">
          <Button className="mt-4 bg-theme-color w-full dark:text-white">
            Change Now
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ResetPassword;
