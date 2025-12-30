'use client';

import { useState, type FormEvent } from 'react';
import { formatEther } from 'viem';

interface ImageGeneratorProps {
  onGenerate: (prompt: string) => Promise<void>;
  isGenerating: boolean;
  generateFee: bigint;
}

export function ImageGenerator({ onGenerate, isGenerating, generateFee }: ImageGeneratorProps) {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) return;
    await onGenerate(prompt.trim());
  };

  const examplePrompts = [
    'A cosmic dragon flying through nebula clouds',
    'Cyberpunk city at sunset with neon lights',
    'Ancient forest with magical glowing mushrooms',
    'Underwater temple with bioluminescent creatures',
  ];

  return (
    <div className="card">
      <h3 className="text-xl font-semibold mb-4">Generate Your Image</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="prompt" className="block text-sm text-white/60 mb-2">
            Describe your image
          </label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="A mystical forest at twilight with glowing fireflies..."
            className="input min-h-[120px] resize-none"
            disabled={isGenerating}
            maxLength={1000}
          />
          <p className="text-xs text-white/40 mt-1">
            {prompt.length}/1000 characters
          </p>
        </div>

        <button
          type="submit"
          disabled={!prompt.trim() || isGenerating}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {isGenerating ? (
            <>
              <div className="spinner" />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Generate ({formatEther(generateFee)} ETH)</span>
            </>
          )}
        </button>
      </form>

      {/* Example prompts */}
      <div className="mt-6 pt-6 border-t border-white/10">
        <p className="text-sm text-white/50 mb-3">Try an example:</p>
        <div className="flex flex-wrap gap-2">
          {examplePrompts.map((example, index) => (
            <button
              key={index}
              onClick={() => setPrompt(example)}
              disabled={isGenerating}
              className="text-xs px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-colors disabled:opacity-50"
            >
              {example.length > 40 ? `${example.slice(0, 40)}...` : example}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
