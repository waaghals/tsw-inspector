import { useState, useCallback, useEffect } from "react";
import { TimeOfDayComponentProps } from "@/types";

export function TimeOfDayComponent({ nodePath, client }: TimeOfDayComponentProps) {
  const [timeData, setTimeData] = useState<{
    localTime: string;
    localTimeISO: string;
    worldTime: string;
    worldTimeISO: string;
    systemTime: string;
    systemTimeISO: string;
    gmtOffset: number;
    dayPercentage: number;
    sunriseTime: string;
    solarNoonTime: string;
    sunsetTime: string;
    sunPositionAzimuth: number;
    sunPositionAltitude: number;
    moonPositionAzimuth: number;
    moonPositionAltitude: number;
    originLatitude: number;
    originLongitude: number;
    timezone: string;
    loading: boolean;
    initialLoad: boolean;
    error: string | null;
  }>({
    localTime: '',
    localTimeISO: '',
    worldTime: '',
    worldTimeISO: '',
    systemTime: '',
    systemTimeISO: '',
    gmtOffset: 0,
    dayPercentage: 0,
    sunriseTime: '',
    solarNoonTime: '',
    sunsetTime: '',
    sunPositionAzimuth: 0,
    sunPositionAltitude: 0,
    moonPositionAzimuth: 0,
    moonPositionAltitude: 0,
    originLatitude: 0,
    originLongitude: 0,
    timezone: 'UTC',
    loading: true,
    initialLoad: true,
    error: null
  });

  const getTimezoneFromCoordinates = useCallback((longitude: number, latitude: number): string => {
    const estimatedOffset = Math.round(longitude / 15);

    if (latitude >= 49 && latitude <= 55 && longitude >= 5 && longitude <= 15) {
      return 'Europe/Berlin';
    } else if (latitude >= 50 && latitude <= 59 && longitude >= -8 && longitude <= 2) {
      return 'Europe/London';
    } else if (latitude >= 40 && latitude <= 50 && longitude >= -5 && longitude <= 10) {
      return 'Europe/Paris';
    } else if (latitude >= 25 && latitude <= 49 && longitude >= -125 && longitude <= -66) {
      if (longitude >= -125 && longitude <= -120) return 'America/Los_Angeles';
      if (longitude >= -120 && longitude <= -105) return 'America/Denver';
      if (longitude >= -105 && longitude <= -90) return 'America/Chicago';
      if (longitude >= -90 && longitude <= -66) return 'America/New_York';
    }

    if (estimatedOffset >= -12 && estimatedOffset <= 12) {
      return `Etc/GMT${estimatedOffset <= 0 ? '+' : '-'}${Math.abs(estimatedOffset)}`;
    }

    return 'UTC';
  }, []);

  const fetchTimeData = useCallback(async (isInitialLoad = false) => {
    if (!client) {
      console.log('TimeOfDay: No client available');
      setTimeData(prev => ({
        ...prev,
        loading: false,
        initialLoad: false,
        error: 'No client available'
      }));
      return;
    }

    try {
      console.log('TimeOfDay: Starting fetch for', nodePath);
      if (isInitialLoad) {
        setTimeData(prev => ({ ...prev, loading: true, error: null }));
      } else {
        setTimeData(prev => ({ ...prev, error: null }));
      }

      const apiNodePath = nodePath.startsWith('Root/') ? nodePath.substring(5) : nodePath;
      const endpoint = `${apiNodePath}.Data`;
      console.log('TimeOfDay: Fetching from endpoint:', endpoint);

      const response = await client.get(endpoint);
      console.log('TimeOfDay: Response received:', response);

      if (response.Result === 'Success' && response.Values) {
        const values = response.Values;

        const originLatitude = values.OriginLatitude as number;
        const originLongitude = values.OriginLongitude as number;
        const timezone = getTimezoneFromCoordinates(originLongitude, originLatitude);

        const localTimeISO = values.LocalTimeISO8601 as string;
        const worldTimeISO = values.WorldTimeISO8601 as string;
        const systemTimeISO = values.SystemTimeISO8601 as string;

        const localTime = new Date(localTimeISO).toLocaleTimeString('en-GB', { hour12: false });
        const worldTime = new Date(worldTimeISO).toLocaleTimeString('en-GB', { hour12: false });
        const systemTime = new Date(systemTimeISO).toLocaleTimeString('en-GB', { hour12: false });

        setTimeData({
          localTime,
          localTimeISO,
          worldTime,
          worldTimeISO,
          systemTime,
          systemTimeISO,
          gmtOffset: values.GMTOffset as number,
          dayPercentage: values.DayPercentage as number,
          sunriseTime: values.SunriseTime as string,
          solarNoonTime: values.SolarNoonTime as string,
          sunsetTime: values.SunsetTime as string,
          sunPositionAzimuth: values.SunPositionAzimuth as number,
          sunPositionAltitude: values.SunPositionAltitude as number,
          moonPositionAzimuth: values.MoonPositionAzimuth as number,
          moonPositionAltitude: values.MoonPositionAltitude as number,
          originLatitude,
          originLongitude,
          timezone,
          loading: false,
          initialLoad: false,
          error: null
        });

        console.log('TimeOfDay: Time data updated successfully');
      } else {
        const errorMsg = response.Message || response.Error || 'Failed to fetch time data';
        console.log('TimeOfDay: API error:', errorMsg);
        setTimeData(prev => ({
          ...prev,
          loading: false,
          initialLoad: false,
          error: errorMsg
        }));
      }
    } catch (error) {
      console.error('TimeOfDay: Exception occurred:', error);
      setTimeData(prev => ({
        ...prev,
        loading: false,
        initialLoad: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  }, [client, nodePath, getTimezoneFromCoordinates]);

  useEffect(() => {
    fetchTimeData(true);
    const interval = setInterval(() => fetchTimeData(false), 1000);
    return () => clearInterval(interval);
  }, [fetchTimeData]);

  if (timeData.loading && timeData.initialLoad) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-center mb-2">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2"></div>
          <span className="text-sm text-gray-600 dark:text-gray-400">Loading time data...</span>
        </div>
        <div className="text-xs text-gray-500 text-center mt-1">
          TimeOfDay node: {nodePath}
        </div>
      </div>
    );
  }

  if (timeData.error) {
    return (
      <div className="p-4 text-center">
        <p className="text-sm text-red-500">Error: {timeData.error}</p>
        <button
          onClick={() => fetchTimeData(false)}
          className="mt-2 px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-blue-700 dark:text-blue-300 mb-3">
        Comprehensive Time & Astronomical Data - {timeData.timezone} - Updates every second
      </p>

      <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-center border-2 border-gray-700">
        <div className="text-2xl font-bold mb-1 tracking-wider">
          {timeData.localTime}
        </div>
        <div className="text-sm opacity-75 mb-2">
          Local Time (GMT{timeData.gmtOffset >= 0 ? '+' : ''}{timeData.gmtOffset})
        </div>
        <div className="text-xs opacity-60">
          World Time: {timeData.worldTime} UTC
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Day Progress</span>
          <span className="text-sm font-mono text-blue-700 dark:text-blue-300">{(timeData.dayPercentage * 100).toFixed(1)}%</span>
        </div>
        <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
          <div
            className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-1000"
            style={{ width: `${timeData.dayPercentage * 100}%` }}
          ></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
          <h6 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-2">☀️ Solar Data</h6>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-yellow-700 dark:text-yellow-300">Sunrise:</span>
              <span className="font-mono">{timeData.sunriseTime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-yellow-700 dark:text-yellow-300">Solar Noon:</span>
              <span className="font-mono">{timeData.solarNoonTime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-yellow-700 dark:text-yellow-300">Sunset:</span>
              <span className="font-mono">{timeData.sunsetTime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-yellow-700 dark:text-yellow-300">Position:</span>
              <span className="font-mono">{timeData.sunPositionAzimuth.toFixed(1)}° / {timeData.sunPositionAltitude.toFixed(1)}°</span>
            </div>
          </div>
        </div>

        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg">
          <h6 className="text-sm font-semibold text-indigo-800 dark:text-indigo-200 mb-2">🌙 Lunar Data</h6>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-indigo-700 dark:text-indigo-300">Azimuth:</span>
              <span className="font-mono">{timeData.moonPositionAzimuth.toFixed(1)}°</span>
            </div>
            <div className="flex justify-between">
              <span className="text-indigo-700 dark:text-indigo-300">Altitude:</span>
              <span className="font-mono">{timeData.moonPositionAltitude.toFixed(1)}°</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded">
          <span className="text-gray-600 dark:text-gray-400">Location:</span>
          <div className="font-mono text-xs">
            {timeData.originLatitude.toFixed(4)}, {timeData.originLongitude.toFixed(4)}
          </div>
        </div>
        <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded">
          <span className="text-gray-600 dark:text-gray-400">System Time:</span>
          <div className="font-mono text-xs">{timeData.systemTime}</div>
        </div>
      </div>
    </div>
  );
}