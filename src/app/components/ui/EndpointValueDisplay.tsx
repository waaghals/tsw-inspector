import React from "react";

export function EndpointValueDisplay({ value }: { value: unknown }) {
  const formatValue = (val: unknown): React.ReactNode => {
    if (val === null) return <span className="text-gray-500 italic">null</span>;
    if (val === undefined) return <span className="text-gray-500 italic">undefined</span>;

    if (typeof val === 'boolean') {
      return <span className={`font-semibold ${val ? 'text-green-600' : 'text-red-600'}`}>{String(val)}</span>;
    }

    if (typeof val === 'number') {
      if (Math.abs(val) > 1e15) {
        return (
          <div className="space-y-1">
            <div><span className="text-blue-600 font-semibold">{val.toExponential(2)}</span> <span className="text-gray-500">(scientific)</span></div>
            <div><span className="text-blue-600 font-semibold">{val.toLocaleString()}</span> <span className="text-gray-500">(formatted)</span></div>
          </div>
        );
      }
      return <span className="text-blue-600 font-semibold">{val}</span>;
    }

    if (typeof val === 'string') {
      if (val.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
        try {
          const date = new Date(val);
          return (
            <div className="space-y-1">
              <div><span className="text-purple-600 font-semibold">&quot;{val}&quot;</span> <span className="text-gray-500">(ISO string)</span></div>
              <div><span className="text-purple-600 font-semibold">{date.toLocaleString()}</span> <span className="text-gray-500">(parsed)</span></div>
            </div>
          );
        } catch {
          // Fall through to regular string handling
        }
      }

      if (val.match(/^[+-]\d{2}:\d{2}:\d{2}/)) {
        return (
          <div>
            <span className="text-purple-600 font-semibold">&quot;{val}&quot;</span> <span className="text-gray-500">(time offset)</span>
          </div>
        );
      }

      return <span className="text-green-600">&quot;{val}&quot;</span>;
    }

    if (Array.isArray(val)) {
      return (
        <div className="pl-4 border-l-2 border-gray-300 dark:border-gray-600">
          <div className="text-orange-600 font-semibold mb-1">Array ({val.length} items):</div>
          {val.map((item, index) => (
            <div key={index} className="mb-1">
              <span className="text-gray-500">[{index}]:</span> {formatValue(item)}
            </div>
          ))}
        </div>
      );
    }

    if (typeof val === 'object') {
      const entries = Object.entries(val as Record<string, unknown>);
      return (
        <div className="pl-4 border-l-2 border-gray-300 dark:border-gray-600">
          <div className="text-orange-600 font-semibold mb-1">Object ({entries.length} properties):</div>
          {entries.map(([key, value]) => (
            <div key={key} className="mb-1">
              <span className="text-gray-700 dark:text-gray-300 font-medium">{key}:</span> {formatValue(value)}
            </div>
          ))}
        </div>
      );
    }

    return <span className="text-gray-600">{String(val)}</span>;
  };

  return (
    <div className="text-xs font-mono bg-white dark:bg-gray-800 p-3 rounded border">
      <div className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Value:</div>
      {formatValue(value)}
    </div>
  );
}