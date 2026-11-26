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
  const [selected, setSelected] = useState<{ id: CertificationId; bank: QuestionBank } | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const requestId = useRef(0);
  useEffect(() => {
    let cancelled = false;
    const request = requestId.current;
    async function restoreCertification() {
      let saved: string | null = null;
      try { saved = localStorage.getItem(ACTIVE_KEY); } catch { /* Selection is optional. */ }
      const id = certifications.find(c => c.id === saved)?.id ?? "ccst";
      try {
        const bank = await loaders[id]();
        if (!cancelled && request === requestId.current) setSelected({ id, bank: bank as QuestionBank });
      } catch {
        if (!cancelled && request === requestId.current) {
          setSelected({ id: "ccst", bank: ccst as QuestionBank });
          setLoadError("The saved certification could not be loaded. Choose it again to retry.");
        }
      }
    }
    void restoreCertification();
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
  if (!selected) return <main className="startup-loading" aria-busy="true"><div className="panel"><span className="eyebrow">STUDYROOM</span><h1>Opening your study room</h1><p role="status">Loading your saved certification…</p></div></main>;
  return <CertificationContext value={{ certification: certifications.find(c => c.id === selected.id)!, bank: selected.bank, selectCertification, loading, loadError }}><StudyRoom key={selected.id} /></CertificationContext>;
}
