/**
 * Factory for creating AVE API clients.
 *
 * Returns a `MockAveClient` when no API key is available or when mock mode
 * is explicitly requested. Otherwise returns the real `AveClient`.
 */

import { AveClient } from "./client.js";
import { MockAveClient } from "./mock-client.js";

export interface CreateAveClientConfig {
  readonly apiKey?: string;
  readonly mock?: boolean;
  readonly baseUrl?: string;
  readonly timeout?: number;
}

export function createAveClient(config: CreateAveClientConfig): AveClient {
  if (config.mock || !config.apiKey) {
    return new MockAveClient();
  }

  return new AveClient({
    apiKey: config.apiKey,
    baseUrl: config.baseUrl,
    timeout: config.timeout,
  });
}
