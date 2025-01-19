/* eslint @typescript-eslint/no-explicit-any: 0 */

// OpenTelemetry libs use XMLHttpRequest internally,
// so we need to provide a polyfill
class XMLHttpRequestPolyfill {
  private method: string = '';
  private url: string = '';
  private headers: Record<string, string> = {};
  private body: string | null = null;
  public onreadystatechange: (() => void) | null = null;
  public onerror: ((error: any) => void) | null = null;
  public status: number = 0;
  public responseText: string = '';
  public withCredentials: boolean = false;

  open(method: string, url: string) {
    this.method = method;
    this.url = url;
  }

  setRequestHeader(name: string, value: string) {
    this.headers[name] = value;
  }

  send(body: string | null = null) {
    this.body = body;
    fetch(this.url, {
      method: this.method,
      headers: this.headers,
      body: this.body,
    })
      .then(async response => {
        this.status = response.status;
        this.responseText = await response.text();
        this.onreadystatechange?.();
      })
      .catch(error => {
        console.error('XHR error', error);
        this.onerror?.(error);
      });
  }
}
// Apply polyfill before importing other modules
(globalThis as any).XMLHttpRequest = XMLHttpRequestPolyfill;
