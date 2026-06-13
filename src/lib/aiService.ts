import { QuizType } from '@prisma/client';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Dynamic question structure for type checking
export interface GeneratedQuestion {
  question: string;
  type: QuizType;
  options?: string[];
  correctAnswer: string;
  explanation: string;
}

export const GeminiService = {
  async generateQuiz(params: {
    title: string;
    subject: string;
    difficulty: string;
    fileName: string;
    className?: string; // e.g. "Grade 10" — scopes question difficulty/level
    numQuestions?: number; // How many questions to generate (default 30)
    studentPerformanceLog?: string; // Optional context about student weak areas
    documentData?: { mimeType: string; base64: string }; // attached source document
  }): Promise<GeneratedQuestion[]> {

    const numQuestions = params.numQuestions ?? 30;
    const hasDoc = !!params.documentData;

    // A real Gemini API key is required — no demo/canned fallback.
    if (!GEMINI_API_KEY || GEMINI_API_KEY.includes('YourGeminiApiKeyHere')) {
      throw new Error('GEMINI_API_KEY is not configured. Set a valid key in .env to generate quizzes.');
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    const systemPrompt = `You are an expert AI EdTech Assistant. Your task is to generate quiz questions.
You must output a raw JSON array containing exactly ${numQuestions} question objects. Do not wrap the JSON in markdown code blocks or write conversational preambles.
${hasDoc
  ? 'A source document is attached. Base EVERY question STRICTLY on the actual content of that attached document. Do NOT invent or include topics that are not present in the document.'
  : 'Generate questions on the given subject.'}
Output strictly following this TypeScript type definition:
\`\`\`typescript
interface GeneratedQuestion {
  question: string;
  type: 'MCQ' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'CASE_STUDY' | 'ASSERTION_REASON';
  options?: string[]; // Only provide for MCQ and ASSERTION_REASON (exact 4 options)
  correctAnswer: string; // Index ("0", "1", "2", "3") for MCQ/Assertion, "true" or "false" for TRUE_FALSE, or text answer for other types
  explanation: string; // Authoritative explanation of the correct answer
}
\`\`\``;

    const userPrompt = `
Generate a quiz with these constraints:
- Class / Grade level: ${params.className || 'School level'}
- Subject: ${params.subject}
- Target Difficulty Level: ${params.difficulty}
- Title Reference: ${params.title}
${hasDoc ? '- Source: the ATTACHED document. Every question must come from its content only.' : `- Document Filename (context only): ${params.fileName}`}
${params.studentPerformanceLog ? `- Target Student Performance Notes: ${params.studentPerformanceLog}` : ''}

Generate ${numQuestions} unique questions that are appropriate for ${params.className || 'this'} students and strictly within the subject "${params.subject}". Do not drift into unrelated subjects or topics. Incorporate the difficulty level (EASY = direct conceptual; HARD = complex numericals, assertion-reasoning, case-studies).
`;

    // Build the multimodal parts: prompt text + (optional) the source document
    const parts: any[] = [{ text: `${systemPrompt}\n\n${userPrompt}` }];
    if (params.documentData) {
      parts.push({
        inlineData: {
          mimeType: params.documentData.mimeType,
          data: params.documentData.base64
        }
      });
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.7
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API HTTP Error: ${response.status}`);
      }

      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!rawText) {
        throw new Error('Empty content block from Gemini response.');
      }

      // Parse JSON
      const questionsList = JSON.parse(rawText) as GeneratedQuestion[];
      if (!Array.isArray(questionsList)) {
        throw new Error('Gemini did not return an array schema.');
      }

      return questionsList.map((q, idx) => ({
        question: q.question || 'Conceptual Question',
        type: q.type || 'MCQ',
        options: q.options || (q.type === 'MCQ' ? ['Option A', 'Option B', 'Option C', 'Option D'] : undefined),
        correctAnswer: String(q.correctAnswer ?? '0'),
        explanation: q.explanation || 'Refer to text notes for explanation.'
      }));

    } catch (e: any) {
      console.error('Gemini Quiz Generation Service Error:', e.message);
      throw new Error(`Quiz generation failed: ${e.message}`);
    }
  },

  // Conversational doubt-solver for students.
  async answerDoubt(params: {
    question: string;
    subject?: string;
    history?: { role: 'user' | 'model'; text: string }[];
  }): Promise<string> {
    if (!GEMINI_API_KEY || GEMINI_API_KEY.includes('YourGeminiApiKeyHere')) {
      throw new Error('GEMINI_API_KEY is not configured. Set a valid key in .env to use the AI tutor.');
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    const systemPrompt = `You are AcuMind AI Tutor, a friendly and encouraging tutor for school and coaching students${
      params.subject ? ` (current subject focus: ${params.subject})` : ''
    }.
Explain concepts clearly and step by step, in simple language. Use small examples. Keep answers concise and focused on the student's question. If the question is a numerical problem, show the working. Never be condescending. If a question is outside academics, gently steer back to studies.`;

    // Build conversation contents from history + the new question
    const contents: any[] = [];
    (params.history || []).slice(-8).forEach((h) => {
      contents.push({ role: h.role, parts: [{ text: h.text }] });
    });
    contents.push({ role: 'user', parts: [{ text: params.question }] });

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents,
          generationConfig: { temperature: 0.6 }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API HTTP Error: ${response.status}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error('Empty response from AI tutor.');
      return text as string;
    } catch (e: any) {
      console.error('Gemini Doubt Solver Error:', e.message);
      throw new Error(`AI tutor failed: ${e.message}`);
    }
  }
};
