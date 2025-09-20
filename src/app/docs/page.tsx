"use client";
import { useEffect, useRef, useState } from "react";

export default function DocsPage() {
  const redocContainerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [yamlContent, setYamlContent] = useState<string>("");
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    const loadRedoc = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check if OpenAPI spec is accessible and load content for fallback
        const specResponse = await fetch('/openapi.yaml');
        if (!specResponse.ok) {
          throw new Error(`Failed to load OpenAPI spec: ${specResponse.status}`);
        }
        const yamlText = await specResponse.text();
        setYamlContent(yamlText);

        // Try multiple CDNs for Redoc
        const redocUrls = [
          'https://cdn.jsdelivr.net/npm/redoc@2.1.3/bundles/redoc.standalone.js',
          'https://unpkg.com/redoc@2.1.3/bundles/redoc.standalone.js',
          'https://cdn.redoc.ly/redoc/2.1.3/bundles/redoc.standalone.js'
        ];

        let redocLoaded = false;

        // Load Redoc if not already loaded
        if (!window.Redoc) {
          for (const url of redocUrls) {
            try {
              await new Promise<void>((resolve, reject) => {
                const script = document.createElement('script');
                script.src = url;
                script.onload = () => {
                  redocLoaded = true;
                  resolve();
                };
                script.onerror = () => reject(new Error(`Failed to load from ${url}`));
                document.head.appendChild(script);
              });
              break; // Success, exit loop
            } catch (err) {
              console.warn(`Failed to load Redoc from ${url}:`, err);
              continue; // Try next URL
            }
          }
        } else {
          redocLoaded = true;
        }

        if (redocLoaded && window.Redoc && redocContainerRef.current) {
          // Initialize Redoc
          window.Redoc.init('/openapi.yaml', {
            scrollYOffset: 60,
            theme: {
              colors: {
                primary: {
                  main: '#3b82f6'
                }
              }
            }
          }, redocContainerRef.current);
          setLoading(false);
        } else {
          // Fall back to custom YAML viewer
          console.warn('Failed to load Redoc from all CDNs, falling back to YAML viewer');
          setShowFallback(true);
          setLoading(false);
        }

      } catch (err) {
        console.error('Error loading documentation:', err);
        setShowFallback(true);
        setLoading(false);
      }
    };

    loadRedoc();

    // Cleanup function
    return () => {
      if (redocContainerRef.current) {
        redocContainerRef.current.innerHTML = '';
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Header with navigation */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">Train Sim World API Documentation</h1>
          <div className="flex gap-3">
            {showFallback && (
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
              >
                Try Redoc Again
              </button>
            )}
            <a
              href="/"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              ← Back to Inspector
            </a>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-lg">Loading API documentation...</div>
            <p className="text-sm text-gray-600 mt-2">Trying multiple CDN sources...</p>
          </div>
        </div>
      )}

      {/* Fallback YAML viewer */}
      {showFallback && !loading && (
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h2 className="text-lg font-semibold text-yellow-800 mb-2">Fallback Documentation Viewer</h2>
            <p className="text-sm text-yellow-700">
              Redoc couldn't be loaded from CDN. Showing raw OpenAPI specification below.
              <button
                onClick={() => window.location.reload()}
                className="ml-2 underline hover:no-underline"
              >
                Click here to retry
              </button>
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2">API Base URL</h3>
              <code className="text-sm bg-white px-2 py-1 rounded">http://localhost:31270</code>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 mb-2">Authentication</h3>
              <p className="text-sm text-green-700">API key in <code>DTGCommKey</code> header</p>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="font-semibold text-purple-800 mb-2">Main Endpoints</h3>
              <ul className="text-sm text-purple-700 space-y-1">
                <li><code>GET /list</code></li>
                <li><code>GET /get/{'{node}.{endpoint}'}</code></li>
                <li><code>PATCH /set/{'{node}.{endpoint}'}</code></li>
              </ul>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-100 px-4 py-2 border-b border-gray-200">
              <h2 className="text-lg font-semibold">OpenAPI Specification (YAML)</h2>
            </div>
            <div className="p-4">
              <pre className="text-xs font-mono bg-white p-4 rounded border overflow-auto max-h-[60vh] whitespace-pre-wrap">
                {yamlContent}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Redoc container */}
      {!showFallback && <div ref={redocContainerRef} />}
    </div>
  );
}

// Add TypeScript declaration for Redoc
declare global {
  interface Window {
    Redoc?: {
      init: (specUrl: string, options: any, element: HTMLElement | null) => void;
    };
  }
}