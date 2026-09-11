import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  sanitizeText,
  isSafeHttpUrl,
  isAllowedVideoUrl,
  safeJsonParse,
  isValidEmail,
} from './validation.js';

const hasControlChar = (s) =>
  [...s].some((ch) => {
    const code = ch.charCodeAt(0);
    return code < 0x20 || code === 0x7f;
  });

describe('validation — propriétés', () => {
  it('sanitizeText : longueur bornée + aucun caractère de contrôle, pour toute entrée', () => {
    fc.assert(
      fc.property(fc.string(), fc.integer({ min: 0, max: 500 }), (input, max) => {
        const out = sanitizeText(input, max);
        expect(out.length).toBeLessThanOrEqual(max);
        expect(hasControlChar(out)).toBe(false);
      })
    );
  });

  it('sanitizeText : ne renvoie jamais autre chose qu’une string', () => {
    fc.assert(
      fc.property(fc.anything(), (input) => {
        expect(typeof sanitizeText(input)).toBe('string');
      })
    );
  });

  it('safeJsonParse : ne lève jamais, quelle que soit l’entrée', () => {
    fc.assert(
      fc.property(fc.anything(), (raw) => {
        expect(() => safeJsonParse(raw, { fallback: true })).not.toThrow();
      })
    );
  });

  it('safeJsonParse : renvoie le fallback pour toute string non-JSON', () => {
    fc.assert(
      fc.property(
        fc.string().filter((s) => {
          try {
            JSON.parse(s);
            return false;
          } catch {
            return true;
          }
        }),
        (garbage) => {
          const fallback = Symbol('fb');
          expect(safeJsonParse(garbage, fallback)).toBe(fallback);
        }
      )
    );
  });

  it('isSafeHttpUrl : jamais true pour un schéma dangereux', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('javascript', 'data', 'vbscript', 'file', 'blob'),
        fc.string(),
        (scheme, rest) => {
          expect(isSafeHttpUrl(`${scheme}:${rest}`)).toBe(false);
        }
      )
    );
  });

  it('isAllowedVideoUrl ⇒ isSafeHttpUrl (le premier implique le second)', () => {
    fc.assert(
      fc.property(fc.webUrl(), (url) => {
        if (isAllowedVideoUrl(url)) expect(isSafeHttpUrl(url)).toBe(true);
      })
    );
  });

  it('isValidEmail : jamais true si la partie locale contient un espace interne', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('john', 'a', 'test.user'),
        fc.constantFrom(' ', '\n', '\t'),
        fc.constantFrom('doe', 'b'),
        (a, ws, b) => {
          expect(isValidEmail(`${a}${ws}${b}@example.co`)).toBe(false);
        }
      )
    );
  });

  it('isValidEmail : invariant sous trim (les espaces de bord ne changent rien)', () => {
    fc.assert(
      fc.property(fc.string(), fc.nat({ max: 3 }), (email, pad) => {
        const s = ' '.repeat(pad);
        expect(isValidEmail(s + email + s)).toBe(isValidEmail(email.trim()));
      })
    );
  });
});
