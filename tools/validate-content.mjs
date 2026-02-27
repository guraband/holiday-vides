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

async function run() {
  const episodes = JSON.parse(await fs.readFile(episodesIndexPath, "utf8"));

  for (const episodeMeta of episodes) {
    const episodePath = path.join(contentDir, episodeMeta.file);
    const episode = JSON.parse(await fs.readFile(episodePath, "utf8"));

    if (!episode.startNodeId || !episode.nodes[episode.startNodeId]) {
      fail(`${episode.id}: startNodeId가 유효하지 않습니다.`);
      continue;
    }

    const endingIds = new Set();

    for (const node of Object.values(episode.nodes)) {
      const choiceIds = new Set();

      for (const choice of node.choices ?? []) {
        if (choiceIds.has(choice.id)) {
          fail(`${episode.id}/${node.id}: choice id 중복 (${choice.id})`);
        }
        choiceIds.add(choice.id);

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

    ok(`${episode.id}: 기본 참조 검증 통과`);
  }

  if (process.exitCode) {
    throw new Error("콘텐츠 검증 실패");
  }
}

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
