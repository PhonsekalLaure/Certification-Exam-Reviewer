"use client";

import { useSyncExternalStore } from "react";
import { useCertification, type CertificationId } from "./certification-context";
import { EMPTY_STATE, parseStudyState, type StudyState } from "./study";

export const STORAGE_KEY = "ccst-study-room:v1";
export const storageKeyFor = (id: CertificationId) => id === "ccst" ? STORAGE_KEY : `studyroom:${id}:v1`;

function createStudyStore(id: CertificationId, validIds: ReadonlySet<string>) {
  const key = storageKeyFor(id);
  const empty: StudyState = { ...EMPTY_STATE, certificationId: id };
  const serverSnapshot = { data: empty, error: "" };
  let snapshot = serverSnapshot;
  let initialized = false;
  let storedValue: string | null | undefined;
  const listeners = new Set<() => void>();

  function read() {
    try {
      const raw = localStorage.getItem(key);
      // Keep session-only changes when the persisted value has not changed.
      if (raw === storedValue) return;
      snapshot = { data: raw ? parseStudyState(JSON.parse(raw), validIds, id) : empty, error: "" };
      storedValue = raw;
    } catch {
      snapshot = { data: snapshot.data, error: "Saved data could not be loaded. You can still study, or restore a backup in Your progress." };
    }
  }
  function getSnapshot() {
    if (!initialized) { initialized = true; read(); }
    return snapshot;
  }
  function onStorage(event: StorageEvent) {
    if (event.key === key || event.key === null) { read(); listeners.forEach(listener => listener()); }
  }
  function subscribe(listener: () => void) {
    listeners.add(listener);
    if (listeners.size === 1) {
      window.addEventListener("storage", onStorage);
      // A certification can miss storage events while another one is selected.
      read();
    }
    return () => {
      listeners.delete(listener);
      if (!listeners.size) window.removeEventListener("storage", onStorage);
    };
  }

  function updateStudy(update: (state: StudyState) => StudyState) {
    getSnapshot();
    read();
    const data = { ...update(snapshot.data), certificationId: id };
    let error = "";
    try {
      const raw = JSON.stringify(data);
      localStorage.setItem(key, raw);
      storedValue = raw;
    }
    catch { error = "Browser storage is unavailable. Changes last for this session only; export a backup in Your progress."; }
    snapshot = { data, error };
    listeners.forEach(listener => listener());
  }

  function importStudy(value: unknown) {
    const data = parseStudyState(value, validIds, id);
    updateStudy(() => data);
  }

  return { subscribe, getSnapshot, getServerSnapshot: () => serverSnapshot, updateStudy, importStudy };
}
const stores = new Map<CertificationId, ReturnType<typeof createStudyStore>>();
function useStore() {
  const { certification, bank } = useCertification();
  let store = stores.get(certification.id);
  if (!store) { store = createStudyStore(certification.id, new Set(bank.questions.map(q => q.id))); stores.set(certification.id, store); }
  return store;
}
export function useStudyActions() {
  const { updateStudy, importStudy } = useStore();
  return { updateStudy, importStudy };
}
export function useStudy() {
  const store = useStore();
  return { ...useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot), updateStudy: store.updateStudy };
}
