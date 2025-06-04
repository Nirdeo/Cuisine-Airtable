import { NextRequest, NextResponse } from 'next/server';
import { generateResponse, listModels } from '@/utils/docker-model-runner';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, model = 'ai/llama3.2:latest', options = {} } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const response = await generateResponse(prompt, model, options);
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in Docker Model Runner API route:', error);
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const models = await listModels();
    return NextResponse.json(models);
  } catch (error) {
    console.error('Error listing models:', error);
    return NextResponse.json(
      { error: 'Failed to list models' },
      { status: 500 }
    );
  }
}
