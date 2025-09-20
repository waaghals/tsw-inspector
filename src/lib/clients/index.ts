import { HttpMethod, RequestOptions, TWSApiResponse } from "./types";

export class TSWClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(apiKey: string, baseUrl: string = 'http://localhost:31270') {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  private async call(method: HttpMethod, url: string): Promise<TWSApiResponse> {
    const options: RequestOptions = {
      method,
      headers: {
        'DTGCommKey': this.apiKey,
        'Content-Type': 'application/json'
      }
    };

    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json() as TWSApiResponse;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Error making ${method} request to ${url}:`, errorMessage);
      throw error;
    }
  }

  async get(nodePath: string): Promise<TWSApiResponse> {
    return this.call('GET', `${this.baseUrl}/get/${nodePath}`);
  }

  async set(nodePath: string, value: number): Promise<TWSApiResponse> {
    const url = `${this.baseUrl}/set/${nodePath}?value=${value}`;
    return this.call('PATCH', url);
  }

  async list(nodePath?: string): Promise<TWSApiResponse> {
    const path = nodePath ? `${this.baseUrl}/list/${nodePath}` : `${this.baseUrl}/list/`;
    return this.call('GET', path);
  }

}

export default TSWClient;