/**
 * Utilitaire pour Docker Model Runner
 * Utilise l'API OpenAI compatible de Docker Model Runner
 */

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface ModelInfo {
  id: string;
  object: string;
  created: number;
  owned_by: string;
}

interface ModelsResponse {
  object: string;
  data: ModelInfo[];
}

/**
 * Configuration pour Docker Model Runner
 */
const DMR_CONFIG = {
  baseUrl: process.env.DMR_HOST || 'http://model-runner.docker.internal',
  model: process.env.DMR_MODEL || 'ai/llama3.2:latest',
  endpoints: {
    chat: '/engines/v1/chat/completions',
    models: '/engines/v1/models',
    completions: '/engines/v1/completions'
  }
};

/**
 * Génère une réponse en utilisant Docker Model Runner
 * @param prompt Le prompt à envoyer au modèle
 * @param model Le modèle à utiliser (par défaut: llama3.2)
 * @param options Options supplémentaires pour la génération
 * @returns La réponse générée
 */
export async function generateResponse(
  prompt: string,
  model: string = DMR_CONFIG.model,
  options: {
    temperature?: number;
    topP?: number;
    maxTokens?: number;
    systemPrompt?: string;
  } = {}
) {
  try {
    const messages: ChatMessage[] = [];
    
    // Ajouter le prompt système si fourni
    if (options.systemPrompt) {
      messages.push({
        role: 'system',
        content: options.systemPrompt
      });
    }
    
    // Ajouter le prompt utilisateur
    messages.push({
      role: 'user',
      content: prompt
    });

    const response = await fetch(`${DMR_CONFIG.baseUrl}${DMR_CONFIG.endpoints.chat}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages,
        temperature: options.temperature || 0.7,
        top_p: options.topP,
        max_tokens: options.maxTokens,
      }),
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status} - ${response.statusText}`);
    }

    const data: ChatCompletionResponse = await response.json();
    
    // Retourner dans un format compatible avec l'ancien code Ollama
    return {
      message: {
        content: data.choices[0]?.message?.content || '',
        role: data.choices[0]?.message?.role || 'assistant'
      },
      model: data.model,
      created_at: new Date(data.created * 1000).toISOString(),
      done: true
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
export async function listModels() {
  try {
    const response = await fetch(`${DMR_CONFIG.baseUrl}${DMR_CONFIG.endpoints.models}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status} - ${response.statusText}`);
    }

    const data: ModelsResponse = await response.json();
    
    // Retourner dans un format compatible avec l'ancien code Ollama
    return {
      models: data.data.map(model => ({
        name: model.id,
        model: model.id,
        modified_at: new Date(model.created * 1000).toISOString(),
        size: 0, // Docker Model Runner ne fournit pas cette info
        digest: '',
        details: {
          parent_model: '',
          format: 'gguf',
          family: 'llama',
          families: ['llama'],
          parameter_size: '3B',
          quantization_level: 'Q4_0'
        }
      }))
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des modèles:', error);
    throw error;
  }
}

/**
 * Streaming de réponse depuis le modèle
 * @param prompt Le prompt à envoyer au modèle
 * @param model Le modèle à utiliser
 * @param onProgress Fonction callback pour le streaming
 * @param options Options supplémentaires
 */
export async function streamResponse(
  prompt: string,
  model: string = DMR_CONFIG.model,
  onProgress: (chunk: string) => void,
  options: {
    temperature?: number;
    topP?: number;
    maxTokens?: number;
    systemPrompt?: string;
  } = {}
) {
  try {
    const messages: ChatMessage[] = [];
    
    if (options.systemPrompt) {
      messages.push({
        role: 'system',
        content: options.systemPrompt
      });
    }
    
    messages.push({
      role: 'user',
      content: prompt
    });

    const response = await fetch(`${DMR_CONFIG.baseUrl}${DMR_CONFIG.endpoints.chat}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages,
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
          if (data === '[DONE]') {
            return;
          }
          
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              onProgress(content);
            }
          } catch (e) {
            // Ignorer les erreurs de parsing pour les chunks partiels
          }
        }
      }
    }
  } catch (error) {
    console.error('Erreur lors du streaming de réponse:', error);
    throw error;
  }
}

/**
 * Test de connectivité avec Docker Model Runner
 * @returns true si la connexion est établie
 */
export async function testConnection(): Promise<boolean> {
  try {
    const response = await fetch(`${DMR_CONFIG.baseUrl}${DMR_CONFIG.endpoints.models}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.ok;
  } catch (error) {
    console.error('Erreur de connexion à Docker Model Runner:', error);
    return false;
  }
}

export default {
  generateResponse,
  listModels,
  streamResponse,
  testConnection,
  config: DMR_CONFIG
}; 