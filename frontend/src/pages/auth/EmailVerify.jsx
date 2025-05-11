import { GraduationCap } from "lucide-react";
import React, { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AppContent } from "../../contexts/AppContext";
import axios from "axios";
import { toast } from "react-toastify";

const EmailVerify = () => {
  axios.defaults.withCredentials = true;

  const { 
    authState: { isLoggedIn, userData },
  backendUrl, checkAuthState
  } = useContext(AppContent);
  
  const [isLoading, setIsLoading] = useState(false);
  const [otpValues, setOtpValues] = useState(Array(6).fill(""));

  const navigate = useNavigate();
  const inputRefs = React.useRef([]);

  const getDashboardRoute = (userRole) => {
    const roleRoutes = {
      Student: "/student-dashboard",
      Faculty: "/faculty-dashboard",
      Admin: "/admin-dashboard",
    };
    return roleRoutes[userRole] || "/student-dashboard";
  };

  const handleInput = (e, index) => {
    const newValue = e.target.value.slice(-1); // Take only the last character
    const newOtpValues = [...otpValues];
    newOtpValues[index] = newValue;
    setOtpValues(newOtpValues);

    if (newValue && index < inputRefs.current.length - 1) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otpValues[index] && index > 0) {
      const newOtpValues = [...otpValues];
      newOtpValues[index - 1] = "";
      setOtpValues(newOtpValues);
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const paste = e.clipboardData.getData("text").slice(0, 6);
    const pasteArray = paste.slice(0, 6).split("");
    const newOtpValues = [...otpValues];

    pasteArray.forEach((char, index) => {
      if (index < 6) {
        newOtpValues[index] = char;
        if (inputRefs.current[index]) {
          inputRefs.current[index].value = char;
        }
      }
    });

    setOtpValues(newOtpValues);
  };

  const isFormValid = () => {
    return otpValues.every((value) => value.length === 1);
  };

  const onSubmitHandler = async (e) => {
    try {
      e.preventDefault();
      if (!isFormValid() || isLoading) return;

      setIsLoading(true);
      const otp = otpValues.join("");

      const { data } = await axios.post(
        backendUrl + "/api/auth/verify-account",
        {
          otp,
          userId: userData?.id,
        }
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
      }
    } catch (error) {
      toast.error(error.message || "Verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn && userData?.isAccountVerified) {
      const dashboardRoute = getDashboardRoute(userData.role);
      navigate(dashboardRoute);
    }
  }, [isLoggedIn, userData, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen px-6 sm:px-0 bg-gradient-to-br from-yellow-100 via-green-50 to-white">
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
      <form
        onSubmit={onSubmitHandler}
        className="p-9 m-5 rounded-4xl shadow-lg w-full sm:w-96 text-black text-sm bg-gradient-to-tr from-blue-50 via-white to-yellow-50"
      >
        <h1 className="text-2xl font-semibold text-center mb-3 gap-4">
          Email Verification OTP
        </h1>
        <p className="text-emerald-600 text-center mb-6">
          Enter the 6-digit code sent to your Email id.
        </p>
        <div className="flex justify-between mb-8" onPaste={handlePaste}>
          {Array(6)
            .fill(0)
            .map((_, index) => (
              <input
                type="text"
                maxLength="1"
                key={index}
                required
                value={otpValues[index]}
                disabled={isLoading}
                className="w-12 h-12 bg-gray-200 text-black text-center text-xl rounded-md
                disabled:opacity-50 disabled:cursor-not-allowed
                focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                ref={(e) => (inputRefs.current[index] = e)}
                onChange={(e) => handleInput(e, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
              />
            ))}
        </div>
        <button
          type="submit"
          disabled={!isFormValid() || isLoading}
          className="w-full flex items-center justify-center bg-yellow-300 text-black size-12 font-medium py-3 px-4 border-2 text-lg border-black rounded-[32px] 
            hover:bg-yellow-400 transition-colors cursor-pointer 
            disabled:opacity-50 disabled:cursor-not-allowed
            disabled:hover:bg-yellow-300"
        >
          {isLoading ? "Verifying..." : "Verify OTP"}
        </button>
      </form>
    </div>
  );
};

export default EmailVerify;
