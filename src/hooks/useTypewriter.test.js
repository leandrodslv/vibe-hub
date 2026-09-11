import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTypewriter } from './useTypewriter.js';

describe('useTypewriter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('révèle le texte caractère par caractère', () => {
    const { result } = renderHook(() => useTypewriter('abc', 10, 1000));

    expect(result.current).toBe('');
    act(() => vi.advanceTimersByTime(10));
    expect(result.current).toBe('a');
    act(() => vi.advanceTimersByTime(10));
    expect(result.current).toBe('ab');
    act(() => vi.advanceTimersByTime(10));
    expect(result.current).toBe('abc');
  });

  it('boucle après la pause', () => {
    const { result } = renderHook(() => useTypewriter('ab', 10, 500));

    act(() => vi.advanceTimersByTime(30)); // 'ab' complet
    expect(result.current).toBe('ab');
    // Après la pause (500), le cycle repart : le 1er caractère réapparaît, pas le 2e.
    act(() => vi.advanceTimersByTime(500));
    expect(result.current).toBe('a');
  });

  it('nettoie son timer au démontage', () => {
    const clearSpy = vi.spyOn(globalThis, 'clearTimeout');
    const { unmount } = renderHook(() => useTypewriter('xyz', 20));
    unmount();
    expect(clearSpy).toHaveBeenCalled();
  });
});
