import { useState, useEffect, useRef, useCallback } from "react";
import { NodeValuesPanelProps, EndpointValue } from "@/types";
import { TWSApiResponse } from "@/lib/clients/types";
import { PushButtonComponent } from "@/components/controls/PushButtonComponent";
import { IrregularLeverComponent } from "@/components/controls/IrregularLeverComponent";
import { WeatherControlComponent } from "@/components/controls/WeatherControlComponent";
import { TimeOfDayComponent } from "@/components/controls/TimeOfDayComponent";
import { EndpointValueDisplay } from "@/components/ui/EndpointValueDisplay";

export function NodeValuesPanel({ nodePath, client }: NodeValuesPanelProps) {
  const [nodeData, setNodeData] = useState<TWSApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [endpointValues, setEndpointValues] = useState<Map<string, EndpointValue>>(new Map());
  const [expandedEndpoints, setExpandedEndpoints] = useState<Set<string>>(new Set());
  const [objectClass, setObjectClass] = useState<string | null>(null);
  const [showWeatherControls, setShowWeatherControls] = useState<boolean>(false);
  const [showTimeOfDayControls, setShowTimeOfDayControls] = useState<boolean>(false);
  const intervalsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const objectClassCacheRef = useRef<Map<string, string | null>>(new Map());

  const shouldShowWeatherControls = useCallback((nodePath: string | null, nodeData: TWSApiResponse | null): boolean => {
    if (!nodePath || !nodeData) return false;

    const isWeatherManager = nodePath.toLowerCase().includes('weathermanager');
    const hasWritableEndpoints = nodeData.Endpoints && nodeData.Endpoints.some(ep => ep.Writable);

    return isWeatherManager && !!hasWritableEndpoints;
  }, []);

  const shouldShowTimeOfDayControls = useCallback((nodePath: string | null, nodeData: TWSApiResponse | null): boolean => {
    if (!nodePath || !nodeData) return false;

    const isTimeOfDay = nodePath.toLowerCase().includes('timeofday');
    const hasDataEndpoint = nodeData.Endpoints && nodeData.Endpoints.some(ep => ep.Name === 'Data');

    return isTimeOfDay && !!hasDataEndpoint;
  }, []);

  const fetchEndpointValue = async (endpointName: string, updateLoading = true) => {
    if (!nodePath || !client) return;

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
        const values = response.Values;
        const firstValue = Object.values(values)[0];
        setEndpointValues(prev => {
          const existing = prev.get(endpointName);
          return new Map(prev.set(endpointName, {
            endpoint: endpointName,
            value: values,
            loading: false,
            error: null,
            monitoring: existing?.monitoring || false,
            inputValue: existing?.inputValue || String(firstValue || ''),
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

    const apiNodePath = nodePath.startsWith('Root/') ? nodePath.substring(5) : nodePath;
    const endpointPath = `${apiNodePath}.${endpointName}`;

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
    const isExpanded = expandedEndpoints.has(endpointName);

    if (isExpanded) {
      // Collapse the endpoint
      setExpandedEndpoints(prev => {
        const newSet = new Set(prev);
        newSet.delete(endpointName);
        return newSet;
      });
    } else {
      // Expand the endpoint and fetch its value
      setExpandedEndpoints(prev => new Set(prev).add(endpointName));
      await fetchEndpointValue(endpointName, true);
    }
  };

  const fetchObjectClass = useCallback(async () => {
    if (!nodePath || !client) {
      setObjectClass(null);
      return;
    }

    const cached = objectClassCacheRef.current.get(nodePath);
    if (cached !== undefined) {
      setObjectClass(cached);
      return;
    }

    try {
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
      setObjectClass(null);
      objectClassCacheRef.current.set(nodePath, null);
    }
  }, [nodePath, client]);

  const toggleEndpointMonitoring = (endpointName: string) => {
    const existing = endpointValues.get(endpointName);
    const isCurrentlyMonitoring = existing?.monitoring || false;

    if (isCurrentlyMonitoring) {
      const intervalId = intervalsRef.current.get(endpointName);
      if (intervalId) {
        clearInterval(intervalId);
        intervalsRef.current.delete(endpointName);
      }
    }

    if (!isCurrentlyMonitoring) {
      fetchEndpointValue(endpointName, true);

      const newIntervalId = setInterval(() => {
        fetchEndpointValue(endpointName, false);
      }, 2000);

      intervalsRef.current.set(endpointName, newIntervalId);
    }

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
      intervalsRef.current.forEach((intervalId) => {
        clearInterval(intervalId);
      });
      intervalsRef.current.clear();
      setEndpointValues(new Map());
      setExpandedEndpoints(new Set());
      return;
    }

    intervalsRef.current.forEach((intervalId) => {
      clearInterval(intervalId);
    });
    intervalsRef.current.clear();
    setEndpointValues(new Map());
    setExpandedEndpoints(new Set());

    const fetchNodeData = async () => {
      setLoading(true);
      setError(null);
      try {
        const listPath = nodePath.startsWith('Root/') ? nodePath.substring(5) : nodePath;

        const listResponse = await client!.list(listPath);
        if (listResponse.Result === 'Success') {
          setNodeData(listResponse);
        } else {
          const getResponse = await client!.get(nodePath);
          setNodeData(getResponse);
        }

        await fetchObjectClass();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch node data');
      } finally {
        setLoading(false);
      }
    };

    fetchNodeData();
  }, [nodePath, client, fetchObjectClass]);

  useEffect(() => {
    setShowWeatherControls(shouldShowWeatherControls(nodePath, nodeData));
  }, [nodePath, nodeData, shouldShowWeatherControls]);

  useEffect(() => {
    setShowTimeOfDayControls(shouldShowTimeOfDayControls(nodePath, nodeData));
  }, [nodePath, nodeData, shouldShowTimeOfDayControls]);

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

      {showWeatherControls && nodeData && nodeData.Endpoints && (
        <div className="mb-6">
          <h4 className="text-md font-semibold mb-2">Weather Controls</h4>
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-orange-800 dark:text-orange-200">
                Node Type: <code className="bg-white dark:bg-gray-800 px-2 py-1 rounded text-xs">WeatherManager</code>
              </span>
            </div>
            <WeatherControlComponent
              nodePath={nodePath}
              client={client}
              endpoints={nodeData.Endpoints}
            />
          </div>
        </div>
      )}

      {showTimeOfDayControls && (
        <div className="mb-6">
          <h4 className="text-md font-semibold mb-2">Time of Day</h4>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Node Type: <code className="bg-white dark:bg-gray-800 px-2 py-1 rounded text-xs">TimeOfDay</code>
              </span>
            </div>
            <TimeOfDayComponent
              nodePath={nodePath}
              client={client}
            />
          </div>
        </div>
      )}

      {nodeData.Endpoints && nodeData.Endpoints.length > 0 && (
        <div className="mb-6">
          <h4 className="text-md font-semibold mb-2">Endpoints (click to expand/collapse):</h4>
          <div className="space-y-1">
            {nodeData.Endpoints.map((endpoint, index) => {
              const endpointValue = endpointValues.get(endpoint.Name);
              const isExpanded = expandedEndpoints.has(endpoint.Name);
              return (
                <div key={index} className="bg-green-50 dark:bg-green-900/20 rounded">
                  <div className="flex justify-between items-center p-2">
                    <div
                      className="flex-1 cursor-pointer hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors rounded p-1 flex items-center gap-2"
                      onClick={() => handleEndpointClick(endpoint.Name)}
                    >
                      <span className="text-xs text-gray-500">
                        {isExpanded ? "▼" : "▶"}
                      </span>
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
                  {isExpanded && endpointValue && !endpointValue.loading && (
                    <div className="px-2 pb-2 space-y-2">
                      {endpointValue.error ? (
                        <div className="text-xs text-red-500 font-mono bg-red-50 dark:bg-red-900/20 p-1 rounded">
                          Error: {endpointValue.error}
                        </div>
                      ) : (
                        <EndpointValueDisplay value={endpointValue.value} />
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