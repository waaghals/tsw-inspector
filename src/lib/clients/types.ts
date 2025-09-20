export interface ApiEndpoint {
  Name: string;
  Writable: boolean;
}

export interface ApiNode {
  NodePath: string;
  NodeName: string;
  Nodes?: ApiNode[];
  Endpoints?: ApiEndpoint[];
}

export interface TWSApiResponse {
  Result: 'Success' | 'Error';
  Values?: Record<string, unknown>;
  Error?: string;
  NodePath?: string;
  NodeName?: string;
  Nodes?: ApiNode[];
  Endpoints?: ApiEndpoint[];
}

export interface TWSControllerConfig {
  baseUrl?: string;
  apiKey?: string;
}

export type ReverserDirection = 'forward' | 'neutral' | 'reverse' | 'f' | 'n' | 'r';

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

export interface RequestOptions {
  method: HttpMethod;
  headers: Record<string, string>;
}