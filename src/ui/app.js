import { loadEpisodeById, loadEpisodesIndex } from "../core/content.js";
import { applyChoice, createRunState, getCurrentNode } from "../core/engine.js";
import {
  exportBackupData,
  importBackupData,
  loadRunState,
  loadSettings,
  saveRunState,
  saveSettings
} from "../core/state.js";

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
    episodeProgress: {},
    currentEpisode: null,
    runState: null,
    settings: loadSettings()
  };

  function applySettingsToRoot() {
    root.classList.toggle("text-sm", store.settings.textSize === "sm");
    root.classList.toggle("text-lg", store.settings.textSize === "lg");
    root.classList.toggle("reduce-motion", store.settings.reduceMotion);
  }

  function updateSettings(nextSettings) {
    store.settings = {
      ...store.settings,
      ...nextSettings
    };
    saveSettings(store.settings);
    applySettingsToRoot();
  }

  function getEpisodeEndings(episode) {
    return Object.values(episode.nodes)
      .filter((node) => node.ending)
      .map((node) => node.ending);
  }

  async function loadEpisodeProgress(episodes) {
    const progressEntries = await Promise.all(
      episodes.map(async (episodeMeta) => {
        const episode = await loadEpisodeById(episodeMeta.id);
        const runState = loadRunState(episode);
        const endings = getEpisodeEndings(episode);
        const discovered = endings.filter((ending) => runState?.endingsFound?.[ending.id]);

        return [
          episodeMeta.id,
          {
            endings,
            discoveredIds: new Set(discovered.map((ending) => ending.id))
          }
        ];
      })
    );

    store.episodeProgress = Object.fromEntries(progressEntries);
  }

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

  function createGlobalTools() {
    const panel = document.createElement("section");
    panel.className = "global-tools";

    const title = document.createElement("h2");
    title.textContent = "설정 & 데이터";

    const controls = document.createElement("div");
    controls.className = "global-tools-controls";

    const textSizeLabel = document.createElement("label");
    textSizeLabel.textContent = "텍스트 크기";

    const textSizeSelect = document.createElement("select");
    textSizeSelect.className = "setting-select";
    const sizeOptions = [
      ["sm", "작게"],
      ["md", "보통"],
      ["lg", "크게"]
    ];

    for (const [value, label] of sizeOptions) {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = label;
      option.selected = store.settings.textSize === value;
      textSizeSelect.append(option);
    }

    textSizeSelect.addEventListener("change", () => {
      updateSettings({ textSize: textSizeSelect.value });
    });

    textSizeLabel.append(textSizeSelect);

    const reduceMotionLabel = document.createElement("label");
    reduceMotionLabel.className = "setting-check";

    const reduceMotionInput = document.createElement("input");
    reduceMotionInput.type = "checkbox";
    reduceMotionInput.checked = store.settings.reduceMotion;
    reduceMotionInput.addEventListener("change", () => {
      updateSettings({ reduceMotion: reduceMotionInput.checked });
    });

    const reduceMotionText = document.createElement("span");
    reduceMotionText.textContent = "애니메이션 감소";

    reduceMotionLabel.append(reduceMotionInput, reduceMotionText);

    const dataActions = document.createElement("div");
    dataActions.className = "backup-actions";

    const exportButton = createButton("백업 내보내기", () => {
      const backup = exportBackupData();
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `holiday-vides-backup-${Date.now()}.json`;
      link.click();
      URL.revokeObjectURL(url);
    });

    const importInput = document.createElement("input");
    importInput.type = "file";
    importInput.accept = "application/json";
    importInput.hidden = true;

    importInput.addEventListener("change", async () => {
      const file = importInput.files?.[0];
      if (!file) {
        return;
      }

      try {
        const content = await file.text();
        importBackupData(content);
        store.settings = loadSettings();
        applySettingsToRoot();
        await renderHome();
        window.alert("백업 데이터를 불러왔습니다.");
      } catch (error) {
        window.alert(error instanceof Error ? error.message : "백업 불러오기에 실패했습니다.");
      } finally {
        importInput.value = "";
      }
    });

    const importButton = createButton("백업 가져오기", () => {
      importInput.click();
    });

    dataActions.append(exportButton, importButton, importInput);
    controls.append(textSizeLabel, reduceMotionLabel, dataActions);
    panel.append(title, controls);

    return panel;
  }

  async function renderHome() {
    store.episodes = await loadEpisodesIndex();
    await loadEpisodeProgress(store.episodes);
    root.innerHTML = "";

    const title = document.createElement("h1");
    title.textContent = "웃긴 추리 게임북";

    const tools = createGlobalTools();

    const list = document.createElement("div");
    list.className = "episode-list";

    for (const episode of store.episodes) {
      const card = document.createElement("article");
      card.className = "card";

      const heading = document.createElement("h2");
      heading.textContent = episode.title;

      const tagline = document.createElement("p");
      tagline.textContent = episode.tagline;

      const progress = store.episodeProgress[episode.id];
      const progressText = document.createElement("p");
      const foundCount = progress?.discoveredIds?.size ?? 0;
      const totalCount = progress?.endings?.length ?? 0;
      progressText.className = "episode-progress";
      progressText.textContent = `엔딩 발견: ${foundCount}/${totalCount}`;

      const codexPanel = document.createElement("section");
      codexPanel.className = "ending-codex";
      codexPanel.hidden = true;

      const codexTitle = document.createElement("h3");
      codexTitle.textContent = "엔딩 도감";

      const codexList = document.createElement("ul");
      codexList.className = "ending-codex-list";

      for (const ending of progress?.endings ?? []) {
        const isFound = progress.discoveredIds.has(ending.id);

        const item = document.createElement("li");
        item.className = "ending-codex-item";

        const endingTitle = document.createElement("p");
        endingTitle.className = "ending-codex-title";
        endingTitle.textContent = isFound ? ending.title : "???";

        const endingSummary = document.createElement("p");
        endingSummary.className = "ending-codex-summary";
        if (isFound) {
          endingSummary.textContent = ending.summary;
        } else if (ending.hint1) {
          endingSummary.textContent = `힌트: ${ending.hint1}`;
        } else {
          endingSummary.textContent = "아직 발견하지 못한 엔딩입니다.";
        }

        item.append(endingTitle, endingSummary);
        codexList.append(item);
      }

      codexPanel.append(codexTitle, codexList);

      const startButton = createButton("시작", () => navigate(`/play/${episode.id}`));

      const codexToggle = createButton("엔딩 도감", () => {
        codexPanel.hidden = !codexPanel.hidden;
      });

      card.append(heading, tagline, progressText, startButton, codexToggle, codexPanel);
      list.append(card);
    }

    root.append(title, tools, list);
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
      applySettingsToRoot();
      window.addEventListener("hashchange", () => {
        void renderRoute();
      });
      void renderRoute();
    }
  };
}
