// src/pages/crm/contacts.tsx
// Página de gestión de contactos

import React from 'react';
import { ContactsList } from '@/components/crm/ContactsList';

export default function ContactsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Contactos</h1>
        <button className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
          Nuevo Contacto
        </button>
      </div>

      <ContactsList />
    </div>
  );
}
