import { isRestrictedOrPrivateHost } from '@vulnsight/validation';
import { ScopeRule } from './types.js';

export class ScopeValidator {
  private readonly rule: ScopeRule;

  constructor(rule: ScopeRule) {
    this.rule = rule;
  }

  /**
   * Determines if a candidate URL is strictly in-scope and permitted to be scanned.
   */
  public isUrlInScope(candidateUrl: string): { allowed: boolean; reason?: string } {
    let parsed: URL;
    try {
      parsed = new URL(candidateUrl);
    } catch {
      return { allowed: false, reason: 'Malformed URL' };
    }

    // Protocol check
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { allowed: false, reason: `Unsupported protocol: ${parsed.protocol}` };
    }

    // SSRF & private IP check (unless permitted in local testing environment)
    if (process.env.ALLOW_PRIVATE_TARGETS !== 'true' && isRestrictedOrPrivateHost(parsed.hostname)) {
      return { allowed: false, reason: `Host ${parsed.hostname} is restricted by SSRF protection rules.` };
    }

    // Host matching
    const targetHost = this.rule.host.toLowerCase();
    const candidateHost = parsed.hostname.toLowerCase();

    if (this.rule.allowSubdomains) {
      if (candidateHost !== targetHost && !candidateHost.endsWith(`.${targetHost}`)) {
        return { allowed: false, reason: `Host ${candidateHost} does not match target domain ${targetHost}` };
      }
    } else {
      if (candidateHost !== targetHost) {
        return { allowed: false, reason: `Host ${candidateHost} does not match authorized target host ${targetHost}` };
      }
    }

    const pathname = parsed.pathname || '/';

    // Check excluded paths first (deny takes precedence)
    for (const excluded of this.rule.excludedPaths) {
      if (this.matchPath(pathname, excluded)) {
        return { allowed: false, reason: `Path ${pathname} matches excluded path pattern ${excluded}` };
      }
    }

    // Check in-scope paths
    if (this.rule.inScopePaths.length > 0) {
      const matchesAnyInScope = this.rule.inScopePaths.some((prefix) => this.matchPath(pathname, prefix));
      if (!matchesAnyInScope) {
        return {
          allowed: false,
          reason: `Path ${pathname} is outside declared in-scope paths (${this.rule.inScopePaths.join(', ')})`,
        };
      }
    }

    return { allowed: true };
  }

  /**
   * Validates a redirect destination during crawling or active testing.
   * If an in-scope URL redirects to an out-of-scope domain or private IP, this immediately detects it.
   */
  public validateRedirect(originalUrl: string, destinationUrl: string): { allowed: boolean; reason?: string } {
    const scopeCheck = this.isUrlInScope(destinationUrl);
    if (!scopeCheck.allowed) {
      return {
        allowed: false,
        reason: `Disallowed redirect from ${originalUrl} to destination ${destinationUrl}: ${scopeCheck.reason}`,
      };
    }
    return { allowed: true };
  }

  private matchPath(pathname: string, pattern: string): boolean {
    if (pattern === '/' || pattern === '/*') return true;
    if (pattern.endsWith('*')) {
      return pathname.startsWith(pattern.slice(0, -1));
    }
    if (pattern.endsWith('/')) {
      return pathname.startsWith(pattern) || pathname === pattern.slice(0, -1);
    }
    return pathname === pattern || pathname.startsWith(`${pattern}/`);
  }
}
