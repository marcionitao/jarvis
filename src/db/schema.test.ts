// src/db/schema.test.ts
// Testes do schema — Project.type para Shopping List.

import { describe, it, expect } from 'vitest';
import { projects } from './schema';
import type { Project } from './schema';

describe('projects table schema', () => {
  describe('type column (Shopping List)', () => {
    it('projects table has a type column accessible as property', () => {
      expect(projects.type).toBeDefined();
    });

    it('type column is defined and has enum values', () => {
      const typeCol = projects.type;
      expect(typeCol).toBeDefined();
      expect(typeCol.enumValues).toContain('default');
      expect(typeCol.enumValues).toContain('shopping');
    });

    it('type column has correct enum values', () => {
      const typeCol = projects.type;
      expect(typeCol.enumValues).toHaveLength(2);
      expect(typeCol.enumValues).toEqual(expect.arrayContaining(['default', 'shopping']));
    });

    it('Project type has type field', () => {
      type TypeField = Project['type'];
      const val: TypeField = 'default';
      expect(val).toBe('default');
    });
  });
});