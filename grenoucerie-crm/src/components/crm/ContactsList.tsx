// src/components/crm/ContactsList.tsx
// Componente de lista de contactos

import React from 'react';
import { useContacts } from '@/hooks/useCRMData';
import { Loader2 } from 'lucide-react';

export function ContactsList() {
  const { data: contacts, isLoading, error } = useContacts();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-600">
        Error al cargar contactos
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold">Nombre</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Email</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Teléfono</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Puesto</th>
            </tr>
          </thead>
          <tbody>
            {contacts?.map((contact) => (
              <tr key={contact.id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-4">
                  {contact.first_name} {contact.last_name}
                </td>
                <td className="px-6 py-4">{contact.email}</td>
                <td className="px-6 py-4">{contact.phone}</td>
                <td className="px-6 py-4">{contact.job_title}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {contacts?.length === 0 && (
        <div className="p-8 text-center text-gray-500">
          No hay contactos aún
        </div>
      )}
    </div>
  );
}
