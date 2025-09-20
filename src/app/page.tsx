"use client";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import TSWClient from "@/lib/clients";
import { ApiNode, TWSApiResponse } from "@/lib/clients/types";

interface PushButtonComponentProps {
  nodePath: string;
  client: TSWClient | null;
}

function PushButtonComponent({ nodePath, client }: PushButtonComponentProps) {
  const handlePushButtonPress = async () => {
    if (!client) return;

    try {
      // Remove "Root/" prefix for the SET request
      const apiNodePath = nodePath.startsWith('Root/') ? nodePath.substring(5) : nodePath;
      await client.set(`${apiNodePath}.InputValue`, 1);
    } catch {
      console.error('Failed to set button press');
    }
  };

  const handlePushButtonRelease = async () => {
    if (!client) return;

    try {
      // Remove "Root/" prefix for the SET request
      const apiNodePath = nodePath.startsWith('Root/') ? nodePath.substring(5) : nodePath;
      await client.set(`${apiNodePath}.InputValue`, 0);
    } catch {
      console.error('Failed to set button release');
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-purple-700 dark:text-purple-300 mb-2">
        Interactive push button - Press and hold to send value 1, release to send value 0
      </p>
      <button
        onMouseDown={handlePushButtonPress}
        onMouseUp={handlePushButtonRelease}
        onMouseLeave={handlePushButtonRelease} // Handle case where mouse leaves button while pressed
        onTouchStart={handlePushButtonPress}
        onTouchEnd={handlePushButtonRelease}
        className="w-32 h-12 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white font-semibold rounded-lg transition-colors select-none"
        style={{ userSelect: 'none' }}
      >
        PUSH
      </button>
      <p className="text-xs text-gray-600 dark:text-gray-400">
        Click and hold or touch and hold to activate
      </p>
    </div>
  );
}

interface IrregularLeverComponentProps {
  nodePath: string;
  client: TSWClient | null;
}

function IrregularLeverComponent({ nodePath, client }: IrregularLeverComponentProps) {
  const [leverRange, setLeverRange] = useState<{ min: number; max: number } | null>(null);
  const [currentLeverValue, setCurrentLeverValue] = useState<number>(0);

  const fetchLeverRange = useCallback(async () => {
    if (!client) {
      setLeverRange(null);
      return;
    }

    try {
      // Remove "Root/" prefix for the GET request
      const apiNodePath = nodePath.startsWith('Root/') ? nodePath.substring(5) : nodePath;

      // Fetch minimum and maximum values
      const [minResponse, maxResponse, currentResponse] = await Promise.all([
        client.get(`${apiNodePath}.Function.GetMinimumInputValue`),
        client.get(`${apiNodePath}.Function.GetMaximumInputValue`),
        client.get(`${apiNodePath}.InputValue`)
      ]);

      let min = 0, max = 1, current = 0;

      if (minResponse.Result === 'Success' && minResponse.Values) {
        const minValue = Object.values(minResponse.Values)[0];
        if (typeof minValue === 'number') min = minValue;
      }

      if (maxResponse.Result === 'Success' && maxResponse.Values) {
        const maxValue = Object.values(maxResponse.Values)[0];
        if (typeof maxValue === 'number') max = maxValue;
      }

      if (currentResponse.Result === 'Success' && currentResponse.Values) {
        const currentValue = Object.values(currentResponse.Values)[0];
        if (typeof currentValue === 'number') current = currentValue;
      }

      setLeverRange({ min, max });
      setCurrentLeverValue(current);
    } catch {
      // Range endpoints might not exist, which is fine
      setLeverRange(null);
      setCurrentLeverValue(0);
    }
  }, [nodePath, client]);

  const handleLeverChange = async (value: number) => {
    if (!client) return;

    try {
      // Remove "Root/" prefix for the SET request
      const apiNodePath = nodePath.startsWith('Root/') ? nodePath.substring(5) : nodePath;

      // Set the value (but don't fetch the actual value yet)
      await client.set(`${apiNodePath}.InputValue`, value);

      // Update the display immediately for responsive feedback
      setCurrentLeverValue(value);
    } catch {
      console.error('Failed to set lever value');
    }
  };

  const handleLeverRelease = async () => {
    if (!client) return;

    try {
      // Remove "Root/" prefix for the GET request
      const apiNodePath = nodePath.startsWith('Root/') ? nodePath.substring(5) : nodePath;

      // Fetch the actual value that was set to ensure accuracy
      const actualResponse = await client.get(`${apiNodePath}.InputValue`);
      if (actualResponse.Result === 'Success' && actualResponse.Values) {
        const actualValue = Object.values(actualResponse.Values)[0];
        if (typeof actualValue === 'number') {
          setCurrentLeverValue(actualValue);
        }
      }
    } catch {
      console.error('Failed to fetch actual lever value');
    }
  };

  // Fetch lever range when component mounts or nodePath/client changes
  useEffect(() => {
    fetchLeverRange();
  }, [fetchLeverRange]);

  if (!leverRange) {
    return (
      <p className="text-sm text-purple-700 dark:text-purple-300">
        Loading lever range data...
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-purple-700 dark:text-purple-300 mb-2">
        Interactive lever control - Drag to set value between {leverRange.min} and {leverRange.max}
      </p>
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono w-12">{leverRange.min}</span>
          <input
            type="range"
            min={leverRange.min}
            max={leverRange.max}
            step="0.01"
            value={currentLeverValue}
            onChange={(e) => handleLeverChange(parseFloat(e.target.value))}
            onMouseUp={handleLeverRelease}
            onTouchEnd={handleLeverRelease}
            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4
              [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer
              [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:bg-blue-500
              [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-none"
          />
          <span className="text-xs font-mono w-12">{leverRange.max}</span>
        </div>
        <div className="flex justify-center">
          <span className="text-sm font-mono bg-white dark:bg-gray-800 px-3 py-1 rounded border">
            Current: {currentLeverValue.toFixed(2)}
          </span>
        </div>
      </div>
      <p className="text-xs text-gray-600 dark:text-gray-400">
        Drag the slider to control the lever position
      </p>
    </div>
  );
}

interface NodeTreeProps {
  node: ApiNode;
  level: number;
  onNodeClick: (nodePath: string) => void;
  searchTerm?: string;
}

function NodeTree({ node, level, onNodeClick, searchTerm }: NodeTreeProps) {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = node.Nodes && node.Nodes.length > 0;

  // Highlight search term in node name
  const highlightText = (text: string, searchTerm?: string) => {
    if (!searchTerm || !searchTerm.trim()) return text;

    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);

    return (
      <>
        {parts.map((part, i) =>
          regex.test(part) ? (
            <span key={i} className="bg-yellow-200 dark:bg-yellow-800 text-yellow-900 dark:text-yellow-100 font-semibold">
              {part}
            </span>
          ) : (
            part
          )
        )}
      </>
    );
  };

  // Auto-expand nodes when searching and they have matching children
  useEffect(() => {
    if (searchTerm && searchTerm.trim() && hasChildren) {
      setExpanded(true);
    }
  }, [searchTerm, hasChildren]);

  return (
    <div className="select-none">
      <div
        className={`flex items-center py-1 px-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer rounded`}
        style={{ paddingLeft: `${level * 20 + 8}px` }}
        onClick={() => {
          if (hasChildren) {
            setExpanded(!expanded);
          }
          onNodeClick(node.NodePath);
        }}
      >
        {hasChildren && (
          <span className="mr-2 text-xs">
            {expanded ? "▼" : "▶"}
          </span>
        )}
        {!hasChildren && <span className="mr-2 text-xs opacity-0">▶</span>}
        <span className="text-sm font-mono">{highlightText(node.NodeName, searchTerm)}</span>
      </div>
      {expanded && hasChildren && (
        <div>
          {node.Nodes!.map((child) => (
            <NodeTree
              key={child.NodePath}
              node={child}
              level={level + 1}
              onNodeClick={onNodeClick}
              searchTerm={searchTerm}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface NodeValuesPanelProps {
  nodePath: string | null;
  client: TSWClient | null;
}

interface EndpointValue {
  endpoint: string;
  value: unknown;
  loading: boolean;
  error: string | null;
  monitoring: boolean;
  inputValue: string;
  settingValue: boolean;
}

function NodeValuesPanel({ nodePath, client }: NodeValuesPanelProps) {
  const [nodeData, setNodeData] = useState<TWSApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [endpointValues, setEndpointValues] = useState<Map<string, EndpointValue>>(new Map());
  const [objectClass, setObjectClass] = useState<string | null>(null);
  const intervalsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const objectClassCacheRef = useRef<Map<string, string | null>>(new Map());

  const fetchEndpointValue = async (endpointName: string, updateLoading = true) => {
    if (!nodePath || !client) return;

    // Remove "Root/" prefix for the GET request, just like we do for list
    const apiNodePath = nodePath.startsWith('Root/') ? nodePath.substring(5) : nodePath;
    const endpointPath = `${apiNodePath}.${endpointName}`;

    if (updateLoading) {
      setEndpointValues(prev => {
        const existing = prev.get(endpointName);
        return new Map(prev.set(endpointName, {
          endpoint: endpointName,
          value: existing?.value || null,
          loading: true,
          error: null,
          monitoring: existing?.monitoring || false,
          inputValue: existing?.inputValue || '',
          settingValue: existing?.settingValue || false
        }));
      });
    }

    try {
      const response = await client.get(endpointPath);
      if (response.Result === 'Success' && response.Values) {
        const value = Object.values(response.Values)[0]; // Get the first value
        setEndpointValues(prev => {
          const existing = prev.get(endpointName);
          return new Map(prev.set(endpointName, {
            endpoint: endpointName,
            value: value,
            loading: false,
            error: null,
            monitoring: existing?.monitoring || false,
            inputValue: existing?.inputValue || String(value || ''),
            settingValue: existing?.settingValue || false
          }));
        });
      } else {
        setEndpointValues(prev => {
          const existing = prev.get(endpointName);
          return new Map(prev.set(endpointName, {
            endpoint: endpointName,
            value: null,
            loading: false,
            error: 'No value returned',
            monitoring: existing?.monitoring || false,
            inputValue: existing?.inputValue || '',
            settingValue: existing?.settingValue || false
          }));
        });
      }
    } catch (err) {
      setEndpointValues(prev => {
        const existing = prev.get(endpointName);
        return new Map(prev.set(endpointName, {
          endpoint: endpointName,
          value: existing?.value || null,
          loading: false,
          error: err instanceof Error ? err.message : 'Unknown error',
          monitoring: existing?.monitoring || false,
          inputValue: existing?.inputValue || '',
          settingValue: existing?.settingValue || false
        }));
      });
    }
  };

  const setEndpointValue = async (endpointName: string, value: string) => {
    if (!nodePath || !client) return;

    // Remove "Root/" prefix for the SET request
    const apiNodePath = nodePath.startsWith('Root/') ? nodePath.substring(5) : nodePath;
    const endpointPath = `${apiNodePath}.${endpointName}`;

    // Convert string to number
    const numericValue = parseFloat(value);
    if (isNaN(numericValue)) {
      setEndpointValues(prev => {
        const existing = prev.get(endpointName);
        return new Map(prev.set(endpointName, {
          ...existing!,
          error: 'Invalid numeric value',
          settingValue: false
        }));
      });
      return;
    }

    setEndpointValues(prev => {
      const existing = prev.get(endpointName);
      return new Map(prev.set(endpointName, {
        ...existing!,
        settingValue: true,
        error: null
      }));
    });

    try {
      const response = await client.set(endpointPath, numericValue);
      if (response.Result === 'Success') {
        // Fetch the new value to confirm the change
        await fetchEndpointValue(endpointName, false);
        setEndpointValues(prev => {
          const existing = prev.get(endpointName);
          return new Map(prev.set(endpointName, {
            ...existing!,
            settingValue: false,
            error: null
          }));
        });
      } else {
        setEndpointValues(prev => {
          const existing = prev.get(endpointName);
          return new Map(prev.set(endpointName, {
            ...existing!,
            settingValue: false,
            error: 'Failed to set value'
          }));
        });
      }
    } catch (err) {
      setEndpointValues(prev => {
        const existing = prev.get(endpointName);
        return new Map(prev.set(endpointName, {
          ...existing!,
          settingValue: false,
          error: err instanceof Error ? err.message : 'Unknown error setting value'
        }));
      });
    }
  };

  const handleEndpointClick = async (endpointName: string) => {
    await fetchEndpointValue(endpointName, true);
  };

  const fetchObjectClass = useCallback(async () => {
    if (!nodePath || !client) {
      setObjectClass(null);
      return;
    }

    // Check cache first
    const cached = objectClassCacheRef.current.get(nodePath);
    if (cached !== undefined) {
      setObjectClass(cached);
      return;
    }

    try {
      // Remove "Root/" prefix for the GET request
      const apiNodePath = nodePath.startsWith('Root/') ? nodePath.substring(5) : nodePath;
      const response = await client.get(`${apiNodePath}.ObjectClass`);

      if (response.Result === 'Success' && response.Values) {
        const classValue = Object.values(response.Values)[0];
        const objectClassValue = typeof classValue === 'string' ? classValue : null;
        setObjectClass(objectClassValue);
        objectClassCacheRef.current.set(nodePath, objectClassValue);
      } else {
        setObjectClass(null);
        objectClassCacheRef.current.set(nodePath, null);
      }
    } catch {
      // ObjectClass endpoint might not exist, which is fine
      setObjectClass(null);
      objectClassCacheRef.current.set(nodePath, null);
    }
  }, [nodePath, client]);



  const toggleEndpointMonitoring = (endpointName: string) => {
    const existing = endpointValues.get(endpointName);
    const isCurrentlyMonitoring = existing?.monitoring || false;

    // Clear existing interval if stopping monitoring
    if (isCurrentlyMonitoring) {
      const intervalId = intervalsRef.current.get(endpointName);
      if (intervalId) {
        clearInterval(intervalId);
        intervalsRef.current.delete(endpointName);
      }
    }

    // Start new interval if enabling monitoring
    if (!isCurrentlyMonitoring) {
      // Also fetch immediately when starting monitoring
      fetchEndpointValue(endpointName, true);

      const newIntervalId = setInterval(() => {
        fetchEndpointValue(endpointName, false);
      }, 2000); // Fetch every 2 seconds

      intervalsRef.current.set(endpointName, newIntervalId);
    }

    // Update the endpoint state
    setEndpointValues(prev => {
      const newMap = new Map(prev);
      newMap.set(endpointName, {
        endpoint: endpointName,
        value: existing?.value || null,
        loading: existing?.loading || false,
        error: existing?.error || null,
        monitoring: !isCurrentlyMonitoring,
        inputValue: existing?.inputValue || '',
        settingValue: existing?.settingValue || false
      });
      return newMap;
    });
  };

  useEffect(() => {
    if (!nodePath || !client) {
      setNodeData(null);
      setObjectClass(null);
      // Clear all intervals when nodePath is null or client is null
      intervalsRef.current.forEach((intervalId) => {
        clearInterval(intervalId);
      });
      intervalsRef.current.clear();
      setEndpointValues(new Map());
      return;
    }

    // Clear all intervals and endpoint values when node changes
    intervalsRef.current.forEach((intervalId) => {
      clearInterval(intervalId);
    });
    intervalsRef.current.clear();
    setEndpointValues(new Map());

    const fetchNodeData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Remove "Root/" prefix for the list call
        const listPath = nodePath.startsWith('Root/') ? nodePath.substring(5) : nodePath;

        // First try to call list on the specific node
        const listResponse = await client!.list(listPath);
        if (listResponse.Result === 'Success') {
          setNodeData(listResponse);
        } else {
          // If list fails, try to get the node values
          const getResponse = await client!.get(nodePath);
          setNodeData(getResponse);
        }

        // Fetch ObjectClass for interactive controls
        await fetchObjectClass();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch node data');
      } finally {
        setLoading(false);
      }
    };

    fetchNodeData();
  }, [nodePath, client, fetchObjectClass]);

  // Cleanup intervals on unmount
  useEffect(() => {
    const intervals = intervalsRef.current;
    return () => {
      intervals.forEach((intervalId) => {
        clearInterval(intervalId);
      });
      intervals.clear();
    };
  }, []);

  if (!nodePath) {
    return (
      <div className="p-4 text-center text-gray-500">
        Select a node to view its values
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4 text-center">
        Loading node data...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        Error: {error}
      </div>
    );
  }

  if (!nodeData) {
    return (
      <div className="p-4 text-center text-gray-500">
        No data available for this node
      </div>
    );
  }

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-3 font-mono break-all">
        {nodePath}
      </h3>

      {/* Interactive Controls */}
      {objectClass && (
        <div className="mb-6">
          <h4 className="text-md font-semibold mb-2">Interactive Controls</h4>
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-purple-800 dark:text-purple-200">
                Object Class: <code className="bg-white dark:bg-gray-800 px-2 py-1 rounded text-xs">{objectClass}</code>
              </span>
            </div>

            {objectClass === 'PushButtonComponent' && (
              <PushButtonComponent nodePath={nodePath} client={client} />
            )}

            {objectClass === 'IrregularLeverComponent' && (
              <IrregularLeverComponent nodePath={nodePath} client={client} />
            )}

            {objectClass && objectClass !== 'PushButtonComponent' && objectClass !== 'IrregularLeverComponent' && (
              <p className="text-sm text-purple-700 dark:text-purple-300">
                No interactive controls available for this object class.
              </p>
            )}
          </div>
        </div>
      )}


      {/* Show endpoints if available */}
      {nodeData.Endpoints && nodeData.Endpoints.length > 0 && (
        <div className="mb-6">
          <h4 className="text-md font-semibold mb-2">Endpoints (click to fetch value):</h4>
          <div className="space-y-1">
            {nodeData.Endpoints.map((endpoint, index) => {
              const endpointValue = endpointValues.get(endpoint.Name);
              return (
                <div key={index} className="bg-green-50 dark:bg-green-900/20 rounded">
                  <div className="flex justify-between items-center p-2">
                    <div
                      className="flex-1 cursor-pointer hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors rounded p-1"
                      onClick={() => handleEndpointClick(endpoint.Name)}
                    >
                      <span className="font-mono text-sm font-medium">{endpoint.Name}</span>
                    </div>
                    <div className="flex items-center gap-2 p-1">
                      {endpointValue?.loading && (
                        <span className="text-xs text-gray-500">Loading...</span>
                      )}
                      {endpointValue?.monitoring && (
                        <span className="text-xs text-green-600 dark:text-green-400 font-medium">Live</span>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleEndpointMonitoring(endpoint.Name);
                        }}
                        className={`px-2 py-1 text-xs rounded font-medium transition-colors ${
                          endpointValue?.monitoring
                            ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50'
                            : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50'
                        }`}
                      >
                        {endpointValue?.monitoring ? 'Unwatch' : 'Watch'}
                      </button>
                      <span className={`px-2 py-1 text-xs rounded font-medium ${
                        endpoint.Writable
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {endpoint.Writable ? 'Writable' : 'Read-only'}
                      </span>
                    </div>
                  </div>
                  {endpointValue && !endpointValue.loading && (
                    <div className="px-2 pb-2 space-y-2">
                      {endpointValue.error ? (
                        <div className="text-xs text-red-500 font-mono bg-red-50 dark:bg-red-900/20 p-1 rounded">
                          Error: {endpointValue.error}
                        </div>
                      ) : (
                        <div className="text-xs font-mono bg-white dark:bg-gray-800 p-2 rounded border">
                          <strong>Value:</strong> {
                            typeof endpointValue.value === 'object'
                              ? JSON.stringify(endpointValue.value, null, 2)
                              : String(endpointValue.value)
                          }
                        </div>
                      )}

                      {endpoint.Writable && (
                        <div className="flex gap-2 items-center">
                          <input
                            type="number"
                            step="any"
                            value={endpointValue.inputValue}
                            onChange={(e) => {
                              setEndpointValues(prev => {
                                const newMap = new Map(prev);
                                const existing = newMap.get(endpoint.Name);
                                if (existing) {
                                  newMap.set(endpoint.Name, {
                                    ...existing,
                                    inputValue: e.target.value,
                                    error: null
                                  });
                                }
                                return newMap;
                              });
                            }}
                            className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            placeholder="Enter numeric value"
                            disabled={endpointValue.settingValue}
                          />
                          <button
                            onClick={() => setEndpointValue(endpoint.Name, endpointValue.inputValue)}
                            disabled={endpointValue.settingValue || !endpointValue.inputValue.trim()}
                            className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                          >
                            {endpointValue.settingValue ? 'Setting...' : 'Set'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Show values if available */}
      {nodeData.Values && Object.keys(nodeData.Values).length > 0 && (
        <div>
          <h4 className="text-md font-semibold mb-2">Values:</h4>
          <div className="space-y-2">
            {Object.entries(nodeData.Values).map(([key, value]) => (
              <div key={key} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-900 rounded">
                <span className="font-mono text-sm font-medium">{key}</span>
                <span className="font-mono text-sm text-right">
                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Show message if no values, nodes, or endpoints */}
      {(!nodeData.Values || Object.keys(nodeData.Values).length === 0) &&
       (!nodeData.Nodes || nodeData.Nodes.length === 0) &&
       (!nodeData.Endpoints || nodeData.Endpoints.length === 0) && (
        <div className="text-center text-gray-500">
          No values, child nodes, or endpoints available for this node
        </div>
      )}
    </div>
  );
}

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
