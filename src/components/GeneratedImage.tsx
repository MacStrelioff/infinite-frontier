'use client';

interface GeneratedImageProps {
  imageBase64: string;
  prompt: string;
}

export function GeneratedImage({ imageBase64, prompt }: GeneratedImageProps) {
  return (
    <div className="card overflow-hidden">
      <div className="relative aspect-square rounded-lg overflow-hidden glow">
        <img
          src={`data:image/png;base64,${imageBase64}`}
          alt={prompt}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="mt-4">
        <h4 className="text-sm text-white/50 mb-1">Prompt</h4>
        <p className="text-white/90">{prompt}</p>
      </div>
    </div>
  );
}
