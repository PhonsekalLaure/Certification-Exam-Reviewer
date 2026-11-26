"use client";
import { useEffect, useRef, useState } from "react";
import ccst from "@/data/questions.json";
import { CertificationContext, certifications, type CertificationId, type QuestionBank } from "@/lib/certification-context";
import { StudyRoom } from "./study-room";

const ACTIVE_KEY = "studyroom:active-certification";
const loaders = {
  ccst: async () => ccst,
  "html-css": async () => (await import("@/data/html-css.json")).default,
  javascript: async () => (await import("@/data/javascript.json")).default,
};
export function CertificationApp() {
  const [selected, setSelected] = useState<{ id: CertificationId; bank: QuestionBank }>({ id: "ccst", bank: ccst as QuestionBank });
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const requestId = useRef(0);
  useEffect(() => {
    let cancelled = false;
    let saved: string | null = null;
    try { saved = localStorage.getItem(ACTIVE_KEY); } catch { /* Selection is optional. */ }
    const id = certifications.find(c => c.id === saved)?.id;
    const request = requestId.current;
    if (id && id !== "ccst") loaders[id]().then(bank => {
      if (!cancelled && request === requestId.current) setSelected({ id, bank: bank as QuestionBank });
    }).catch(() => {
      if (!cancelled && request === requestId.current) setLoadError("The saved certification could not be loaded. Choose it again to retry.");
    });
    return () => { cancelled = true; };
  }, []);
  async function selectCertification(id: CertificationId) {
    const request = ++requestId.current;
    setLoading(true); setLoadError("");
    try {
      const bank = await loaders[id]();
      if (request !== requestId.current) return;
      setSelected({ id, bank: bank as QuestionBank });
      try { localStorage.setItem(ACTIVE_KEY, id); } catch { /* Study still works in memory. */ }
    } catch { if (request === requestId.current) setLoadError("This certification could not be loaded. Please try again."); }
    finally { if (request === requestId.current) setLoading(false); }
  }
  return <CertificationContext value={{ certification: certifications.find(c => c.id === selected.id)!, bank: selected.bank, selectCertification, loading, loadError }}><StudyRoom key={selected.id} /></CertificationContext>;
}
