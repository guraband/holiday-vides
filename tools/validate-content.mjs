import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const contentDir = path.join(root, "src", "content");
const episodesIndexPath = path.join(contentDir, "episodes.json");

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
      const hasNextNode = (node.choices ?? []).some((choice) => Boolean(choice.to));

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
