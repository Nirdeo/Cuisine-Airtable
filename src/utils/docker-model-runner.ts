/**
 * Utilitaire pour Docker Model Runner (DMR) avec API OpenAI compatible
 * Remplace l'intégration Ollama
 */

const MODEL_RUNNER_HOST = process.env.MODEL_RUNNER_HOST || 'http://localhost';
const MODEL_RUNNER_PORT = process.env.MODEL_RUNNER_PORT || '12434';
const BASE_URL = `${MODEL_RUNNER_HOST}:${MODEL_RUNNER_PORT}`;

// Interface pour les messages de chat
interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// Interface pour les options de génération
interface GenerationOptions {
  temperature?: number;
  topP?: number;
  topK?: number;
  maxTokens?: number;
}

// Interface pour la réponse de chat
interface ChatResponse {
  choices: Array<{
    message: {
      content: string;
      role: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Interface pour la liste des modèles
interface ModelList {
  data: Array<{
    id: string;
    object: string;
    created: number;
    owned_by: string;
  }>;
}

/**
 * Génère une réponse en utilisant Docker Model Runner
 * @param prompt Le prompt à envoyer au modèle
 * @param model Le modèle à utiliser (par défaut 'ai/llama3.2')
 * @param options Options supplémentaires pour la génération
 * @returns La réponse générée
 */
export async function generateResponse(
  prompt: string,
  model: string = 'ai/llama3.2',
  options: GenerationOptions = {}
): Promise<{ message: { content: string; role: string } }> {
  try {
    const response = await fetch(`${BASE_URL}/engines/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: 'Vous êtes un assistant culinaire expert.' },
          { role: 'user', content: prompt }
        ],
        temperature: options.temperature || 0.7,
        top_p: options.topP,
        max_tokens: options.maxTokens,
      }),
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status} - ${response.statusText}`);
    }

    const data: ChatResponse = await response.json();
    
    if (!data.choices || data.choices.length === 0) {
      throw new Error('Aucune réponse reçue du modèle');
    }

    return {
      message: {
        content: data.choices[0].message.content,
        role: data.choices[0].message.role
      }
    };
  } catch (error) {
    console.error('Erreur lors de la génération de réponse avec Docker Model Runner:', error);
    throw error;
  }
}

/**
 * Liste tous les modèles disponibles
 * @returns Liste des modèles disponibles
 */
export async function listModels(): Promise<{ models: Array<{ name: string }> }> {
  try {
    const response = await fetch(`${BASE_URL}/engines/v1/models`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status} - ${response.statusText}`);
    }

    const data: ModelList = await response.json();
    
    // Convertir au format attendu par l'application
    return {
      models: data.data.map(model => ({ name: model.id }))
    };
  } catch (error) {
    console.error('Erreur lors de la liste des modèles Docker Model Runner:', error);
    throw error;
  }
}

/**
 * Streame une réponse du modèle (version simplifiée pour Docker Model Runner)
 * @param prompt Le prompt à envoyer au modèle
 * @param model Le modèle à utiliser (par défaut 'ai/llama3.2')
 * @param onProgress Fonction de callback pour le streaming
 * @param options Options supplémentaires pour la génération
 */
export async function streamResponse(
  prompt: string,
  model: string = 'ai/llama3.2',
  onProgress: (chunk: string) => void,
  options: GenerationOptions = {}
): Promise<void> {
  try {
    const response = await fetch(`${BASE_URL}/engines/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: 'Vous êtes un assistant culinaire expert.' },
          { role: 'user', content: prompt }
        ],
        temperature: options.temperature || 0.7,
        top_p: options.topP,
        max_tokens: options.maxTokens,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status} - ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Impossible de lire le stream de réponse');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') return;
          
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              onProgress(content);
            }
          } catch (e) {
            // Ignorer les erreurs de parsing des chunks partiels
          }
        }
      }
    }
  } catch (error) {
    console.error('Erreur lors du streaming avec Docker Model Runner:', error);
    throw error;
  }
}

/**
 * Vérifie si Docker Model Runner est disponible
 * @returns true si DMR est accessible
 */
export async function checkModelRunnerHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${BASE_URL}/engines/v1/models`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.ok;
  } catch (error) {
    console.error('Docker Model Runner non accessible:', error);
    return false;
  }
}

export default {
  generateResponse,
  listModels,
  streamResponse,
  checkModelRunnerHealth,
}; 