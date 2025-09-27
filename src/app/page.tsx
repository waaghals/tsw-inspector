"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import TSWClient from "@/lib/clients";
import { ApiNode } from "@/lib/clients/types";
import { NodeTree } from "@/app/components/ui/NodeTree";
import { NodeValuesPanel } from "@/app/components/panels/NodeValuesPanel";




export default function Home() {
  const [nodes, setNodes] = useState<ApiNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showHelpModal, setShowHelpModal] = useState(false);

  const client = useMemo(() => {
    if (!apiKey) return null;
    return new TSWClient(apiKey);
  }, [apiKey]);

  // Filter nodes based on search term
  const filterNodes = useCallback((nodes: ApiNode[], searchTerm: string): ApiNode[] => {
    if (!searchTerm.trim()) return nodes;

    const filtered: ApiNode[] = [];
    const searchLower = searchTerm.toLowerCase();

    for (const node of nodes) {
      // Check if current node matches
      const nodeMatches = node.NodeName.toLowerCase().includes(searchLower) ||
                         node.NodePath.toLowerCase().includes(searchLower);

      // Recursively filter child nodes
      const filteredChildren = node.Nodes ? filterNodes(node.Nodes, searchTerm) : [];

      // Include node if it matches or has matching children
      if (nodeMatches || filteredChildren.length > 0) {
        filtered.push({
          ...node,
          Nodes: filteredChildren
        });
      }
    }

    return filtered;
  }, []);

  const filteredNodes = useMemo(() => {
    return filterNodes(nodes, searchTerm);
  }, [nodes, searchTerm, filterNodes]);

  const connectToAPI = async () => {
    if (!client) return;

    try {
      setLoading(true);
      setError(null);
      const response = await client.list();
      if (response.Result === 'Success' && response.Nodes) {
        setNodes(response.Nodes);
        setIsConnected(true);
        // Store API key in localStorage for convenience
        localStorage.setItem('tsw-api-key', apiKey);
      } else {
        setError('Failed to fetch nodes - check your API key');
        setIsConnected(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed - check your API key and ensure Train Sim World is running');
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  };

  // Load API key from localStorage on mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem('tsw-api-key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
  }, []);

  // Show connection form if not connected
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center">
        <div className="w-full max-w-md p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Train Sim World API Inspector</h1>
            <p className="text-gray-600 dark:text-gray-400">Inspect and control in game data.<br />The API allows direct access to all information and controls of the environment and the train.</p>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6 shadow-lg">
            <form onSubmit={(e) => { e.preventDefault(); connectToAPI(); }}>
              <div className="mb-4">
                <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  API Key
                </label>
                <input
                  type="text"
                  id="apiKey"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-gray-100"
                  placeholder="Enter your TSW API key"
                  required
                />
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !apiKey.trim()}
                className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Connecting...' : 'Connect'}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <button
                  onClick={() => setShowHelpModal(true)}
                  className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Need help?
                </button>
                <div className="flex gap-4">
                  <a
                    href="https://redocly.github.io/redoc/?url=https://tsw-inspector.waaghals.dev/openapi.yaml"
                    className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    View API Docs
                  </a>
                  <a
                    href="https://github.com/waaghals/tsw-inspector"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    GitHub
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Help Modal */}
        {showHelpModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">Getting Started with TSW API Inspector</h2>
                  <button
                    onClick={() => setShowHelpModal(false)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-6 text-sm">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">1. Enable the Train Sim World API</h3>
                    <p className="mb-2">To use this inspector, you need to start Train Sim World with the HTTP API enabled:</p>
                    <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded font-mono text-xs">
                      TrainSimWorld5.exe -HTTPAPI
                    </div>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                      Add this flag to your Steam launch options or create a shortcut with this parameter.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-2">2. Find Your API Key</h3>
                    <p className="mb-2">Once TSW is running with the API enabled, find your API key in:</p>
                    <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded font-mono text-xs break-all">
                      %USERPROFILE%\Documents\My Games\TrainSimWorld5\Saved\Config\CommAPIKey.txt
                    </div>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                      Copy the entire contents of this file and paste it into the API Key field above.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-2">3. Using the Inspector</h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                      <li>Browse the node tree to explore TSW&apos;s internal structure</li>
                      <li>Click on nodes to view their values and endpoints</li>
                      <li>Use the search box to quickly find specific nodes</li>
                      <li>Click &quot;Watch&quot; on endpoints to monitor live values</li>
                      <li>Interact with controls (buttons, levers) when available</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-2">Troubleshooting</h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                      <li>Ensure TSW is running and you&apos;re in a session</li>
                      <li>Check that the -HTTPAPI flag is properly set</li>
                      <li>Make sure no firewall is blocking localhost:31270</li>
                    </ul>
                  </div>
                </div>

                <div className="mt-6 flex justify-center">
                  <button
                    onClick={() => setShowHelpModal(false)}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                  >
                    Got it!
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg">Loading API nodes...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">API Nodes Inspector</h1>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setIsConnected(false);
                setNodes([]);
                setSelectedNode(null);
                setError(null);
              }}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
              Disconnect
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-200px)]">
          {/* Nodes Tree */}
          <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
            <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-lg font-semibold">Nodes Tree</h2>
                <button
                  onClick={connectToAPI}
                  disabled={loading}
                  className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search nodes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 pl-9 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <svg
                  className="absolute left-3 top-2.5 h-4 w-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2 top-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
            <div className="overflow-auto h-full">
              {searchTerm && (
                <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    {filteredNodes.length === 0 ? 'No nodes found' : `Found ${filteredNodes.length} matching node${filteredNodes.length === 1 ? '' : 's'}`}
                  </p>
                </div>
              )}
              {filteredNodes.map((node) => (
                <NodeTree
                  key={node.NodePath}
                  node={node}
                  level={0}
                  onNodeClick={setSelectedNode}
                  searchTerm={searchTerm}
                />
              ))}
            </div>
          </div>

          {/* Node Values */}
          <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
            <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold">Node Values</h2>
            </div>
            <div className="overflow-auto h-full">
              <NodeValuesPanel nodePath={selectedNode} client={client} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
