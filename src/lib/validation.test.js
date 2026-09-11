import { describe, it, expect } from 'vitest';
import {
  isValidEmail,
  isSafeHttpUrl,
  isAllowedVideoUrl,
  matchesHost,
  sanitizeText,
  safeJsonParse,
} from './validation.js';

describe('isValidEmail', () => {
  it.each(['a@b.co', 'jean.dupont+tag@sous.domaine.fr', 'x_y@z.io'])('accepte %s', (v) => {
    expect(isValidEmail(v)).toBe(true);
  });

  it.each(['', 'plain', 'a@b', 'a@@b.co', 'a b@c.co', 'a@b.c', null, undefined, 42])(
    'rejette %s',
    (v) => {
      expect(isValidEmail(v)).toBe(false);
    }
  );

  it('rejette une adresse au-delà de 254 caractères', () => {
    expect(isValidEmail(`${'a'.repeat(250)}@b.co`)).toBe(false);
  });
});

describe('isSafeHttpUrl', () => {
  it.each(['https://vibehub.fr', 'http://localhost:5173/app'])('accepte %s', (v) => {
    expect(isSafeHttpUrl(v)).toBe(true);
  });

  it.each(['javascript:alert(1)', 'data:text/html,<script>', 'vbscript:msgbox', '', '   ', null])(
    'rejette %s',
    (v) => {
      expect(isSafeHttpUrl(v)).toBe(false);
    }
  );
});

describe('isAllowedVideoUrl', () => {
  it.each([
    'https://www.youtube.com/watch?v=abc',
    'https://youtu.be/abc',
    'https://contoso.sharepoint.com/video/x',
    'https://stream.office.com/embed/x',
  ])('accepte un hôte vidéo autorisé : %s', (v) => {
    expect(isAllowedVideoUrl(v)).toBe(true);
  });

  it.each([
    'https://evil.com/video',
    'https://youtube.com.evil.com/x',
    'javascript:alert(1)',
    'https://vimeo.com/123',
  ])('rejette %s', (v) => {
    expect(isAllowedVideoUrl(v)).toBe(false);
  });
});

describe('matchesHost', () => {
  it('compare le hostname parsé, pas un substring de l’URL', () => {
    expect(matchesHost('https://youtube.com/x', ['youtube.com'])).toBe(true);
    expect(matchesHost('https://www.youtube.com/x', ['youtube.com'])).toBe(true);
    // « youtube.com » ailleurs dans l’URL ne doit jamais matcher.
    expect(matchesHost('https://youtube.com.evil.tld/x', ['youtube.com'])).toBe(false);
    expect(matchesHost('https://evil.tld/youtube.com', ['youtube.com'])).toBe(false);
    expect(matchesHost('https://evil.tld/?r=youtube.com', ['youtube.com'])).toBe(false);
  });

  it('renvoie false sur une URL illisible', () => {
    expect(matchesHost('pas une url', ['youtube.com'])).toBe(false);
    expect(matchesHost(null, ['youtube.com'])).toBe(false);
  });
});

describe('sanitizeText', () => {
  it('retire les caractères de contrôle', () => {
    expect(sanitizeText('a\u0000b\u0007c\u007fd')).toBe('abcd');
  });

  it('borne la longueur', () => {
    expect(sanitizeText('x'.repeat(100), 10)).toHaveLength(10);
  });

  it('renvoie une chaîne vide pour une entrée non-string', () => {
    expect(sanitizeText(null)).toBe('');
    expect(sanitizeText({})).toBe('');
  });
});

describe('safeJsonParse', () => {
  it('parse un JSON valide', () => {
    expect(safeJsonParse('{"a":1}', {})).toEqual({ a: 1 });
  });

  it('renvoie le fallback sur JSON invalide', () => {
    expect(safeJsonParse('{oops', { ok: true })).toEqual({ ok: true });
  });

  it('renvoie le fallback sur null/undefined/non-string', () => {
    expect(safeJsonParse(null, [])).toEqual([]);
    expect(safeJsonParse(undefined, 'x')).toBe('x');
    expect(safeJsonParse('null', 'fallback')).toBe('fallback');
  });
});
