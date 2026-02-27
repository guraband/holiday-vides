const episodeCache = new Map();
let episodesIndexCache = null;

export async function loadEpisodesIndex() {
  if (episodesIndexCache) {
    return episodesIndexCache;
  }

  const response = await fetch("./src/content/episodes.json");
  if (!response.ok) {
    throw new Error("에피소드 목록을 불러오지 못했습니다.");
  }

  episodesIndexCache = await response.json();
  return episodesIndexCache;
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

  if (episode.id !== episodeId) {
    throw new Error(`에피소드 id 불일치: 요청(${episodeId}), 파일(${episode.id})`);
  }

  episodeCache.set(episodeId, episode);
  return episode;
}
