export function createRunState(episode) {
  return {
    episodeId: episode.id,
    episodeVersion: episode.version,
    nodeId: episode.startNodeId,
    history: [{ nodeId: episode.startNodeId, timestamp: Date.now() }],
    endingsFound: {}
  };
}

export function getCurrentNode(episode, state) {
  return episode.nodes[state.nodeId] ?? null;
}

export function applyChoice(episode, state, choiceId) {
  const node = getCurrentNode(episode, state);
  if (!node) {
    throw new Error("현재 노드를 찾을 수 없습니다.");
  }

  const choice = node.choices.find((item) => item.id === choiceId);
  if (!choice || !choice.to) {
    throw new Error("선택지를 처리할 수 없습니다.");
  }

  const nextNode = episode.nodes[choice.to];
  if (!nextNode) {
    throw new Error(`다음 노드(${choice.to})가 없습니다.`);
  }

  state.nodeId = nextNode.id;
  state.history.push({ nodeId: nextNode.id, choiceId, timestamp: Date.now() });

  if (nextNode.ending) {
    state.endingsFound[nextNode.ending.id] = true;
  }

  return {
    node: nextNode,
    isEnding: Boolean(nextNode.ending)
  };
}

export function undoChoice(state, steps = 1) {
  if (!state || !Array.isArray(state.history) || state.history.length <= 1) {
    return false;
  }

  const rollbackCount = Math.min(Math.max(steps, 1), 3, state.history.length - 1);
  const nextHistory = state.history.slice(0, -rollbackCount);
  const last = nextHistory.at(-1);

  if (!last?.nodeId) {
    return false;
  }

  state.history = nextHistory;
  state.nodeId = last.nodeId;
  return true;
}
