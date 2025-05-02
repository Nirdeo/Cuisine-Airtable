import { Ollama } from 'ollama';

// Initialize the Ollama client
const ollama = new Ollama({
  host: process.env.OLLAMA_HOST || 'http://localhost:11434',
});

/**
 * Generate a response using the specified model
 * @param prompt The prompt to send to the model
 * @param model The model to use (defaults to 'llama3.2')
 * @param options Additional options for the generation
 * @returns The generated response
 */
export async function generateResponse(
  prompt: string,
  model: string = 'llama3.2',
  options: {
    temperature?: number;
    topP?: number;
    topK?: number;
    maxTokens?: number;
  } = {}
) {
  try {
    const response = await ollama.chat({
      model,
      messages: [{ role: 'user', content: prompt }],
      options: {
        temperature: options.temperature,
        top_p: options.topP,
        top_k: options.topK,
        num_predict: options.maxTokens,
      },
    });

    return response;
  } catch (error) {
    console.error('Error generating response from Ollama:', error);
    throw error;
  }
}

/**
 * List all available models
 * @returns Array of available models
 */
export async function listModels() {
  try {
    const models = await ollama.list();
    return models;
  } catch (error) {
    console.error('Error listing Ollama models:', error);
    throw error;
  }
}

/**
 * Stream a response from the model
 * @param prompt The prompt to send to the model
 * @param model The model to use (defaults to 'llama3.2')
 * @param onProgress Callback function for streaming progress
 * @param options Additional options for the generation
 */
export async function streamResponse(
  prompt: string,
  model: string = 'llama3.2',
  onProgress: (chunk: string) => void,
  options: {
    temperature?: number;
    topP?: number;
    topK?: number;
    maxTokens?: number;
  } = {}
) {
  try {
    const stream = await ollama.chat({
      model,
      messages: [{ role: 'user', content: prompt }],
      options: {
        temperature: options.temperature,
        top_p: options.topP,
        top_k: options.topK,
        num_predict: options.maxTokens,
      },
      stream: true,
    });

    for await (const chunk of stream) {
      if (chunk.message?.content) {
        onProgress(chunk.message.content);
      }
    }
  } catch (error) {
    console.error('Error streaming response from Ollama:', error);
    throw error;
  }
}

export default ollama;
