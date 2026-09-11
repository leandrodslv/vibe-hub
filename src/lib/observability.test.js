import { describe, it, expect, vi, beforeEach } from 'vitest';

const h = vi.hoisted(() => ({ metricsUrl: '', handlers: {} }));

vi.mock('web-vitals', () => {
  const reg = (name) => (cb) => {
    h.handlers[name] = cb;
  };
  return {
    onCLS: reg('CLS'),
    onINP: reg('INP'),
    onLCP: reg('LCP'),
    onFCP: reg('FCP'),
    onTTFB: reg('TTFB'),
  };
});

vi.mock('../config/env.js', () => ({
  env: {
    get metricsUrl() {
      return h.metricsUrl;
    },
    mode: 'test',
    isProd: false,
  },
}));

// `initObservability` a un garde `started` → module neuf à chaque test.
async function load() {
  vi.resetModules();
  return import('./observability.js');
}

const vital = (name, value, rating = 'good') => ({
  name,
  value,
  rating,
  id: 'x',
  navigationType: 'navigate',
});

beforeEach(() => {
  h.metricsUrl = '';
  h.handlers = {};
  sessionStorage.clear();
  navigator.sendBeacon = vi.fn(() => true);
});

describe('observability', () => {
  it('un web-vital est loggé sans beacon quand VITE_METRICS_URL est vide', async () => {
    const { initObservability } = await load();
    initObservability();
    h.handlers.LCP(vital('LCP', 1234.5));
    expect(navigator.sendBeacon).not.toHaveBeenCalled();
  });

  it('POST le web-vital vers l’endpoint quand il est configuré', async () => {
    h.metricsUrl = 'https://x/metrics';
    const { initObservability } = await load();
    initObservability();
    h.handlers.LCP(vital('LCP', 1234.5));
    expect(navigator.sendBeacon).toHaveBeenCalledOnce();
    const [url, blob] = navigator.sendBeacon.mock.calls[0];
    expect(url).toBe('https://x/metrics');
    expect(blob).toBeInstanceOf(Blob);
  });

  it('reportError loggue toujours et beacone si configuré', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    h.metricsUrl = 'https://x/metrics';
    const { reportError } = await load();
    reportError('test:boom', new Error('nope'), { extra: 1 });
    expect(errSpy).toHaveBeenCalled();
    expect(navigator.sendBeacon).toHaveBeenCalledOnce();
    errSpy.mockRestore();
  });

  it('le sessionId d’onglet est créé et réutilisé', async () => {
    h.metricsUrl = 'https://x/metrics';
    const { initObservability } = await load();
    initObservability();
    h.handlers.CLS(vital('CLS', 0.1));
    h.handlers.INP(vital('INP', 200));
    expect(sessionStorage.getItem('obs_session_id')).toBeTruthy();
    expect(navigator.sendBeacon).toHaveBeenCalledTimes(2);
  });

  it('capture window.onerror (log + beacon)', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    h.metricsUrl = 'https://x/metrics';
    const { initObservability } = await load();
    initObservability();

    navigator.sendBeacon.mockClear();
    window.dispatchEvent(
      new ErrorEvent('error', { error: new Error('crash'), filename: 'a.js', lineno: 1, colno: 2 })
    );

    // (des listeners d'anciens tests s'accumulent sur le `window` jsdom partagé —
    // on vérifie juste que le handler courant loggue + beacone.)
    expect(errSpy).toHaveBeenCalled();
    expect(navigator.sendBeacon).toHaveBeenCalled();
    errSpy.mockRestore();
  });

  it('fetch keepalive en repli si sendBeacon absent', async () => {
    navigator.sendBeacon = undefined;
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(/** @type {any} */ ({}));
    h.metricsUrl = 'https://x/metrics';
    const { initObservability } = await load();
    initObservability();
    h.handlers.LCP(vital('LCP', 1000));
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://x/metrics',
      expect.objectContaining({ keepalive: true })
    );
    fetchSpy.mockRestore();
  });
});
