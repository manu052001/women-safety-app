import React, { useState } from 'react';
import { Plus, Trash2, Phone, User } from 'lucide-react';
import { Contact } from '../types';

interface ContactsManagerProps {
  contacts: Contact[];
  setContacts: (contacts: Contact[]) => void;
}

export const ContactsManager: React.FC<ContactsManagerProps> = ({ contacts, setContacts }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRelation, setNewRelation] = useState('');

  const addContact = () => {
    if (!newName || !newPhone) return;
    const newContact: Contact = {
      id: Date.now().toString(),
      name: newName,
      phone: newPhone,
      relation: newRelation || 'Friend'
    };
    setContacts([...contacts, newContact]);
    setNewName('');
    setNewPhone('');
    setNewRelation('');
    setIsAdding(false);
  };

  const removeContact = (id: string) => {
    setContacts(contacts.filter(c => c.id !== id));
  };

  return (
    <div className="w-full max-w-md mx-auto p-4 space-y-6 pb-24">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-white">Trusted Contacts</h2>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="p-2 bg-guardian-red rounded-full text-white hover:bg-red-600 transition"
        >
          <Plus size={24} />
        </button>
      </div>

      {isAdding && (
        <div className="bg-guardian-card p-4 rounded-xl border border-gray-700 space-y-3 animate-fade-in-down">
          <input 
            type="text" 
            placeholder="Name" 
            className="w-full bg-guardian-dark border border-gray-600 rounded-lg p-3 text-white focus:outline-none focus:border-guardian-red"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <input 
            type="tel" 
            placeholder="Phone Number" 
            className="w-full bg-guardian-dark border border-gray-600 rounded-lg p-3 text-white focus:outline-none focus:border-guardian-red"
            value={newPhone}
            onChange={(e) => setNewPhone(e.target.value)}
          />
           <input 
            type="text" 
            placeholder="Relation (e.g. Sister)" 
            className="w-full bg-guardian-dark border border-gray-600 rounded-lg p-3 text-white focus:outline-none focus:border-guardian-red"
            value={newRelation}
            onChange={(e) => setNewRelation(e.target.value)}
          />
          <div className="flex gap-2 pt-2">
            <button 
              onClick={addContact}
              className="flex-1 bg-white text-guardian-dark font-bold py-2 rounded-lg"
            >
              Save Contact
            </button>
            <button 
              onClick={() => setIsAdding(false)}
              className="px-4 text-gray-400 hover:text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {contacts.length === 0 ? (
          <div className="text-center py-10 text-gray-500 bg-guardian-card/30 rounded-xl border border-dashed border-gray-700">
            <User size={48} className="mx-auto mb-3 opacity-50" />
            <p>No contacts added yet.</p>
            <p className="text-sm">Add friends or family to notify in emergencies.</p>
          </div>
        ) : (
          contacts.map(contact => (
            <div key={contact.id} className="bg-guardian-card p-4 rounded-xl flex items-center justify-between border border-gray-700/50 hover:border-guardian-red/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-guardian-red/20 flex items-center justify-center text-guardian-red font-bold">
                  {contact.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold text-white">{contact.name}</h3>
                  <div className="flex items-center text-xs text-gray-400 gap-2">
                    <span>{contact.relation}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><Phone size={10} /> {contact.phone}</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => removeContact(contact.id)}
                className="p-2 text-gray-500 hover:text-red-500 transition-colors"
              >
                <Trash2 size={20} />
              </button>
            </div>
          ))
        )}
      </div>
      
      <div className="bg-blue-900/20 border border-blue-800/50 p-4 rounded-lg mt-8">
        <h4 className="text-blue-400 text-sm font-bold mb-1">Did you know?</h4>
        <p className="text-blue-200/70 text-xs">
          Adding local emergency numbers (like 911, 112, 100) as a contact can be helpful for quick dialing.
        </p>
      </div>
    </div>
  );
};