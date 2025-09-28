import { useState, useMemo } from "react";
import { WeatherControlComponentProps, WeatherPreset } from "@/types";

export function WeatherControlComponent({ nodePath, client, endpoints }: WeatherControlComponentProps) {
  const [applyingPreset, setApplyingPreset] = useState<string | null>(null);

  const writableEndpoints = useMemo(() => endpoints.filter(ep => ep.Writable), [endpoints]);

  const weatherPresets = useMemo<WeatherPreset[]>(() => [
    {
      name: "Reset Weather",
      description: "Reset to default weather conditions",
      icon: "🔄",
      color: "bg-green-100 border-green-300 text-green-800",
      values: {
        "Reset": 1.0
      } as Record<string, number>
    },
    {
      name: "Clear Sunny",
      description: "Perfect sunny day with clear skies",
      icon: "☀️",
      color: "bg-yellow-100 border-yellow-300 text-yellow-800",
      values: {
        "Temperature": 25.0,
        "Cloudiness": 0.0,
        "Precipitation": 0.0,
        "Wetness": 0.0,
        "GroundSnow": 0.0,
        "PiledSnow": 0.0,
        "FogDensity": 0.0
      }
    },
    {
      name: "Partly Cloudy",
      description: "Mix of sun and clouds",
      icon: "⛅",
      color: "bg-blue-100 border-blue-300 text-blue-800",
      values: {
        "Temperature": 20.0,
        "Cloudiness": 0.4,
        "Precipitation": 0.0,
        "Wetness": 0.1,
        "GroundSnow": 0.0,
        "PiledSnow": 0.0,
        "FogDensity": 0.0
      }
    },
    {
      name: "Overcast",
      description: "Heavy cloud cover, no rain",
      icon: "☁️",
      color: "bg-gray-100 border-gray-300 text-gray-800",
      values: {
        "Temperature": 15.0,
        "Cloudiness": 0.9,
        "Precipitation": 0.0,
        "Wetness": 0.2,
        "GroundSnow": 0.0,
        "PiledSnow": 0.0,
        "FogDensity": 0.1
      }
    },
    {
      name: "Light Rain",
      description: "Gentle rainfall with moderate visibility",
      icon: "🌦️",
      color: "bg-blue-100 border-blue-400 text-blue-900",
      values: {
        "Temperature": 12.0,
        "Cloudiness": 0.8,
        "Precipitation": 0.3,
        "Wetness": 0.6,
        "GroundSnow": 0.0,
        "PiledSnow": 0.0,
        "FogDensity": 0.1
      }
    },
    {
      name: "Heavy Rain",
      description: "Strong rainfall with reduced visibility",
      icon: "🌧️",
      color: "bg-indigo-100 border-indigo-400 text-indigo-900",
      values: {
        "Temperature": 8.0,
        "Cloudiness": 1.0,
        "Precipitation": 0.8,
        "Wetness": 0.9,
        "GroundSnow": 0.0,
        "PiledSnow": 0.0,
        "FogDensity": 0.2
      }
    },
    {
      name: "Foggy",
      description: "Dense fog with very low visibility",
      icon: "🌫️",
      color: "bg-gray-200 border-gray-400 text-gray-900",
      values: {
        "Temperature": 5.0,
        "Cloudiness": 0.7,
        "Precipitation": 0.0,
        "Wetness": 0.4,
        "GroundSnow": 0.0,
        "PiledSnow": 0.0,
        "FogDensity": 0.8
      }
    },
    {
      name: "Winter Snow",
      description: "Cold snowy conditions",
      icon: "❄️",
      color: "bg-blue-200 border-blue-400 text-blue-900",
      values: {
        "Temperature": -2.0,
        "Cloudiness": 0.8,
        "Precipitation": 0.4,
        "Wetness": 0.1,
        "GroundSnow": 0.7,
        "PiledSnow": 0.5,
        "FogDensity": 0.0
      }
    },
    {
      name: "Blizzard",
      description: "Severe winter storm with heavy snow",
      icon: "🌨️",
      color: "bg-indigo-200 border-indigo-500 text-indigo-900",
      values: {
        "Temperature": -8.0,
        "Cloudiness": 1.0,
        "Precipitation": 0.9,
        "Wetness": 0.0,
        "GroundSnow": 1.0,
        "PiledSnow": 0.9,
        "FogDensity": 0.3
      }
    }
  ], []);

  const applyPreset = async (preset: WeatherPreset) => {
    if (!client || applyingPreset) return;

    setApplyingPreset(preset.name);

    try {
      const apiNodePath = nodePath.startsWith('Root/') ? nodePath.substring(5) : nodePath;
      const matchedEndpoints: {endpoint: string; value: number}[] = [];

      writableEndpoints.forEach(endpoint => {
        if (preset.values[endpoint.Name] !== undefined) {
          matchedEndpoints.push({
            endpoint: endpoint.Name,
            value: preset.values[endpoint.Name]
          });
          return;
        }

        const presetKeys = Object.keys(preset.values);
        for (const presetKey of presetKeys) {
          if (endpoint.Name.toLowerCase().includes(presetKey.toLowerCase()) ||
              presetKey.toLowerCase().includes(endpoint.Name.toLowerCase())) {
            matchedEndpoints.push({
              endpoint: endpoint.Name,
              value: preset.values[presetKey]
            });
            break;
          }
        }
      });

      const promises = matchedEndpoints.map(async ({endpoint, value}) => {
        try {
          await client.set(`${apiNodePath}.${endpoint}`, value);
        } catch (error) {
          console.error(`Failed to set ${endpoint} to ${value}:`, error);
        }
      });

      await Promise.all(promises);

    } catch (error) {
      console.error(`Failed to apply preset ${preset.name}:`, error);
    } finally {
      setApplyingPreset(null);
    }
  };

  if (writableEndpoints.length === 0) {
    return (
      <p className="text-sm text-purple-700 dark:text-purple-300">
        No writable endpoints found for weather controls.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-purple-700 dark:text-purple-300 mb-4">
        Weather Management Controls - Quick presets for realistic weather scenarios
      </p>

      <div>
        <h5 className="text-sm font-semibold mb-3 text-gray-800 dark:text-gray-200">Weather Presets</h5>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {weatherPresets.map(preset => (
            <button
              key={preset.name}
              onClick={() => applyPreset(preset)}
              disabled={applyingPreset !== null}
              className={`
                relative p-3 rounded-lg border-2 text-left transition-all hover:scale-105 disabled:hover:scale-100 disabled:opacity-50
                ${preset.color}
                ${applyingPreset === preset.name ? 'ring-2 ring-blue-400 ring-offset-2' : ''}
              `}
              title={preset.description}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{preset.icon}</span>
                <span className="text-xs font-semibold">{preset.name}</span>
              </div>
              <p className="text-xs opacity-75 leading-tight">{preset.description}</p>
              {applyingPreset === preset.name && (
                <div className="absolute inset-0 bg-white bg-opacity-50 rounded-lg flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}