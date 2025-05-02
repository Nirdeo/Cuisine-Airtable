import Image from "next/image";
import OllamaChat from "@/components/OllamaChat";

export default function Home() {
  return (
    <div className="grid grid-rows-[auto_1fr_auto] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <header className="w-full flex flex-col items-center gap-4">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />
        <h1 className="text-2xl font-bold">Ollama Chat Integration</h1>
        <p className="text-center max-w-xl text-gray-600">
          This demo shows how to use Ollama with Next.js. Make sure you have Ollama running locally
          or specify your Ollama host in the environment variables.
        </p>
      </header>

      <main className="flex flex-col gap-[32px] w-full items-center">
        <OllamaChat />

        <div className="mt-8 p-4 bg-gray-50 rounded-lg border max-w-2xl">
          <h2 className="text-lg font-semibold mb-2">Getting Started</h2>
          <ol className="list-inside list-decimal text-sm/6 space-y-2 font-[family-name:var(--font-geist-mono)]">
            <li className="tracking-[-.01em]">
              Make sure Ollama is running locally on port 11434
            </li>
            <li className="tracking-[-.01em]">
              Select a model from the dropdown (if available)
            </li>
            <li className="tracking-[-.01em]">
              Type your message and click Send
            </li>
          </ol>
        </div>
      </main>

      <footer className="flex gap-[24px] flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://github.com/ollama/ollama-js"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Ollama JS Documentation
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://ollama.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          Ollama Website
        </a>
      </footer>
    </div>
  );
}
