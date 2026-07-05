import { useContext, useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppContent } from "../../../contexts/AppContext";
import axios from "axios";
import { toast } from "react-toastify";
import { getSocket } from "../../../utils/socket";

const ExamReview = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { backendUrl } = useContext(AppContent);

  const [questions, setQuestions] = useState([]);
  const [remainingTime, setRemainingTime] = useState(0);
  const [attemptId, setAttemptId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [responses, setResponses] = useState({});
  const joinedAttemptRef = useRef(null);
  const headerRef = useRef(null);

  const getOptionLabel = (option) => {
    if (typeof option === "string") return option;
    if (option && typeof option === "object") {
      return option.text || option.label || option.value || "";
    }
    return "";
  };

  useEffect(() => {
    const attemptData = localStorage.getItem(`examAttempt-${examId}`);
    if (attemptData) {
      const parsedData = JSON.parse(attemptData);
      setResponses(parsedData.responses || {});
      if (parsedData.attemptId) {
        setAttemptId(parsedData.attemptId);
      }
    }
  }, [examId]);

  useEffect(() => {
    let isMounted = true;

    const initializeReview = async () => {
      setIsLoading(true);

      try {
        let currentAttemptId = attemptId;

        if (!currentAttemptId) {
          const { data } = await axios.get(`${backendUrl}/api/exams/${examId}/attempt`, {
            withCredentials: true,
          });
          currentAttemptId = data.attempt._id;

          if (!isMounted) return;
          setAttemptId(currentAttemptId);
        }

        const socket = getSocket();
        if (socket?.connected) {
          socket.emit("join-exam-room", currentAttemptId);
          joinedAttemptRef.current = currentAttemptId;
          console.log("[ExamReview] Joined exam room:", currentAttemptId);
        } else {
          console.warn("[ExamReview] Shared socket not connected. Timer updates unavailable.");
        }

        const questionsRes = await axios.get(`${backendUrl}/api/questions/${examId}/questions`, {
          withCredentials: true,
        });

        if (!isMounted) return;
        setQuestions(questionsRes.data.questions || []);
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to load review data:", error);
        toast.error("Failed to load review data");
        navigate("/student-dashboard/exams");
      }
    };

    initializeReview();

    return () => {
      isMounted = false;
      const socket = getSocket();
      if (socket?.connected && joinedAttemptRef.current) {
        socket.emit("leave-exam-room");
        console.log("[ExamReview] Left exam room:", joinedAttemptRef.current);
      }
      joinedAttemptRef.current = null;
    };
  }, [examId, backendUrl, navigate, attemptId]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleTimerUpdate = (time) => {
      setRemainingTime(time);
    };

    const handleTimeExpired = async () => {
      console.log("=== AUTO-SUBMIT TRIGGERED ===");
      try {
        const savedData = localStorage.getItem(`examAttempt-${examId}`);
        if (!savedData) {
          toast.info("No responses to submit.");
          navigate("/student-dashboard/exams");
          return;
        }

        const parsedData = JSON.parse(savedData);
        const currentResponses = parsedData.responses || {};

        await axios.get(`${backendUrl}/api/user/data`, { withCredentials: true });

        await axios.post(
          `${backendUrl}/api/responses/${examId}/batch`,
          { responses: currentResponses },
          { withCredentials: true, timeout: 10000 }
        );

        localStorage.removeItem(`examAttempt-${examId}`);

        if (socket?.connected && joinedAttemptRef.current) {
          socket.emit("leave-exam-room");
        }
        joinedAttemptRef.current = null;

        toast.success("Exam submitted successfully due to time expiry.");
        navigate("/student-dashboard/exams");
      } catch (error) {
        console.error("=== AUTO-SUBMIT ERROR ===");
        console.error("Error type:", error.name);
        console.error("Error message:", error.message);
        console.error("Response status:", error.response?.status);
        console.error("Response data:", error.response?.data);

        let errorMessage = "Error submitting responses automatically.";
        if (error.code === "ECONNABORTED") {
          errorMessage = "Submission timeout. Please check your connection.";
        } else if (error.response?.status === 401) {
          errorMessage = "Authentication failed. Please login again.";
        } else if (error.response?.status === 404) {
          errorMessage = "Exam not found.";
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        }

        toast.error(errorMessage);
        navigate("/student-dashboard/exams");
      }
    };

    const handleExamError = (error) => {
      console.error("Review page exam error:", error);
      toast.error(error.message || "An error occurred with the exam");
      navigate("/student-dashboard/exams");
    };

    socket.on("timer-update", handleTimerUpdate);
    socket.on("time-expired", handleTimeExpired);
    socket.on("exam-error", handleExamError);

    return () => {
      socket.off("timer-update", handleTimerUpdate);
      socket.off("time-expired", handleTimeExpired);
      socket.off("exam-error", handleExamError);
    };
  }, [examId, backendUrl, navigate]);

  const handleFinalSubmit = async () => {
    try {
      await axios.post(
        `${backendUrl}/api/responses/${examId}/batch`,
        { responses },
        { withCredentials: true }
      );

      localStorage.removeItem(`examAttempt-${examId}`);

      const socket = getSocket();
      if (socket?.connected && joinedAttemptRef.current) {
        socket.emit("leave-exam-room");
      }
      joinedAttemptRef.current = null;

      toast.success("Exam submitted successfully!");
      navigate("/student-dashboard/exams");
    } catch (error) {
      toast.error("Submission failed: " + (error.response?.data?.message || error.message));
    }
  };

  const handleBackToExam = () => {
    navigate(`/student-dashboard/exams/${examId}/attempt`);
  };

  const formatTime = (seconds) => {
    if (!seconds && seconds !== 0) return "00:00:00";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const getAnsweredCount = () => {
    return Object.keys(responses).filter((key) => responses[key]?.length > 0).length;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-100 flex justify-center items-center">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="text-gray-600 mt-4 text-center">Loading review...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-100">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div
            ref={headerRef}
            className="bg-gradient-to-r from-teal-600 to-green-600 text-white p-6 sticky top-0 z-10"
          >
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold mb-2">Review Your Answers</h1>
                <p className="text-teal-100">
                  {getAnsweredCount()} of {questions.length} questions answered
                </p>
              </div>

              <div className="bg-white/20 backdrop-blur-sm rounded-xl px-6 py-3">
                <div className="text-sm text-teal-100 mb-1">Time Remaining</div>
                <div className="text-2xl font-bold font-mono">{formatTime(remainingTime)}</div>
              </div>
            </div>
          </div>

          <div className="p-6 lg:p-8">
            <div className="space-y-6">
              {questions.map((question, questionIndex) => {
                const selectedOptions = responses[question._id] || [];

                return (
                  <div
                    key={question._id}
                    className="bg-gray-50 rounded-2xl p-6 border border-gray-200 shadow-sm"
                  >
                    <div className="mb-4">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
                        <span className="bg-teal-100 text-teal-700 px-3 py-1 rounded-full text-sm font-medium">
                          Question {questionIndex + 1}
                        </span>
                        <span className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm">
                          {question.questionType === "msq" ? "Multiple Select" : "Single Select"}
                        </span>
                      </div>

                      <h3 className="text-lg lg:text-xl font-semibold text-gray-800 leading-relaxed">
                        {question.questionText || question.question}
                      </h3>
                    </div>

                    <div className="space-y-3">
                      {(question.options || []).map((option, optionIndex) => {
                        const isSelected = selectedOptions.includes(optionIndex);

                        return (
                          <div
                            key={option?._id || optionIndex}
                            className={`p-4 rounded-xl border-2 transition-all ${
                              isSelected
                                ? "border-teal-500 bg-teal-50 shadow-sm"
                                : "border-gray-200 bg-white"
                            }`}
                          >
                            <div className="flex items-start gap-4">
                              <div
  className={`flex-shrink-0 w-6 h-6 border-2 flex items-center justify-center mt-0.5 ${
    question.questionType === "msq" ? "rounded-md" : "rounded-full"
  } ${
    isSelected
      ? "border-teal-500 bg-teal-500"
      : "border-gray-300 bg-white"
  }`}
>
  {isSelected &&
    (question.questionType === "msq" ? (
      <svg
        className="w-3.5 h-3.5 text-white"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
          d="M16.704 5.29a1 1 0 010 1.42l-7.2 7.2a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.42l2.293 2.294 6.493-6.494a1 1 0 011.414 0z"
          clipRule="evenodd"
        />
      </svg>
    ) : (
      <div className="w-2 h-2 bg-white rounded-full"></div>
    ))}
</div>
                              <span
                                className={`leading-relaxed ${
                                  isSelected ? "text-teal-800 font-medium" : "text-gray-700"
                                }`}
                              >
                                {getOptionLabel(option)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {selectedOptions.length === 0 && (
                      <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                        <p className="text-amber-700 text-sm font-medium">
                          No answer selected for this question
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-8 flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-gray-200">
              <button
                onClick={handleBackToExam}
                className="px-8 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all duration-200"
              >
                ← Back to Exam
              </button>

              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-600">
                  Progress:{" "}
                  <span className="font-semibold text-teal-600">
                    {getAnsweredCount()}/{questions.length}
                  </span>
                </div>

                <button
                  onClick={handleFinalSubmit}
                  className="px-8 py-3 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  Final Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamReview;