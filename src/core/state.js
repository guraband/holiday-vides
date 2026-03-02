const RUN_STATE_STORAGE_KEY = "holiday-vides:run-state:v1";
const SETTINGS_STORAGE_KEY = "holiday-vides:settings:v1";
const BACKUP_VERSION = 1;

const DEFAULT_SETTINGS = {
  textSize: "md",
  reduceMotion:
    typeof window !== "undefined"
      ? window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false
      : false
};

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sanitizeRunState(raw, episode) {
  if (!isRecord(raw)) {
    return null;
  }

  const nodeId = typeof raw.nodeId === "string" && episode.nodes[raw.nodeId] ? raw.nodeId : episode.startNodeId;
  const history = Array.isArray(raw.history)
    ? raw.history.filter((entry) => isRecord(entry) && typeof entry.nodeId === "string")
    : [];

  const endingsFound = isRecord(raw.endingsFound) ? raw.endingsFound : {};
  const hasVersionMismatch =
    typeof raw.episodeVersion === "string" && raw.episodeVersion !== episode.version;

  if (hasVersionMismatch) {
    return {
      episodeId: episode.id,
      episodeVersion: episode.version,
      nodeId: episode.startNodeId,
      history: [{ nodeId: episode.startNodeId, timestamp: Date.now() }],
      endingsFound
    };
  }

  return {
    episodeId: episode.id,
    episodeVersion: episode.version,
    nodeId,
    history: history.length ? history : [{ nodeId, timestamp: Date.now() }],
    endingsFound
  };
}

function sanitizeSettings(raw) {
  if (!isRecord(raw)) {
    return { ...DEFAULT_SETTINGS };
  }

  const textSize = ["sm", "md", "lg"].includes(raw.textSize) ? raw.textSize : DEFAULT_SETTINGS.textSize;
  const reduceMotion = typeof raw.reduceMotion === "boolean" ? raw.reduceMotion : DEFAULT_SETTINGS.reduceMotion;

  return {
    textSize,
    reduceMotion
  };
}

function readJSON(key, fallbackValue = {}) {
  const raw = localStorage.getItem(key);
  if (!raw) {
    return fallbackValue;
  }

  try {
    const parsed = JSON.parse(raw);
    return isRecord(parsed) ? parsed : fallbackValue;
  } catch {
    return fallbackValue;
  }
}

function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function readRunStorage() {
  return readJSON(RUN_STATE_STORAGE_KEY, {});
}

function writeRunStorage(value) {
  writeJSON(RUN_STATE_STORAGE_KEY, value);
}

export function loadRunState(episode) {
  const all = readRunStorage();
  return sanitizeRunState(all[episode.id], episode);
}

export function saveRunState(state) {
  if (!state?.episodeId) {
    return;
  }

  const all = readRunStorage();
  all[state.episodeId] = state;
  writeRunStorage(all);
}

export function clearRunState(episodeId) {
  if (!episodeId) {
    return;
  }

  const all = readRunStorage();
  delete all[episodeId];
  writeRunStorage(all);
}

export function loadSettings() {
  return sanitizeSettings(readJSON(SETTINGS_STORAGE_KEY, DEFAULT_SETTINGS));
}

export function saveSettings(settings) {
  writeJSON(SETTINGS_STORAGE_KEY, sanitizeSettings(settings));
}

export function exportBackupData() {
  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    runStates: readRunStorage(),
    settings: loadSettings()
  };
}

export function importBackupData(jsonText) {
  let parsed;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error("백업 파일이 올바른 JSON 형식이 아닙니다.");
  }

  if (!isRecord(parsed) || parsed.version !== BACKUP_VERSION) {
    throw new Error("백업 데이터 형식이 올바르지 않거나 버전이 맞지 않습니다.");
  }

  const runStates = isRecord(parsed.runStates) ? parsed.runStates : {};
  const settings = sanitizeSettings(parsed.settings);

  writeRunStorage(runStates);
  saveSettings(settings);
}
