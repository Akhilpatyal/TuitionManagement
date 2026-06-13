"use client";

import React, { useState, useEffect } from "react";
import { Student, Quiz, QuizType } from "@prisma/client";

import {
  Sparkles,
  UploadCloud,
  Plus,
  BookOpen,
  BrainCircuit,
  User,
  Layers,
  HelpCircle,
  Clock,
  CheckCircle2,
  Trash2,
  PenLine,
  ListChecks,
  Copy,
  Users,
  ArrowUp,
  ArrowDown,
  X,
  Check,
} from "lucide-react";
type StudentWithUser = Student & {
  name: string;
};
type QuizQuestion = {
  type: string;
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
};

type ManualQuestion = {
  type: string;
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
};

type GeneratedQuizType = {
  title: string;
  description: string;
  batch: string;
  durationMin: number;
  difficulty: string;
  questions: QuizQuestion[];
};
export default function QuizManagement() {
  const [students, setStudents] = useState<StudentWithUser[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);

  // File upload state
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // AI generation controls
  const [subject, setSubject] = useState("Physics");
  const [aiClass, setAiClass] = useState("Grade 10");
  const [batch, setBatch] = useState("Alpha Batch");
  const [difficulty, setDifficulty] = useState<string>("ADAPTIVE");
  const [numQuestions, setNumQuestions] = useState(30);
  const [targetStudentId, setTargetStudentId] = useState("");
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);

  const classOptions = Array.from({ length: 9 }, (_, i) => `Grade ${i + 4}`);

  // Generating states
  const [isGenerating, setIsGenerating] = useState(false);
  const [genStep, setGenStep] = useState(0);
  const [generatedQuiz, setGeneratedQuiz] = useState<GeneratedQuizType | null>(
    null,
  );
  // Manual quiz builder states
  const [manualTitle, setManualTitle] = useState("");
  const [manualSubject, setManualSubject] = useState("Physics");
  const [manualBatch, setManualBatch] = useState("Alpha Batch");
  const [manualDuration, setManualDuration] = useState(15);
  const [manualTargetStudentId, setManualTargetStudentId] = useState("");
  const [isSavingManual, setIsSavingManual] = useState(false);

  const blankQuestion = (): ManualQuestion => ({
    type: "MCQ",
    question: "",
    options: ["", "", "", ""],
    correctAnswer: "0",
    explanation: "",
  });
  const [manualQuestions, setManualQuestions] = useState<ManualQuestion[]>([
    blankQuestion(),
  ]);

  const updateQuestion = (idx: number, patch: Partial<ManualQuestion>) => {
    setManualQuestions((prev) =>
      prev.map((q, i) => (i === idx ? { ...q, ...patch } : q)),
    );
  };

  const changeQuestionType = (idx: number, type: string) => {
    if (type === "MCQ")
      updateQuestion(idx, {
        type,
        options: ["", "", "", ""],
        correctAnswer: "0",
      });
    else if (type === "TRUE_FALSE")
      updateQuestion(idx, { type, options: undefined, correctAnswer: "true" });
    else updateQuestion(idx, { type, options: undefined, correctAnswer: "" });
  };

  const updateOption = (qIdx: number, oIdx: number, value: string) => {
    setManualQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx || !q.options) return q;
        const options = q.options.map((o, j) => (j === oIdx ? value : o));
        return { ...q, options };
      }),
    );
  };

  const addQuestion = () =>
    setManualQuestions((prev) => [...prev, blankQuestion()]);
  const removeQuestion = (idx: number) =>
    setManualQuestions((prev) =>
      prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev,
    );

  const handleCreateManualQuiz = async () => {
    if (!manualTitle.trim()) {
      alert("Please enter a quiz title.");
      return;
    }
    // Validate questions
    for (let i = 0; i < manualQuestions.length; i++) {
      const q = manualQuestions[i];
      if (!q.question.trim()) {
        alert(`Question ${i + 1} is empty.`);
        return;
      }
      if (q.type === "MCQ") {
        if (!q.options || q.options.some((o) => !o.trim())) {
          alert(`Fill all 4 options for question ${i + 1}.`);
          return;
        }
      } else if (q.type === "SHORT_ANSWER" && !q.correctAnswer.trim()) {
        alert(`Provide the correct answer for question ${i + 1}.`);
        return;
      }
    }

    setIsSavingManual(true);
    try {
      const res = await fetch("/api/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_manual",
          title: manualTitle,
          subject: manualSubject,
          batch: manualBatch,
          durationMin: manualDuration,
          questions: manualQuestions,
          targetStudentId: manualTargetStudentId || undefined,
        }),
      });

      if (res.ok) {
        setManualTitle("");
        setManualDuration(15);
        setManualTargetStudentId("");
        setManualQuestions([blankQuestion()]);
        fetchQuizzesAndStudents();
        alert("Quiz created and assigned successfully.");
      } else {
        const err = await res.json();
        alert(err.error || "Failed to create quiz.");
      }
    } catch (e) {
      console.error("Manual quiz create failed:", e);
      alert("Failed to create quiz.");
    } finally {
      setIsSavingManual(false);
    }
  };

  // ---- Edit / Reassign / Duplicate existing quizzes ----
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editSubject, setEditSubject] = useState("Physics");
  const [editBatch, setEditBatch] = useState("Alpha Batch");
  const [editDuration, setEditDuration] = useState(15);
  const [editDifficulty, setEditDifficulty] = useState("MEDIUM");
  const [editTargetStudentId, setEditTargetStudentId] = useState("");
  const [editQuestions, setEditQuestions] = useState<ManualQuestion[]>([]);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [reassignQuiz, setReassignQuiz] = useState<Quiz | null>(null);
  const [reassignBatch, setReassignBatch] = useState("Alpha Batch");
  const [reassignStudentId, setReassignStudentId] = useState("");
  const [isReassigning, setIsReassigning] = useState(false);

  const normalizeQ = (q: any): ManualQuestion => ({
    type: q.type || "MCQ",
    question: q.question || "",
    options: q.options
      ? [...q.options]
      : q.type === "MCQ" || !q.type
        ? ["", "", "", ""]
        : undefined,
    correctAnswer: String(q.correctAnswer ?? "0"),
    explanation: q.explanation || "",
  });

  const openEditQuiz = (quiz: Quiz) => {
    setEditingQuiz(quiz);
    setEditTitle(quiz.title);
    setEditSubject(quiz.subject);
    setEditBatch(quiz.batch);
    setEditDuration(quiz.durationMin);
    setEditDifficulty(quiz.difficulty);
    setEditTargetStudentId((quiz as any).studentId || "");
    const qs = Array.isArray(quiz.questions) ? (quiz.questions as any[]) : [];
    setEditQuestions(qs.length ? qs.map(normalizeQ) : [blankQuestion()]);
  };

  const editUpdate = (idx: number, patch: Partial<ManualQuestion>) =>
    setEditQuestions((prev) =>
      prev.map((q, i) => (i === idx ? { ...q, ...patch } : q)),
    );
  const editChangeType = (idx: number, type: string) => {
    if (type === "MCQ")
      editUpdate(idx, { type, options: ["", "", "", ""], correctAnswer: "0" });
    else if (type === "TRUE_FALSE")
      editUpdate(idx, { type, options: undefined, correctAnswer: "true" });
    else editUpdate(idx, { type, options: undefined, correctAnswer: "" });
  };
  const editUpdateOption = (qIdx: number, oIdx: number, value: string) =>
    setEditQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx || !q.options) return q;
        return {
          ...q,
          options: q.options.map((o, j) => (j === oIdx ? value : o)),
        };
      }),
    );
  const editAddQuestion = () =>
    setEditQuestions((prev) => [...prev, blankQuestion()]);
  const editRemoveQuestion = (idx: number) =>
    setEditQuestions((prev) =>
      prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev,
    );
  const editMoveQuestion = (idx: number, dir: -1 | 1) =>
    setEditQuestions((prev) => {
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });

  const validateQuestions = (qs: ManualQuestion[]): string | null => {
    for (let i = 0; i < qs.length; i++) {
      const q = qs[i];
      if (!q.question.trim()) return `Question ${i + 1} is empty.`;
      if (q.type === "MCQ") {
        if (!q.options || q.options.some((o) => !o.trim()))
          return `Fill all 4 options for question ${i + 1}.`;
      } else if (q.type === "SHORT_ANSWER" && !q.correctAnswer.trim()) {
        return `Provide the correct answer for question ${i + 1}.`;
      }
    }
    return null;
  };

  const handleSaveEdit = async () => {
    if (!editingQuiz) return;
    if (!editTitle.trim()) {
      alert("Please enter a quiz title.");
      return;
    }
    const err = validateQuestions(editQuestions);
    if (err) {
      alert(err);
      return;
    }
    setIsSavingEdit(true);
    try {
      const res = await fetch("/api/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_quiz",
          quizId: editingQuiz.id,
          title: editTitle,
          subject: editSubject,
          batch: editBatch,
          durationMin: editDuration,
          difficulty: editDifficulty,
          questions: editQuestions,
          targetStudentId: editTargetStudentId || null,
        }),
      });
      if (res.ok) {
        setEditingQuiz(null);
        fetchQuizzesAndStudents();
        alert("Quiz updated successfully.");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update quiz.");
      }
    } catch (e) {
      console.error("Update quiz failed:", e);
      alert("Failed to update quiz.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const openReassign = (quiz: Quiz) => {
    setReassignQuiz(quiz);
    setReassignBatch(quiz.batch);
    setReassignStudentId((quiz as any).studentId || "");
  };

  const handleReassign = async () => {
    if (!reassignQuiz) return;
    setIsReassigning(true);
    try {
      const res = await fetch("/api/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reassign_quiz",
          quizId: reassignQuiz.id,
          batch: reassignBatch,
          targetStudentId: reassignStudentId || undefined,
        }),
      });
      if (res.ok) {
        setReassignQuiz(null);
        fetchQuizzesAndStudents();
        alert("Quiz reassigned and students notified.");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to reassign quiz.");
      }
    } catch (e) {
      console.error("Reassign failed:", e);
      alert("Failed to reassign quiz.");
    } finally {
      setIsReassigning(false);
    }
  };

  const handleDuplicateQuiz = async (quiz: Quiz) => {
    try {
      const res = await fetch("/api/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "duplicate_quiz", quizId: quiz.id }),
      });
      if (res.ok) {
        const data = await res.json();
        await fetchQuizzesAndStudents();
        // Open the new copy in the editor so it can be modified right away
        if (data.quiz) openEditQuiz(data.quiz);
      } else {
        alert("Failed to duplicate quiz.");
      }
    } catch (e) {
      console.error("Duplicate failed:", e);
    }
  };

  const fetchQuizzesAndStudents = async () => {
    try {
      const [studentsRes, quizzesRes] = await Promise.all([
        fetch("/api/students"),
        fetch("/api/quizzes"),
      ]);

      if (studentsRes.ok) {
        const studentsData = (await studentsRes.ok)
          ? await studentsRes.json()
          : [];
        setStudents(studentsData);
      }
      if (quizzesRes.ok) {
        const quizzesData = await quizzesRes.json();
        setQuizzes(quizzesData);
      }
    } catch (e) {
      console.error("Failed to load quizzes list:", e);
    }
  };

  useEffect(() => {
    fetchQuizzesAndStudents();
  }, []);

  // Auto-detect subject from file name keywords
  const detectSubject = (fileName: string): string => {
    const lower = fileName.toLowerCase();
    if (
      lower.includes("physics") ||
      lower.includes("electro") ||
      lower.includes("optic") ||
      lower.includes("thermo") ||
      lower.includes("mechanic")
    )
      return "Physics";
    if (
      lower.includes("chem") ||
      lower.includes("organic") ||
      lower.includes("kinetic") ||
      lower.includes("reaction") ||
      lower.includes("mole")
    )
      return "Chemistry";
    if (
      lower.includes("math") ||
      lower.includes("calc") ||
      lower.includes("algebra") ||
      lower.includes("limit") ||
      lower.includes("probab") ||
      lower.includes("statistic")
    )
      return "Mathematics";
    return subject; // keep current if no match
  };

  // Upload a real File object to /api/upload
  const uploadFileToServer = async (file: File) => {
    if (!file.name.match(/\.(pdf|txt|doc|docx|png|jpg|jpeg)$/i)) {
      alert("Please upload a PDF, Word document, image, or text file.");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setUploadedFile(data.name);
        setUploadedFileUrl(data.url || null);
        setSubject(detectSubject(data.name));
        setGeneratedQuiz(null);
      } else {
        const err = await res.json();
        alert(`Upload failed: ${err.error || "Unknown error"}`);
      }
    } catch (e) {
      console.error("Upload error:", e);
      alert("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSimulateUpload = (fileName: string, detectedSubject: string) => {
    setUploadedFile(fileName);
    setUploadedFileUrl(null); // demo templates have no real file content
    setSubject(detectedSubject);
    setGeneratedQuiz(null);
  };

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;
    await uploadFileToServer(files[0]);
  };

  // File input change handler
  const handleFileInputChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    await uploadFileToServer(files[0]);
    // Reset input so the same file can be re-selected
    e.target.value = "";
  };

  const handleRunAIGenerator = async () => {
    if (!uploadedFile) {
      alert("Please drop or select a document reference first.");
      return;
    }

    setIsGenerating(true);
    setGenStep(1);
    setGeneratedQuiz(null);

    // Minor loading animation effect
    setTimeout(async () => {
      setGenStep(2);
      setTimeout(async () => {
        setGenStep(3);
        try {
          const res = await fetch("/api/quizzes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "generate_ai",
              title: uploadedFile.split(".")[0].replace(/_/g, " "),
              subject,
              className: aiClass,
              batch,
              difficulty,
              numQuestions,
              fileName: uploadedFile,
              fileUrl: uploadedFileUrl || undefined,
              targetStudentId: targetStudentId || undefined,
            }),
          });

          if (res.ok) {
            const data = await res.json();
            setGeneratedQuiz(data.quiz);
            fetchQuizzesAndStudents();
          } else {
            alert("AI Quiz Generation failed. Gemini API model busy.");
          }
        } catch (err) {
          console.error("Error generating AI quiz:", err);
        } finally {
          setIsGenerating(false);
          setGenStep(0);
        }
      }, 800);
    }, 800);
  };

  const handlePublishQuiz = () => {
    setGeneratedQuiz(null);
    setUploadedFile(null);
    setUploadedFileUrl(null);
    alert(
      "AI-generated quiz successfully published and dispatched to student dashboards.",
    );
  };

  const handleDeleteQuiz = async (id: string) => {
    if (confirm("Delete this quiz? Any student records will be removed.")) {
      try {
        const res = await fetch(`/api/quizzes?id=${id}`, {
          method: "DELETE",
        });
        if (res.ok) {
          fetchQuizzesAndStudents();
        } else {
          alert("Failed to delete quiz");
        }
      } catch (err) {
        console.error("Error deleting quiz:", err);
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Upper AI Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Input (7 cols) */}
        <div className="lg:col-span-6 glass-card rounded-3xl p-6 flex flex-col justify-between">
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-indigo-400" />
              <h3 className="text-md font-bold text-slate-200">
                AI Quiz Generation Agent
              </h3>
            </div>

            {/* Document upload zone */}
            <div>
              <label className="block text-[10px] uppercase font-mono text-slate-500 mb-2">
                Upload Reference Material
              </label>

              {/* Hidden real file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,.doc,.docx,.png,.jpg,.jpeg"
                className="hidden"
                onChange={handleFileInputChange}
              />

              {!uploadedFile ? (
                <div
                  onDragEnter={handleDragOver}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all duration-200 cursor-pointer select-none ${
                    isDragging
                      ? "border-indigo-500 bg-indigo-500/5 scale-[1.01]"
                      : "border-slate-800 hover:border-indigo-500/40 hover:bg-slate-900/30"
                  }`}
                >
                  {isUploading ? (
                    <div className="flex flex-col items-center gap-3 py-2">
                      <div className="w-8 h-8 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                      <p className="text-xs font-mono text-indigo-400 animate-pulse">
                        Uploading file to server...
                      </p>
                    </div>
                  ) : (
                    <>
                      <UploadCloud
                        className={`w-8 h-8 mx-auto mb-2 transition-colors ${isDragging ? "text-indigo-400" : "text-slate-600"}`}
                      />
                      <p className="text-xs text-slate-400 font-medium">
                        {isDragging
                          ? "Drop file to upload"
                          : "Drag & drop a PDF here, or click to browse"}
                      </p>
                      <p className="text-[10px] text-slate-600 font-mono mt-1">
                        Supports PDF, DOC, DOCX, TXT, PNG, JPG
                      </p>
                    </>
                  )}

                  {/* Quick-load demo templates */}
                  {!isUploading && !isDragging && (
                    <div
                      className="flex flex-wrap justify-center gap-2 mt-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="text-[9px] text-slate-600 font-mono uppercase w-full mb-1">
                        Or use demo templates:
                      </span>
                      <button
                        onClick={() =>
                          handleSimulateUpload(
                            "Electromagnetism_Theory.pdf",
                            "Physics",
                          )
                        }
                        className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-400 hover:text-white transition-colors cursor-pointer"
                      >
                        + Physics_Lab.pdf
                      </button>
                      <button
                        onClick={() =>
                          handleSimulateUpload(
                            "Organic_Chemistry_Compounds.pdf",
                            "Chemistry",
                          )
                        }
                        className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-400 hover:text-white transition-colors cursor-pointer"
                      >
                        + Organic_Ch2.pdf
                      </button>
                      <button
                        onClick={() =>
                          handleSimulateUpload(
                            "Limits_And_Integrals.pdf",
                            "Mathematics",
                          )
                        }
                        className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-400 hover:text-white transition-colors cursor-pointer"
                      >
                        + Calc_Limits.pdf
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/25">
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-5 h-5 text-indigo-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate max-w-[200px]">
                        {uploadedFile}
                      </p>
                      <p className="text-[10px] text-indigo-400 font-mono">
                        Reference Synced ✓
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setUploadedFile(null);
                      setUploadedFileUrl(null);
                      setGeneratedQuiz(null);
                    }}
                    className="text-xs text-slate-500 hover:text-rose-400 font-bold shrink-0 ml-3 transition-colors"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>

            {/* Config selectors */}
            <div className="grid grid-cols-2 gap-4 text-xs text-slate-300">
              <div>
                <label className="block text-[10px] uppercase font-mono text-slate-500 mb-1.5">
                  Subject
                </label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-900 focus:outline-none"
                >
                  <option value="English">English</option>
                  <option value="Hindi">Hindi</option>
                  <option value="Sanskrit">Sanskrit</option>
                  <option value="French">French</option>
                  <option value="German">German</option>

                  <option value="Environmental Studies">
                    Environmental Studies
                  </option>
                  <option value="Science">Science</option>
                  <option value="Social Science">Social Science</option>
                  <option value="History">History</option>
                  <option value="Geography">Geography</option>
                  <option value="Political Science">Political Science</option>
                  <option value="Civics">Civics</option>

                  <option value="Physics">Physics</option>
                  <option value="Chemistry">Chemistry</option>
                  <option value="Biology">Biology</option>
                  <option value="Mathematics">Mathematics</option>

                  <option value="Accountancy">Accountancy</option>
                  <option value="Business Studies">Business Studies</option>
                  <option value="Economics">Economics</option>
                  <option value="Entrepreneurship">Entrepreneurship</option>

                  <option value="Computer Science">Computer Science</option>
                  <option value="Informatics Practices">
                    Informatics Practices
                  </option>
                  <option value="Information Technology">
                    Information Technology
                  </option>
                  <option value="Artificial Intelligence">
                    Artificial Intelligence
                  </option>

                  <option value="Physical Education">Physical Education</option>
                  <option value="Health & Wellness">Health & Wellness</option>
                  <option value="Yoga">Yoga</option>

                  <option value="General Knowledge">General Knowledge</option>
                  <option value="Moral Science">Moral Science</option>
                  <option value="Drawing & Art">Drawing & Art</option>
                  <option value="Music">Music</option>

                  <option value="JEE Physics">JEE Physics</option>
                  <option value="JEE Chemistry">JEE Chemistry</option>
                  <option value="JEE Mathematics">JEE Mathematics</option>

                  <option value="NEET Physics">NEET Physics</option>
                  <option value="NEET Chemistry">NEET Chemistry</option>
                  <option value="NEET Biology">NEET Biology</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono text-slate-500 mb-1.5">
                  Target Batch
                </label>
                <select
                  value={batch}
                  onChange={(e) => setBatch(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-900 focus:outline-none"
                >
                  <option value="Alpha Batch">Alpha Batch</option>
                  <option value="Beta Batch">Beta Batch</option>
                  <option value="Gamma Batch">Gamma Batch</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs text-slate-300">
              <div>
                <label className="block text-[10px] uppercase font-mono text-slate-500 mb-1.5">
                  Class / Grade
                </label>
                <select
                  value={aiClass}
                  onChange={(e) => setAiClass(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-900 focus:outline-none"
                >
                  {classOptions.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono text-slate-500 mb-1.5">
                  Difficulty Profile
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-900 focus:outline-none"
                >
                  <option value="ADAPTIVE">Adaptive (Targeted)</option>
                  <option value="EASY">Easy (Revision)</option>
                  <option value="MEDIUM">Medium (Balanced)</option>
                  <option value="HARD">Hard (Challenge)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono text-slate-500 mb-1.5">
                  Number of Questions
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={numQuestions}
                  onChange={(e) =>
                    setNumQuestions(
                      Math.min(
                        Math.max(parseInt(e.target.value, 10) || 1, 1),
                        50,
                      ),
                    )
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono text-slate-500 mb-1.5">
                  Assign to Student (Optional)
                </label>
                <select
                  value={targetStudentId}
                  onChange={(e) => setTargetStudentId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-900 focus:outline-none"
                >
                  <option value="">All Batch Students</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.accuracyPct}% Acc)
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <button
            onClick={handleRunAIGenerator}
            disabled={isGenerating || !uploadedFile}
            className="w-full mt-6 py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white text-xs font-bold transition-all duration-300 btn-glow-primary flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <BrainCircuit className="w-4 h-4" />
            <span>Generate Adaptive Quiz (AI)</span>
          </button>
        </div>

        {/* Right Output - Preview (5 cols) */}
        <div className="lg:col-span-6 glass-card rounded-3xl p-6 flex flex-col justify-between min-h-[350px]">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
              <h3 className="text-md font-bold text-slate-200">
                AI Compiler Output
              </h3>
            </div>

            {isGenerating && (
              <div className="h-64 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-12 h-12 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />

                {genStep === 1 && (
                  <p className="text-xs font-mono text-indigo-400 animate-pulse">
                    Reading document & extracting concepts...
                  </p>
                )}
                {genStep === 2 && (
                  <p className="text-xs font-mono text-purple-400 animate-pulse">
                    Reviewing student profiles & setting difficulty...
                  </p>
                )}
                {genStep === 3 && (
                  <p className="text-xs font-mono text-cyan-400 animate-pulse">
                    Authoring unique questions & explanations...
                  </p>
                )}
              </div>
            )}

            {!isGenerating && !generatedQuiz && (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-900 rounded-2xl">
                <HelpCircle className="w-8 h-8 text-slate-700 mb-2" />
                <p className="text-xs text-slate-500 leading-relaxed font-mono">
                  Wait state. Configure details and execute the AI generator to
                  output live preview sheets.
                </p>
              </div>
            )}

            {!isGenerating && generatedQuiz && (
              <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
                <div className="p-3.5 rounded-2xl bg-indigo-500/5 border border-indigo-500/10">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>{generatedQuiz.title}</span>
                  </h4>
                  <p className="text-[10px] text-slate-400 leading-relaxed mt-1">
                    {generatedQuiz.description}
                  </p>

                  <div className="flex gap-4 mt-3 text-[10px] font-mono text-slate-500 uppercase">
                    <span>Batch: {generatedQuiz.batch}</span>
                    <span>Dur: {generatedQuiz.durationMin}M</span>
                    <span>Diff: {generatedQuiz.difficulty}</span>
                  </div>
                </div>

                {generatedQuiz.questions.map((q: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-slate-950/40 border border-slate-900 space-y-2"
                  >
                    <span className="text-[9px] font-mono font-bold text-purple-400 uppercase">
                      Question {idx + 1} ({q.type})
                    </span>
                    <p className="text-xs font-semibold text-slate-200">
                      {q.question}
                    </p>
                    {q.options && (
                      <ul className="space-y-1 pl-2 text-[11px] text-slate-400 list-disc">
                        {q.options.map((opt: string, oIdx: number) => (
                          <li
                            key={oIdx}
                            className={
                              oIdx.toString() === q.correctAnswer
                                ? "text-emerald-400 font-semibold list-none flex items-center gap-1.5"
                                : ""
                            }
                          >
                            {oIdx.toString() === q.correctAnswer && (
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            )}
                            {opt}
                          </li>
                        ))}
                      </ul>
                    )}
                    {!q.options && (
                      <p className="text-[10px] text-emerald-400 italic">
                        Correct Answer: {q.correctAnswer}
                      </p>
                    )}
                    <p className="text-[10px] text-slate-500 leading-relaxed bg-white/[0.01] p-2 rounded border border-white/[0.02]">
                      <strong className="text-slate-400 font-mono">
                        Explanation:
                      </strong>{" "}
                      {q.explanation}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {!isGenerating && generatedQuiz && (
            <button
              onClick={handlePublishQuiz}
              className="w-full mt-6 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-bold transition-all shadow-lg cursor-pointer"
            >
              Publish & Assign Quiz
            </button>
          )}
        </div>
      </div>

      {/* Manual Quiz Builder */}
      <div className="glass-card rounded-3xl p-6">
        <div className="flex items-center gap-2 mb-1">
          <PenLine className="w-5 h-5 text-indigo-400" />
          <h3 className="text-md font-bold text-slate-200">
            Manual Quiz Builder
          </h3>
        </div>
        <p className="text-[11px] text-slate-500 mb-6">
          No AI needed — write your own questions, options, and answers, then
          assign to a batch or student.
        </p>

        {/* Quiz meta */}
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] uppercase font-mono text-slate-500 mb-1.5">
              Quiz Title
            </label>
            <input
              type="text"
              value={manualTitle}
              onChange={(e) => setManualTitle(e.target.value)}
              placeholder="e.g. Kinematics Weekly Test"
              className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-900 focus:border-indigo-500 focus:outline-none text-sm text-slate-200"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-slate-300">
            <div>
              <label className="block text-[10px] uppercase font-mono text-slate-500 mb-1.5">
                Subject
              </label>
              <select
                value={manualSubject}
                onChange={(e) => setManualSubject(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-900 focus:outline-none"
              >
                <option value="English">English</option>
                <option value="Hindi">Hindi</option>
                <option value="Sanskrit">Sanskrit</option>
                <option value="French">French</option>
                <option value="German">German</option>

                <option value="Environmental Studies">
                  Environmental Studies
                </option>
                <option value="Science">Science</option>
                <option value="Social Science">Social Science</option>
                <option value="History">History</option>
                <option value="Geography">Geography</option>
                <option value="Political Science">Political Science</option>
                <option value="Civics">Civics</option>

                <option value="Physics">Physics</option>
                <option value="Chemistry">Chemistry</option>
                <option value="Biology">Biology</option>
                <option value="Mathematics">Mathematics</option>

                <option value="Accountancy">Accountancy</option>
                <option value="Business Studies">Business Studies</option>
                <option value="Economics">Economics</option>
                <option value="Entrepreneurship">Entrepreneurship</option>

                <option value="Computer Science">Computer Science</option>
                <option value="Informatics Practices">
                  Informatics Practices
                </option>
                <option value="Information Technology">
                  Information Technology
                </option>
                <option value="Artificial Intelligence">
                  Artificial Intelligence
                </option>

                <option value="Physical Education">Physical Education</option>
                <option value="Health & Wellness">Health & Wellness</option>
                <option value="Yoga">Yoga</option>

                <option value="General Knowledge">General Knowledge</option>
                <option value="Moral Science">Moral Science</option>
                <option value="Drawing & Art">Drawing & Art</option>
                <option value="Music">Music</option>

                <option value="JEE Physics">JEE Physics</option>
                <option value="JEE Chemistry">JEE Chemistry</option>
                <option value="JEE Mathematics">JEE Mathematics</option>

                <option value="NEET Physics">NEET Physics</option>
                <option value="NEET Chemistry">NEET Chemistry</option>
                <option value="NEET Biology">NEET Biology</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase font-mono text-slate-500 mb-1.5">
                Assign to Batch
              </label>
              <select
                value={manualBatch}
                onChange={(e) => setManualBatch(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-900 focus:outline-none"
              >
                <option value="Alpha Batch">Alpha Batch</option>
                <option value="Beta Batch">Beta Batch</option>
                <option value="Gamma Batch">Gamma Batch</option>
                <option value="All Batches">All Batches</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase font-mono text-slate-500 mb-1.5">
                Duration (Mins)
              </label>
              <input
                type="number"
                min={1}
                value={manualDuration}
                onChange={(e) =>
                  setManualDuration(
                    Math.max(parseInt(e.target.value, 10) || 1, 1),
                  )
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-mono text-slate-500 mb-1.5">
                Assign Student (Optional)
              </label>
              <select
                value={manualTargetStudentId}
                onChange={(e) => setManualTargetStudentId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-900 focus:outline-none"
              >
                <option value="">Whole Batch</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className="mt-6 space-y-4">
          {manualQuestions.map((q, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-slate-900/30 border border-slate-900/80 space-y-3"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] font-mono font-bold text-purple-400 uppercase flex items-center gap-1.5">
                  <ListChecks className="w-3.5 h-3.5" />
                  Question {idx + 1}
                </span>
                <div className="flex items-center gap-2">
                  <select
                    value={q.type}
                    onChange={(e) => changeQuestionType(idx, e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-900 text-[11px] text-slate-300 focus:outline-none cursor-pointer"
                  >
                    <option value="MCQ">Multiple Choice</option>
                    <option value="TRUE_FALSE">True / False</option>
                    <option value="SHORT_ANSWER">Short Answer</option>
                  </select>
                  {manualQuestions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeQuestion(idx)}
                      className="p-1.5 rounded-lg bg-slate-950 text-slate-500 hover:text-rose-400 border border-slate-900 hover:border-rose-500/25 transition-all cursor-pointer"
                      title="Remove question"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <textarea
                value={q.question}
                onChange={(e) =>
                  updateQuestion(idx, { question: e.target.value })
                }
                placeholder="Type the question here..."
                rows={2}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-900 focus:border-indigo-500 focus:outline-none text-xs text-slate-200"
              />

              {/* Answer config by type */}
              {q.type === "MCQ" && q.options && (
                <div className="space-y-2">
                  <span className="text-[9px] font-mono uppercase text-slate-600">
                    Tap the circle to mark the correct option
                  </span>
                  {q.options.map((opt, oIdx) => {
                    const isCorrect = q.correctAnswer === oIdx.toString();
                    return (
                      <div key={oIdx} className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            updateQuestion(idx, {
                              correctAnswer: oIdx.toString(),
                            })
                          }
                          title="Mark correct"
                          className={`w-6 h-6 shrink-0 rounded-lg flex items-center justify-center text-[10px] font-mono font-bold border transition-all cursor-pointer ${
                            isCorrect
                              ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                              : "bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700"
                          }`}
                        >
                          {String.fromCharCode(65 + oIdx)}
                        </button>
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) =>
                            updateOption(idx, oIdx, e.target.value)
                          }
                          placeholder={`Option ${String.fromCharCode(65 + oIdx)}`}
                          className={`flex-1 px-3 py-1.5 rounded-lg bg-slate-950 border text-xs text-slate-200 focus:outline-none ${
                            isCorrect
                              ? "border-emerald-500/30"
                              : "border-slate-900 focus:border-indigo-500"
                          }`}
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              {q.type === "TRUE_FALSE" && (
                <div className="grid grid-cols-2 gap-3">
                  {["true", "false"].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() =>
                        updateQuestion(idx, { correctAnswer: val })
                      }
                      className={`py-2 rounded-xl border text-xs font-bold uppercase transition-all cursor-pointer ${
                        q.correctAnswer === val
                          ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
                          : "bg-slate-950 border-slate-900 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              )}

              {q.type === "SHORT_ANSWER" && (
                <div>
                  <label className="block text-[9px] font-mono uppercase text-slate-600 mb-1">
                    Correct Answer
                  </label>
                  <input
                    type="text"
                    value={q.correctAnswer}
                    onChange={(e) =>
                      updateQuestion(idx, { correctAnswer: e.target.value })
                    }
                    placeholder="Expected answer text"
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-900 focus:border-indigo-500 focus:outline-none text-xs text-slate-200"
                  />
                </div>
              )}

              <div>
                <label className="block text-[9px] font-mono uppercase text-slate-600 mb-1">
                  Explanation (Optional)
                </label>
                <textarea
                  value={q.explanation}
                  onChange={(e) =>
                    updateQuestion(idx, { explanation: e.target.value })
                  }
                  placeholder="Why is this the correct answer?"
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-900 focus:border-indigo-500 focus:outline-none text-[11px] text-slate-300"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="mt-5 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={addQuestion}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Question</span>
          </button>
          <button
            type="button"
            onClick={handleCreateManualQuiz}
            disabled={isSavingManual}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
          >
            {isSavingManual ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  Create &amp; Assign Quiz ({manualQuestions.length}{" "}
                  {manualQuestions.length === 1 ? "Question" : "Questions"})
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Currently active quizzes */}
      <div className="glass-card rounded-3xl p-6">
        <h3 className="text-md font-bold text-slate-200 mb-6 flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-400" />
          <span>Active Quizzes Registry</span>
        </h3>

        <div className="grid grid-cols-1 gap-4">
          {quizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="flex items-start md:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/30 border border-slate-900/60 hover:border-indigo-500/20 transition-all duration-200"
            >
              <div className="flex gap-4 items-center">
                <div
                  className={`p-3 rounded-xl ${
                    quiz.isAiGenerated
                      ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                      : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                  }`}
                >
                  <BrainCircuit className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                    <span>{quiz.title}</span>
                    {quiz.isAiGenerated && (
                      <span className="text-[8px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        AI Generated
                      </span>
                    )}
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                    {quiz.description}
                  </p>

                  <div className="flex flex-wrap gap-4 mt-2.5 text-[10px] font-mono text-slate-500 uppercase font-bold">
                    <span>Subject: {quiz.subject}</span>
                    <span>Batch: {quiz.batch}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{quiz.durationMin} Mins</span>
                    </span>
                    <span>
                      Questions:{" "}
                      {Array.isArray(quiz.questions)
                        ? quiz.questions.length
                        : 0}
                    </span>
                    <span>Diff: {quiz.difficulty}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => openEditQuiz(quiz)}
                  className="p-2 rounded-xl bg-slate-950 hover:bg-indigo-500/10 text-slate-500 hover:text-indigo-400 border border-slate-900 hover:border-indigo-500/25 transition-all duration-200"
                  title="Edit quiz & questions"
                >
                  <PenLine className="w-4 h-4" />
                </button>
                <button
                  onClick={() => openReassign(quiz)}
                  className="p-2 rounded-xl bg-slate-950 hover:bg-cyan-500/10 text-slate-500 hover:text-cyan-400 border border-slate-900 hover:border-cyan-500/25 transition-all duration-200"
                  title="Reassign to student / batch"
                >
                  <Users className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDuplicateQuiz(quiz)}
                  className="p-2 rounded-xl bg-slate-950 hover:bg-purple-500/10 text-slate-500 hover:text-purple-400 border border-slate-900 hover:border-purple-500/25 transition-all duration-200"
                  title="Duplicate for reuse"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteQuiz(quiz.id)}
                  className="p-2 rounded-xl bg-slate-950 hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 border border-slate-900 hover:border-rose-500/25 transition-all duration-200"
                  title="Purge Quiz"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reassign Modal */}
      {reassignQuiz && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#04060d]/80 backdrop-blur-md"
          onClick={() => setReassignQuiz(null)}
        >
          <div
            className="w-full max-w-md glass-card rounded-3xl p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setReassignQuiz(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-cyan-400" />
              <span className="text-[10px] font-mono font-bold tracking-wider text-cyan-400 uppercase">
                Reassign
              </span>
            </div>
            <h3 className="text-base font-bold text-white mb-1">
              {reassignQuiz.title}
            </h3>
            <p className="text-[11px] text-slate-500 mb-6">
              Assign this quiz to a different batch or a specific student.
              They&apos;ll be notified.
            </p>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] uppercase font-mono text-slate-500 mb-1.5">
                  Assign to Batch
                </label>
                <select
                  value={reassignBatch}
                  onChange={(e) => setReassignBatch(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-900 focus:outline-none text-slate-200"
                >
                  <option value="Alpha Batch">Alpha Batch</option>
                  <option value="Beta Batch">Beta Batch</option>
                  <option value="Gamma Batch">Gamma Batch</option>
                  <option value="All Batches">All Batches</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] uppercase font-mono text-slate-500 mb-1.5">
                  Assign to Student (Optional)
                </label>
                <select
                  value={reassignStudentId}
                  onChange={(e) => setReassignStudentId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-900 focus:outline-none text-slate-200"
                >
                  <option value="">Whole Batch</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setReassignQuiz(null)}
                className="px-4 py-2 rounded-xl border border-slate-800 hover:bg-slate-900 text-slate-300 text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReassign}
                disabled={isReassigning}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
              >
                {isReassigning ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Reassign</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Quiz Modal */}
      {editingQuiz && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-[#04060d]/80 backdrop-blur-md"
          onClick={() => setEditingQuiz(null)}
        >
          <div
            className="w-full max-w-3xl max-h-[92vh] flex flex-col glass-card rounded-3xl relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 p-5 border-b border-slate-900/70">
              <div className="flex items-center gap-2">
                <PenLine className="w-5 h-5 text-indigo-400" />
                <h3 className="text-md font-bold text-slate-200">Edit Quiz</h3>
              </div>
              <button
                onClick={() => setEditingQuiz(null)}
                className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Metadata */}
              <div>
                <label className="block text-[10px] uppercase font-mono text-slate-500 mb-1.5">
                  Quiz Title
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-900 focus:border-indigo-500 focus:outline-none text-sm text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-slate-300">
                <div>
                  <label className="block text-[10px] uppercase font-mono text-slate-500 mb-1.5">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={editSubject}
                    onChange={(e) => setEditSubject(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-mono text-slate-500 mb-1.5">
                    Batch
                  </label>
                  <select
                    value={editBatch}
                    onChange={(e) => setEditBatch(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-900 focus:outline-none"
                  >
                    <option value="Alpha Batch">Alpha Batch</option>
                    <option value="Beta Batch">Beta Batch</option>
                    <option value="Gamma Batch">Gamma Batch</option>
                    <option value="All Batches">All Batches</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-mono text-slate-500 mb-1.5">
                    Duration (Min)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={editDuration}
                    onChange={(e) =>
                      setEditDuration(
                        Math.max(parseInt(e.target.value, 10) || 1, 1),
                      )
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-mono text-slate-500 mb-1.5">
                    Assign Student
                  </label>
                  <select
                    value={editTargetStudentId}
                    onChange={(e) => setEditTargetStudentId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-900 focus:outline-none"
                  >
                    <option value="">Whole Batch</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Questions */}
              <div className="space-y-4">
                {editQuestions.map((q, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-slate-900/30 border border-slate-900/80 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[10px] font-mono font-bold text-purple-400 uppercase flex items-center gap-1.5">
                        <ListChecks className="w-3.5 h-3.5" />
                        Question {idx + 1}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => editMoveQuestion(idx, -1)}
                          disabled={idx === 0}
                          className="p-1.5 rounded-lg bg-slate-950 text-slate-500 hover:text-indigo-400 border border-slate-900 disabled:opacity-30 transition-all cursor-pointer"
                          title="Move up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => editMoveQuestion(idx, 1)}
                          disabled={idx === editQuestions.length - 1}
                          className="p-1.5 rounded-lg bg-slate-950 text-slate-500 hover:text-indigo-400 border border-slate-900 disabled:opacity-30 transition-all cursor-pointer"
                          title="Move down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <select
                          value={q.type}
                          onChange={(e) => editChangeType(idx, e.target.value)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-900 text-[11px] text-slate-300 focus:outline-none cursor-pointer"
                        >
                          <option value="MCQ">Multiple Choice</option>
                          <option value="TRUE_FALSE">True / False</option>
                          <option value="SHORT_ANSWER">Short Answer</option>
                        </select>
                        {editQuestions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => editRemoveQuestion(idx)}
                            className="p-1.5 rounded-lg bg-slate-950 text-slate-500 hover:text-rose-400 border border-slate-900 hover:border-rose-500/25 transition-all cursor-pointer"
                            title="Remove"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <textarea
                      value={q.question}
                      onChange={(e) =>
                        editUpdate(idx, { question: e.target.value })
                      }
                      placeholder="Question text..."
                      rows={2}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-900 focus:border-indigo-500 focus:outline-none text-xs text-slate-200"
                    />

                    {q.type === "MCQ" && q.options && (
                      <div className="space-y-2">
                        <span className="text-[9px] font-mono uppercase text-slate-600">
                          Tap the letter to mark the correct option
                        </span>
                        {q.options.map((opt, oIdx) => {
                          const isCorrect = q.correctAnswer === oIdx.toString();
                          return (
                            <div key={oIdx} className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  editUpdate(idx, {
                                    correctAnswer: oIdx.toString(),
                                  })
                                }
                                className={`w-6 h-6 shrink-0 rounded-lg flex items-center justify-center text-[10px] font-mono font-bold border transition-all cursor-pointer ${
                                  isCorrect
                                    ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                                    : "bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700"
                                }`}
                              >
                                {String.fromCharCode(65 + oIdx)}
                              </button>
                              <input
                                type="text"
                                value={opt}
                                onChange={(e) =>
                                  editUpdateOption(idx, oIdx, e.target.value)
                                }
                                placeholder={`Option ${String.fromCharCode(65 + oIdx)}`}
                                className={`flex-1 px-3 py-1.5 rounded-lg bg-slate-950 border text-xs text-slate-200 focus:outline-none ${
                                  isCorrect
                                    ? "border-emerald-500/30"
                                    : "border-slate-900 focus:border-indigo-500"
                                }`}
                              />
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {q.type === "TRUE_FALSE" && (
                      <div className="grid grid-cols-2 gap-3">
                        {["true", "false"].map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() =>
                              editUpdate(idx, { correctAnswer: val })
                            }
                            className={`py-2 rounded-xl border text-xs font-bold uppercase transition-all cursor-pointer ${
                              q.correctAnswer === val
                                ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
                                : "bg-slate-950 border-slate-900 text-slate-400 hover:text-slate-200"
                            }`}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                    )}

                    {q.type === "SHORT_ANSWER" && (
                      <div>
                        <label className="block text-[9px] font-mono uppercase text-slate-600 mb-1">
                          Correct Answer
                        </label>
                        <input
                          type="text"
                          value={q.correctAnswer}
                          onChange={(e) =>
                            editUpdate(idx, { correctAnswer: e.target.value })
                          }
                          placeholder="Expected answer text"
                          className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-900 focus:border-indigo-500 focus:outline-none text-xs text-slate-200"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-[9px] font-mono uppercase text-slate-600 mb-1">
                        Explanation (Optional)
                      </label>
                      <textarea
                        value={q.explanation}
                        onChange={(e) =>
                          editUpdate(idx, { explanation: e.target.value })
                        }
                        rows={2}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-900 focus:border-indigo-500 focus:outline-none text-[11px] text-slate-300"
                      />
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={editAddQuestion}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold transition-all cursor-pointer w-full"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Question</span>
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-900/70 flex justify-end gap-3">
              <button
                onClick={() => setEditingQuiz(null)}
                className="px-4 py-2 rounded-xl border border-slate-800 hover:bg-slate-900 text-slate-300 text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isSavingEdit}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSavingEdit ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Save Changes ({editQuestions.length})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
