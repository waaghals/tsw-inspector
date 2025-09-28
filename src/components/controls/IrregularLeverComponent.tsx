import { useState, useCallback, useEffect } from "react";
import { IrregularLeverComponentProps } from "@/types";

export function IrregularLeverComponent({ nodePath, client }: IrregularLeverComponentProps) {
  const [leverRange, setLeverRange] = useState<{ min: number; max: number } | null>(null);
  const [currentLeverValue, setCurrentLeverValue] = useState<number>(0);

  const fetchLeverRange = useCallback(async () => {
    if (!client) {
      setLeverRange(null);
      return;
    }

    try {
      const apiNodePath = nodePath.startsWith('Root/') ? nodePath.substring(5) : nodePath;

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
      setLeverRange(null);
      setCurrentLeverValue(0);
    }
  }, [nodePath, client]);

  const handleLeverChange = async (value: number) => {
    if (!client) return;

    try {
      const apiNodePath = nodePath.startsWith('Root/') ? nodePath.substring(5) : nodePath;

      await client.set(`${apiNodePath}.InputValue`, value);

      setCurrentLeverValue(value);
    } catch {
      console.error('Failed to set lever value');
    }
  };

  const handleLeverRelease = async () => {
    if (!client) return;

    try {
      const apiNodePath = nodePath.startsWith('Root/') ? nodePath.substring(5) : nodePath;

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