import {
  ArrowRight,
  GraduationCap,
  MailCheck,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import React, { useContext, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AppContent } from "../../contexts/AppContext";
import axios from "axios";
import { toast } from "react-toastify";
import { withMinimumLoading } from "../../utils/withMinimumLoading";

const AUTO_SUBMIT_DELAY = 800;

const EmailVerify = () => {
  axios.defaults.withCredentials = true;

  const {
    authState: { isLoggedIn, userData },
    backendUrl,
    checkAuthState,
  } = useContext(AppContent);

  const [isLoading, setIsLoading] = useState(false);
  const [otpValues, setOtpValues] = useState(Array(6).fill(""));

  const navigate = useNavigate();
  const inputRefs = useRef([]);
  const submitButtonRef = useRef(null);
  const autoSubmitTimeoutRef = useRef(null);

  const getDashboardRoute = (userRole) => {
    const roleRoutes = {
      Student: "/student-dashboard",
      Faculty: "/faculty-dashboard",
      Admin: "/admin-dashboard",
    };
    return roleRoutes[userRole] || "/student-dashboard";
  };

  const clearAutoSubmitTimeout = () => {
    if (autoSubmitTimeoutRef.current) {
      clearTimeout(autoSubmitTimeoutRef.current);
      autoSubmitTimeoutRef.current = null;
    }
  };

  const isOtpComplete = (values) => {
    return values.every((value) => value.length === 1);
  };

  const scheduleAutoSubmit = (values) => {
    clearAutoSubmitTimeout();

    if (!isOtpComplete(values) || isLoading) return;

    autoSubmitTimeoutRef.current = setTimeout(() => {
      submitButtonRef.current?.click();
    }, AUTO_SUBMIT_DELAY);
  };

  const handleInput = (event, index) => {
    const rawValue = event.target.value.replace(/\D/g, "");
    const newValue = rawValue.slice(-1);
    const newOtpValues = [...otpValues];
    newOtpValues[index] = newValue;
    setOtpValues(newOtpValues);

    if (newValue && index < inputRefs.current.length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    if (isOtpComplete(newOtpValues)) {
      scheduleAutoSubmit(newOtpValues);
    } else {
      clearAutoSubmitTimeout();
    }
  };

  const handleKeyDown = (event, index) => {
    clearAutoSubmitTimeout();

    if (event.key === "Backspace" && !otpValues[index] && index > 0) {
      const newOtpValues = [...otpValues];
      newOtpValues[index - 1] = "";
      setOtpValues(newOtpValues);
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (event) => {
    event.preventDefault();
    const paste = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const pasteArray = paste.split("");
    const newOtpValues = Array(6).fill("");

    pasteArray.forEach((char, index) => {
      if (index < 6) {
        newOtpValues[index] = char;
      }
    });

    setOtpValues(newOtpValues);

    const nextFocusIndex = Math.min(pasteArray.length, 5);
    inputRefs.current[nextFocusIndex]?.focus();

    if (isOtpComplete(newOtpValues)) {
      scheduleAutoSubmit(newOtpValues);
    } else {
      clearAutoSubmitTimeout();
    }
  };

  const isFormValid = () => {
    return isOtpComplete(otpValues);
  };

  const onSubmitHandler = async (event) => {
    try {
      event.preventDefault();
      clearAutoSubmitTimeout();

      if (!isFormValid() || isLoading) return;

      setIsLoading(true);
const otp = otpValues.join("");

const { data } = await withMinimumLoading(
  () =>
    axios.post(backendUrl + "/api/auth/verify-account", {
      otp,
      userId: userData?._id,
    }),
  1000
);

      if (data.success) {
        toast.success(data.message);
        await checkAuthState();

        const dashboardRoute = getDashboardRoute(
          data.user?.role || userData?.role
        );
        navigate(dashboardRoute);
      } else {
        toast.error(data.message);
        submitButtonRef.current?.focus();
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || error.message || "Verification failed"
      );
      submitButtonRef.current?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoading && isLoggedIn && userData?.isAccountVerified) {
      const dashboardRoute = getDashboardRoute(userData.role);
      navigate(dashboardRoute);
    }
  }, [isLoggedIn, userData, navigate, isLoading]);

  useEffect(() => {
    return () => {
      clearAutoSubmitTimeout();
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-900">
      <div className="grid min-h-screen lg:grid-cols-[0.95fr_1.05fr]">
        <section className="relative hidden overflow-hidden lg:flex">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(45,212,191,0.18),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.16),_transparent_24%)]" />

          <div className="relative flex w-full flex-col justify-between px-10 py-10 xl:px-14">
            <Link to="/" className="inline-flex w-fit items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-cyan-300 ring-1 ring-white/10 backdrop-blur-sm">
                <GraduationCap className="h-5 w-5" />
              </div>

              <div>
                <p className="text-xl font-bold tracking-tight text-white">Cognito</p>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  LMS Platform
                </p>
              </div>
            </Link>

            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">
                <Sparkles className="h-4 w-4" />
                Account verification
              </div>

              <h1 className="mt-6 text-4xl font-bold leading-tight text-white xl:text-5xl">
                Verify your email and activate your academic account.
              </h1>

              <p className="mt-5 max-w-lg text-base leading-8 text-slate-300">
                Enter the six-digit verification code sent to your email to unlock
                access to your role-based dashboard and academic workspace.
              </p>

              <div className="mt-10 grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                  <MailCheck className="h-5 w-5 text-cyan-300" />
                  <p className="mt-4 text-sm font-semibold text-white">Email verified</p>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    Confirm your account securely before entering the platform.
                  </p>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                  <ShieldCheck className="h-5 w-5 text-emerald-300" />
                  <p className="mt-4 text-sm font-semibold text-white">Protected access</p>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    Verification helps keep academic access aligned and secure.
                  </p>
                </div>
              </div>
            </div>

            <p className="text-sm text-slate-500">
              Secure onboarding for students, faculty, and administrators.
            </p>
          </div>
        </section>

        <section className="relative flex min-h-screen items-center justify-center px-5 py-8 sm:px-8 lg:px-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(45,212,191,0.1),_transparent_20%)] lg:hidden" />

          <div className="relative w-full max-w-xl">
            <div className="mb-8 flex items-center justify-between lg:hidden">
              <Link to="/" className="inline-flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-cyan-300 ring-1 ring-white/10">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xl font-bold tracking-tight text-white">Cognito</p>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    LMS Platform
                  </p>
                </div>
              </Link>
            </div>

            <form
              onSubmit={onSubmitHandler}
              className="rounded-[32px] border border-white/10 bg-white p-6 shadow-2xl sm:p-8"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">
                    Verification
                  </p>
                  <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                    Verify your email
                  </h1>
                  <p className="mt-3 text-sm leading-6 text-slate-500">
                    Enter the 6-digit code sent to your email address.
                  </p>
                </div>

                <div className="hidden h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 sm:flex">
                  <MailCheck className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-8" onPaste={handlePaste}>
                <div className="flex justify-between gap-2 sm:gap-3">
                  {Array(6)
                    .fill(0)
                    .map((_, index) => (
                      <input
                        key={index}
                        type="text"
                        inputMode="numeric"
                        autoComplete={index === 0 ? "one-time-code" : "off"}
                        maxLength={1}
                        required
                        value={otpValues[index]}
                        disabled={isLoading}
                        className="h-14 w-12 rounded-2xl border border-slate-200 bg-slate-50 text-center text-xl font-semibold text-slate-900 outline-none transition focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:opacity-60 sm:h-16 sm:w-14"
                        ref={(element) => (inputRefs.current[index] = element)}
                        onChange={(event) => handleInput(event, index)}
                        onKeyDown={(event) => handleKeyDown(event, index)}
                      />
                    ))}
                </div>

                <p className="mt-4 text-sm text-slate-500">
                  Tip: you can paste the full code directly.
                </p>
              </div>

              <button
  ref={submitButtonRef}
  type="submit"
  disabled={!isFormValid() || isLoading}
  aria-busy={isLoading}
  className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full cursor-pointer bg-slate-950 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
>
  {isLoading ? (
    <>
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
      Verifying...
    </>
  ) : (
    <>
      Verify OTP
      <ArrowRight className="h-4 w-4" />
    </>
  )}
</button>

              <div className="mt-6 rounded-2xl bg-slate-50 px-4 py-4 text-center">
                <p className="text-sm text-slate-600">
                  Enter the latest code from your inbox before it expires.
                </p>
              </div>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
};

export default EmailVerify;