import { loadEpisodeById, loadEpisodesIndex } from "../core/content.js";
import { applyChoice, createRunState, getCurrentNode } from "../core/engine.js";
import { loadRunState, saveRunState } from "../core/state.js";

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

function createImageBlock(imageUrl, altText, className = "scene-image") {
  if (typeof imageUrl !== "string" || imageUrl.trim() === "") {
    return null;
  }

  const wrapper = document.createElement("figure");
  wrapper.className = `${className}-wrapper`;

  const image = document.createElement("img");
  image.className = className;
  image.src = imageUrl;
  image.alt = altText;

  const placeholder = document.createElement("figcaption");
  placeholder.className = "image-placeholder";
  placeholder.textContent = `${altText} (이미지를 불러오지 못했어요)`;
  placeholder.hidden = true;

  image.addEventListener("error", () => {
    image.hidden = true;
    placeholder.hidden = false;
  });

  wrapper.append(image, placeholder);
  return wrapper;
}

export function createApp(root) {
  const store = {
    episodes: [],
    currentEpisode: null,
    runState: null
  };

  function resetRun() {
    store.currentEpisode = null;
    store.runState = null;
  }

  function renderError(message) {
    root.innerHTML = "";
    const title = document.createElement("h1");
    title.textContent = "문제가 발생했어요";

    const description = document.createElement("p");
    description.textContent = message;

    const home = createButton("사건 선택으로", () => {
      resetRun();
      navigate("/");
    });

    root.append(title, description, home);
  }

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

  function renderEnding(ending, episodeId) {
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

      store.runState = createRunState(store.currentEpisode);
      saveRunState(store.runState);
      navigate(`/play/${episodeId}`);
      void renderPlay(episodeId);
    });

    const home = createButton("사건 선택", () => {
      resetRun();
      navigate("/");
    });

    root.append(title, kind, summary, restart, home);
  }

  async function renderPlay(episodeId) {
    if (!store.currentEpisode || store.currentEpisode.id !== episodeId) {
      store.currentEpisode = await loadEpisodeById(episodeId);
      store.runState = loadRunState(store.currentEpisode) ?? createRunState(store.currentEpisode);
      saveRunState(store.runState);
    }

    const node = getCurrentNode(store.currentEpisode, store.runState);
    if (!node) {
      renderError("현재 장면을 찾지 못했습니다.");
      return;
    }

    if (node.ending) {
      renderEnding(node.ending, episodeId);
      return;
    }

    root.innerHTML = "";

    const title = document.createElement("h1");
    title.textContent = store.currentEpisode.title;

    const nodeTitle = document.createElement("h2");
    nodeTitle.textContent = node.title ?? "장면";

    const body = document.createElement("p");
    body.textContent = node.body;

    const nodeImage = createImageBlock(node.imageUrl, `${nodeTitle.textContent} 장면 이미지`);

    const choices = document.createElement("div");
    choices.className = "choice-list";

    for (const choice of node.choices) {
      const choiceRow = document.createElement("div");
      choiceRow.className = "choice-item";

      const choiceImage = createImageBlock(choice.imageUrl, `${choice.text} 선택지 이미지`, "choice-image");
      if (choiceImage) {
        choiceRow.append(choiceImage);
      }

      const button = createButton(choice.text, () => {
        const result = applyChoice(store.currentEpisode, store.runState, choice.id);
        if (result.isEnding && result.node.ending) {
          saveRunState(store.runState);
          renderEnding(result.node.ending, episodeId);
          return;
        }

        saveRunState(store.runState);
        void renderPlay(episodeId);
      });
      choiceRow.append(button);
      choices.append(choiceRow);
    }

    const back = createButton("사건 목록", () => {
      resetRun();
      navigate("/");
    });

    root.append(title, nodeTitle, body, ...(nodeImage ? [nodeImage] : []), choices, back);
  }

  async function renderRoute() {
    try {
      const route = parseHash();
      if (route.screen === "play") {
        await renderPlay(route.episodeId);
        return;
      }

      resetRun();
      await renderHome();
    } catch (error) {
      renderError(error instanceof Error ? error.message : "알 수 없는 오류");
    }
  }

  return {
    start() {
      window.addEventListener("hashchange", () => {
        void renderRoute();
      });
      void renderRoute();
    }
  };
}
