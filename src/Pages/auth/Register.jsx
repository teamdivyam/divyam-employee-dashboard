import React, { useEffect, useState } from "react";
import { Button } from "@components/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@components/components/ui/card";

import { Input } from "@components/components/ui/input";
import { Label } from "@components/components/ui/label";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { NavLink, useNavigate, Navigate } from "react-router-dom";
import { config } from "../../../config";
import { toast, Toaster } from "sonner";
import { RegisterFormSchema } from "@/validator/auth.validator.js";

const Register = () => {
    const navigate = useNavigate();

    const SHOW_REGISTER_PAGE =
        config?.SHOW_REGISTER_PAGE === "true" ? true : false;

    console.log("Show register page:", SHOW_REGISTER_PAGE);

    if (!SHOW_REGISTER_PAGE) {
        console.log("Going to login page!");
        return <Navigate to="/login" />;
    }

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        mode: "all",
        resolver: yupResolver(RegisterFormSchema),
    });

    const onSubmit = (data) => {
        const postData = async (data) => {
            const formData = new FormData();

            formData.append("avatar", data.file[0]);
            formData.append("fullName", data.fullName);
            formData.append("email", data.email);
            formData.append("password", data.password);
            formData.append("confirmPassword", data.confirmPassword);
            formData.append("mobileNum", data.mobileNum);

            try {
                const response = await fetch(
                    `${config.BACKEND_URL}/api/admin/register`,
                    {
                        method: "POST",
                        body: formData,
                    }
                );

                if (!response.ok) {
                    console.error("Cannot register a new account");
                    return;
                }

                const result = await response.json();

                if (result.success) {
                    toast.success("New Account Registered successfully");

                    // redirect to login page
                    setTimeout(() => {
                        navigate("/login");
                    }, 15 * 100);
                }
            } catch (error) {
                console.error("Error during registration:", error);
            }
        };

        postData(data);
    };

    useEffect(() => {
        if (localStorage.getItem("token")) {
            navigate("/dashboard");
        }
    }, []);

    return (
        <>
            <Toaster />

            <div className="min-h-screen  flex items-center">
                <Card className="mx-auto lg:w-1/4 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-2xl">
                            Register New Account
                        </CardTitle>
                        <CardDescription>
                            Enter your details below to register account
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit(onSubmit)}>
                            <div className="grid gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="fullName">Name</Label>
                                    <Input
                                        id="fullName"
                                        type="text"
                                        placeholder="Mohan Singh"
                                        required
                                        {...register("fullName", {
                                            required: true,
                                            maxLength: 20,
                                        })}
                                    />

                                    <div
                                        className={`${
                                            errors?.fullName
                                                ? "block text-red-400 text-sm errMsgStyle"
                                                : "text-red-400 text-sm errMsgStyle hidden"
                                        } `}
                                    >
                                        {errors?.fullName
                                            ? errors.fullName?.message
                                            : "."}
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="mobileNum">
                                        Mobile Number
                                    </Label>
                                    <div className="flex  ">
                                        <div
                                            className=" flex items-center bg-gray-300 text-black text-sm px-2 align-middle  text-center
                rounded-sm rounded-r-none
                "
                                        >
                                            <span>+91</span>
                                        </div>
                                        <Input
                                            className="border-l-0 rounded-l-none"
                                            id="mobileNum"
                                            type="number"
                                            placeholder="9878987671"
                                            required
                                            {...register("mobileNum")}
                                        />
                                    </div>
                                    <div
                                        className={`${
                                            errors?.mobileNum
                                                ? "block text-red-400 text-sm errMsgStyle"
                                                : "text-red-400 text-sm errMsgStyle hidden"
                                        } `}
                                    >
                                        {errors?.mobileNum
                                            ? errors.mobileNum?.message
                                            : "."}
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="text"
                                        placeholder="admin@divyam.in"
                                        required
                                        {...register("email")}
                                    />
                                    <div
                                        className={`${
                                            errors?.email
                                                ? "block text-red-400 text-sm errMsgStyle"
                                                : "text-red-400 text-sm errMsgStyle hidden"
                                        } `}
                                    >
                                        {errors?.email
                                            ? errors.email?.message
                                            : "."}
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="profileImage">
                                        Profile Image
                                    </Label>
                                    <Input
                                        id="profileImage"
                                        type="file"
                                        className="block w-full text-sm text-slate-500
                  file:mr-4  file:font-semibold
                  file:rounded-md
                  file:border-0 file:text-xs
                  file:bg-orange-200 file:text-slate-600
                  hover:file:bg-orange-300"
                                        placeholder="Upload profile image (max 5mb Supported)"
                                        {...register("file")}
                                    />
                                    <div
                                        className={`${
                                            errors?.file
                                                ? "block text-red-400 text-sm errMsgStyle"
                                                : "text-red-400 text-sm errMsgStyle hidden"
                                        } `}
                                    >
                                        {errors?.file
                                            ? errors.file?.message
                                            : null}
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <div className="flex items-center">
                                        <Label htmlFor="password">
                                            Password
                                        </Label>
                                        {/* <a href="#" className="ml-auto inline-block text-sm underline">
                Forgot your password?
              </a> */}
                                    </div>
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="********"
                                        required
                                        {...register("password")}
                                    />

                                    <div
                                        className={`${
                                            errors?.password
                                                ? "block text-red-400 text-sm errMsgStyle"
                                                : "text-red-400 text-sm errMsgStyle hidden"
                                        } `}
                                    >
                                        {errors?.password
                                            ? errors.password?.message
                                            : "."}
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="cnfrmPassword">
                                        Confirm Password
                                    </Label>
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        placeholder="********"
                                        required
                                        {...register("confirmPassword")}
                                    />
                                    <div
                                        className={`${
                                            errors?.confirmPassword
                                                ? "block text-red-400 text-sm errMsgStyle"
                                                : "text-red-400 text-sm errMsgStyle hidden"
                                        } `}
                                    >
                                        {errors?.confirmPassword
                                            ? errors.confirmPassword?.message
                                            : "."}
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full bg-theme-color"
                                >
                                    Register
                                </Button>
                            </div>
                        </form>

                        <div className="mt-4 text-center text-sm">
                            <NavLink to="/login" className="underline">
                                Log In..
                            </NavLink>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
};

export default Register;
