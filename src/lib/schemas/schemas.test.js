import { describe, it, expect, vi } from 'vitest';
import {
  parseOrThrow,
  parseOrWarn,
  SchemaError,
  courseSchema,
  courseArraySchema,
  courseInputSchema,
  courseUpdateSchema,
  waitlistCountArraySchema,
  geminiTextSchema,
  geminiProxyResponseSchema,
} from './index.js';

const validCourse = {
  id: 1,
  title: 'Cours',
  module_name: 'MODULE 1',
  description: null,
  duration: null,
  image_url: null,
  video_url: null,
  published: true,
  order_index: 0,
  created_at: '2026-01-01T00:00:00Z',
};

describe('parseOrThrow', () => {
  it('renvoie la donnée typée quand elle est valide', () => {
    expect(parseOrThrow(courseSchema, validCourse, 'test')).toEqual(validCourse);
  });

  it('lève une SchemaError contextualisée quand elle ne l’est pas', () => {
    try {
      parseOrThrow(courseSchema, { ...validCourse, published: 'oui' }, 'getCourses');
      throw new Error('aurait dû lever');
    } catch (err) {
      expect(err).toBeInstanceOf(SchemaError);
      expect(err.op).toBe('getCourses');
      expect(err.message).toMatch(/published/);
    }
  });
});

describe('parseOrWarn', () => {
  it('renvoie le fallback et loggue sans lever', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const out = parseOrWarn(waitlistCountArraySchema, [{ tool_id: 'x' }], 'counts', []);
    expect(out).toEqual([]);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe('courseSchema', () => {
  it('rejette une ligne sans title (colonne renommée côté DB)', () => {
    const { title: _title, ...noTitle } = validCourse;
    expect(courseSchema.safeParse(noTitle).success).toBe(false);
  });

  it('tolère des colonnes supplémentaires (passthrough)', () => {
    const parsed = courseSchema.parse({ ...validCourse, extra_col: 42 });
    expect(parsed.extra_col).toBe(42);
  });

  it('courseArraySchema rejette null', () => {
    expect(courseArraySchema.safeParse(null).success).toBe(false);
  });
});

describe('courseInputSchema', () => {
  const input = {
    title: 'T',
    module_name: 'M',
    description: null,
    duration: null,
    image_url: null,
    video_url: null,
    published: true,
    order_index: 1,
  };

  it('accepte un payload complet', () => {
    expect(courseInputSchema.safeParse(input).success).toBe(true);
  });

  it('rejette un champ en trop (dérive du formulaire)', () => {
    expect(courseInputSchema.safeParse({ ...input, slug: 'x' }).success).toBe(false);
  });

  it('rejette un titre vide', () => {
    expect(courseInputSchema.safeParse({ ...input, title: '' }).success).toBe(false);
  });

  it('courseUpdateSchema accepte une mise à jour partielle', () => {
    expect(courseUpdateSchema.safeParse({ published: false }).success).toBe(true);
  });
});

describe('gemini', () => {
  it('geminiTextSchema rejette la chaîne vide', () => {
    expect(geminiTextSchema.safeParse('').success).toBe(false);
    expect(geminiTextSchema.safeParse('ok').success).toBe(true);
  });

  it('geminiProxyResponseSchema accepte { text } ou { error }', () => {
    expect(geminiProxyResponseSchema.safeParse({ text: 'hi' }).success).toBe(true);
    expect(geminiProxyResponseSchema.safeParse({ error: 'boom', status: 429 }).success).toBe(true);
    expect(geminiProxyResponseSchema.safeParse({ foo: 1 }).success).toBe(false);
  });
});
