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
export interface PracticeAnswer {
  selected: string[];
  matches: Record<string, string>;
  submitted: boolean;
  correct?: boolean;
}
export interface PracticeDraft {
  id: string;
  chapterId: number;
  mode: "learn" | "test";
  includeNotes: boolean;
  index: number;
  items: { questionId: string; optionIds: string[]; matchOptions: string[] }[];
  answers: Record<string, PracticeAnswer>;
  flagged: string[];
}
export interface PracticeSession {
  id: string;
  date: string;
  total: number;
  correct: number;
  questionIds: string[];
  mode?: "learn" | "test";
  answers?: Record<string, PracticeAnswer>;
}
export interface StudyState {
  version: 1;
  certificationId?: string;
  bookmarks: string[];
  cards: Record<string, CardRating>;
  results: Record<string, { attempts: number; correct: number; lastCorrect: boolean }>;
  sessions: PracticeSession[];
  activePractice?: PracticeDraft | null;
  lastStudy: { mode: "flashcards" | "practice"; chapterId: number; questionId: string } | null;
}
export const EMPTY_STATE: StudyState = { version: 1, bookmarks: [], cards: {}, results: {}, sessions: [], lastStudy: null };

export function studySummary(questions: readonly Question[], state: StudyState) {
  return {
    studied: questions.filter(q => state.cards[q.id] || state.results[q.id]).length,
    known: Object.values(state.cards).filter(rating => rating === "known").length,
    answered: questions.filter(q => state.results[q.id]).length,
    latestCorrect: questions.filter(q => state.results[q.id]?.lastCorrect === true).length,
    needsReview: questions.filter(q => needsReview(q.id, state)).length,
    totals: Object.values(state.results).reduce((sum, result) => ({ attempts: sum.attempts + result.attempts, correct: sum.correct + result.correct }), { attempts: 0, correct: 0 }),
  };
}

export function needsReview(id: string, state: StudyState) {
  return state.results[id]?.lastCorrect === false || state.cards[id] === "learning";
}

/** Complete a saved quiz once, including when another tab already finished it. */
export function completePractice(state: StudyState, id: string, questions: readonly Question[], date: string): StudyState {
  const draft = state.activePractice;
  if (!draft || draft.id !== id || state.sessions.some(session => session.id === id)) return state;
  const questionMap = new Map(questions.map(q => [q.id, q]));
  let next = state;
  const answers: Record<string, PracticeAnswer> = {};
  for (const item of draft.items) {
    const question = questionMap.get(item.questionId);
    const answer = draft.answers[item.questionId] ?? { selected: [], matches: {}, submitted: false };
    const correct = Boolean(question && answer.submitted && gradeAnswer(question, answer.selected, answer.matches));
    answers[item.questionId] = { ...answer, correct };
    // Learning mode records each submission immediately; test mode waits until finish.
    if (draft.mode === "test" && answer.submitted) next = recordAnswer(next, item.questionId, correct);
  }
  const session: PracticeSession = { id, date, mode: draft.mode, total: draft.items.length, correct: Object.values(answers).filter(a => a.correct).length, questionIds: draft.items.map(item => item.questionId), answers };
  return { ...next, activePractice: null, sessions: [session, ...next.sessions].slice(0, 100) };
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
    const session: PracticeSession = { id: item.id, date: item.date, total: item.total, correct: item.correct, questionIds: [...item.questionIds] };
    if (item.mode !== undefined) {
      if (item.mode !== "learn" && item.mode !== "test") throw new Error("The backup contains an invalid practice mode.");
      session.mode = item.mode;
    }
    if (item.answers !== undefined) session.answers = parsePracticeAnswers(item.answers, new Set(item.questionIds));
    return session;
  });
  let lastStudy: StudyState["lastStudy"] = null;
  if (value.lastStudy !== null) {
    const item = value.lastStudy;
    if (!isObject(item) || (item.mode !== "flashcards" && item.mode !== "practice") || !Number.isInteger(item.chapterId) || Number(item.chapterId) < 0 || Number(item.chapterId) > 7 || !knownId(item.questionId)) throw new Error("The backup contains an invalid study position.");
    lastStudy = { mode: item.mode, chapterId: Number(item.chapterId), questionId: item.questionId };
  }
  const parsed: StudyState = { version: 1, certificationId, bookmarks: [...new Set(value.bookmarks)], cards, results, sessions, lastStudy };
  if (value.activePractice != null) {
    const draft = value.activePractice;
    if (!isObject(draft) || typeof draft.id !== "string" || !draft.id || draft.id.length > 100 || !integer(draft.chapterId) || draft.chapterId > 7 || (draft.mode !== "learn" && draft.mode !== "test") || typeof draft.includeNotes !== "boolean" || !Array.isArray(draft.items) || !draft.items.length || draft.items.length > validIds.size || !integer(draft.index) || draft.index >= draft.items.length) throw new Error("The backup contains an invalid saved quiz.");
    const items = draft.items.map(item => {
      if (!isObject(item) || !knownId(item.questionId) || !stringList(item.optionIds) || !stringList(item.matchOptions) || new Set(item.optionIds).size !== item.optionIds.length) throw new Error("The backup contains an invalid saved question.");
      return { questionId: item.questionId, optionIds: item.optionIds, matchOptions: item.matchOptions };
    });
    const draftIds = new Set(items.map(item => item.questionId));
    if (draftIds.size !== items.length || !Array.isArray(draft.flagged) || !draft.flagged.every(id => typeof id === "string" && draftIds.has(id))) throw new Error("The backup contains invalid saved quiz flags.");
    parsed.activePractice = { id: draft.id, chapterId: draft.chapterId, mode: draft.mode, includeNotes: draft.includeNotes, index: draft.index, items, answers: parsePracticeAnswers(draft.answers, draftIds), flagged: [...new Set(draft.flagged)] };
  }
  return parsed;
}

function stringList(value: unknown): value is string[] {
  return Array.isArray(value) && value.length <= 100 && value.every(item => typeof item === "string" && item.length <= 10000);
}

function parsePracticeAnswers(value: unknown, validIds: ReadonlySet<string>): Record<string, PracticeAnswer> {
  if (!isObject(value)) throw new Error("The backup contains invalid saved answers.");
  return Object.fromEntries(Object.entries(value).map(([id, answer]) => {
    if (!validIds.has(id) || !isObject(answer) || !stringList(answer.selected) || new Set(answer.selected).size !== answer.selected.length || !isObject(answer.matches) || Object.keys(answer.matches).length > 100 || !Object.entries(answer.matches).every(([key, text]) => key.length <= 100 && typeof text === "string" && text.length <= 10000) || typeof answer.submitted !== "boolean" || (answer.correct !== undefined && typeof answer.correct !== "boolean")) throw new Error("The backup contains invalid saved answers.");
    return [id, { selected: [...answer.selected], matches: { ...answer.matches } as Record<string, string>, submitted: answer.submitted, ...(answer.correct !== undefined ? { correct: answer.correct } : {}) }];
  }));
}
