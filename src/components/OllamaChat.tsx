'use client';

import { useState, useRef, useEffect } from 'react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default function OllamaChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [models, setModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState('llama3.2');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch available models on component mount
  useEffect(() => {
    async function fetchModels() {
      try {
        const response = await fetch('/api/ollama');
        if (!response.ok) throw new Error('Failed to fetch models');

        const data = await response.json();
        if (data.models) {
          setModels(data.models.map((model: any) => model.name));
          if (data.models.length > 0) {
            setSelectedModel(data.models[0].name);
          }
        }
      } catch (error) {
        console.error('Error fetching models:', error);
      }
    }

    fetchModels();
  }, []);

  // Scroll to bottom of chat when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim()) return;

    // Add user message to chat
    const userMessage: ChatMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ollama', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: input,
          model: selectedModel,
          options: {
            temperature: 0.7,
          },
        }),
      });

      if (!response.ok) throw new Error('Failed to generate response');

      const data = await response.json();

      // Add assistant message to chat
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.message?.content || 'No response generated',
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error generating response:', error);
      // Add error message to chat
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Error: Failed to generate response' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col w-full max-w-2xl mx-auto p-4 h-[600px] border rounded-lg">
      <div className="mb-4 flex items-center">
        <label htmlFor="model-select" className="mr-2 text-sm font-medium">
          Model:
        </label>
        <select
          id="model-select"
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          className="border rounded px-2 py-1 text-sm"
          disabled={isLoading}
        >
          {models.length > 0 ? (
            models.map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))
          ) : (
            <>
              <option value="llama3.2">llama3.2</option>
              <option value="mistral">mistral</option>
            </>
          )}
        </select>
      </div>

      <div className="flex-1 overflow-y-auto mb-4 space-y-4 p-4 border rounded bg-gray-50">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            Start a conversation with Ollama
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-100 ml-auto max-w-[80%]'
                  : 'bg-white border max-w-[80%]'
              }`}
            >
              <p className="text-sm font-semibold mb-1">
                {message.role === 'user' ? 'You' : 'Ollama'}
              </p>
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 p-2 border rounded"
          disabled={isLoading}
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
          disabled={isLoading || !input.trim()}
        >
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  );
}
