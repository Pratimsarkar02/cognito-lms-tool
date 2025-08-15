import {
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  Lock,
  Mail,
  User,
  UserCog,
  XCircle,
} from "lucide-react";
import { useState, useEffect, useContext } from "react";
import googleIcon from "../../assets/google.png";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AppContent } from "../../contexts/AppContext";
import axios from "axios";
import { toast } from "react-toastify";

const Login = () => {
  const navigate = useNavigate();
  const {
    checkAuthState,
    backendUrl 
  } = useContext(AppContent);

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
    if(params.get("state") === "login"){
      setState("Login");
    }
  },[location]);
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
    if (!pass) return { strength: 0, label: "", color: "bg-gray-200" };

    if (pass.length >= 8) strength += 20;
    if (/[A-Z]/.test(pass)) strength += 20;
    if (/[a-z]/.test(pass)) strength += 20;
    if (/[0-9]/.test(pass)) strength += 20;
    if (/[@#$%^&*]/.test(pass)) strength += 20;

    if (strength <= 25) return { strength, label: "Weak", color: "bg-red-500" };
    if (strength <= 75)
      return { strength, label: "Medium", color: "bg-yellow-500" };
    return { strength, label: "Strong", color: "bg-green-500" };
  };

  const getDashboardRoute = (userRole) => {
    const roleRoutes = {
      Student: "/student-dashboard",
      Faculty: "/faculty-dashboard",
      Admin: "/admin-dashboard",
    };
    return roleRoutes[userRole] || "/student-dashboard"; // fallback to student dashboard (by default)
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
    } else {
      return isEmailValid && password.length > 0;
    }
  };

  const handleSignUp = async () => {
    try {
      const { data } = await axios.post(backendUrl + "/api/auth/register", {
        firstName,
        lastName,
        email,
        password,
        role,
      });

      if (data && typeof data.success === "boolean") {
        toast.success(
          "Sign up successful! Please login with your credentials."
        );
        
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
      const { data } = await axios.post(`${backendUrl}/api/auth/login`, {
        email,
        password,
      });
  
      if (data.success) {
        
        await checkAuthState();
        
        // Get updated state from context
        const dashboardRoute = getDashboardRoute(data.user.role);
        navigate(dashboardRoute);
        
        toast.success(`Welcome to COGNITO, ${data.user.firstName}!`);
      }
      else{
        toast.error(data.message || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      const errorMessage = error.response?.data?.message 
      || error.message
      || "Login failed due to network error";
      toast.error(errorMessage);
    }
  };

  const onSubmitHandler = async (e) => {
    try {
      e.preventDefault();
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

  return (
    <div className="flex items-center justify-center min-h-screen px-6 sm:px-0 bg-gradient-to-br  from-yellow-100 via-green-50 to-white">
      <div className="fixed top-0 left-0 right-0 m-4">
          <Link to="/" className="flex items-center">
            <GraduationCap
              strokeWidth={2.25}
              size={40}
              className="mr-1 text-2xl font-semibold text-emerald-500"
            />
            <h1 className="text-3xl font-bold text-black">Cog</h1>
            <h1 className="text-3xl font-bold text-emerald-600 ml">Nito</h1>
          </Link>
        </div>
      <div className="p-9 m-5 rounded-4xl shadow-lg w-full sm:w-96 text-black text-sm bg-gradient-to-tr from-blue-50 via-white to-yellow-50">
        <h2 className="text-4xl font-bold text-center mb-3 gap-4">
          {state === "Sign Up" ? "Create Account" : "Login"}
        </h2>
        <p className="text-lg text-emerald-600 font-semibold text-center mb-4">
          {state === "Sign Up"
            ? "Create your account here"
            : "Login to your account"}
        </p>
        <form onSubmit={onSubmitHandler}>
          {/*First Name Input Field */}
          {state === "Sign Up" && (
            <div className="relative mb-4 gap-3">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First Name"
                className="w-full pl-10 text-lg pr-14 py-2 border rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                required
              />
            </div>
          )}
          {/*Last Name Input Field */}
          {state === "Sign Up" && (
            <div className="relative mb-4 gap-3">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last Name"
                className="w-full pl-10 text-lg pr-12 py-2 border rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                required
              />
            </div>
          )}

          {/*Email Input Field */}
          <div className="relative mb-4 gap-3">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email Address"
              className={`w-full pl-10 text-lg pr-12 py-2 border rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                email && (isEmailValid ? "border-green-500" : "border-red-500")
              }`}
              required
            />
            {email && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {isEmailValid ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
              </div>
            )}
          </div>
          {email && !isEmailValid && (
            <p className="text-sm text-red-500 mt-1">
              Please enter a valid email address
            </p>
          )}
          {/*Password Input Field */}
          <div className="relative mb-4 gap-3">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full pl-10 text-lg pr-12 py-2 border rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5 cursor-pointer" />
              ) : (
                <Eye className="h-5 w-5 cursor-pointer" />
              )}
            </button>
          </div>
          {state === "Sign Up" && (
            <div>
              {password && (
                <div className="space-y-1">
                  <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${passwordStrength.color} transition-all duration-300`}
                      style={{ width: `${passwordStrength.strength}%` }}
                    />
                  </div>
                  <p
                    className={`text-sm ${
                      passwordStrength.label === "Weak"
                        ? "text-red-500"
                        : passwordStrength.label === "Medium"
                        ? "text-yellow-600"
                        : "text-green-600"
                    }`}
                  >
                    Password strength: {passwordStrength.label}
                  </p>
                  <p className="text-xs text-gray-500">
                    Password must be at least 8 characters long and contain
                    uppercase, lowercase, numbers, and special characters
                  </p>
                </div>
              )}
            </div>
          )}

          {/*Confirm Password Input Field */}
          {state === "Sign Up" && (
            <div>
              <div className="relative mb-4 gap-3">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm Password"
                  className={`w-full pl-10 text-lg pr-12 py-2 border rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                    confirmPassword &&
                    (isPasswordMatch ? "border-green-500" : "border-red-500")
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 cursor-pointer" />
                  ) : (
                    <Eye className="h-5 w-5 cursor-pointer" />
                  )}
                </button>
                {confirmPassword && (
                  <div className="absolute right-12 top-1/2 -translate-y-1/2">
                    {isPasswordMatch ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                )}
              </div>
              <div>
                {confirmPassword && !isPasswordMatch && (
                  <p className="text-sm text-red-500 mt-1">
                    Passwords do not match
                  </p>
                )}
              </div>
            </div>
          )}

          {/*List of roles*/}
          {state === "Sign Up" && (
            <div className="relative mb-4 gap-3">
              <UserCog className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full pl-10 text-lg text-gray-500 pr-12 py-2 border rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 cursor-pointer"
                required
              >
                <option value="" disabled>
                  Select User Type...
                </option>
                <option value="Student">Student</option>
                <option value="Faculty">Faculty</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
          )}

          {/*Forget Password Button*/}
          <span
            onClick={() => navigate("/reset-password")}
            className="mb-4 flex items-center justify-left text-black font-semibold hover:underline cursor-pointer"
          >
            Forgot Password?
          </span>

          {/*Submit Button*/}
          <button
            type="submit"
            disabled={!isFormValid() || isLoading}
            className="w-full flex items-center justify-center bg-yellow-300 text-black size-12 font-medium py-3 px-4 border-2 text-lg border-black rounded-[32px] hover:bg-yellow-400 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Please wait..." : state}
          </button>

          <div className="flex items-center my-3">
            <div className="flex-grow border-t border-gray-300"></div>
            <span className="px-4 text-gray-500">OR</span>
            <div className="flex-grow border-t border-gray-300"></div>
          </div>
          {/*Google Sign In Button*/}
          <button
            type="button"
            className="w-full flex items-center size-12 justify-center gap-2 text-lg bg-white border-2 border-black text-gray-700 font-medium py-3 px-4 rounded-[32px] hover:bg-gray-200 transition-colors cursor-pointer"
          >
            <img src={googleIcon} className="h-5 w-5" />
            Continue with Google
          </button>
        </form>
        {state === "Sign Up" ? (
          <p className="text-center text-sm text-gray-600 mt-4">
            Already have an account?{" "}
            <span
              onClick={() => setState("Login")}
              className="text-emerald-600 hover:text-emerald-700 hover:underline font-medium cursor-pointer"
            >
              Login Here
            </span>
          </p>
        ) : (
          <p className="text-center text-sm text-gray-600 mt-4">
            Don&#39;t have an account?{" "}
            <span
              onClick={() => setState("Sign Up")}
              className="text-emerald-600 hover:text-emerald-700 hover:underline font-medium cursor-pointer"
            >
              Sign Up Now
            </span>
          </p>
        )}
      </div>
      </div>

  );
};

export default Login;
