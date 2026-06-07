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
    numQuestions?: number; // How many questions to generate (default 30)
    studentPerformanceLog?: string; // Optional context about student weak areas
  }): Promise<GeneratedQuestion[]> {

    const numQuestions = params.numQuestions ?? 30;

    // A real Gemini API key is required — no demo/canned fallback.
    if (!GEMINI_API_KEY || GEMINI_API_KEY.includes('YourGeminiApiKeyHere')) {
      throw new Error('GEMINI_API_KEY is not configured. Set a valid key in .env to generate quizzes.');
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    const systemPrompt = `You are an expert AI EdTech Assistant. Your task is to generate quiz questions based on the provided material.
You must output a raw JSON array containing exactly ${numQuestions} question objects. Do not wrap the JSON in markdown code blocks or write conversational preambles.
Output strictly following this TypeScript type definition:
\`\`\`typescript
interface GeneratedQuestion {
  question: string;
  type: 'MCQ' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'CASE_STUDY' | 'ASSERTION_REASON';
  options?: string[]; // Only provide for MCQ and ASSERTION_REASON (exact 4 options)
  correctAnswer: string; // Index ("0", "1", "2", "3") for MCQ/Assertion, "true" or "false" for TRUE_FALSE, or text answer for other types
  explanation: string; // Authoritative scientific explanation of the correct answer
}
\`\`\``;

    const userPrompt = `
Generate a quiz based on:
- Document Filename: ${params.fileName}
- Subject Domain: ${params.subject}
- Target Difficulty Level: ${params.difficulty}
- Title Reference: ${params.title}
${params.studentPerformanceLog ? `- Target Student Performance Notes: ${params.studentPerformanceLog}` : ''}

Generate ${numQuestions} unique questions. Incorporate the specified difficulty level (EASY means direct conceptual questions; HARD means complex numericals, assertion-reasoning, and case-studies).
`;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }]
            }
          ],
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
  }
};
