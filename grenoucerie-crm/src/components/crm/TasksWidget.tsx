// src/components/crm/TasksWidget.tsx
// Widget de tareas pendientes

import React from 'react';
import { useTasks } from '@/hooks/useCRMData';
import { CheckCircle2, Circle } from 'lucide-react';

export function TasksWidget() {
  const { data: tasks, isLoading } = useTasks();

  const pendingTasks = tasks?.filter((t) => t.status !== 'Completed') || [];
  const upcomingTasks = pendingTasks.slice(0, 5);

  return (
    <div className="rounded-lg border p-4">
      <h3 className="mb-3 font-semibold">Tareas Próximas</h3>

      {isLoading ? (
        <p className="text-sm text-gray-500">Cargando...</p>
      ) : upcomingTasks.length === 0 ? (
        <p className="text-sm text-gray-500">No hay tareas pendientes</p>
      ) : (
        <div className="space-y-2">
          {upcomingTasks.map((task) => (
            <div
              key={task.id}
              className="flex items-start gap-3 rounded-md p-2 hover:bg-gray-50"
            >
              <Circle className="mt-1 h-4 w-4 flex-shrink-0 text-gray-400" />
              <div className="flex-1">
                <p className="text-sm font-medium">{task.title}</p>
                {task.due_date && (
                  <p className="text-xs text-gray-500">
                    Vence: {new Date(task.due_date).toLocaleDateString()}
                  </p>
                )}
              </div>
              <span className={`rounded px-2 py-1 text-xs font-medium ${
                task.priority === 'High' ? 'bg-red-100 text-red-700' :
                task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                'bg-blue-100 text-blue-700'
              }`}>
                {task.priority}
              </span>
            </div>
          ))}
        </div>
      )}

      {pendingTasks.length > 5 && (
        <p className="mt-3 text-xs text-gray-500">
          +{pendingTasks.length - 5} tareas más
        </p>
      )}
    </div>
  );
}
