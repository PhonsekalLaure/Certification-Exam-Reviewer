export type QuestionType = "single" | "multiple" | "matching" | "ordering" | "reference";
export type QuestionStatus = "standard" | "qualified" | "historical" | "invalid";
export interface Question {
  id: string;
  number: number;
  chapterId: number;
  sourcePage: number;
  type: QuestionType;
  prompt: string;
  exhibit: string;
  options: { id: string; text: string }[];
  correctIds: string[];
  pairs: { id: string; left: string; right: string; options?: string[]; acceptedAnswers?: string[] }[];
  answerLabel: string;
  explanation: string;
  status: QuestionStatus;
  scorable: boolean;
  sourceFile?: string;
  sourceReferences?: { file: string; page: number }[];
  matchOptions?: string[];
  studyNote?: string;
  contentFormat?: "text";
  answerExhibit?: string;
  review?: {
    kind: "verified" | "corrected" | "adapted";
    reviewedAt: string;
    summary: string;
    references: { label: string; url: string }[];
    originalAnswer?: unknown;
  };
}
export interface Chapter { id: number; title: string; description: string; slug: string; count: number }
export type CardRating = "learning" | "known";
export interface StudyState {
  version: 1;
  certificationId?: string;
  bookmarks: string[];
  cards: Record<string, CardRating>;
  results: Record<string, { attempts: number; correct: number; lastCorrect: boolean }>;
  sessions: { id: string; date: string; total: number; correct: number; questionIds: string[] }[];
  lastStudy: { mode: "flashcards" | "practice"; chapterId: number; questionId: string } | null;
}
export const EMPTY_STATE: StudyState = { version: 1, bookmarks: [], cards: {}, results: {}, sessions: [], lastStudy: null };

export function studySummary(questions: readonly Question[], state: StudyState) {
  return {
    studied: questions.filter(q => state.cards[q.id] || state.results[q.id]).length,
    known: Object.values(state.cards).filter(rating => rating === "known").length,
    totals: Object.values(state.results).reduce((sum, result) => ({ attempts: sum.attempts + result.attempts, correct: sum.correct + result.correct }), { attempts: 0, correct: 0 }),
  };
}

export function recordAnswer(state: StudyState, questionId: string, correct: boolean): StudyState {
  const previous = state.results[questionId] ?? { attempts: 0, correct: 0, lastCorrect: false };
  return {
    ...state,
    results: { ...state.results, [questionId]: { attempts: previous.attempts + 1, correct: previous.correct + Number(correct), lastCorrect: correct } },
  };
}

export function shuffled<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const output = [...items];
  for (let i = output.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [output[i], output[j]] = [output[j], output[i]];
  }
  return output;
}

export function isCorrectMatch(pair: Question["pairs"][number], answer: string | undefined): boolean {
  return answer === pair.right || Boolean(answer && pair.acceptedAnswers?.includes(answer));
}

export function gradeAnswer(question: Question, selected: string[], matches: Record<string, string>): boolean {
  if (question.status === "invalid" || question.type === "reference") return false;
  if (question.type === "matching") return question.pairs.every(pair => isCorrectMatch(pair, matches[pair.id]));
  if (question.type === "ordering") return selected.length === question.correctIds.length && selected.every((id, i) => id === question.correctIds[i]);
  return selected.length === question.correctIds.length && question.correctIds.every(id => selected.includes(id));
}

export function isAnswerComplete(question: Question, selected: string[], matches: Record<string, string>): boolean {
  if (question.type === "reference") return false;
  if (question.type === "matching") return question.pairs.every(pair => Boolean(matches[pair.id]));
  if (question.type === "ordering") return selected.length === question.correctIds.length;
  return selected.length > 0;
}

export function practicePool(questions: Question[], chapterId: number, includeNotes: boolean): Question[] {
  return questions.filter(q => (!chapterId || q.chapterId === chapterId) && q.status !== "invalid" && (includeNotes || q.scorable));
}

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const integer = (value: unknown, min = 0): value is number => Number.isSafeInteger(value) && Number(value) >= min && Number(value) <= 1_000_000;

/** Validate untrusted browser storage and backup files; copy only recognized fields. */
export function parseStudyState(value: unknown, validIds: ReadonlySet<string>, certificationId = "ccst"): StudyState {
  if (!isObject(value) || value.version !== 1 || !Array.isArray(value.bookmarks) || !isObject(value.cards) || !isObject(value.results) || !Array.isArray(value.sessions)) throw new Error("This is not a supported Study Room backup.");
  if ((value.certificationId ?? "ccst") !== certificationId) throw new Error("This backup belongs to a different certification. Switch to that certification before importing it.");
  const knownId = (id: unknown): id is string => typeof id === "string" && validIds.has(id);
  if (!value.bookmarks.every(knownId)) throw new Error("The backup contains an unknown question.");
  const cards: StudyState["cards"] = {};
  for (const [id, rating] of Object.entries(value.cards)) {
    if (!knownId(id) || (rating !== "known" && rating !== "learning")) throw new Error("The backup contains invalid flashcard progress.");
    cards[id] = rating;
  }
  const results: StudyState["results"] = {};
  for (const [id, result] of Object.entries(value.results)) {
    if (!knownId(id) || !isObject(result) || !integer(result.attempts, 1) || !integer(result.correct) || result.correct > result.attempts || typeof result.lastCorrect !== "boolean") throw new Error("The backup contains invalid quiz progress.");
    results[id] = { attempts: result.attempts, correct: result.correct, lastCorrect: result.lastCorrect };
  }
  const sessions: StudyState["sessions"] = value.sessions.slice(0, 100).map(item => {
    if (!isObject(item) || typeof item.id !== "string" || item.id.length > 100 || typeof item.date !== "string" || !Number.isFinite(Date.parse(item.date)) || !integer(item.total, 1) || !integer(item.correct) || item.correct > item.total || !Array.isArray(item.questionIds) || item.questionIds.length !== item.total || new Set(item.questionIds).size !== item.total || !item.questionIds.every(knownId)) throw new Error("The backup contains an invalid practice session.");
    return { id: item.id, date: item.date, total: item.total, correct: item.correct, questionIds: [...item.questionIds] };
  });
  let lastStudy: StudyState["lastStudy"] = null;
  if (value.lastStudy !== null) {
    const item = value.lastStudy;
    if (!isObject(item) || (item.mode !== "flashcards" && item.mode !== "practice") || !Number.isInteger(item.chapterId) || Number(item.chapterId) < 0 || Number(item.chapterId) > 7 || !knownId(item.questionId)) throw new Error("The backup contains an invalid study position.");
    lastStudy = { mode: item.mode, chapterId: Number(item.chapterId), questionId: item.questionId };
  }
  return { version: 1, certificationId, bookmarks: [...new Set(value.bookmarks)], cards, results, sessions, lastStudy };
}
