const episodeCache = new Map();

export async function loadEpisodesIndex() {
  const response = await fetch("./src/content/episodes.json");
  if (!response.ok) {
    throw new Error("에피소드 목록을 불러오지 못했습니다.");
  }

  return response.json();
}

export async function loadEpisodeById(episodeId) {
  if (episodeCache.has(episodeId)) {
    return episodeCache.get(episodeId);
  }

  const episodes = await loadEpisodesIndex();
  const meta = episodes.find((episode) => episode.id === episodeId);

  if (!meta?.file) {
    throw new Error(`에피소드 메타(${episodeId})를 찾지 못했습니다.`);
  }

  const response = await fetch(`./src/content/${meta.file}`);
  if (!response.ok) {
    throw new Error(`에피소드(${episodeId})를 불러오지 못했습니다.`);
  }

  const episode = await response.json();
  episodeCache.set(episodeId, episode);
  return episode;
}
