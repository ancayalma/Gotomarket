// src/pages/crm/tasks.tsx
// Página de gestión de tareas

import React from 'react';
import { useTasks } from '@/hooks/useCRMData';
import { TASK_STATUS, TASK_PRIORITY } from '@/lib/crm/constants';
import { CheckCircle2, Circle } from 'lucide-react';

export default function TasksPage() {
  const { data: tasks, isLoading } = useTasks();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tareas</h1>
        <button className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
          Nueva Tarea
        </button>
      </div>

      <div className="rounded-lg border bg-white">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">Título</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Estado</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Prioridad</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Vencimiento</th>
              </tr>
            </thead>
            <tbody>
              {tasks?.map((task) => (
                <tr key={task.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {task.status === 'Completed' ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <Circle className="h-4 w-4 text-gray-400" />
                      )}
                      <span>{task.title}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`rounded px-2 py-1 text-xs font-medium ${
                      task.status === 'Completed' ? 'bg-green-100 text-green-700' :
                      task.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {task.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`rounded px-2 py-1 text-xs font-medium ${
                      task.priority === 'Urgent' ? 'bg-red-100 text-red-700' :
                      task.priority === 'High' ? 'bg-orange-100 text-orange-700' :
                      task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {task.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {task.due_date ? new Date(task.due_date).toLocaleDateString() : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {isLoading && <p className="p-4 text-center text-gray-500">Cargando...</p>}
        {!isLoading && tasks?.length === 0 && (
          <p className="p-4 text-center text-gray-500">No hay tareas</p>
        )}
      </div>
    </div>
  );
}
