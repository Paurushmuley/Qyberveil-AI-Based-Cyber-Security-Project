import { RawScannerAlert } from './types.js';

export class CustomSecurityChecks {
  /**
   * Evaluates security headers on an HTTP response
   */
  public static checkSecurityHeaders(
    targetUrl: string,
    status: number,
    headers: Record<string, string>
  ): RawScannerAlert[] {
    const alerts: RawScannerAlert[] = [];
    const lowerHeaders = Object.fromEntries(
      Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v])
    );

    // 1. Strict-Transport-Security (HSTS)
    if (!lowerHeaders['strict-transport-security'] && targetUrl.startsWith('https:')) {
      alerts.push({
        source: 'CUSTOM_BASELINE',
        alertName: 'Missing HTTP Strict Transport Security (HSTS) Header',
        description:
          'The application does not enforce HTTPS via the Strict-Transport-Security response header. Without HSTS, users are vulnerable to SSL-stripping and man-in-the-middle attacks.',
        uri: targetUrl,
        method: 'GET',
        rawSeverity: 'Medium',
        rawConfidence: 'High',
        cweId: '319',
        solution: 'Configure the Strict-Transport-Security header: "max-age=31536000; includeSubDomains; preload".',
        responseStatus: status,
        responseHeaders: headers,
      });
    }

    // 2. Content-Security-Policy (CSP)
    if (!lowerHeaders['content-security-policy']) {
      alerts.push({
        source: 'CUSTOM_BASELINE',
        alertName: 'Missing Content Security Policy (CSP) Header',
        description:
          'Content Security Policy (CSP) is not implemented. CSP prevents Cross-Site Scripting (XSS) and data injection attacks by restricting the origins of executable scripts and stylesheets.',
        uri: targetUrl,
        method: 'GET',
        rawSeverity: 'Medium',
        rawConfidence: 'High',
        cweId: '1021',
        solution: "Define a restrictive Content-Security-Policy header, such as: default-src 'self'; script-src 'self'; object-src 'none'.",
        responseStatus: status,
        responseHeaders: headers,
      });
    }

    // 3. X-Content-Type-Options
    if (lowerHeaders['x-content-type-options'] !== 'nosniff') {
      alerts.push({
        source: 'CUSTOM_BASELINE',
        alertName: 'Missing or Invalid X-Content-Type-Options Header',
        description:
          'The X-Content-Type-Options header is missing or not set to "nosniff". Browsers may attempt to MIME-sniff response content, potentially executing untrusted uploads as HTML/JavaScript.',
        uri: targetUrl,
        method: 'GET',
        rawSeverity: 'Low',
        rawConfidence: 'High',
        cweId: '16',
        solution: 'Set "X-Content-Type-Options: nosniff" on all responses.',
        responseStatus: status,
        responseHeaders: headers,
      });
    }

    // 4. X-Frame-Options
    if (!lowerHeaders['x-frame-options'] && !lowerHeaders['content-security-policy']?.includes('frame-ancestors')) {
      alerts.push({
        source: 'CUSTOM_BASELINE',
        alertName: 'Missing Anti-Clickjacking Header (X-Frame-Options)',
        description:
          'The page does not specify X-Frame-Options or CSP frame-ancestors. An attacker may embed this web page inside an invisible iframe to perform Clickjacking attacks.',
        uri: targetUrl,
        method: 'GET',
        rawSeverity: 'Low',
        rawConfidence: 'High',
        cweId: '1021',
        solution: 'Set "X-Frame-Options: DENY" or "X-Frame-Options: SAMEORIGIN", or use CSP frame-ancestors.',
        responseStatus: status,
        responseHeaders: headers,
      });
    }

    // 5. Information Disclosure (X-Powered-By / Server Banner)
    if (lowerHeaders['x-powered-by']) {
      alerts.push({
        source: 'CUSTOM_BASELINE',
        alertName: 'Server Framework Disclosure via X-Powered-By Header',
        description: `The application reveals underlying backend framework details via the "X-Powered-By: ${lowerHeaders['x-powered-by']}" header, aiding attacker reconnaissance.`,
        uri: targetUrl,
        method: 'GET',
        evidenceText: `X-Powered-By: ${lowerHeaders['x-powered-by']}`,
        rawSeverity: 'Informational',
        rawConfidence: 'High',
        cweId: '200',
        solution: 'Disable the X-Powered-By header in your application configuration (e.g. app.disable("x-powered-by") in Express).',
        responseStatus: status,
        responseHeaders: headers,
      });
    }

    return alerts;
  }

  /**
   * Evaluates security flags on Set-Cookie headers
   */
  public static checkCookies(
    targetUrl: string,
    setCookieHeaders: string[]
  ): RawScannerAlert[] {
    const alerts: RawScannerAlert[] = [];

    for (const cookieStr of setCookieHeaders) {
      const parts = cookieStr.split(';').map((p) => p.trim());
      const nameVal = parts[0] || '';
      const cookieName = nameVal.split('=')[0] || 'Unknown';
      const flags = parts.slice(1).map((f) => f.toLowerCase());

      const isSecure = flags.includes('secure');
      const isHttpOnly = flags.includes('httponly');
      const hasSameSite = flags.some((f) => f.startsWith('samesite='));

      if (!isHttpOnly) {
        alerts.push({
          source: 'CUSTOM_BASELINE',
          alertName: `Cookie Missing HttpOnly Flag: ${cookieName}`,
          description: `The cookie "${cookieName}" was set without the HttpOnly flag. If a Cross-Site Scripting (XSS) vulnerability exists, malicious JavaScript can access this cookie.`,
          uri: targetUrl,
          method: 'GET',
          param: cookieName,
          evidenceText: cookieStr,
          rawSeverity: 'Low',
          rawConfidence: 'High',
          cweId: '1004',
          solution: 'Ensure all session and authentication cookies include the HttpOnly attribute.',
        });
      }

      if (!isSecure && targetUrl.startsWith('https:')) {
        alerts.push({
          source: 'CUSTOM_BASELINE',
          alertName: `Cookie Missing Secure Flag: ${cookieName}`,
          description: `The cookie "${cookieName}" is transmitted over HTTPS without the Secure flag, allowing it to be exposed over unencrypted HTTP connections.`,
          uri: targetUrl,
          method: 'GET',
          param: cookieName,
          evidenceText: cookieStr,
          rawSeverity: 'Medium',
          rawConfidence: 'High',
          cweId: '614',
          solution: 'Set the Secure flag on all cookies served over HTTPS.',
        });
      }

      if (!hasSameSite) {
        alerts.push({
          source: 'CUSTOM_BASELINE',
          alertName: `Cookie Missing SameSite Attribute: ${cookieName}`,
          description: `The cookie "${cookieName}" does not specify a SameSite attribute, which increases susceptibility to Cross-Site Request Forgery (CSRF).`,
          uri: targetUrl,
          method: 'GET',
          param: cookieName,
          evidenceText: cookieStr,
          rawSeverity: 'Low',
          rawConfidence: 'High',
          cweId: '1275',
          solution: 'Configure "SameSite=Lax" or "SameSite=Strict" on cookies.',
        });
      }
    }

    return alerts;
  }
}
