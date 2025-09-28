import TSWClient from "@/lib/clients";

export interface PushButtonComponentProps {
  nodePath: string;
  client: TSWClient | null;
}

export interface IrregularLeverComponentProps {
  nodePath: string;
  client: TSWClient | null;
}

export interface NodeTreeProps {
  node: import("@/lib/clients/types").ApiNode;
  level: number;
  onNodeClick: (nodePath: string) => void;
  searchTerm?: string;
}

export interface NodeValuesPanelProps {
  nodePath: string | null;
  client: TSWClient | null;
}

export interface WeatherControlComponentProps {
  nodePath: string;
  client: TSWClient | null;
  endpoints: {Name: string; Writable: boolean}[];
}

export interface TimeOfDayComponentProps {
  nodePath: string;
  client: TSWClient | null;
}

export interface WeatherPreset {
  name: string;
  description: string;
  icon: string;
  values: Record<string, number>;
  color: string;
}

export interface EndpointValue {
  endpoint: string;
  value: unknown;
  loading: boolean;
  error: string | null;
  monitoring: boolean;
  inputValue: string;
  settingValue: boolean;
}