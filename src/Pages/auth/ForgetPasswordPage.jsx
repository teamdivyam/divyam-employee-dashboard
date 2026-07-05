import React, { useState } from "react";
import { Button } from "@components/components/ui/button";
import { NavLink } from "react-router-dom";
import { ArrowLeft, ShieldAlert, MailOpen } from "lucide-react";
import Loader from "@components/components/Loader";
import { config } from "../../../config.js";
import { Input } from "@components/components/ui/input";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
const FORGET_PASSWORD_SCHEMA = yup.object({
  email: yup.string().email().required(),
});

export const ForgetPasswordPage = () => {
  const [error, setError] = useState();
  const [loading, setLoading] = useState(false);
  const [isShowInstruction, setShowInstruction] = useState();
  const [adminEmail, setAdminEmail] = useState(null);

  const token = localStorage.getItem("AppID");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    mode: "all",
    resolver: yupResolver(FORGET_PASSWORD_SCHEMA),
    defaultValues: {
      email: "",
    },
  });

  const handleResetPasswordForm = (data) => {
    setLoading(true);
    // extract admin email from the token
    (async () => {
      try {
        const response = await fetch(
          `${config.BACKEND_URL}/api/admin/reset-password`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
          }
        );
        const result = await response.json();
        if (!response.ok) {
          setError("Something went wrong | Internal Error");
          setLoading(false);
        }
        if (!result?.success) {
          setError(result?.msg);
        }
        if (result.success) {
          setAdminEmail(result?.adminEmail);
          setTimeout(() => {
            setLoading(false);
          }, 400);
          setTimeout(() => {
            setShowInstruction(true);
          }, 700);
        }
      } catch (error) {
        setError(error?.message);
      }
    })();
  };

  // transform: translate(-112px, -113px);

  return (
    <div className="h-screen flex items-center justify-center">
      <div className="border bg-neutral-100 p-28 rounded-sm  relative">
        {isShowInstruction && (
          <div className=" bg-white absolute w-full h-full -translate-x-[112px] -translate-y-[112px] px-10 py-20">
            <p className="text-neutral-500">
              {`Lorem ipsum dolor sit amet consectetur, adipisicing elit. Quia,
              mollitia deleniti aliquam laudantium, repudiandae aperiam minima
              officia ducimus, voluptatibus itaque ${adminEmail && adminEmail}
              explicabo at delectus incidunt sunt consequatur fugit nihil quam
              sequi!`}
            </p>

            <div className="anchorText flex flex-col gap-4 mt-20">
              <NavLink
                to="mailto:"
                className="flex  justify-center items-center gap-2 text-sm group bg-orange-500 rounded-md border p-2"
              >
                <MailOpen className="text-white" />
                <span className=" text-white">Open Inbox</span>
              </NavLink>

              <NavLink
                to="/login"
                className="flex  justify-center items-center gap-2 text-sm text-neutral-400"
              >
                <span>Back to login</span>
                <ArrowLeft />
              </NavLink>
            </div>
          </div>
        )}

        <div className="cardHeader text-center  flex  flex-col justify-center items-center gap-4 ">
          <ShieldAlert size={48} color="green" />
          <h1 className="text-2xl text-neutral-800"> Forget Password? </h1>
        </div>
        <form
          className="mt-16"
          onSubmit={handleSubmit(handleResetPasswordForm)}
        >
          {error && <p className="text-red-400 text-sm">{error}</p>}

          <Input
            placeholder="Email address"
            className="my-1 focus:border-orange-400 focus-visible:ring-transparent"
            {...register("email")}
          />
          {/* error msgs */}
          {errors && (
            <p className="text-red-400 pl-1 text-sm mb-1 ">
              {errors?.email?.message}
            </p>
          )}

          <div className="flex flex-col gap-4">
            <Button
              type="submit"
              className="w-[300px] bg-theme-color shadow-none"
            >
              {loading === true ? <Loader /> : "Reset Password"}
            </Button>

            <NavLink to="/login">
              <Button
                type="submit"
                className="w-[300px] bg-transparent shadow-none border-none text-neutral-600 hover:text-neutral-600 hover:bg-transparent hover:border-none"
              >
                Back to log in <ArrowLeft />
              </Button>
            </NavLink>
          </div>
        </form>
      </div>
    </div>
  );
};
