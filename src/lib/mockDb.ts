// Mock Database client for Tuition Management System

export type Role = 'ADMIN' | 'STUDENT';
export type FeeStatus = 'PAID' | 'UNPAID' | 'PENDING';
export type QuizType = 'MCQ' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'CASE_STUDY' | 'ASSERTION_REASON';

export interface User {
  id: string;
  email: string;
  role: Role;
  name: string;
}

export interface Student {
  id: string;
  userId: string;
  name: string;
  email: string;
  rollNumber: string;
  class: string;
  batch: string;
  subjects: string[];
  parentContact: string;
  attendancePct: number;
  feeStatus: FeeStatus;
  rank: number;
  accuracyPct: number;
  xpPoints: number;
  quizStreak: number;
  badges: string[];
}

export interface Attendance {
  id: string;
  studentId: string;
  date: string; // YYYY-MM-DD
  status: boolean; // true = Present, false = Absent
}

export interface FeeHistory {
  id: string;
  studentId: string;
  amount: number;
  month: string; // e.g., "May 2026"
  dueDate: string;
  paidDate?: string;
  status: FeeStatus;
  receiptUrl?: string;
}

export interface Question {
  id: string;
  question: string;
  type: QuizType;
  options?: string[]; // for MCQ
  correctAnswer: string; // index for MCQ, "true"/"false" for T/F, text for short answer
  explanation?: string;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  type: QuizType;
  batch: string;
  subject: string;
  durationMin: number;
  questions: Question[];
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'ADAPTIVE';
  isAiGenerated: boolean;
  sourceFile?: string;
  createdAt: string;
}

export interface QuizAttempt {
  id: string;
  studentId: string;
  quizId: string;
  quizTitle: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  accuracyPct: number;
  xpGained: number;
  answers: Record<string, string>; // questionId -> studentAnswer
  completedAt: string;
}

export interface StudyMaterial {
  id: string;
  title: string;
  description: string;
  fileType: 'PDF' | 'Notes' | 'Homework' | 'Assignment';
  fileUrl: string;
  subject: string;
  batch: string;
  uploadedAt: string;
}

export interface Notification {
  id: string;
  studentId: string | null; // null for global
  title: string;
  message: string;
  read: boolean;
  type: 'QUIZ' | 'FEE' | 'ATTENDANCE' | 'SYSTEM';
  createdAt: string;
}

export interface AIReport {
  id: string;
  studentId: string;
  weakTopics: string[];
  strongTopics: string[];
  suggestions: string[];
  generatedAt: string;
}

// Initial Seed Data
const initialUsers: User[] = [
  { id: 'u-admin', email: 'admin@tuition.com', role: 'ADMIN', name: 'Dr. Sarah Jenkins' },
  { id: 'u-alex', email: 'alex@tuition.com', role: 'STUDENT', name: 'Alex Rivera' },
  { id: 'u-sofia', email: 'sofia@tuition.com', role: 'STUDENT', name: 'Sofia Chen' },
  { id: 'u-marcus', email: 'marcus@tuition.com', role: 'STUDENT', name: 'Marcus Vance' },
  { id: 'u-emily', email: 'emily@tuition.com', role: 'STUDENT', name: 'Emily Watson' },
  { id: 'u-ryan', email: 'ryan@tuition.com', role: 'STUDENT', name: 'Ryan Kaelen' },
];

const initialStudents: Student[] = [
  {
    id: 's-alex',
    userId: 'u-alex',
    name: 'Alex Rivera',
    email: 'alex@tuition.com',
    rollNumber: 'T26-101',
    class: 'Grade 12',
    batch: 'Alpha Batch',
    subjects: ['Physics', 'Chemistry', 'Mathematics'],
    parentContact: '+1 (555) 019-2834',
    attendancePct: 98,
    feeStatus: 'PAID',
    rank: 1,
    accuracyPct: 94,
    xpPoints: 1240,
    quizStreak: 5,
    badges: ['Speed Demon', 'Perfect Week', 'AI Solver'],
  },
  {
    id: 's-sofia',
    userId: 'u-sofia',
    name: 'Sofia Chen',
    email: 'sofia@tuition.com',
    rollNumber: 'T26-102',
    class: 'Grade 12',
    batch: 'Alpha Batch',
    subjects: ['Physics', 'Chemistry', 'Mathematics'],
    parentContact: '+1 (555) 014-9921',
    attendancePct: 95,
    feeStatus: 'PAID',
    rank: 2,
    accuracyPct: 88,
    xpPoints: 1050,
    quizStreak: 3,
    badges: ['Sharp Shooter', 'Constancy'],
  },
  {
    id: 's-marcus',
    userId: 'u-marcus',
    name: 'Marcus Vance',
    email: 'marcus@tuition.com',
    rollNumber: 'T26-103',
    class: 'Grade 12',
    batch: 'Beta Batch',
    subjects: ['Physics', 'Mathematics'],
    parentContact: '+1 (555) 012-4411',
    attendancePct: 72, // Alert
    feeStatus: 'PENDING',
    rank: 3,
    accuracyPct: 82,
    xpPoints: 890,
    quizStreak: 1,
    badges: ['First Blood'],
  },
  {
    id: 's-emily',
    userId: 'u-emily',
    name: 'Emily Watson',
    email: 'emily@tuition.com',
    rollNumber: 'T26-104',
    class: 'Grade 11',
    batch: 'Gamma Batch',
    subjects: ['Chemistry', 'Mathematics'],
    parentContact: '+1 (555) 015-8833',
    attendancePct: 85,
    feeStatus: 'UNPAID',
    rank: 4,
    accuracyPct: 64, // Weak
    xpPoints: 540,
    quizStreak: 0,
    badges: ['Quick Starter'],
  },
  {
    id: 's-ryan',
    userId: 'u-ryan',
    name: 'Ryan Kaelen',
    email: 'ryan@tuition.com',
    rollNumber: 'T26-105',
    class: 'Grade 12',
    batch: 'Beta Batch',
    subjects: ['Physics', 'Chemistry'],
    parentContact: '+1 (555) 019-9944',
    attendancePct: 61, // Low Alert
    feeStatus: 'UNPAID',
    rank: 5,
    accuracyPct: 58, // Weak
    xpPoints: 410,
    quizStreak: 0,
    badges: [],
  },
];

// Past 10 Days Attendance
const initialAttendance: Attendance[] = [];
const dates = Array.from({ length: 10 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - i - 1);
  return d.toISOString().split('T')[0];
});

initialStudents.forEach(student => {
  dates.forEach(date => {
    // Ryan is absent 40% of times, Marcus 30%, others 5%
    let status = true;
    const rand = Math.random();
    if (student.id === 's-ryan' && rand < 0.39) status = false;
    else if (student.id === 's-marcus' && rand < 0.28) status = false;
    else if (rand < 0.05) status = false;

    initialAttendance.push({
      id: `a-${student.id}-${date}`,
      studentId: student.id,
      date,
      status,
    });
  });
});

const initialFeeHistory: FeeHistory[] = [
  { id: 'f1', studentId: 's-alex', amount: 150, month: 'May 2026', dueDate: '2026-05-10', paidDate: '2026-05-08', status: 'PAID', receiptUrl: '/receipts/f1.pdf' },
  { id: 'f2', studentId: 's-sofia', amount: 150, month: 'May 2026', dueDate: '2026-05-10', paidDate: '2026-05-09', status: 'PAID', receiptUrl: '/receipts/f2.pdf' },
  { id: 'f3', studentId: 's-marcus', amount: 120, month: 'May 2026', dueDate: '2026-05-10', status: 'PENDING' },
  { id: 'f4', studentId: 's-emily', amount: 120, month: 'May 2026', dueDate: '2026-05-10', status: 'UNPAID' },
  { id: 'f5', studentId: 's-ryan', amount: 120, month: 'May 2026', dueDate: '2026-05-10', status: 'UNPAID' },
  { id: 'f6', studentId: 's-alex', amount: 150, month: 'April 2026', dueDate: '2026-04-10', paidDate: '2026-04-09', status: 'PAID', receiptUrl: '/receipts/f6.pdf' },
  { id: 'f7', studentId: 's-sofia', amount: 150, month: 'April 2026', dueDate: '2026-04-10', paidDate: '2026-04-10', status: 'PAID', receiptUrl: '/receipts/f7.pdf' },
  { id: 'f8', studentId: 's-marcus', amount: 120, month: 'April 2026', dueDate: '2026-04-10', paidDate: '2026-04-11', status: 'PAID', receiptUrl: '/receipts/f8.pdf' },
];

const initialQuizzes: Quiz[] = [
  {
    id: 'q1',
    title: 'Kinematics Mastery Quiz',
    description: 'Covers projectile motion, relative velocity, and equations of acceleration.',
    type: 'MCQ',
    batch: 'Alpha Batch',
    subject: 'Physics',
    durationMin: 15,
    difficulty: 'MEDIUM',
    isAiGenerated: false,
    createdAt: '2026-05-20T10:00:00Z',
    questions: [
      {
        id: 'q1_1',
        type: 'MCQ',
        question: 'A projectile is launched at an angle of 45 degrees to the horizontal. If the initial velocity is doubled, how does the range change?',
        options: ['It remains the same', 'It doubles', 'It triples', 'It quadruples'],
        correctAnswer: '3', // index 3 = quadruples
        explanation: 'The range formula is R = (u^2 * sin(2theta))/g. Since range is proportional to the square of velocity, doubling the velocity quadruples the range.'
      },
      {
        id: 'q1_2',
        type: 'MCQ',
        question: 'What is the acceleration of a body thrown vertically upwards at its highest point?',
        options: ['Zero', 'g (downwards)', 'g (upwards)', 'Depends on the mass'],
        correctAnswer: '1',
        explanation: 'At the highest point, velocity is zero, but acceleration due to gravity (g) is still acting downwards at 9.8 m/s^2.'
      },
      {
        id: 'q1_3',
        type: 'MCQ',
        question: 'If the displacement-time graph of a particle is a straight line parallel to the time axis, what does it mean?',
        options: ['The velocity is uniform', 'The velocity is zero', 'The acceleration is constant', 'The particle is accelerating'],
        correctAnswer: '1',
        explanation: 'A displacement-time graph parallel to the time axis indicates that displacement is not changing. Therefore, the object is at rest and its velocity is zero.'
      }
    ]
  },
  {
    id: 'q2',
    title: 'Stoichiometry & Chemical Equations',
    description: 'AI Generated Revision Quiz targeting basic mole calculations and balancing equations.',
    type: 'MCQ',
    batch: 'Alpha Batch',
    subject: 'Chemistry',
    durationMin: 10,
    difficulty: 'EASY',
    isAiGenerated: true,
    sourceFile: 'StoichiometryNotes_Ch2.pdf',
    createdAt: '2026-05-22T08:30:00Z',
    questions: [
      {
        id: 'q2_1',
        type: 'MCQ',
        question: 'How many moles of hydrogen atoms are there in 2 moles of water (H2O)?',
        options: ['2 moles', '4 moles', '1 mole', '6.022 x 10^23 moles'],
        correctAnswer: '1',
        explanation: 'Each molecule of H2O contains 2 atoms of hydrogen. Thus, 2 moles of H2O contain 4 moles of hydrogen atoms.'
      },
      {
        id: 'q2_2',
        type: 'MCQ',
        question: 'In the balanced equation 2H2 + O2 -> 2H2O, what is the ratio of moles of reactants?',
        options: ['1:1', '2:1', '1:2', '3:2'],
        correctAnswer: '1',
        explanation: 'The balanced equation shows 2 moles of H2 reacting with 1 mole of O2, making the ratio 2:1.'
      }
    ]
  }
];

const initialQuizAttempts: QuizAttempt[] = [
  {
    id: 'qa1',
    studentId: 's-alex',
    quizId: 'q1',
    quizTitle: 'Kinematics Mastery Quiz',
    score: 100,
    totalQuestions: 3,
    correctAnswers: 3,
    accuracyPct: 100,
    xpGained: 150,
    answers: { q1_1: '3', q1_2: '1', q1_3: '1' },
    completedAt: '2026-05-21T11:42:00Z'
  },
  {
    id: 'qa2',
    studentId: 's-sofia',
    quizId: 'q1',
    quizTitle: 'Kinematics Mastery Quiz',
    score: 66.7,
    totalQuestions: 3,
    correctAnswers: 2,
    accuracyPct: 66.7,
    xpGained: 80,
    answers: { q1_1: '3', q1_2: '0', q1_3: '1' },
    completedAt: '2026-05-21T14:10:00Z'
  }
];

const initialStudyMaterials: StudyMaterial[] = [
  { id: 'm1', title: 'Electrostatics Formula Sheet', description: 'Comprehensive formulas for Electric fields, potential, and capacitance.', fileType: 'PDF', fileUrl: '/materials/electrostatics_formulas.pdf', subject: 'Physics', batch: 'Alpha Batch', uploadedAt: '2026-05-18T09:00:00Z' },
  { id: 'm2', title: 'Calculus Integration Cheat Sheet', description: 'Quick guides on standard integration formats.', fileType: 'Notes', fileUrl: '/materials/calculus_integration.pdf', subject: 'Mathematics', batch: 'Alpha Batch', uploadedAt: '2026-05-19T14:00:00Z' },
  { id: 'm3', title: 'Periodic Table Trends Assignment', description: 'Complete questions on trends down group 1 and across period 3.', fileType: 'Homework', fileUrl: '/materials/periodic_trends_hw.pdf', subject: 'Chemistry', batch: 'Beta Batch', uploadedAt: '2026-05-21T10:30:00Z' },
];

const initialNotifications: Notification[] = [
  { id: 'n1', studentId: null, title: 'Exam Schedule Announced', message: 'The Mid-Term Mock Examinations are scheduled from June 5th. Timetable is uploaded in study materials.', read: false, type: 'SYSTEM', createdAt: '2026-05-24T08:00:00Z' },
  { id: 'n2', studentId: 's-marcus', title: 'Attendance Alert', message: 'Your attendance has dropped to 72%. Please speak to Jenkins regarding makeup sessions.', read: false, type: 'ATTENDANCE', createdAt: '2026-05-24T09:00:00Z' },
  { id: 'n3', studentId: 's-emily', title: 'Fees Outstanding Remind', message: 'Monthly fee of $120 for May 2026 is unpaid. Due date was May 10th.', read: false, type: 'FEE', createdAt: '2026-05-23T11:00:00Z' },
  { id: 'n4', studentId: 's-alex', title: 'New Quiz Assigned', message: 'AI generated revision quiz "Stoichiometry & Chemical Equations" has been assigned to your batch.', read: false, type: 'QUIZ', createdAt: '2026-05-22T09:00:00Z' },
];

const initialAIReports: AIReport[] = [
  {
    id: 'ai1',
    studentId: 's-alex',
    weakTopics: ['Rotational Dynamics', 'Advanced Calculus Integration'],
    strongTopics: ['Kinematics', 'Electrostatics', 'Calculus Derivatives'],
    suggestions: [
      'Focus on moment of inertia calculations. Solve 5 rotational equilibrium MCQs.',
      'Maintain consistency: excellent work holding a 5-day quiz streak!'
    ],
    generatedAt: '2026-05-24T18:00:00Z'
  },
  {
    id: 'ai2',
    studentId: 's-emily',
    weakTopics: ['Mole Concept Calculations', 'Stoichiometry Coefficients', 'Algebraic Functions'],
    strongTopics: ['Chemical Bonding', 'Trigonometric Equations'],
    suggestions: [
      'Take a Mole Concept foundations review. The AI has assigned an easy-level Stoichiometry revision quiz.',
      'Spend 15 minutes reviewing mole ratio examples in class notes.'
    ],
    generatedAt: '2026-05-24T18:00:00Z'
  }
];

// Helper to access data either in memory (SSR) or from localStorage
class MockDatabase {
  private inMemoryData: {
    users: User[];
    students: Student[];
    attendance: Attendance[];
    feeHistory: FeeHistory[];
    quizzes: Quiz[];
    quizAttempts: QuizAttempt[];
    studyMaterials: StudyMaterial[];
    notifications: Notification[];
    aiReports: AIReport[];
  };

  constructor() {
    this.inMemoryData = {
      users: initialUsers,
      students: initialStudents,
      attendance: initialAttendance,
      feeHistory: initialFeeHistory,
      quizzes: initialQuizzes,
      quizAttempts: initialQuizAttempts,
      studyMaterials: initialStudyMaterials,
      notifications: initialNotifications,
      aiReports: initialAIReports
    };
  }

  private isClient(): boolean {
    return typeof window !== 'undefined';
  }

  private getStore<K extends keyof typeof this.inMemoryData>(key: K): typeof this.inMemoryData[K] {
    if (this.isClient()) {
      const stored = localStorage.getItem(`tms_${key}`);
      if (!stored) {
        localStorage.setItem(`tms_${key}`, JSON.stringify(this.inMemoryData[key]));
        return this.inMemoryData[key];
      }
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error("Error parsing localstorage TMS", e);
        return this.inMemoryData[key];
      }
    }
    return this.inMemoryData[key];
  }

  private setStore<K extends keyof typeof this.inMemoryData>(key: K, data: typeof this.inMemoryData[K]) {
    this.inMemoryData[key] = data;
    if (this.isClient()) {
      localStorage.setItem(`tms_${key}`, JSON.stringify(data));
    }
  }

  // Core Actions
  getUsers(): User[] { return this.getStore('users'); }
  
  getStudents(): Student[] { 
    const students = this.getStore('students');
    return students.sort((a, b) => a.rank - b.rank);
  }
  
  getStudentById(id: string): Student | undefined {
    return this.getStudents().find(s => s.id === id);
  }

  getStudentByUserId(userId: string): Student | undefined {
    return this.getStudents().find(s => s.userId === userId);
  }

  saveStudent(student: Student) {
    const list = this.getStudents();
    const index = list.findIndex(s => s.id === student.id);
    if (index >= 0) {
      list[index] = student;
    } else {
      list.push(student);
    }
    this.setStore('students', list);
    this.recalculateRanks();
  }

  deleteStudent(studentId: string) {
    let students = this.getStudents();
    const student = students.find(s => s.id === studentId);
    if (!student) return;
    students = students.filter(s => s.id !== studentId);
    this.setStore('students', students);

    // Delete associated User
    let users = this.getUsers();
    users = users.filter(u => u.id !== student.userId);
    this.setStore('users', users);

    // Delete attendance records
    let attendance = this.getAttendance();
    attendance = attendance.filter(a => a.studentId !== studentId);
    this.setStore('attendance', attendance);

    // Delete fee records
    let fees = this.getFeeHistory();
    fees = fees.filter(f => f.studentId !== studentId);
    this.setStore('feeHistory', fees);

    // Delete quiz attempts
    let attempts = this.getQuizAttempts();
    attempts = attempts.filter(a => a.studentId !== studentId);
    this.setStore('quizAttempts', attempts);

    this.recalculateRanks();
  }

  private recalculateRanks() {
    const list = this.getStudents();
    // Sort by accuracy (primary) & XP (secondary) desc
    list.sort((a, b) => {
      if (b.accuracyPct !== a.accuracyPct) {
        return b.accuracyPct - a.accuracyPct;
      }
      return b.xpPoints - a.xpPoints;
    });
    const updated = list.map((student, i) => ({
      ...student,
      rank: i + 1
    }));
    this.setStore('students', updated);
  }

  // Attendance
  getAttendance(): Attendance[] { return this.getStore('attendance'); }
  
  markAttendance(studentId: string, date: string, status: boolean) {
    const list = this.getAttendance();
    const existingIndex = list.findIndex(a => a.studentId === studentId && a.date === date);
    if (existingIndex >= 0) {
      list[existingIndex].status = status;
    } else {
      list.push({ id: `a-${studentId}-${date}`, studentId, date, status });
    }
    this.setStore('attendance', list);
    
    // Recalculate Student attendance %
    this.recalculateAttendancePct(studentId);
  }

  private recalculateAttendancePct(studentId: string) {
    const list = this.getAttendance().filter(a => a.studentId === studentId);
    if (list.length === 0) return;
    const presents = list.filter(a => a.status).length;
    const pct = Math.round((presents / list.length) * 100);
    
    const student = this.getStudentById(studentId);
    if (student) {
      student.attendancePct = pct;
      this.saveStudent(student);

      // Trigger automatic low attendance notification if below 75%
      if (pct < 75) {
        const notifications = this.getNotifications();
        const alertExists = notifications.some(n => n.studentId === studentId && n.type === 'ATTENDANCE' && n.message.includes(`${pct}%`));
        if (!alertExists) {
          this.addNotification({
            studentId,
            title: 'Attendance Critical Alert',
            message: `Your overall attendance has fallen to ${pct}%. Please maintain attendance above 75% to stay eligible for quizzes.`,
            type: 'ATTENDANCE'
          });
        }
      }
    }
  }

  // Fees
  getFeeHistory(): FeeHistory[] { return this.getStore('feeHistory'); }
  
  saveFee(fee: FeeHistory) {
    const list = this.getFeeHistory();
    const index = list.findIndex(f => f.id === fee.id);
    if (index >= 0) {
      list[index] = fee;
    } else {
      list.push(fee);
    }
    this.setStore('feeHistory', list);
    this.updateStudentFeeStatus(fee.studentId);
  }

  payFee(feeId: string) {
    const list = this.getFeeHistory();
    const index = list.findIndex(f => f.id === feeId);
    if (index >= 0) {
      list[index].status = 'PAID';
      list[index].paidDate = new Date().toISOString().split('T')[0];
      list[index].receiptUrl = `/receipts/${feeId}.pdf`;
      this.setStore('feeHistory', list);
      this.updateStudentFeeStatus(list[index].studentId);
    }
  }

  private updateStudentFeeStatus(studentId: string) {
    const student = this.getStudentById(studentId);
    if (!student) return;
    const history = this.getFeeHistory().filter(f => f.studentId === studentId);
    const hasUnpaid = history.some(f => f.status === 'UNPAID');
    const hasPending = history.some(f => f.status === 'PENDING');
    
    let status: FeeStatus = 'PAID';
    if (hasUnpaid) status = 'UNPAID';
    else if (hasPending) status = 'PENDING';

    student.feeStatus = status;
    this.saveStudent(student);
  }

  // Quizzes
  getQuizzes(): Quiz[] { return this.getStore('quizzes'); }
  
  createQuiz(quiz: Omit<Quiz, 'id' | 'createdAt'>) {
    const list = this.getQuizzes();
    const newQuiz: Quiz = {
      ...quiz,
      id: `q-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    list.push(newQuiz);
    this.setStore('quizzes', list);

    // Notify students of this batch
    const students = this.getStudents().filter(s => s.batch === quiz.batch || quiz.batch === 'All Batches');
    students.forEach(student => {
      this.addNotification({
        studentId: student.id,
        title: `New Quiz Assigned`,
        message: `Quiz "${quiz.title}" has been assigned for your subject ${quiz.subject}. Duration: ${quiz.durationMin} mins.`,
        type: 'QUIZ'
      });
    });

    return newQuiz;
  }

  // Attempts
  getQuizAttempts(): QuizAttempt[] { return this.getStore('quizAttempts'); }
  
  submitAttempt(attempt: Omit<QuizAttempt, 'id' | 'completedAt'>) {
    const list = this.getQuizAttempts();
    const newAttempt: QuizAttempt = {
      ...attempt,
      id: `qa-${Date.now()}`,
      completedAt: new Date().toISOString()
    };
    list.push(newAttempt);
    this.setStore('quizAttempts', list);

    // Update Student accuracy, XP and streak
    const student = this.getStudentById(attempt.studentId);
    if (student) {
      // XP Add
      student.xpPoints += attempt.xpGained;

      // Streak Increment
      student.quizStreak += 1;
      
      // Accuracy Calculation (rolling average of all attempts)
      const studentAttempts = list.filter(a => a.studentId === attempt.studentId);
      const totalAccuracy = studentAttempts.reduce((acc, curr) => acc + curr.accuracyPct, 0);
      student.accuracyPct = Math.round(totalAccuracy / studentAttempts.length);

      // Streak Reward Badges
      if (student.quizStreak === 3 && !student.badges.includes('Constancy')) {
        student.badges.push('Constancy');
      } else if (student.quizStreak === 5 && !student.badges.includes('Perfect Week')) {
        student.badges.push('Perfect Week');
      } else if (attempt.accuracyPct === 100 && !student.badges.includes('Sharp Shooter')) {
        student.badges.push('Sharp Shooter');
      }

      this.saveStudent(student);
      
      // Update AI analytics report asynchronously
      this.generateAIReportForStudent(student.id);
    }
  }

  // Study Materials
  getStudyMaterials(): StudyMaterial[] { return this.getStore('studyMaterials'); }
  
  uploadStudyMaterial(material: Omit<StudyMaterial, 'id' | 'uploadedAt'>) {
    const list = this.getStudyMaterials();
    const newMaterial: StudyMaterial = {
      ...material,
      id: `m-${Date.now()}`,
      uploadedAt: new Date().toISOString()
    };
    list.push(newMaterial);
    this.setStore('studyMaterials', list);

    // Notify students
    const students = this.getStudents().filter(s => s.batch === material.batch || material.batch === 'All Batches');
    students.forEach(student => {
      this.addNotification({
        studentId: student.id,
        title: `Study Material Uploaded`,
        message: `New ${material.fileType} titled "${material.title}" is available for ${material.subject}.`,
        type: 'SYSTEM'
      });
    });

    return newMaterial;
  }

  // Notifications
  getNotifications(): Notification[] { return this.getStore('notifications'); }
  
  addNotification(notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) {
    const list = this.getNotifications();
    const newNotification: Notification = {
      ...notification,
      id: `n-${Date.now()}`,
      read: false,
      createdAt: new Date().toISOString()
    };
    list.push(newNotification);
    this.setStore('notifications', list);
    return newNotification;
  }

  markNotificationRead(id: string) {
    const list = this.getNotifications();
    const index = list.findIndex(n => n.id === id);
    if (index >= 0) {
      list[index].read = true;
      this.setStore('notifications', list);
    }
  }

  // AI Reports
  getAIReports(): AIReport[] { return this.getStore('aiReports'); }
  
  getAIReportByStudent(studentId: string): AIReport | undefined {
    return this.getAIReports().find(r => r.studentId === studentId);
  }

  generateAIReportForStudent(studentId: string) {
    const student = this.getStudentById(studentId);
    if (!student) return;

    const attempts = this.getQuizAttempts().filter(a => a.studentId === studentId);
    const reports = this.getAIReports();
    
    // Simple Rule Engine based on Quiz Attempts
    // Find quizzes where student score was < 70% or accuracy < 70%
    const weakTopicsSet = new Set<string>();
    const strongTopicsSet = new Set<string>();

    attempts.forEach(attempt => {
      const quiz = this.getQuizzes().find(q => q.id === attempt.quizId);
      if (quiz) {
        if (attempt.accuracyPct < 70) {
          weakTopicsSet.add(`${quiz.subject} (${quiz.title.split(' ')[0]})`);
        } else {
          strongTopicsSet.add(`${quiz.subject} (${quiz.title.split(' ')[0]})`);
        }
      }
    });

    // Default if no failures
    if (weakTopicsSet.size === 0) {
      if (student.accuracyPct < 70) {
        weakTopicsSet.add('Stoichiometry Mole Ratios');
      } else {
        weakTopicsSet.add('Advanced Rotational Balance');
      }
    }
    if (strongTopicsSet.size === 0) {
      strongTopicsSet.add('Kinematics Equations');
      strongTopicsSet.add('Chemical Formulations');
    }

    const weakTopics = Array.from(weakTopicsSet);
    const strongTopics = Array.from(strongTopicsSet).filter(t => !weakTopics.includes(t));

    const suggestions = [
      `Review lecture videos for ${weakTopics[0] || 'your core subjects'}.`,
      `Practice 5 extra MCQs to strengthen topics with under 70% accuracy.`,
      student.quizStreak > 2 
        ? `Superb! Keep up your ${student.quizStreak}-day streak!` 
        : `Take at least 1 quick test daily to unlock the "Constancy" badge.`
    ];

    const updatedReport: AIReport = {
      id: `ai-${studentId}`,
      studentId,
      weakTopics,
      strongTopics,
      suggestions,
      generatedAt: new Date().toISOString()
    };

    const existingIndex = reports.findIndex(r => r.studentId === studentId);
    if (existingIndex >= 0) {
      reports[existingIndex] = updatedReport;
    } else {
      reports.push(updatedReport);
    }
    this.setStore('aiReports', reports);
  }

  // Custom User Session helper
  login(email: string): User | null {
    const user = this.getUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
    if (user) {
      if (this.isClient()) {
        localStorage.setItem('tms_current_user', JSON.stringify(user));
      }
      return user;
    }
    return null;
  }

  getCurrentUser(): User | null {
    if (this.isClient()) {
      const stored = localStorage.getItem('tms_current_user');
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          return null;
        }
      }
    }
    // Default server/unauthenticated state
    return null;
  }

  logout() {
    if (this.isClient()) {
      localStorage.removeItem('tms_current_user');
    }
  }
}

export const db = new MockDatabase();
