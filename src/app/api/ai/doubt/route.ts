import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { GeminiService } from '@/lib/aiService';

// POST — ask the AI tutor a doubt
export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(req, ['STUDENT', 'ADMIN']);
    if (!authResult.authenticated) {
      return authResult.response;
    }

    const body = await req.json();
    const { question, subject, history } = body;

    if (!question || !question.trim()) {
      return NextResponse.json({ error: 'Please enter a question' }, { status: 400 });
    }

    const answer = await GeminiService.answerDoubt({
      question: question.trim(),
      subject,
      history: Array.isArray(history) ? history : []
    });

    return NextResponse.json({ answer });
  } catch (e: any) {
    console.error('AI doubt error:', e);
    return NextResponse.json(
      { error: e.message || 'The AI tutor is unavailable right now.' },
      { status: 500 }
    );
  }
}
