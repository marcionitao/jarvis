// src/schemas/task.schema.ts
// Schemas Zod partilhados para validação de tarefas.

import { z } from 'zod';

export const quickAddParsedSchema = z.object({
  title: z.string().trim().min(1, 'O título não pode estar vazio.'),
  priority: z.number().int().min(0).max(4),
  projectName: z.string().nullable(),
  labelName: z.string().nullable(),
  dueDate: z.number().int().nullable(),
});

export type QuickAddParsedInput = z.infer<typeof quickAddParsedSchema>;
