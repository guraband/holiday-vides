function hashSeed(seed) {
  let hash = 2166136261;
  const text = String(seed ?? "");
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function nextRandom(state) {
  const base = hashSeed(state.rng?.seed ?? "");
  const step = Number.isFinite(state.rng?.step) ? state.rng.step : 0;
  let value = (base + Math.imul(step + 1, 0x9e3779b9)) >>> 0;

  value ^= value << 13;
  value ^= value >>> 17;
  value ^= value << 5;

  state.rng.step = step + 1;
  return (value >>> 0) / 4294967296;
}

function hasVisitedNode(state, nodeId) {
  return (state.history ?? []).some((entry) => entry?.nodeId === nodeId);
}

function evaluateCondition(condition, state) {
  switch (condition?.type) {
    case "hasItem":
      return (state.inventory ?? []).includes(condition.item);
    case "hasClue":
      return (state.clues ?? []).includes(condition.clue);
    case "flagEquals":
      return state.flags?.[condition.flag] === condition.value;
    case "statGte":
      return (state.stats?.[condition.stat] ?? 0) >= condition.value;
    case "statLte":
      return (state.stats?.[condition.stat] ?? 0) <= condition.value;
    case "visitedNode":
      return hasVisitedNode(state, condition.nodeId);
    case "endingFound":
      return Boolean(state.endingsFound?.[condition.endingId]);
    default:
      return false;
  }
}

function buildDisabledReason(choice, unmetConditions) {
  if (choice.disabledReason) {
    return choice.disabledReason;
  }

  const first = unmetConditions[0];
  if (!first) {
    return "선택할 수 없습니다.";
  }

  switch (first.type) {
    case "hasItem":
      return `아이템 필요: ${first.item}`;
    case "hasClue":
      return `단서 필요: ${first.clue}`;
    case "flagEquals":
      return `조건 필요: ${first.flag}`;
    case "statGte":
      return `능력치 부족: ${first.stat} ${first.value} 이상 필요`;
    case "statLte":
      return `능력치 초과: ${first.stat} ${first.value} 이하 필요`;
    case "visitedNode":
      return "이전에 특정 장면을 방문해야 합니다.";
    case "endingFound":
      return "특정 엔딩을 먼저 찾아야 합니다.";
    default:
      return "조건을 만족하지 못했습니다.";
  }
}

function applyEffect(effect, state) {
  switch (effect?.type) {
    case "addItem":
      if (!state.inventory.includes(effect.item)) {
        state.inventory.push(effect.item);
      }
      return null;
    case "removeItem":
      state.inventory = state.inventory.filter((item) => item !== effect.item);
      return null;
    case "addClue":
      if (!state.clues.includes(effect.clue)) {
        state.clues.push(effect.clue);
      }
      return null;
    case "removeClue":
      state.clues = state.clues.filter((clue) => clue !== effect.clue);
      return null;
    case "setFlag":
      state.flags[effect.flag] = effect.value;
      return null;
    case "addStat":
      state.stats[effect.stat] = (state.stats[effect.stat] ?? 0) + effect.delta;
      return null;
    case "goto":
      return effect.to;
    default:
      return null;
  }
}

function applyEffects(effects, state) {
  let forcedNextNodeId = null;
  for (const effect of effects ?? []) {
    const gotoTarget = applyEffect(effect, state);
    if (gotoTarget) {
      forcedNextNodeId = gotoTarget;
    }
  }
  return forcedNextNodeId;
}

function rollCheck(check, state) {
  const rollType = check.roll ?? "d20";
  if (rollType === "coin") {
    return nextRandom(state) < 0.5 ? 1 : 0;
  }

  const max = rollType === "d6" ? 6 : 20;
  return Math.floor(nextRandom(state) * max) + 1;
}

function resolveChoiceTransition(choice, state) {
  if (!choice.check) {
    return { transition: choice, checkResult: null };
  }

  const roll = rollCheck(choice.check, state);
  const bonus = choice.check.bonusFlag && state.flags[choice.check.bonusFlag] ? 1 : 0;
  const total = roll + bonus;
  const passed = total >= choice.check.dc;

  return {
    transition: passed ? choice.onPass ?? choice : choice.onFail ?? choice,
    checkResult: {
      roll,
      bonus,
      total,
      dc: choice.check.dc,
      passed,
      type: choice.check.roll ?? "d20"
    }
  };
}

export function createRunState(episode) {
  const rngSeed =
    typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`;

  return {
    episodeId: episode.id,
    episodeVersion: episode.version,
    nodeId: episode.startNodeId,
    stats: {},
    inventory: [],
    clues: [],
    flags: {},
    history: [{ nodeId: episode.startNodeId, timestamp: Date.now() }],
    endingsFound: {},
    rng: {
      seed: rngSeed,
      step: 0
    }
  };
}

export function getCurrentNode(episode, state) {
  return episode.nodes[state.nodeId] ?? null;
}

export function getChoiceViewModels(episode, state) {
  const node = getCurrentNode(episode, state);
  if (!node) {
    return [];
  }

  return (node.choices ?? []).map((choice) => {
    const unmetConditions = (choice.cond ?? []).filter((condition) => !evaluateCondition(condition, state));
    const enabled = unmetConditions.length === 0;

    return {
      ...choice,
      enabled,
      disabledReason: enabled ? "" : buildDisabledReason(choice, unmetConditions)
    };
  });
}

export function applyChoice(episode, state, choiceId) {
  const node = getCurrentNode(episode, state);
  if (!node) {
    throw new Error("현재 노드를 찾을 수 없습니다.");
  }

  const choice = (node.choices ?? []).find((item) => item.id === choiceId);
  if (!choice) {
    throw new Error("선택지를 처리할 수 없습니다.");
  }

  const choiceView = getChoiceViewModels(episode, state).find((item) => item.id === choice.id);
  if (!choiceView?.enabled) {
    throw new Error(choiceView?.disabledReason || "조건을 만족하지 못해 선택할 수 없습니다.");
  }

  const { transition, checkResult } = resolveChoiceTransition(choice, state);
  const fromChoiceGoto = applyEffects(choice.effects, state);
  const fromTransitionGoto = applyEffects(transition.effects, state);

  const nextNodeId = fromTransitionGoto ?? fromChoiceGoto ?? transition.to ?? choice.to;
  if (!nextNodeId) {
    throw new Error("다음 노드가 정의되지 않았습니다.");
  }

  const nextNode = episode.nodes[nextNodeId];
  if (!nextNode) {
    throw new Error(`다음 노드(${nextNodeId})가 없습니다.`);
  }

  state.nodeId = nextNode.id;
  state.history.push({
    nodeId: nextNode.id,
    choiceId,
    timestamp: Date.now(),
    ...(checkResult ? { checkResult } : {})
  });

  if (nextNode.ending) {
    state.endingsFound[nextNode.ending.id] = true;
  }

  return {
    node: nextNode,
    isEnding: Boolean(nextNode.ending),
    checkResult
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
