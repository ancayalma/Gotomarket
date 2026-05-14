// src/components/crm/LeadForm.tsx
// Formulario para crear/editar leads

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Lead } from '@/lib/crm';

const leadSchema = z.object({
  first_name: z.string().optional(),
  last_name: z.string().min(1, 'Apellido requerido'),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  job_title: z.string().optional(),
  status: z.string().default('NEW'),
});

type LeadFormData = z.infer<typeof leadSchema>;

interface LeadFormProps {
  initialData?: Partial<Lead>;
  onSubmit?: (data: LeadFormData) => void;
}

export function LeadForm({ initialData, onSubmit }: LeadFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: initialData as any,
  });

  return (
    <form onSubmit={handleSubmit((data) => onSubmit?.(data))} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Nombre</label>
          <input
            {...register('first_name')}
            className="mt-1 block w-full rounded border px-3 py-2"
            placeholder="Nombre"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Apellido</label>
          <input
            {...register('last_name')}
            className="mt-1 block w-full rounded border px-3 py-2"
            placeholder="Apellido"
          />
          {errors.last_name && (
            <p className="mt-1 text-sm text-red-600">{errors.last_name.message}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium">Email</label>
        <input
          {...register('email')}
          type="email"
          className="mt-1 block w-full rounded border px-3 py-2"
          placeholder="email@example.com"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Empresa</label>
        <input
          {...register('company')}
          className="mt-1 block w-full rounded border px-3 py-2"
          placeholder="Nombre empresa"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Teléfono</label>
          <input
            {...register('phone')}
            className="mt-1 block w-full rounded border px-3 py-2"
            placeholder="+34 6XX XXX XXX"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Puesto</label>
          <input
            {...register('job_title')}
            className="mt-1 block w-full rounded border px-3 py-2"
            placeholder="Director, Manager..."
          />
        </div>
      </div>

      <button
        type="submit"
        className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
      >
        Guardar Lead
      </button>
    </form>
  );
}
