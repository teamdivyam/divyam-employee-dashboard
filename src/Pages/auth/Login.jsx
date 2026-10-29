import { useEffect, useRef, useState } from "react";
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

import { Navigate, NavLink } from "react-router-dom";

import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";

import { LoginFormSchema } from "@/validator/auth.validator.js";
import { toast } from "sonner";
import { Eye, EyeOff, Mail, Lock, Loader2, ArrowRight, ClipboardList, CalendarDays, Wallet, ShieldCheck } from "lucide-react";
import EmployeeV2Service from "../../services/employee-v2.service.js";
import useAuthSession from "../../hooks/useAuthSession.js";
import SuspenseLoader from "../../components/components/SuspenseLoader.jsx";

/* ---------------- API FUNCTIONS ---------------- */

const fetchLogin = async ({ email, password }) => {
  const response = await EmployeeV2Service.login({
    email,
    password,
  });

  return response.data;
};

/* ---------------- COMPONENT ---------------- */

const LoginPage = () => {
  const { data: session, isPending: isCheckingSession } = useAuthSession();

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
    onSuccess: (result) => {
      const redirectUrl = result.data?.redirectUrl;

      if (!redirectUrl) {
        throw new Error("Login succeeded, but no portal redirect was provided.");
      }

      toast.success(result.message || "Login successful");
      window.location.assign(redirectUrl);
    },
    onError: (error) => {
      const errorMsg = error.response?.data?.message
        || error.message
        || "Login failed. Please check your credentials.";
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

  const onSubmit = ({ email, password }) => {
    loginMutation.mutate({ email, password });
  };

  /* ---------------- AUTH CHECK ---------------- */

  if (isCheckingSession) {
    return <SuspenseLoader />;
  }

  if (session) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <main className="login-page h-screen overflow-hidden">
      <div className="h-full overflow-y-auto">
        <div className="login-layout">
          <section className="login-story" aria-label="Divyam Employee Portal">
            <div className="login-brand">
              <img src="/img/logo.png" alt="" className="login-logo" />
              <p className="login-wordmark">Divyam</p>
              <p className="login-promise">The Promise of Purity.<br />The Standard of Luxury.</p>
            </div>
            <div className="login-intro">
              <p className="login-eyebrow">Employee Portal</p>
              <h1>Your Work.<br /><span>Our Standard.</span></h1>
              <p className="login-story-description">Stay connected with your team and manage your tasks, events, attendance and salary — all in one place.</p>
            </div>
            <div className="login-features">
              {[
                [ClipboardList, "My Workspace", "Team updates and announcements", "workspace"],
                [CalendarDays, "My Tasks & Events", "Your work and event responsibilities", "events"],
                [CalendarDays, "Attendance & Leave", "Track attendance and manage leave", "attendance"],
                [Wallet, "Salary & Expenses", "View payroll and manage expenses", "salary"],
              ].map(([Icon, title, description, tone]) => (
                <div className="login-feature" key={title}>
                  <span className={`login-feature-icon login-feature-${tone}`}><Icon aria-hidden="true" /></span>
                  <div><h2>{title}</h2><p>{description}</p></div>
                </div>
              ))}
            </div>
            <p className="login-values">People &nbsp; | &nbsp; Service &nbsp; | &nbsp; Excellence</p>
          </section>
          <section className="login-form-panel" aria-label="Employee sign in">
            <Card className="login-card">
              <CardHeader className="login-card-header">
                <div className="login-mobile-brand"><img src="/img/logo.png" alt="" />Divyam</div>
                <p className="login-eyebrow">Employee Portal</p>
                <CardTitle className="login-title">Welcome Back</CardTitle>
                <CardDescription className="login-description">Sign in to access your workspace, tasks, events and employee information.</CardDescription>
              </CardHeader>
              <CardContent className="login-card-content">
                <form onSubmit={handleSubmit(onSubmit)} className="login-form" noValidate>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <div className="login-input-wrap">
                      <Mail className="login-input-icon" aria-hidden="true" />
                      <Input id="email" type="email" autoComplete="username" placeholder="employee@divyam.in"
                        className="login-input" aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "email-error" : undefined}
                        {...register("email")} ref={(e) => { emailInputRef.current = e; register("email").ref(e); }} />
                    </div>
                    {errors.email && <p id="email-error" className="login-error" role="alert">{errors.email.message}</p>}
                  </div>
                  <div>
                    <div className="login-password-label"><Label htmlFor="password">Password</Label><NavLink to="/forgot-password">Forgot Password?</NavLink></div>
                    <div className="login-input-wrap">
                      <Lock className="login-input-icon" aria-hidden="true" />
                      <Input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password"
                        className="login-input login-password-input" placeholder="Enter your password"
                        aria-invalid={Boolean(errors.password)} aria-describedby={errors.password ? "password-error" : undefined} {...register("password")} />
                      <Button type="button" variant="ghost" size="icon" className="login-password-toggle"
                        aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword}
                        onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff /> : <Eye />}
                      </Button>
                    </div>
                    {errors.password && <p id="password-error" className="login-error" role="alert">{errors.password.message}</p>}
                  </div>
                  <Button type="submit" disabled={isSubmitting || !isValid || !isDirty} className="login-submit">
                    {isSubmitting ? <><Loader2 className="animate-spin" />Authenticating...</> : <>Login<ArrowRight aria-hidden="true" /></>}
                  </Button>
                </form>
                <div className="login-security"><ShieldCheck aria-hidden="true" /><div><p>For authorised employees only.</p><span>Secure access to DIVYAM systems.</span></div></div>
                <p className="login-values login-card-values">People &nbsp; | &nbsp; Service &nbsp; | &nbsp; Excellence</p>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
      {isSubmitting && (
        <div className="fixed inset-0 bg-background/70 backdrop-blur-sm z-50 flex items-center justify-center" role="status" aria-live="polite">
          <Card><CardContent className="p-8 flex flex-col items-center gap-4"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p>Authenticating...</p></CardContent></Card>
        </div>
      )}
    </main>
  );
};

export default LoginPage;