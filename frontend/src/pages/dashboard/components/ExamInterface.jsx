import { useContext, useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppContent } from "../../../contexts/AppContext";
import axios from "axios";
import { toast } from "react-toastify";
import { getSocket } from "../../../utils/socket";

const ExamInterface = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { backendUrl } = useContext(AppContent);

  const [examData, setExamData] = useState({
    questions: [],
    duration: 0,
    title: "",
    attemptId: null,
  });
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState({});
  const [serverTime, setServerTime] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const joinedAttemptRef = useRef(null);

  const getOptionLabel = (option) => {
    if (typeof option === "string") return option;
    if (option && typeof option === "object") {
      return option.text || option.label || option.value || "";
    }
    return "";
  };

  useEffect(() => {
    let isMounted = true;

    const initializeExam = async () => {
      setIsLoading(true);
      try {
        const { data } = await axios.get(`${backendUrl}/api/exams/${examId}/attempt`, {
          withCredentials: true,
        });

        const attemptId = data.attempt._id;

        const [examRes, questionsRes] = await Promise.all([
          axios.get(`${backendUrl}/api/exams/${examId}`, { withCredentials: true }),
          axios.get(`${backendUrl}/api/questions/${examId}/questions`, {
            withCredentials: true,
          }),
        ]);

        if (!isMounted) return;

        setExamData({
          questions: questionsRes.data.questions || [],
          duration: examRes.data.duration,
          title: examRes.data.title,
          attemptId,
        });

        const saved = localStorage.getItem(`examAttempt-${examId}`);
        if (saved) {
          const savedData = JSON.parse(saved);
          setResponses(savedData.responses || {});
          setCurrentQuestion(savedData.currentQuestion || 0);
        }

        const socket = getSocket();
        if (socket?.connected) {
          socket.emit("join-exam-room", attemptId);
          joinedAttemptRef.current = attemptId;
          console.log("[ExamInterface] Joined exam room:", attemptId);
        } else {
          console.warn("[ExamInterface] Shared socket not connected. Timer updates unavailable.");
        }

        setIsLoading(false);
      } catch (error) {
        console.error("Exam initialization error:", error);
        toast.error("Failed to initialize exam");
        navigate("/student-dashboard/exams");
      }
    };

    initializeExam();

    return () => {
      isMounted = false;
      const socket = getSocket();
      if (socket?.connected && joinedAttemptRef.current) {
        socket.emit("leave-exam-room");
        console.log("[ExamInterface] Left exam room:", joinedAttemptRef.current);
      }
      joinedAttemptRef.current = null;
    };
  }, [examId, backendUrl, navigate]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleTimerUpdate = (time) => {
      setServerTime(time);
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
      console.error("Exam error:", error);
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

  useEffect(() => {
    if (examData.attemptId) {
      localStorage.setItem(
        `examAttempt-${examId}`,
        JSON.stringify({
          responses,
          currentQuestion,
          attemptId: examData.attemptId,
        })
      );
    }
  }, [responses, currentQuestion, examId, examData.attemptId]);

  const handleAnswerSelect = (optionIndex) => {
    if (!examData.questions[currentQuestion]) return;

    const questionId = examData.questions[currentQuestion]._id;
    const newResponses = { ...responses };

    if (examData.questions[currentQuestion].questionType === "msq") {
      newResponses[questionId] = newResponses[questionId]?.includes(optionIndex)
        ? newResponses[questionId].filter((i) => i !== optionIndex)
        : [...(newResponses[questionId] || []), optionIndex];
    } else {
      newResponses[questionId] = [optionIndex];
    }

    setResponses(newResponses);
  };

  const isOptionSelected = (questionId, optionIndex) => {
    return responses[questionId] ? responses[questionId].includes(optionIndex) : false;
  };

  const handleReviewClick = () => {
    navigate(`/student-dashboard/exams/${examId}/review`);
  };

  const formatTime = (seconds) => {
    if (!seconds && seconds !== 0) return "00:00:00";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex justify-center items-center">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4 text-center">Loading exam...</p>
        </div>
      </div>
    );
  }

  const currentQuestionData = examData.questions[currentQuestion];

  if (!currentQuestionData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex justify-center items-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <p className="text-red-600 text-lg font-semibold">No question found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold mb-2">{examData.title}</h1>
                <p className="text-indigo-100">
                  Question {currentQuestion + 1} of {examData.questions.length}
                </p>
              </div>

              <div className="bg-white/20 backdrop-blur-sm rounded-xl px-6 py-3">
                <div className="text-sm text-indigo-100 mb-1">Time Remaining</div>
                <div className="text-2xl font-bold font-mono">{formatTime(serverTime)}</div>
              </div>
            </div>
          </div>

          <div className="flex flex-col xl:flex-row min-h-[600px]">
            <div className="flex-1 p-6 lg:p-8">
              <div className="mb-8">
                <div className="bg-indigo-50 rounded-xl p-4 mb-6">
                  <span className="text-sm font-medium text-indigo-600 uppercase tracking-wide">
                    {currentQuestionData.questionType === "msq"
                      ? "Multiple Select Question"
                      : "Single Select Question"}
                  </span>
                </div>

                <h2 className="text-xl lg:text-2xl font-semibold text-gray-800 leading-relaxed">
                  {currentQuestionData.questionText || currentQuestionData.question}
                </h2>
              </div>

              <div className="space-y-4">
                {(currentQuestionData.options || []).map((option, index) => (
                  <button
                    key={option?._id || index}
                    type="button"
                    onClick={() => handleAnswerSelect(index)}
                    className={`w-full p-4 lg:p-5 rounded-xl border-2 transition-all duration-200 text-left hover:shadow-md ${
                      isOptionSelected(currentQuestionData._id, index)
                        ? "border-indigo-500 bg-indigo-50 shadow-md"
                        : "border-gray-200 bg-white hover:border-indigo-300"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div
  className={`flex-shrink-0 w-6 h-6 border-2 flex items-center justify-center mt-0.5 ${
    currentQuestionData.questionType === "msq" ? "rounded-md" : "rounded-full"
  } ${
    isOptionSelected(currentQuestionData._id, index)
      ? "border-indigo-500 bg-indigo-500"
      : "border-gray-300 bg-white"
  }`}
>
  {isOptionSelected(currentQuestionData._id, index) &&
    (currentQuestionData.questionType === "msq" ? (
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
                      <span className="text-gray-800 leading-relaxed">
                        {getOptionLabel(option)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setCurrentQuestion((prev) => Math.max(prev - 1, 0))}
                  disabled={currentQuestion === 0}
                  className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                    currentQuestion === 0
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  ← Previous
                </button>

                <div className="flex gap-3">
                  <button
                    onClick={handleReviewClick}
                    className="px-6 py-3 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600 transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    Review Answers
                  </button>

                  <button
                    onClick={() =>
                      setCurrentQuestion((prev) =>
                        Math.min(prev + 1, examData.questions.length - 1)
                      )
                    }
                    disabled={currentQuestion === examData.questions.length - 1}
                    className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                      currentQuestion === examData.questions.length - 1
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg"
                    }`}
                  >
                    Next →
                  </button>
                </div>
              </div>
            </div>

            <div className="xl:w-80 bg-gray-50 p-6 border-t xl:border-t-0 xl:border-l border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Question Navigator</h3>

              <div className="grid grid-cols-5 xl:grid-cols-4 gap-3">
                {examData.questions.map((question, index) => {
                  const isAnswered = responses[question._id]?.length > 0;
                  const isCurrent = currentQuestion === index;

                  return (
                    <button
                      key={question._id}
                      onClick={() => setCurrentQuestion(index)}
                      className={`w-12 h-12 rounded-xl font-medium text-sm transition-all duration-200 ${
                        isCurrent
                          ? "bg-indigo-600 text-white shadow-lg scale-105"
                          : isAnswered
                          ? "bg-green-100 text-green-700 border-2 border-green-300 hover:bg-green-200"
                          : "bg-white text-gray-600 border-2 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50"
                      }`}
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="w-4 h-4 bg-indigo-600 rounded"></div>
                  <span>Current Question</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="w-4 h-4 bg-green-100 border-2 border-green-300 rounded"></div>
                  <span>Answered</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="w-4 h-4 bg-white border-2 border-gray-200 rounded"></div>
                  <span>Not Answered</span>
                </div>
              </div>

              <div className="mt-6 p-4 bg-white rounded-xl border border-gray-200">
                <div className="text-sm text-gray-600 mb-2">Progress</div>
                <div className="text-2xl font-bold text-indigo-600">
                  {
                    Object.keys(responses).filter((key) => responses[key]?.length > 0).length
                  }{" "}
                  / {examData.questions.length}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                  <div
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${
                        (Object.keys(responses).filter((key) => responses[key]?.length > 0).length /
                          examData.questions.length) *
                        100
                      }%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div> 
    </div>
  );
};

export default ExamInterface;