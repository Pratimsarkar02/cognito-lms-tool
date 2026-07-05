import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  KeyRound,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  XCircle,
} from "lucide-react";
import { useContext, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AppContent } from "../../contexts/AppContext";
import axios from "axios";
import { toast } from "react-toastify";
import { withMinimumLoading } from "../../utils/withMinimumLoading";

const ResetPassword = () => {
  const navigate = useNavigate();
  const { backendUrl,  authState: { userData, isLoggedIn } } = useContext(AppContent);

  axios.defaults.withCredentials = true;

  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isEmailSent, setIsEmailSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [isOtpSubmitted, setIsOtpSubmitted] = useState(false);

  const [isEmailValid, setIsEmailValid] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isPasswordMatch, setIsPasswordMatch] = useState(false);

  const [otpValues, setOtpValues] = useState(Array(6).fill(""));

  const [isEmailSubmitting, setIsEmailSubmitting] = useState(false);
  const [isOtpSubmitting, setIsOtpSubmitting] = useState(false);
  const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false);

const otpSubmitButtonRef = useRef(null);
const autoSubmitTimeoutRef = useRef(null);

  const inputRefs = useRef([]);

  const clearAutoSubmitTimeout = () => {
  if (autoSubmitTimeoutRef.current) {
    clearTimeout(autoSubmitTimeoutRef.current);
    autoSubmitTimeoutRef.current = null;
  }
};

const isOtpComplete = (values) => values.every((value) => value.length === 1);

const scheduleOtpAutoSubmit = (values) => {
  clearAutoSubmitTimeout();

  if (!isOtpComplete(values) || isOtpSubmitting) return;

  autoSubmitTimeoutRef.current = setTimeout(() => {
    otpSubmitButtonRef.current?.click();
  }, 800);
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
    scheduleOtpAutoSubmit(newOtpValues);
  } else {
    clearAutoSubmitTimeout();
  }
};

const handleKeyDown = (event, index) => {
  clearAutoSubmitTimeout();

  if (event.key !== "Backspace") return;

  const newOtpValues = [...otpValues];

  if (otpValues[index]) {
    newOtpValues[index] = "";
    setOtpValues(newOtpValues);
    return;
  }

  if (index > 0) {
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
    newOtpValues[index] = char;
  });

  setOtpValues(newOtpValues);

  const nextFocusIndex = Math.min(pasteArray.length, 5);
  inputRefs.current[nextFocusIndex]?.focus();

  if (isOtpComplete(newOtpValues)) {
    scheduleOtpAutoSubmit(newOtpValues);
  } else {
    clearAutoSubmitTimeout();
  }
};

  const isEmailFormValid = () => isEmailValid && email;

const isOtpFormValid = () => isOtpComplete(otpValues);

  const isPasswordFormValid = () => {
    const passwordStrength = calculatePasswordStrength(newPassword);
    return (
      newPassword &&
      confirmPassword &&
      isPasswordMatch &&
      passwordStrength.strength >= 75
    );
  };

  useEffect(() => {
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setIsEmailValid(validEmail.test(email));
  }, [email]);

  useEffect(() => {
    if (newPassword) {
      setIsPasswordMatch(newPassword === confirmPassword);
    } else {
      setConfirmPassword("");
      setIsPasswordMatch(false);
    }
  }, [newPassword, confirmPassword]);

  const calculatePasswordStrength = (pass, strength = 0) => {
    if (!pass) return { strength: 0, label: "", color: "bg-slate-200" };

    if (pass.length >= 8) strength += 20;
    if (/[A-Z]/.test(pass)) strength += 20;
    if (/[a-z]/.test(pass)) strength += 20;
    if (/[0-9]/.test(pass)) strength += 20;
    if (/[@#$%^&*]/.test(pass)) strength += 20;

    if (strength <= 25) return { strength, label: "Weak", color: "bg-rose-500" };
    if (strength <= 75) return { strength, label: "Medium", color: "bg-amber-500" };
    return { strength, label: "Strong", color: "bg-emerald-500" };
  };

  const passwordStrength = calculatePasswordStrength(newPassword);

  const onSubmitEmail = async (event) => {
    event.preventDefault();
    if (isEmailSubmitting) return;

    try {
      setIsEmailSubmitting(true);

      const { data } = await withMinimumLoading(
        () =>
          axios.post(backendUrl + "/api/auth/send-reset-otp", {
            email,
          }),
        1000
      );

      if (data.success) {
        toast.success(data.message);
        setIsEmailSent(true);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setIsEmailSubmitting(false);
    }
  };

  const onSubmitOtp = async (event) => {
    event.preventDefault();
    if (isOtpSubmitting) return;

    try {
      setIsOtpSubmitting(true);

      clearAutoSubmitTimeout();
const otpValue = otpValues.join("");

      const { data } = await withMinimumLoading(
        () =>
          axios.post(backendUrl + "/api/auth/verify-reset-otp", {
            email,
            otp: otpValue,
          }),
        1000
      );

      if (data.success) {
        setOtp(otpValue);
        setIsOtpSubmitted(true);
        toast.success("OTP verified successfully");
      } else {
        toast.error(data.message);
        
        setOtpValues(Array(6).fill(""));
inputRefs.current[0]?.focus();

      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setIsOtpSubmitting(false);
    }
  };

  const onSubmitNewPassword = async (event) => {
    event.preventDefault();
    if (isPasswordSubmitting) return;

    try {
      setIsPasswordSubmitting(true);

      const { data } = await withMinimumLoading(
        () =>
          axios.post(backendUrl + "/api/auth/reset-password", {
            email,
            otp,
            newPassword,
          }),
        1000
      );

if (data.success) {
  toast.success(data.message);

  if (isLoggedIn && userData) {

    if (userData?.role === "Student") {
      navigate("/student-dashboard");
    } else if (userData?.role === "Faculty") {
      navigate("/faculty-dashboard");
    } else if (userData?.role === "Admin") {
      navigate("/admin-dashboard");
    } else {
      navigate("/");
    }
  } else {
    navigate("/login?state=login");
  }
} else {
  toast.error(data.message);
}
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setIsPasswordSubmitting(false);
    }
  };

  const renderSpinner = () => (
    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
  );

  const currentStep = !isEmailSent ? 1 : !isOtpSubmitted ? 2 : 3;

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
                Password recovery
              </div>

              <h1 className="mt-6 text-4xl font-bold leading-tight text-white xl:text-5xl">
                Recover access to your academic account in three clear steps.
              </h1>

              <p className="mt-5 max-w-lg text-base leading-8 text-slate-300">
                Confirm your email, verify the reset code, and create a new password
                without leaving the Cognito authentication flow.
              </p>

              <div className="mt-10 grid gap-4">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-white">Step 1</p>
                      <p className="mt-1 text-sm leading-6 text-slate-400">
                        Send a reset code to your registered email.
                      </p>
                    </div>
                    <Mail className="h-5 w-5 text-cyan-300" />
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-white">Step 2</p>
                      <p className="mt-1 text-sm leading-6 text-slate-400">
                        Verify the six-digit OTP securely.
                      </p>
                    </div>
                    <ShieldCheck className="h-5 w-5 text-emerald-300" />
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-white">Step 3</p>
                      <p className="mt-1 text-sm leading-6 text-slate-400">
                        Set a stronger password and return to login.
                      </p>
                    </div>
                    <KeyRound className="h-5 w-5 text-violet-300" />
                  </div>
                </div>
              </div>
            </div>

            <p className="text-sm text-slate-500">
              Secure recovery flow for students, faculty, and administrators.
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

            <div className="rounded-[32px] border border-white/10 bg-white p-6 shadow-2xl sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">
                    Reset password
                  </p>
                  <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                    {!isEmailSent
                      ? "Start password recovery"
                      : !isOtpSubmitted
                      ? "Verify reset code"
                      : "Create a new password"}
                  </h1>
                  <p className="mt-3 text-sm leading-6 text-slate-500">
                    {!isEmailSent
                      ? "Enter your email to receive a verification code."
                      : !isOtpSubmitted
                      ? "Enter the 6-digit code sent to your email address."
                      : "Choose a strong new password for your account."}
                  </p>
                </div>

                <div className="hidden h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 sm:flex">
                  {!isEmailSent ? (
                    <Mail className="h-5 w-5" />
                  ) : !isOtpSubmitted ? (
                    <ShieldCheck className="h-5 w-5" />
                  ) : (
                    <Lock className="h-5 w-5" />
                  )}
                </div>
              </div>

              <div className="mt-6 flex items-center gap-2">
                {[1, 2, 3].map((step) => (
                  <div
                    key={step}
                    className={`h-2 flex-1 rounded-full ${
                      step <= currentStep ? "bg-cyan-500" : "bg-slate-200"
                    }`}
                  />
                ))}
              </div>

              {!isEmailSent && (
                <form onSubmit={onSubmitEmail} className="mt-8 space-y-4">
                  <div>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="Email address"
                        className={`w-full rounded-2xl py-3 pl-11 pr-12 text-sm text-slate-800 outline-none transition focus:ring-4 ${
                          email
                            ? isEmailValid
                              ? "border border-emerald-300 focus:border-emerald-400 focus:ring-emerald-100"
                              : "border border-rose-300 focus:border-rose-400 focus:ring-rose-100"
                            : "border border-slate-200 focus:border-cyan-400 focus:ring-cyan-100"
                        }`}
                        required
                      />

                      {email && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                          {isEmailValid ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-rose-500" />
                          )}
                        </div>
                      )}
                    </div>

                    {email && !isEmailValid && (
                      <p className="mt-2 text-sm text-rose-600">
                        Please enter a valid email address.
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={!isEmailFormValid() || isEmailSubmitting}
                    aria-busy={isEmailSubmitting}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full cursor-pointer bg-slate-950 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isEmailSubmitting ? (
                      <>
                        {renderSpinner()}
                        Sending code...
                      </>
                    ) : (
                      <>
                        Send reset code
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {!isOtpSubmitted && isEmailSent && (
                <form onSubmit={onSubmitOtp} className="mt-8 space-y-6">
                  <div onPaste={handlePaste}>
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
  disabled={isOtpSubmitting}
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
  ref={otpSubmitButtonRef}
  type="submit"
  disabled={!isOtpFormValid() || isOtpSubmitting}
  aria-busy={isOtpSubmitting}
  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
>
                    {isOtpSubmitting ? (
                      <>
                        {renderSpinner()}
                        Verifying...
                      </>
                    ) : (
                      <>
                        Verify OTP
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {isOtpSubmitted && isEmailSent && (
                <form onSubmit={onSubmitNewPassword} className="mt-8 space-y-4">
                  <div>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(event) => setNewPassword(event.target.value)}
                        placeholder="New password"
                        className="w-full rounded-2xl border border-slate-200 py-3 pl-11 pr-12 text-sm text-slate-800 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-slate-400 transition hover:text-slate-600"
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>

                    {newPassword && (
                      <div className="mt-3 space-y-2">
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full ${passwordStrength.color} transition-all duration-300`}
                            style={{ width: `${passwordStrength.strength}%` }}
                          />
                        </div>

                        <p
                          className={`text-sm font-medium ${
                            passwordStrength.label === "Weak"
                              ? "text-rose-600"
                              : passwordStrength.label === "Medium"
                              ? "text-amber-600"
                              : "text-emerald-600"
                          }`}
                        >
                          Password strength: {passwordStrength.label}
                        </p>

                        <p className="text-xs leading-6 text-slate-500">
                          Use at least 8 characters with uppercase, lowercase,
                          numbers, and a special character.
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        placeholder="Confirm new password"
                        className={`w-full rounded-2xl py-3 pl-11 pr-20 text-sm text-slate-800 outline-none transition focus:ring-4 ${
                          confirmPassword
                            ? isPasswordMatch
                              ? "border border-emerald-300 focus:border-emerald-400 focus:ring-emerald-100"
                              : "border border-rose-300 focus:border-rose-400 focus:ring-rose-100"
                            : "border border-slate-200 focus:border-cyan-400 focus:ring-cyan-100"
                        }`}
                        required
                      />

                      {confirmPassword && (
                        <div className="absolute right-12 top-1/2 -translate-y-1/2">
                          {isPasswordMatch ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-rose-500" />
                          )}
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-slate-400 transition hover:text-slate-600"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>

                    {confirmPassword && !isPasswordMatch && (
                      <p className="mt-2 text-sm text-rose-600">
                        Passwords do not match.
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={!isPasswordFormValid() || isPasswordSubmitting}
                    aria-busy={isPasswordSubmitting}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full cursor-pointer bg-slate-950 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isPasswordSubmitting ? (
                      <>
                        {renderSpinner()}
                        Resetting password...
                      </>
                    ) : (
                      <>
                        Reset password
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </form>
              )}

              <div className="mt-6 rounded-2xl bg-slate-50 px-4 py-4 text-center">
                <p className="text-sm text-slate-600">
                  Remember your password?{" "}
                  <span
                    onClick={() => navigate("/login?state=login")}
                    className="cursor-pointer font-semibold text-cyan-700 transition hover:text-cyan-800 hover:underline"
                  >
                    Back to login
                  </span>
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ResetPassword;