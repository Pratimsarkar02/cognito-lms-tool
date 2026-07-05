import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  User,
  UserCog,
  Users,
  XCircle,
} from "lucide-react";
import { useState, useEffect, useContext } from "react";
import googleIcon from "../../assets/google.png";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AppContent } from "../../contexts/AppContext";
import axios from "axios";
import { toast } from "react-toastify";
import { withMinimumLoading } from "../../utils/withMinimumLoading";

const Login = () => {
  const navigate = useNavigate();
  const { checkAuthState, backendUrl } = useContext(AppContent);
  const location = useLocation();

  const [state, setState] = useState("Sign Up");
  const [isLoading, setIsLoading] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isEmailValid, setIsEmailValid] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isPasswordMatch, setIsPasswordMatch] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("state") === "login") {
      setState("Login");
    }
  }, [location]);

  useEffect(() => {
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setIsEmailValid(validEmail.test(email));
  }, [email]);

  useEffect(() => {
    if (password && state === "Sign Up") {
      setIsPasswordMatch(password === confirmPassword);
    } else {
      setConfirmPassword("");
      setIsPasswordMatch(false);
    }
  }, [password, confirmPassword, state]);

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

  const getDashboardRoute = (userRole) => {
    const roleRoutes = {
      Student: "/student-dashboard",
      Faculty: "/faculty-dashboard",
      Admin: "/admin-dashboard",
    };
    return roleRoutes[userRole] || "/student-dashboard";
  };

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setPassword("");
    setRole("");
    setConfirmPassword("");
  };

  const passwordStrength = calculatePasswordStrength(password);

  const isFormValid = () => {
    if (state === "Sign Up") {
      return (
        isEmailValid &&
        password.length >= 8 &&
        isPasswordMatch &&
        passwordStrength.strength >= 75 &&
        firstName &&
        lastName &&
        role
      );
    }

    return isEmailValid && password.length > 0;
  };

  const handleSignUp = async () => {
    try {
      const { data } = await withMinimumLoading(
  () =>
    axios.post(backendUrl + "/api/auth/register", {
      firstName,
      lastName,
      email,
      password,
      role,
    }),
  1000
);

      if (data && typeof data.success === "boolean") {
        toast.success("Sign up successful! Please login with your credentials.");
        resetForm();
        setState("Login");
      } else {
        toast.error(data.message || "Sign up failed");
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || "Sign up failed";
      toast.error(errorMessage);
    }
  };

  const handleLogin = async () => {
    try {
      const { data } = await withMinimumLoading(
  () =>
    axios.post(`${backendUrl}/api/auth/login`, {
      email,
      password,
    }),
  1000
);

      if (data.success) {
        await checkAuthState();
        const dashboardRoute = getDashboardRoute(data.user.role);
        navigate(dashboardRoute);
        toast.success(`Welcome to COGNITO, ${data.user.firstName}!`);
      } else {
        toast.error(data.message || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Login failed due to network error";
      toast.error(errorMessage);
    }
  };

  const onSubmitHandler = async (event) => {
    try {
      event.preventDefault();
      setIsLoading(true);

      try {
        axios.defaults.withCredentials = true;
      } catch (error) {
        console.error("Error setting axios defaults:", error);
      }

      if (state === "Sign Up") {
        await handleSignUp();
      } else {
        await handleLogin();
      }
    } catch (error) {
      console.error("Authentication error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const isSignup = state === "Sign Up";

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
                Academic access
              </div>

              <h1 className="mt-6 text-4xl font-bold leading-tight text-white xl:text-5xl">
                {isSignup
                  ? "Create your Cognito account and join your academic workspace."
                  : "Welcome back to your campus learning and exam hub."}
              </h1>

              <p className="mt-5 max-w-lg text-base leading-8 text-slate-300">
                Access course activity, exam workflows, notifications, and role-based
                academic tools from one focused platform.
              </p>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                  <Users className="h-5 w-5 text-cyan-300" />
                  <p className="mt-4 text-sm font-semibold text-white">Role-aware</p>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    Separate flows for students, faculty, and admins.
                  </p>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                  <ShieldCheck className="h-5 w-5 text-emerald-300" />
                  <p className="mt-4 text-sm font-semibold text-white">Secure access</p>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    Built for safer login and institutional workflows.
                  </p>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                  <Mail className="h-5 w-5 text-violet-300" />
                  <p className="mt-4 text-sm font-semibold text-white">Stay updated</p>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    Get academic alerts, reminders, and feed updates.
                  </p>
                </div>
              </div>
            </div>

            <p className="text-sm text-slate-500">
              Designed to keep learning, exams, and communication connected.
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
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">
                    {isSignup ? "Create account" : "Login"}
                  </p>
                  <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                    {isSignup ? "Get started with Cognito" : "Sign in to continue"}
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-slate-500">
                    {isSignup
                      ? "Set up your account to access your academic workspace."
                      : "Use your credentials to access your dashboard."}
                  </p>
                </div>

                <div className="hidden h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 sm:flex">
                  <GraduationCap className="h-5 w-5" />
                </div>
              </div>

              <form onSubmit={onSubmitHandler} className="mt-8 space-y-4">
                {isSignup && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={firstName}
                        onChange={(event) => setFirstName(event.target.value)}
                        placeholder="First name"
                        className="w-full rounded-2xl border border-slate-200 py-3 pl-11 pr-4 text-sm text-slate-800 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                        required
                      />
                    </div>

                    <div className="relative">
                      <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={lastName}
                        onChange={(event) => setLastName(event.target.value)}
                        placeholder="Last name"
                        className="w-full rounded-2xl border border-slate-200 py-3 pl-11 pr-4 text-sm text-slate-800 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                        required
                      />
                    </div>
                  </div>
                )}

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

                <div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Password"
                      className="w-full rounded-2xl border border-slate-200 py-3 pl-11 pr-12 text-sm text-slate-800 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>

                  {isSignup && password && (
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

                {isSignup && (
                  <>
                    <div>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(event) => setConfirmPassword(event.target.value)}
                          placeholder="Confirm password"
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
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
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

                    <div className="relative">
                      <UserCog className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                      <select
                        id="role"
                        value={role}
                        onChange={(event) => setRole(event.target.value)}
                        className="w-full cursor-pointer rounded-2xl border border-slate-200 py-3 pl-11 pr-4 text-sm text-slate-700 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                        required
                      >
                        <option value="" disabled>
                          Select user type...
                        </option>
                        <option value="Student">Student</option>
                        <option value="Faculty">Faculty</option>
                        <option value="Admin">Admin</option>
                      </select>
                    </div>
                  </>
                )}

                {!isSignup && (
                  <div className="flex justify-end">
                    <span
                      onClick={() => navigate("/reset-password")}
                      className="cursor-pointer text-sm font-medium text-cyan-700 transition hover:text-cyan-800 hover:underline"
                    >
                      Forgot password?
                    </span>
                  </div>
                )}

                <button
  type="submit"
  disabled={!isFormValid() || isLoading}
  aria-busy={isLoading}
  className="inline-flex w-full items-center justify-center gap-2 rounded-full cursor-pointer bg-slate-950 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
>
  {isLoading ? (
    <>
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
      {isSignup ? "Creating account..." : "Logging in..."}
    </>
  ) : (
    <>
      {isSignup ? "Create account" : "Login"}
      <ArrowRight className="h-4 w-4" />
    </>
  )}
</button>

                <div className="flex items-center gap-4 py-1">
                  <div className="h-px flex-1 bg-slate-200" />
                  <span className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                    Or
                  </span>
                  <div className="h-px flex-1 bg-slate-200" />
                </div>

                <button
                  type="button"
                  className="inline-flex w-full items-center justify-center gap-3 rounded-full border cursor-pointer border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <img src={googleIcon} alt="Google" className="h-5 w-5" />
                  Continue with Google
                </button>
              </form>

              <div className="mt-6 rounded-2xl bg-slate-50 px-4 py-4 text-center">
                {isSignup ? (
                  <p className="text-sm text-slate-600">
                    Already have an account?{" "}
                    <span
                      onClick={() => setState("Login")}
                      className="cursor-pointer font-semibold text-cyan-700 transition hover:text-cyan-800 hover:underline"
                    >
                      Login here
                    </span>
                  </p>
                ) : (
                  <p className="text-sm text-slate-600">
                    Don&#39;t have an account?{" "}
                    <span
                      onClick={() => setState("Sign Up")}
                      className="cursor-pointer font-semibold text-cyan-700 transition hover:text-cyan-800 hover:underline"
                    >
                      Sign up now
                    </span>
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Login;