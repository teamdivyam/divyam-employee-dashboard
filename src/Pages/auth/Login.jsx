import { config } from "../../../config.js";
import React, { useEffect, useRef, useState } from "react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@components/components/ui/avatar";
import { Badge } from "@components/components/ui/badge";
import { Navigate, NavLink, useNavigate } from "react-router-dom";

import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";

import { LoginFormSchema } from "@/validator/auth.validator.js";
import isTokenExpired from "@/utils/isTokenExpired.js";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { toast } from "sonner";
import { Eye, EyeOff, Mail, Lock, Loader2, AlertCircle } from "lucide-react";
import EmployeeService from "../../services/employee.service.js";

/* ---------------- API FUNCTIONS ---------------- */

const fetchLogin = async ({ email, password, recaptchaToken }) => {
  const response = await EmployeeService.login({
    email,
    password,
    recaptchaToken,
  });
  return response.data;
};

/* ---------------- COMPONENT ---------------- */

const LoginPage = () => {
  const navigate = useNavigate();
  const { executeRecaptcha } = useGoogleReCaptcha();

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const emailInputRef = useRef(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty, isValid },
  } = useForm({
    mode: "onChange",
    resolver: yupResolver(LoginFormSchema),
  });

  /* ---------------- EFFECTS ---------------- */

  useEffect(() => {
    // Auto-focus email input on mount
    if (emailInputRef.current) {
      emailInputRef.current.focus();
    }
  }, []);

  /* ---------------- MUTATIONS ---------------- */

  const loginMutation = useMutation({
    mutationFn: fetchLogin,
    onMutate: () => {
      setIsSubmitting(true);
    },
    onSuccess: (data) => {
      localStorage.setItem("AppID", data.token);
      toast.success("Login successful! Redirecting...");
      setTimeout(() => navigate("/dashboard"), 1000);
    },
    onError: (error) => {
      const errorMsg = error.response?.data?.message || "Login failed. Please check your credentials.";
      toast.error(errorMsg, {
        duration: 4000,
        position: "top-center",
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  /* ---------------- SUBMIT HANDLER ---------------- */

  const onSubmit = async (data) => {
    if (!executeRecaptcha) {
      toast.error("reCAPTCHA not ready. Please refresh the page.");
      return;
    }

    let recaptchaToken = undefined;
    if (config.PRODUCTION_MODE === "production") {
      try {
        recaptchaToken = await executeRecaptcha("employee_login");
      } catch (error) {
        toast.error("reCAPTCHA verification failed. Please try again.");
        return;
      }
    }

    loginMutation.mutate({ ...data, recaptchaToken });
  };

  /* ---------------- AUTH CHECK ---------------- */

  const token = localStorage.getItem("AppID");
  if (!isTokenExpired(token)) {
    return <Navigate to="/dashboard" />;
  }

  /* ---------------- UI ----------------*/

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 h-[500px] w-[500px] rounded-full bg-orange-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-primary/10 blur-3xl" />
      </div>

      <div className="relative grid min-h-screen lg:grid-cols-2">

        {/* Left Panel */}
        <div className="hidden lg:flex flex-col justify-between p-12 border-r border-border bg-card/50 backdrop-blur-sm">
          <div>
            <div className="flex items-center gap-4">
              <div className="rounded-2xl border bg-muted/50 p-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage
                      src="/img/logo.png"
                      alt="Divyam"
                      className="rotateImg invert dark:invert-0"
                    />
                    <AvatarFallback>D</AvatarFallback>
                  </Avatar>
                </div>

              <div>
                <h1 className="text-3xl font-bold">
                  Divyam Employee
                </h1>

                <p className="text-muted-foreground">
                  Inventory & Operations Platform
                </p>
              </div>
            </div>

            <div className="mt-16 space-y-6">
              <div className="rounded-xl border bg-card p-5">
                <h3 className="font-semibold">
                  Inventory Management
                </h3>

                <p className="text-sm text-muted-foreground mt-2">
                  Track stock movement, variants and inventory operations.
                </p>
              </div>

              <div className="rounded-xl border bg-card p-5">
                <h3 className="font-semibold">
                  Package Management
                </h3>

                <p className="text-sm text-muted-foreground mt-2">
                  Manage products, package combinations and allocations.
                </p>
              </div>

              <div className="rounded-xl border bg-card p-5">
                <h3 className="font-semibold">
                  Employee Operations
                </h3>

                <p className="text-sm text-muted-foreground mt-2">
                  Secure employee access and operational workflows.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-2xl font-bold">1K+</p>
                <p className="text-xs text-muted-foreground">
                  Inventory Records
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <p className="text-2xl font-bold">5+</p>
                <p className="text-xs text-muted-foreground">
                  Packages
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <p className="text-2xl font-bold">24/7</p>
                <p className="text-xs text-muted-foreground">
                  Operations
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Panel */}
        <div className="flex items-center justify-center p-6">
          <Card className="w-full max-w-md border-border/50 shadow-2xl bg-card/95 backdrop-blur-xl">
            <CardHeader className="space-y-6 pb-4">

              <div className="flex justify-center">
                <div className="rounded-2xl border bg-muted/50 p-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage
                      src="/img/logo.png"
                      alt="Divyam"
                      className="rotateImg invert dark:invert-0"
                    />
                    <AvatarFallback>D</AvatarFallback>
                  </Avatar>
                </div>
              </div>

              <div className="text-center">
                <div className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium">
                  Employee Portal
                </div>

                <CardTitle className="mt-4 text-3xl">
                  Welcome Back
                </CardTitle>

                <CardDescription className="mt-2">
                  Access inventory, packages, products and employee operations.
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent>
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-5"
              >
                {/* Email */}
                <div>
                  <Label htmlFor="email">
                    Email Address
                  </Label>

                  <div className="relative mt-2">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

                    <Input
                      id="email"
                      type="email"
                      placeholder="employee@divyam.in"
                      className="h-14 pl-11 rounded-xl"
                      {...register("email")}
                      ref={(e) => {
                        emailInputRef.current = e;
                        register("email").ref(e);
                      }}
                    />
                  </div>

                  {errors.email && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">
                      Password
                    </Label>

                    <NavLink
                      to="/forgot-password"
                      className="text-xs text-theme-color"
                    >
                      Forgot Password?
                    </NavLink>
                  </div>

                  <div className="relative mt-2">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      className="h-14 pl-11 pr-11 rounded-xl"
                      placeholder="Enter your password"
                      {...register("password")}
                    />

                    <button
                      type="button"
                      className="absolute right-4 top-1/2 -translate-y-1/2"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  {errors.password && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting || !isValid || !isDirty}
                  className="h-14 w-full rounded-xl bg-theme-color text-base font-semibold"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Authenticating...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>

                <Card className="border-dashed">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Lock className="h-4 w-4 mt-0.5 text-green-600" />

                      <div>
                        <p className="text-sm font-medium">
                          Secure Login
                        </p>

                        <p className="text-xs text-muted-foreground mt-1">
                          Protected by reCAPTCHA verification and encrypted
                          transmission.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {isSubmitting && (
        <div className="fixed inset-0 bg-background/70 backdrop-blur-sm z-50 flex items-center justify-center">
          <Card>
            <CardContent className="p-8 flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-theme-color" />
              <p>Authenticating...</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default LoginPage;