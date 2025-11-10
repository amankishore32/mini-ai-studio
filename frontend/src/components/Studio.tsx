import React, { useState, useEffect } from "react";
import {
  Camera,
  LogOut,
  Loader2,
  AlertCircle,
  CheckCircle,
  X,
  ImageIcon,
} from "lucide-react";
import Upload from "./Upload";
import { useGenerate } from "../hooks/useGenerate";
import type { User, Generation } from "../types";

const Studio: React.FC<{ user: User; onLogout: () => void }> = ({
  user,
  onLogout,
}) => {
  const [imagePreview, setImagePreview] = useState<string>("");
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("realistic");
  const {
    isGenerating,
    error,
    result,
    generations,
    handleGenerate: generateWithParams,
    handleAbort,
    setError,
    setResult,
    fetchGenerations,
  } = useGenerate({ token: user.token });

  useEffect(() => {
    void fetchGenerations();
  }, [fetchGenerations]);

  const handleImageUpload = (file: File | null) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError("Image must be less than 10MB");
      return;
    }
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      setError("Only JPEG and PNG images are supported");
      return;
    }
    setImagePreview(URL.createObjectURL(file));
    setError(null);
  };

  const loadGeneration = (gen: Generation) => {
    setResult(gen);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Camera className="w-8 h-8 text-purple-600" />
            <h1 className="text-2xl font-bold text-gray-900">AI Studio</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user.email}</span>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors focus:ring-2 focus:ring-purple-500"
            >
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Create Generation</h2>
              <Upload
                imagePreview={imagePreview}
                disabled={isGenerating}
                onSelect={(file) => handleImageUpload(file)}
              />
              <div className="mb-4">
                <label
                  htmlFor="prompt"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Prompt
                </label>
                <textarea
                  id="prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe what you want to generate..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  rows={3}
                  disabled={isGenerating}
                />
              </div>
              <div className="mb-4">
                <label
                  htmlFor="style"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Style
                </label>
                <select
                  id="style"
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={isGenerating}
                >
                  <option value="realistic">Realistic</option>
                  <option value="artistic">Artistic</option>
                  <option value="vintage">Vintage</option>
                  <option value="modern">Modern</option>
                </select>
              </div>
              {error && (
                <div
                  className="mb-4 flex items-start gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg"
                  role="alert"
                >
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />{" "}
                  <div className="flex-1">{error}</div>
                </div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => generateWithParams(prompt, style)}
                  disabled={isGenerating || !prompt.trim()}
                  className="flex-1 bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                >
                  {isGenerating ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" /> Generating...
                    </span>
                  ) : (
                    "Generate"
                  )}
                </button>
                {isGenerating && (
                  <button
                    onClick={handleAbort}
                    className="px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    aria-label="Abort generation"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Recent Generations</h2>
              {generations.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No generations yet
                </p>
              ) : (
                <div className="space-y-3">
                  {generations.map((gen) => (
                    <button
                      key={gen.id}
                      onClick={() => loadGeneration(gen)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors text-left focus:ring-2 focus:ring-purple-500"
                    >
                      <div className="w-16 h-16 bg-gray-100 flex items-center justify-center rounded-lg text-gray-400 text-xs overflow-hidden flex-shrink-0">
                        {gen.imageUrl ? (
                          <img
                            src={gen.imageUrl}
                            alt={gen.prompt}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-center text-xs font-medium">
                            {gen.status}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {gen.prompt}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(gen.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Result</h2>
            {result ? (
              <div className="space-y-4">
                <div className="w-full h-64 bg-gray-100 flex items-center justify-center rounded-lg text-gray-400">
                  {result.imageUrl ? (
                    <img
                      src={result.imageUrl}
                      alt={result.prompt}
                      className="w-full h-64 object-cover rounded-lg"
                    />
                  ) : (
                    "No image"
                  )}
                </div>
                <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">
                    Status: {result.status}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>Prompt:</strong> {result.prompt}
                  </p>
                  <p>
                    <strong>Style:</strong> {result.style}
                  </p>
                  <p>
                    <strong>Created:</strong>{" "}
                    {new Date(result.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <ImageIcon className="w-24 h-24 mb-4" />
                <p>Your generated item will appear here</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Studio;
