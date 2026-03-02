import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const contentDir = path.join(root, "src", "content");
const episodesIndexPath = path.join(contentDir, "episodes.json");

const CONDITION_TYPES = new Set([
  "hasItem",
  "hasClue",
  "flagEquals",
  "statGte",
  "statLte",
  "visitedNode",
  "endingFound"
]);

const EFFECT_TYPES = new Set([
  "addItem",
  "removeItem",
  "addClue",
  "removeClue",
  "setFlag",
  "addStat",
  "goto"
]);

const CHECK_ROLL_TYPES = new Set(["d6", "d20", "coin"]);

function fail(message) {
  console.error(`❌ ${message}`);
  process.exitCode = 1;
}

function ok(message) {
  console.log(`✅ ${message}`);
}

function collectReachableNodes(episode) {
  const visited = new Set();
  const queue = [episode.startNodeId];

  while (queue.length) {
    const nodeId = queue.shift();
    if (!nodeId || visited.has(nodeId) || !episode.nodes[nodeId]) {
      continue;
    }

    visited.add(nodeId);
    const node = episode.nodes[nodeId];

    for (const choice of node.choices ?? []) {
      if (choice.to) {
        queue.push(choice.to);
      }

      if (choice.onPass?.to) {
        queue.push(choice.onPass.to);
      }

      if (choice.onFail?.to) {
        queue.push(choice.onFail.to);
      }

      for (const effect of [...(choice.effects ?? []), ...(choice.onPass?.effects ?? []), ...(choice.onFail?.effects ?? [])]) {
        if (effect?.type === "goto" && effect.to) {
          queue.push(effect.to);
        }
      }
    }
  }

  return visited;
}

function validateImageUrl(imageUrl, contextLabel) {
  if (imageUrl === undefined || imageUrl === null) {
    return;
  }

  if (typeof imageUrl !== "string") {
    fail(`${contextLabel}: imageUrl은 문자열, null, 또는 누락이어야 합니다.`);
    return;
  }

  if (imageUrl.trim() === "") {
    fail(`${contextLabel}: imageUrl에 빈 문자열은 허용되지 않습니다.`);
    return;
  }

  const isValid =
    imageUrl.startsWith("https://") || imageUrl.startsWith("./") || imageUrl.startsWith("../");

  if (!isValid) {
    fail(`${contextLabel}: imageUrl은 https:// 또는 ./ ../ 상대경로만 허용됩니다. (${imageUrl})`);
  }
}

function validateCondition(condition, contextLabel) {
  if (typeof condition !== "object" || condition === null) {
    fail(`${contextLabel}: cond 항목은 객체여야 합니다.`);
    return;
  }

  if (!CONDITION_TYPES.has(condition.type)) {
    fail(`${contextLabel}: 지원하지 않는 Condition 타입입니다. (${condition.type})`);
  }
}

function validateEffects(effects, contextLabel, episode) {
  for (const effect of effects ?? []) {
    if (typeof effect !== "object" || effect === null) {
      fail(`${contextLabel}: effects 항목은 객체여야 합니다.`);
      continue;
    }

    if (!EFFECT_TYPES.has(effect.type)) {
      fail(`${contextLabel}: 지원하지 않는 Effect 타입입니다. (${effect.type})`);
      continue;
    }

    if (effect.type === "goto" && (!effect.to || !episode.nodes[effect.to])) {
      fail(`${contextLabel}: goto effect의 to가 유효한 노드를 가리켜야 합니다. (${effect.to})`);
    }
  }
}

function validateCheck(choice, contextLabel) {
  const check = choice.check;
  if (!check) {
    return;
  }

  if (typeof check !== "object") {
    fail(`${contextLabel}: check는 객체여야 합니다.`);
    return;
  }

  if (typeof check.stat !== "string" || !check.stat) {
    fail(`${contextLabel}: check.stat은 비어있지 않은 문자열이어야 합니다.`);
  }

  if (typeof check.dc !== "number" || !Number.isFinite(check.dc)) {
    fail(`${contextLabel}: check.dc는 숫자여야 합니다.`);
  }

  if (check.roll !== undefined && !CHECK_ROLL_TYPES.has(check.roll)) {
    fail(`${contextLabel}: check.roll은 d6, d20, coin 중 하나여야 합니다. (${check.roll})`);
  }

  if (check.bonusFlag !== undefined && (typeof check.bonusFlag !== "string" || !check.bonusFlag)) {
    fail(`${contextLabel}: check.bonusFlag는 비어있지 않은 문자열이어야 합니다.`);
  }
}

async function run() {
  const episodes = JSON.parse(await fs.readFile(episodesIndexPath, "utf8"));
  const episodeIds = new Set();

  for (const episodeMeta of episodes) {
    if (!episodeMeta.id || !episodeMeta.file) {
      fail("episodes.json의 항목은 id와 file을 가져야 합니다.");
      continue;
    }

    if (episodeIds.has(episodeMeta.id)) {
      fail(`episodes.json: 중복된 episode id (${episodeMeta.id})`);
      continue;
    }
    episodeIds.add(episodeMeta.id);

    const episodePath = path.join(contentDir, episodeMeta.file);
    const episode = JSON.parse(await fs.readFile(episodePath, "utf8"));

    if (episode.id !== episodeMeta.id) {
      fail(`${episodeMeta.file}: id 불일치 (${episode.id} !== ${episodeMeta.id})`);
    }

    if (!episode.startNodeId || !episode.nodes[episode.startNodeId]) {
      fail(`${episode.id}: startNodeId가 유효하지 않습니다.`);
      continue;
    }

    const endingIds = new Set();

    for (const node of Object.values(episode.nodes)) {
      validateImageUrl(node.imageUrl, `${episode.id}/${node.id}`);

      const choiceIds = new Set();
      const hasNextNode = (node.choices ?? []).some(
        (choice) =>
          Boolean(choice.to || choice.onPass?.to || choice.onFail?.to) ||
          [...(choice.effects ?? []), ...(choice.onPass?.effects ?? []), ...(choice.onFail?.effects ?? [])].some(
            (effect) => effect?.type === "goto"
          )
      );

      if (!node.ending && !hasNextNode) {
        fail(`${episode.id}/${node.id}: 엔딩이 아닌 노드에 진행 가능한 선택지가 없습니다.`);
      }

      for (const choice of node.choices ?? []) {
        if (choiceIds.has(choice.id)) {
          fail(`${episode.id}/${node.id}: choice id 중복 (${choice.id})`);
        }
        choiceIds.add(choice.id);

        validateImageUrl(choice.imageUrl, `${episode.id}/${node.id}/${choice.id}`);

        if (choice.to && !episode.nodes[choice.to]) {
          fail(`${episode.id}/${node.id}: 존재하지 않는 노드 참조 (${choice.to})`);
        }

        if (choice.onPass?.to && !episode.nodes[choice.onPass.to]) {
          fail(`${episode.id}/${node.id}/${choice.id}: onPass.to가 유효하지 않습니다. (${choice.onPass.to})`);
        }

        if (choice.onFail?.to && !episode.nodes[choice.onFail.to]) {
          fail(`${episode.id}/${node.id}/${choice.id}: onFail.to가 유효하지 않습니다. (${choice.onFail.to})`);
        }

        const hasGotoInChoiceEffects = (choice.effects ?? []).some((effect) => effect?.type === "goto");
        if (hasGotoInChoiceEffects && (choice.to || choice.onPass || choice.onFail)) {
          fail(`${episode.id}/${node.id}/${choice.id}: choice.effects에 goto를 쓸 때 to/onPass/onFail을 함께 사용할 수 없습니다.`);
        }

        for (const condition of choice.cond ?? []) {
          validateCondition(condition, `${episode.id}/${node.id}/${choice.id}`);
        }

        validateEffects(choice.effects, `${episode.id}/${node.id}/${choice.id}`, episode);
        validateEffects(choice.onPass?.effects, `${episode.id}/${node.id}/${choice.id}/onPass`, episode);
        validateEffects(choice.onFail?.effects, `${episode.id}/${node.id}/${choice.id}/onFail`, episode);
        validateCheck(choice, `${episode.id}/${node.id}/${choice.id}`);
      }

      if (node.ending) {
        if (endingIds.has(node.ending.id)) {
          fail(`${episode.id}: ending id 중복 (${node.ending.id})`);
        }
        endingIds.add(node.ending.id);
      }
    }

    const reachable = collectReachableNodes(episode);
    for (const nodeId of Object.keys(episode.nodes)) {
      if (!reachable.has(nodeId)) {
        fail(`${episode.id}: 도달 불가능한 노드 (${nodeId})`);
      }
    }

    ok(`${episode.id}: 기본 참조/도달성 검증 통과`);
  }

  if (process.exitCode) {
    throw new Error("콘텐츠 검증 실패");
  }
}

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
