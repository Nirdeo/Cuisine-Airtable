import { NextRequest, NextResponse } from 'next/server';
import { generateResponse, listModels } from '@/utils/docker-model-runner';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, model = 'ai/llama3.2', options = {} } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const response = await generateResponse(prompt, model, options);
    return NextResponse.json(response);
  } catch (error) {
    console.error('Erreur dans la route API Docker Model Runner:', error);
    return NextResponse.json(
      { error: 'Échec de la génération de réponse avec Docker Model Runner' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const models = await listModels();
    return NextResponse.json(models);
  } catch (error) {
    console.error('Erreur lors de la liste des modèles:', error);
    return NextResponse.json(
      { error: 'Échec de la récupération de la liste des modèles' },
      { status: 500 }
    );
  }
}
