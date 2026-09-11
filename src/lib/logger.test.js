import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger, setLogSink, setLogContext, serializeError } from './logger.js';

describe('logger', () => {
  let logSpy;
  let warnSpy;
  let errorSpy;

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    setLogSink(null);
    setLogContext({ release: undefined, sessionId: undefined });
    vi.restoreAllMocks();
  });

  it('émet une ligne JSON structurée avec ts/level/message', () => {
    logger.info('hello', { a: 1 });
    expect(logSpy).toHaveBeenCalledOnce();
    const entry = JSON.parse(logSpy.mock.calls[0][0]);
    expect(entry).toMatchObject({ level: 'info', message: 'hello', a: 1 });
    expect(entry.ts).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('route warn → console.warn et error → console.error', () => {
    logger.warn('w');
    logger.error('e');
    expect(warnSpy).toHaveBeenCalledOnce();
    expect(errorSpy).toHaveBeenCalledOnce();
  });

  it('caviarde les clés sensibles', () => {
    logger.info('login', { email: 'a@b.co', apiKey: 'xxx', keep: 'ok' });
    const entry = JSON.parse(logSpy.mock.calls[0][0]);
    expect(entry.email).toBe('[redacted]');
    expect(entry.apiKey).toBe('[redacted]');
    expect(entry.keep).toBe('ok');
  });

  it('joint le contexte de base (release/sessionId) à chaque entrée', () => {
    setLogContext({ release: '1.2.3+abc', sessionId: 's-1' });
    logger.info('x');
    const entry = JSON.parse(logSpy.mock.calls[0][0]);
    expect(entry).toMatchObject({ release: '1.2.3+abc', sessionId: 's-1' });
  });

  it('le contexte d’appel écrase le contexte de base', () => {
    setLogContext({ release: 'base' });
    logger.info('x', { release: 'appel' });
    expect(JSON.parse(logSpy.mock.calls[0][0]).release).toBe('appel');
  });

  it('transmet l’entrée au sink branché et survit à un sink qui lève', () => {
    const sink = vi.fn(() => {
      throw new Error('sink cassé');
    });
    setLogSink(sink);
    expect(() => logger.error('boom')).not.toThrow();
    expect(sink).toHaveBeenCalledOnce();
  });
});

describe('serializeError', () => {
  it('sérialise une Error avec name/msg/stack', () => {
    const out = serializeError(new TypeError('nope'));
    expect(out).toMatchObject({ name: 'TypeError', msg: 'nope' });
    expect(out.stack).toBeTypeOf('string');
  });

  it('gère une valeur non-Error', () => {
    expect(serializeError('juste une string')).toEqual({ msg: 'juste une string' });
    expect(serializeError(null)).toEqual({ msg: 'null' });
  });
});
