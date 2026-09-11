import { describe, it, expect } from 'vitest';
import {
  notificationSchema,
  notificationArraySchema,
  notificationPreferencesSchema,
  DEFAULT_PREFERENCES,
  CATEGORY_PREF_KEY,
  NOTIFICATION_CATEGORIES,
} from './notification.js';

const validNotification = {
  id: 'n1',
  category: 'new_course',
  title: 'Nouvelle leçon disponible',
  body: null,
  link: '/app?tab=modules',
  read: false,
  dismissed: false,
  created_at: '2026-09-11T10:00:00Z',
};

describe('notificationSchema', () => {
  it('accepte une notification valide', () => {
    expect(notificationSchema.parse(validNotification)).toMatchObject({
      id: 'n1',
      category: 'new_course',
    });
  });

  it('rejette une catégorie inconnue', () => {
    expect(() => notificationSchema.parse({ ...validNotification, category: 'unknown' })).toThrow();
  });

  it('tolère des colonnes en trop (user_id de PostgREST) sans les exposer', () => {
    const parsed = notificationSchema.parse({ ...validNotification, user_id: 'secret-uuid' });
    expect(parsed).not.toHaveProperty('user_id');
  });

  it('valide un tableau de notifications', () => {
    expect(notificationArraySchema.parse([validNotification])).toHaveLength(1);
  });
});

describe('notificationPreferencesSchema', () => {
  it('applique les défauts quand rien n’est fourni', () => {
    const parsed = notificationPreferencesSchema.parse({});
    expect(parsed).toEqual(DEFAULT_PREFERENCES);
    expect(parsed.app_enabled).toBe(true);
    expect(parsed.email_enabled).toBe(false);
    expect(parsed.reminder_frequency).toBe('weekly');
  });

  it('accepte une heure HH:MM valide', () => {
    const parsed = notificationPreferencesSchema.parse({ quiet_from: '22:00', quiet_to: '08:00' });
    expect(parsed.quiet_from).toBe('22:00');
  });

  it('rejette un format d’heure invalide', () => {
    expect(() => notificationPreferencesSchema.parse({ quiet_from: '25:99' })).toThrow();
  });

  it('rejette une fréquence de rappel inconnue', () => {
    expect(() => notificationPreferencesSchema.parse({ reminder_frequency: 'monthly' })).toThrow();
  });
});

describe('CATEGORY_PREF_KEY', () => {
  it('mappe chaque catégorie reconnue vers une clé de préférence valide', () => {
    for (const category of NOTIFICATION_CATEGORIES) {
      const key = CATEGORY_PREF_KEY[category];
      expect(DEFAULT_PREFERENCES).toHaveProperty(key);
    }
  });
});
