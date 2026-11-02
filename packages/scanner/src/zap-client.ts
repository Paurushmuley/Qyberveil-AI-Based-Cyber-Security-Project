import { RawScannerAlert } from './types.js';

export interface ZAPConfig {
  baseUrl: string;
  apiKey?: string;
}

export class ZAPScannerClient {
  private readonly baseUrl: string;
  private readonly apiKey?: string;

  constructor(config?: Partial<ZAPConfig>) {
    this.baseUrl = (config?.baseUrl || process.env.ZAP_API_URL || 'http://localhost:8080').replace(/\/+$/, '');
    this.apiKey = config?.apiKey || process.env.ZAP_API_KEY;
  }

  public async isAvailable(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/JSON/core/view/version/?apikey=${this.apiKey || ''}`, {
        signal: AbortSignal.timeout(3000),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  public async importOpenApi(specUrl: string): Promise<{ success: boolean; endpointsImported?: number; error?: string }> {
    try {
      const url = `${this.baseUrl}/JSON/openapi/action/importUrl/?url=${encodeURIComponent(specUrl)}&apikey=${this.apiKey || ''}`;
      const res = await fetch(url, { method: 'GET' });
      if (res.ok) {
        return { success: true };
      }
      return { success: false, error: `ZAP OpenAPI import failed: HTTP ${res.status}` };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'ZAP OpenAPI import failed' };
    }
  }

  public async startSpider(targetUrl: string, maxChildren = 10): Promise<string> {
    const url = `${this.baseUrl}/JSON/spider/action/scan/?url=${encodeURIComponent(targetUrl)}&maxChildren=${maxChildren}&apikey=${this.apiKey || ''}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`ZAP Spider initiation failed: HTTP ${res.status}`);
    }
    const data = (await res.json()) as { scan?: string };
    return data.scan || '0';
  }

  public async getSpiderStatus(scanId: string): Promise<number> {
    const url = `${this.baseUrl}/JSON/spider/view/status/?scanId=${scanId}&apikey=${this.apiKey || ''}`;
    const res = await fetch(url);
    if (!res.ok) return 100;
    const data = (await res.json()) as { status?: string };
    return Number(data.status || 100);
  }

  public async getAlerts(targetBaseUrl: string): Promise<RawScannerAlert[]> {
    try {
      const url = `${this.baseUrl}/JSON/core/view/alerts/?baseurl=${encodeURIComponent(targetBaseUrl)}&apikey=${this.apiKey || ''}`;
      const res = await fetch(url);
      if (!res.ok) return [];

      const data = (await res.json()) as {
        alerts?: Array<{
          pluginId?: string;
          alert: string;
          description: string;
          url: string;
          method: string;
          param?: string;
          attack?: string;
          evidence?: string;
          risk: 'High' | 'Medium' | 'Low' | 'Informational';
          confidence: 'High' | 'Medium' | 'Low' | 'False Positive';
          cweid?: string;
          wascid?: string;
          solution?: string;
        }>;
      };

      return (data.alerts || []).map((a) => ({
        source: 'OWASP_ZAP',
        pluginId: a.pluginId,
        alertName: a.alert,
        description: a.description,
        uri: a.url,
        method: a.method || 'GET',
        param: a.param,
        attack: a.attack,
        evidenceText: a.evidence,
        rawSeverity: a.risk,
        rawConfidence: a.confidence,
        cweId: a.cweid,
        wascId: a.wascid,
        solution: a.solution,
      }));
    } catch {
      return [];
    }
  }
}
