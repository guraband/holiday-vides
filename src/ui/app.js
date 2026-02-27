import { loadEpisodeById, loadEpisodesIndex } from "../core/content.js";
import { applyChoice, createRunState, getCurrentNode } from "../core/engine.js";

function parseHash() {
  const hash = window.location.hash.replace(/^#\/?/, "");
  const [route, episodeId] = hash.split("/");

  if (route === "play" && episodeId) {
    return { screen: "play", episodeId };
  }

  return { screen: "home" };
}

function navigate(path) {
  window.location.hash = path;
}

function createButton(label, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.addEventListener("click", onClick);
  return button;
}

export function createApp(root) {
  const store = {
    episodes: [],
    currentEpisode: null,
    runState: null
  };

  async function renderHome() {
    store.episodes = await loadEpisodesIndex();

    root.innerHTML = "";

    const title = document.createElement("h1");
    title.textContent = "웃긴 추리 게임북";

    const list = document.createElement("div");
    list.className = "episode-list";

    for (const episode of store.episodes) {
      const card = document.createElement("article");
      card.className = "card";

      const heading = document.createElement("h2");
      heading.textContent = episode.title;

      const tagline = document.createElement("p");
      tagline.textContent = episode.tagline;

      const startButton = createButton("시작", () => navigate(`/play/${episode.id}`));

      card.append(heading, tagline, startButton);
      list.append(card);
    }

    root.append(title, list);
  }

  async function renderPlay(episodeId) {
    if (!store.currentEpisode || store.currentEpisode.id !== episodeId) {
      store.currentEpisode = await loadEpisodeById(episodeId);
      store.runState = createRunState(store.currentEpisode);
    }

    const node = getCurrentNode(store.currentEpisode, store.runState);
    if (!node) {
      root.textContent = "노드를 불러올 수 없습니다.";
      return;
    }

    root.innerHTML = "";

    const title = document.createElement("h1");
    title.textContent = store.currentEpisode.title;

    const nodeTitle = document.createElement("h2");
    nodeTitle.textContent = node.title ?? "장면";

    const body = document.createElement("p");
    body.textContent = node.body;

    const choices = document.createElement("div");
    choices.className = "choice-list";

    if (!node.choices.length && node.ending) {
      const endingButton = createButton("엔딩 보기", () => renderEnding(node.ending));
      const restartButton = createButton("처음으로", () => {
        store.currentEpisode = null;
        store.runState = null;
        navigate("/");
      });
      choices.append(endingButton, restartButton);
    } else {
      for (const choice of node.choices) {
        const button = createButton(choice.text, () => {
          const result = applyChoice(store.currentEpisode, store.runState, choice.id);
          if (result.isEnding && result.node.ending) {
            renderEnding(result.node.ending);
            return;
          }

          renderPlay(episodeId);
        });
        choices.append(button);
      }
    }

    const back = createButton("사건 목록", () => {
      store.currentEpisode = null;
      store.runState = null;
      navigate("/");
    });

    root.append(title, nodeTitle, body, choices, back);
  }

  function renderEnding(ending) {
    root.innerHTML = "";

    const title = document.createElement("h1");
    title.textContent = ending.title;

    const kind = document.createElement("p");
    kind.className = "ending-kind";
    kind.textContent = `엔딩 타입: ${ending.kind}`;

    const summary = document.createElement("p");
    summary.textContent = ending.summary;

    const restart = createButton("다시 플레이", () => {
      if (!store.currentEpisode) {
        navigate("/");
        return;
      }

      const episodeId = store.currentEpisode.id;
      store.runState = createRunState(store.currentEpisode);
      navigate(`/play/${episodeId}`);
      renderPlay(episodeId);
    });

    const home = createButton("사건 선택", () => {
      store.currentEpisode = null;
      store.runState = null;
      navigate("/");
    });

    root.append(title, kind, summary, restart, home);
  }

  async function renderRoute() {
    const route = parseHash();

    if (route.screen === "play") {
      await renderPlay(route.episodeId);
      return;
    }

    await renderHome();
  }

  return {
    start() {
      window.addEventListener("hashchange", renderRoute);
      renderRoute();
    }
  };
}
