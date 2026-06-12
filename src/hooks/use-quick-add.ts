// src/hooks/use-quick-add.ts
// Mutation encadeada para o Quick Add:
//   1. parse do texto (parser local)
//   2. resolve project (find-or-create) ou usa Inbox
//   3. resolve label (find-or-create, se houver)
//   4. cria a tarefa
//   5. (se label) faz attach
// Emite 'tasks:changed' no fim (via useMutation).

import * as projectsRepo from '@/repositories/projects.repo';
import * as labelsRepo from '@/repositories/labels.repo';
import * as tasksRepo from '@/repositories/tasks.repo';
import { INBOX_PROJECT_ID } from '@/db/seed';
import { projectColors } from '@/styles/theme';
import { parseQuickAdd } from '@/services/quick-capture.service';
import { quickAddParsedSchema } from '@/schemas/task.schema';
import { useMutation } from './use-mutation';
import type { JarvisDB } from '@/db/client';
import type { TaskDTO } from '@/repositories/tasks.repo';

type Db = JarvisDB;

async function findOrCreateProject(db: Db, name: string): Promise<string> {
  const existing = await projectsRepo.listActive(db);
  const found = existing.find((p) => p.name.toLowerCase() === name.toLowerCase());
  if (found) return found.id;
  const created = await projectsRepo.create(db, {
    name,
    color: projectColors[0],
    icon: 'folder-outline',
  });
  return created.id;
}

async function findOrCreateLabel(db: Db, name: string): Promise<string> {
  const existing = await labelsRepo.list(db);
  const found = existing.find((l) => l.name.toLowerCase() === name.toLowerCase());
  if (found) return found.id;
  const created = await labelsRepo.create(db, {
    name,
    color: projectColors[5],
  });
  return created.id;
}

export function useQuickAdd() {
  return useMutation<[string, number | null, string | null], TaskDTO | null>(
    'tasks:changed',
    async (db, raw, pickerDueDate, projectIdOverride) => {
      const parsedRaw = parseQuickAdd(raw);
      const parsed = quickAddParsedSchema.parse(parsedRaw);

      // projectIdOverride vem da URL (?project=ID) quando o Quick Add é
      // aberto a partir do detail de um projecto. Tem prioridade sobre
      // o #nome extraído do texto, que por sua vez tem prioridade sobre
      // o Inbox.
      let projectId: string;
      if (projectIdOverride) {
        projectId = projectIdOverride;
      } else if (parsed.projectName) {
        projectId = await findOrCreateProject(db, parsed.projectName);
      } else {
        projectId = INBOX_PROJECT_ID;
      }

      // O picker de data tem prioridade sobre a data extraída do texto.
      const dueDate = pickerDueDate ?? parsed.dueDate;

      const task = await tasksRepo.create(db, {
        title: parsed.title,
        priority: parsed.priority,
        projectId,
        dueDate,
        dueTime: parsed.dueTime,
      });

      if (parsed.labelName) {
        const labelId = await findOrCreateLabel(db, parsed.labelName);
        await labelsRepo.attachToTask(db, task.id, labelId);
      }

      return task;
    }
  );
}
