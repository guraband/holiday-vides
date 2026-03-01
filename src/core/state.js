const STORAGE_KEY = "holiday-vides:run-state:v1";

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

  return {
    episodeId: episode.id,
    nodeId,
    history: history.length ? history : [{ nodeId, timestamp: Date.now() }],
    endingsFound
  };
}

function readStorage() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return {};
  }

  const parsed = JSON.parse(raw);
  return isRecord(parsed) ? parsed : {};
}

function writeStorage(value) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
}

export function loadRunState(episode) {
  const all = readStorage();
  return sanitizeRunState(all[episode.id], episode);
}

export function saveRunState(state) {
  if (!state?.episodeId) {
    return;
  }

  const all = readStorage();
  all[state.episodeId] = state;
  writeStorage(all);
}

export function clearRunState(episodeId) {
  if (!episodeId) {
    return;
  }

  const all = readStorage();
  delete all[episodeId];
  writeStorage(all);
}

