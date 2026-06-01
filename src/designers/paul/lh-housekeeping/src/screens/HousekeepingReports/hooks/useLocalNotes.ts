import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { LocalNote, NoteCategory } from '../types';

// On-device store for Room notes. Deliberately decoupled from the shared
// database: nothing here touches Si's si_staff_notes table. Notes persist
// locally (AsyncStorage → localStorage on web), keyed by roomId so they stay
// with the room across reservations.
const STORAGE_KEY = 'paul.lh-housekeeping.roomNotes.v1';

export interface AddNoteInput {
  roomId: string;
  author: string;
  text: string;
  category: NoteCategory;
}

export function useLocalNotes() {
  const [notes, setNotes] = useState<LocalNote[]>([]);
  const loaded = useRef(false);

  // Hydrate once from storage.
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(raw => { if (raw) setNotes(JSON.parse(raw) as LocalNote[]); })
      .catch(err => console.warn('[paul] load room notes failed', err))
      .finally(() => { loaded.current = true; });
  }, []);

  // Persist on change (skip the initial empty render before hydration).
  useEffect(() => {
    if (!loaded.current) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(notes))
      .catch(err => console.warn('[paul] save room notes failed', err));
  }, [notes]);

  const addNote = useCallback((input: AddNoteInput) => {
    const now = new Date().toISOString();
    const note: LocalNote = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      roomId: input.roomId,
      author: input.author,
      text: input.text,
      category: input.category,
      createdAt: now,
      updatedAt: now,
    };
    setNotes(prev => [...prev, note]);
  }, []);

  const updateNote = useCallback((id: string, patch: { text?: string; category?: NoteCategory }) => {
    setNotes(prev => prev.map(n =>
      n.id === id ? { ...n, ...patch, updatedAt: new Date().toISOString() } : n,
    ));
  }, []);

  return { notes, addNote, updateNote };
}
