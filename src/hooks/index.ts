// src/hooks/index.ts
// Re-exports públicos da camada de hooks.

export { eventBus } from './event-bus';
export type { EventName, Listener } from './event-bus';

export { useQuery } from './use-query';
export type { QueryState } from './use-query';

export { useMutation } from './use-mutation';
export type { MutationState } from './use-mutation';

export { useTodayTasks, useUpcomingTasks, useProjectTasks, useTask } from './use-tasks';
export {
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  useToggleComplete,
} from './use-task-mutations';

export {
  useProjects,
  useProject,
  useCreateProject,
  useUpdateProject,
  useArchiveProject,
} from './use-projects';

export {
  useLabels,
  useCreateLabel,
  useUpdateLabel,
  useDeleteLabel,
  useAttachLabel,
  useLabel,
} from './use-labels';

export { useTasksForDate } from './use-tasks-for-date';

export { useTasksForLabel } from './use-tasks-for-label';

export { useTasksForMonth } from './use-tasks-for-month';

export { useTasksSearch } from './use-tasks-search';
export type { SearchFilters } from './use-tasks-search';

export { useDebounce } from './use-debounce';
