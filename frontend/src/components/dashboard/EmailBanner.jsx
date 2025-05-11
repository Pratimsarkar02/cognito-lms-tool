import { useContext } from "react";
import { Link } from "react-router-dom";
import { AppContent } from "../../contexts/AppContext";
import { toast } from "react-toastify";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const EmailVerificationBanner = () => {
  const navigate = useNavigate();
  const { 
    authState: { userData },
    backendUrl 
  } = useContext(AppContent);

  // Only show banner if user exists and email is not verified
  if (!userData || userData.isAccountVerified) {
    return null;
  }

  const sendVerifyOtp = async () => {
    try {
      axios.defaults.withCredentials = true;
      const { data } = await axios.post(
        backendUrl + "/api/auth/send-verify-otp"
      );
      if (data.success) {
        navigate("/email-verify");
        toast.success("Email Verification OTP sent to your mail.");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message || "Failed to send verification email");
    }
  };

  return (
    <div className="relative bg-yellow-200 text-yellow-800 text-sm p-3 flex items-center justify-between left-0 w-full shadow-md" 
         style={{ top: "64px" }}>
      <span className="flex-1 text-center md:text-left md:flex-none">
        ⚠️ Please verify your email address by clicking the link sent to{" "}
        <strong>{userData.email}</strong>.
      </span>

      <Link
        to="/email-verify"
        onClick={sendVerifyOtp}
        className="font-semibold bg-white border-2 px-3 py-1 border-yellow-400 rounded hover:bg-gray-50 transition-colors cursor-pointer ml-2"
      >
        Verify Email
      </Link>
    </div>
  );
};

export default EmailVerificationBanner;