import { loadEpisodeById, loadEpisodesIndex } from "../core/content.js";
import {
  applyChoice,
  createRunState,
  getChoiceViewModels,
  getCurrentNode,
  undoChoice
} from "../core/engine.js";
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

function createButton(label, onClick, options = {}) {
  const { variant = "primary", className = "" } = options;
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.className = ["button", `button-${variant}`, className].filter(Boolean).join(" ");
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

function createBadge(text, className = "") {
  const badge = document.createElement("span");
  badge.className = ["badge", className].filter(Boolean).join(" ");
  badge.textContent = text;
  return badge;
}

export function createApp(root) {
  let announceRegion = document.getElementById("route-announce-region");
  if (!announceRegion) {
    announceRegion = document.createElement("p");
    announceRegion.id = "route-announce-region";
    announceRegion.className = "sr-only";
    announceRegion.setAttribute("aria-live", "polite");
    announceRegion.setAttribute("aria-atomic", "true");
    root.before(announceRegion);
  }

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

  function setScreen(screenName) {
    root.dataset.screen = screenName;
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

  function announceScene(message) {
    announceRegion.textContent = message;
  }

  function renderError(message) {
    setScreen("error");
    root.innerHTML = "";

    const shell = document.createElement("section");
    shell.className = "screen-shell screen-shell-error";

    const panel = document.createElement("div");
    panel.className = "hero-panel";

    const eyebrow = createBadge("오류", "badge-alert");

    const title = document.createElement("h1");
    title.textContent = "문제가 발생했어요";

    const description = document.createElement("p");
    description.className = "hero-description";
    description.textContent = message;

    const actions = document.createElement("div");
    actions.className = "button-row";

    const home = createButton("사건 선택으로", () => {
      resetRun();
      navigate("/");
    });

    actions.append(home);
    panel.append(eyebrow, title, description, actions);
    shell.append(panel);
    root.append(shell);

    title.tabIndex = -1;
    title.focus();
    announceScene(`오류: ${message}`);
  }

  function createGlobalTools() {
    const panel = document.createElement("section");
    panel.className = "global-tools surface-card";

    const header = document.createElement("div");
    header.className = "section-heading";

    const titleWrap = document.createElement("div");

    const eyebrow = createBadge("개인화");

    const title = document.createElement("h2");
    title.textContent = "설정 & 데이터";

    const summary = document.createElement("p");
    summary.className = "section-description";
    summary.textContent = "가독성과 저장 데이터를 한 번에 관리해 더 편하게 플레이하세요.";

    titleWrap.append(eyebrow, title, summary);
    header.append(titleWrap);

    const controls = document.createElement("div");
    controls.className = "global-tools-controls";

    const textSizeCard = document.createElement("label");
    textSizeCard.className = "tool-control-card";

    const textSizeLabel = document.createElement("span");
    textSizeLabel.className = "tool-control-label";
    textSizeLabel.textContent = "텍스트 크기";

    const textSizeHelp = document.createElement("span");
    textSizeHelp.className = "tool-control-help";
    textSizeHelp.textContent = "플레이 중 문단과 버튼 크기를 조절합니다.";

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

    textSizeCard.append(textSizeLabel, textSizeHelp, textSizeSelect);

    const reduceMotionLabel = document.createElement("label");
    reduceMotionLabel.className = "tool-control-card setting-check";

    const reduceMotionCopy = document.createElement("div");

    const reduceMotionTitle = document.createElement("span");
    reduceMotionTitle.className = "tool-control-label";
    reduceMotionTitle.textContent = "애니메이션 감소";

    const reduceMotionText = document.createElement("span");
    reduceMotionText.className = "tool-control-help";
    reduceMotionText.textContent = "움직임을 최소화해 더 편안하게 이용합니다.";

    reduceMotionCopy.append(reduceMotionTitle, reduceMotionText);

    const reduceMotionInput = document.createElement("input");
    reduceMotionInput.type = "checkbox";
    reduceMotionInput.checked = store.settings.reduceMotion;
    reduceMotionInput.addEventListener("change", () => {
      updateSettings({ reduceMotion: reduceMotionInput.checked });
    });

    reduceMotionLabel.append(reduceMotionCopy, reduceMotionInput);

    const dataCard = document.createElement("div");
    dataCard.className = "tool-control-card";

    const dataTitle = document.createElement("span");
    dataTitle.className = "tool-control-label";
    dataTitle.textContent = "백업 관리";

    const dataHelp = document.createElement("span");
    dataHelp.className = "tool-control-help";
    dataHelp.textContent = "발견한 엔딩과 설정을 파일로 내보내거나 다시 불러옵니다.";

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
      setTimeout(() => URL.revokeObjectURL(url), 100);
    }, { variant: "secondary" });

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
    }, { variant: "ghost" });

    dataActions.append(exportButton, importButton, importInput);
    dataCard.append(dataTitle, dataHelp, dataActions);
    controls.append(textSizeCard, reduceMotionLabel, dataCard);
    panel.append(header, controls);

    return panel;
  }

  function buildProgressStats() {
    const totals = Object.values(store.episodeProgress).reduce(
      (accumulator, progress) => {
        accumulator.found += progress.discoveredIds.size;
        accumulator.total += progress.endings.length;
        return accumulator;
      },
      { found: 0, total: 0 }
    );

    return [
      { label: "플레이 가능한 사건", value: `${store.episodes.length}개` },
      { label: "발견한 엔딩", value: `${totals.found}/${totals.total}` },
      { label: "현재 텍스트", value: store.settings.textSize === "lg" ? "크게" : store.settings.textSize === "sm" ? "작게" : "보통" }
    ];
  }

  async function renderHome() {
    setScreen("home");
    store.episodes = await loadEpisodesIndex();
    await loadEpisodeProgress(store.episodes);
    root.innerHTML = "";

    const shell = document.createElement("div");
    shell.className = "screen-shell home-shell";

    const hero = document.createElement("section");
    hero.className = "hero-panel";

    const heroCopy = document.createElement("div");
    heroCopy.className = "hero-copy";

    const eyebrow = createBadge("Interactive Mystery");

    const title = document.createElement("h1");
    title.textContent = "웃긴 추리 게임북";

    const description = document.createElement("p");
    description.className = "hero-description";
    description.textContent = "코믹한 사건 현장을 탐색하고, 단서를 모아 기상천외한 엔딩을 해금해 보세요.";

    const heroStats = document.createElement("div");
    heroStats.className = "hero-stats";

    for (const stat of buildProgressStats()) {
      const statCard = document.createElement("div");
      statCard.className = "stat-card";

      const statValue = document.createElement("strong");
      statValue.textContent = stat.value;

      const statLabel = document.createElement("span");
      statLabel.textContent = stat.label;

      statCard.append(statValue, statLabel);
      heroStats.append(statCard);
    }

    heroCopy.append(eyebrow, title, description, heroStats);

    const heroAside = document.createElement("aside");
    heroAside.className = "hero-aside surface-card";

    const asideTitle = document.createElement("h2");
    asideTitle.textContent = "플레이 포인트";

    const pointList = document.createElement("ul");
    pointList.className = "feature-list";

    [
      "선택지마다 장면 이미지와 결과 흐름을 직관적으로 확인",
      "엔딩 도감으로 해금 현황과 힌트를 빠르게 체크",
      "백업 파일로 기록을 안전하게 저장하고 복원"
    ].forEach((text) => {
      const item = document.createElement("li");
      item.textContent = text;
      pointList.append(item);
    });

    heroAside.append(asideTitle, pointList);
    hero.append(heroCopy, heroAside);

    const contentGrid = document.createElement("section");
    contentGrid.className = "home-content-grid";

    const tools = createGlobalTools();

    const librarySection = document.createElement("section");
    librarySection.className = "episode-library";

    const libraryHeader = document.createElement("div");
    libraryHeader.className = "section-heading";

    const libraryTitleWrap = document.createElement("div");

    const libraryBadge = createBadge("Case Files");

    const libraryTitle = document.createElement("h2");
    libraryTitle.textContent = "사건 목록";

    const libraryDescription = document.createElement("p");
    libraryDescription.className = "section-description";
    libraryDescription.textContent = "마음에 드는 에피소드를 골라 바로 플레이하거나, 도감으로 숨겨진 엔딩을 확인하세요.";

    libraryTitleWrap.append(libraryBadge, libraryTitle, libraryDescription);
    libraryHeader.append(libraryTitleWrap);

    const list = document.createElement("div");
    list.className = "episode-list";

    for (const episode of store.episodes) {
      const card = document.createElement("article");
      card.className = "card episode-card";

      const cardHead = document.createElement("div");
      cardHead.className = "episode-card-head";

      const textWrap = document.createElement("div");

      const heading = document.createElement("h3");
      heading.textContent = episode.title;

      const tagline = document.createElement("p");
      tagline.className = "episode-tagline";
      tagline.textContent = episode.tagline;

      const progress = store.episodeProgress[episode.id];
      const foundCount = progress?.discoveredIds?.size ?? 0;
      const totalCount = progress?.endings?.length ?? 0;

      const progressText = createBadge(`엔딩 ${foundCount}/${totalCount}`, "badge-accent");
      progressText.classList.add("episode-progress");

      textWrap.append(heading, tagline);
      cardHead.append(textWrap, progressText);

      const codexPanel = document.createElement("section");
      codexPanel.className = "ending-codex";
      codexPanel.hidden = true;

      const codexTitle = document.createElement("h4");
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

      const actionRow = document.createElement("div");
      actionRow.className = "button-row";

      const startButton = createButton("플레이 시작", () => navigate(`/play/${episode.id}`));

      const codexToggle = createButton("엔딩 도감 보기", () => {
        codexPanel.hidden = !codexPanel.hidden;
        codexToggle.textContent = codexPanel.hidden ? "엔딩 도감 보기" : "엔딩 도감 닫기";
      }, { variant: "secondary" });

      actionRow.append(startButton, codexToggle);
      card.append(cardHead, actionRow, codexPanel);
      list.append(card);
    }

    librarySection.append(libraryHeader, list);
    contentGrid.append(tools, librarySection);
    shell.append(hero, contentGrid);
    root.append(shell);

    title.tabIndex = -1;
    title.focus();
    announceScene("홈 화면");
  }

  function renderEnding(ending, episodeId) {
    setScreen("ending");
    root.innerHTML = "";

    const shell = document.createElement("section");
    shell.className = "screen-shell result-shell";

    const panel = document.createElement("article");
    panel.className = "result-panel surface-card";

    const title = document.createElement("h1");
    title.textContent = ending.title;

    const kind = createBadge(`엔딩 타입 · ${ending.kind}`, "badge-accent");
    kind.classList.add("ending-kind");

    const summary = document.createElement("p");
    summary.className = "result-summary";
    summary.textContent = ending.summary;

    const actions = document.createElement("div");
    actions.className = "button-row";

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
    }, { variant: "secondary" });

    actions.append(restart, home);
    panel.append(kind, title, summary, actions);
    shell.append(panel);
    root.append(shell);

    title.tabIndex = -1;
    title.focus();
    announceScene(`엔딩: ${ending.title}`);
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

    setScreen("play");
    root.innerHTML = "";

    const shell = document.createElement("div");
    shell.className = "screen-shell play-shell";

    const topbar = document.createElement("header");
    topbar.className = "play-topbar surface-card";

    const topbarCopy = document.createElement("div");

    const title = document.createElement("h1");
    title.textContent = store.currentEpisode.title;

    const subline = document.createElement("p");
    subline.className = "play-subline";
    subline.textContent = "단서를 살피고, 선택지를 비교해 가장 재미있는 결말을 찾아보세요.";

    topbarCopy.append(title, subline);

    const topbarMeta = document.createElement("div");
    topbarMeta.className = "topbar-meta";
    topbarMeta.append(
      createBadge(`진행 단계 ${store.runState.history.length}`, "badge-accent"),
      createBadge(`${Object.keys(store.runState.endingsFound).length}개 엔딩 기록`)
    );

    topbar.append(topbarCopy, topbarMeta);

    const sceneCard = document.createElement("section");
    sceneCard.className = "scene-card surface-card";

    const sceneHeader = document.createElement("div");
    sceneHeader.className = "scene-header";

    const nodeTitle = document.createElement("h2");
    nodeTitle.textContent = node.title ?? "장면";

    const sceneBadge = createBadge("현재 장면", "badge-accent");
    sceneHeader.append(nodeTitle, sceneBadge);

    const body = document.createElement("p");
    body.className = "scene-body";
    body.textContent = node.body;

    const nodeImage = createImageBlock(node.imageUrl, `${nodeTitle.textContent} 장면 이미지`);

    sceneCard.append(sceneHeader, body, ...(nodeImage ? [nodeImage] : []));

    const choicesSection = document.createElement("section");
    choicesSection.className = "choices-section";

    const choicesHeading = document.createElement("div");
    choicesHeading.className = "section-heading";

    const choicesTitleWrap = document.createElement("div");
    choicesTitleWrap.append(
      createBadge("Decision"),
      Object.assign(document.createElement("h2"), { textContent: "선택지" }),
      Object.assign(document.createElement("p"), {
        className: "section-description",
        textContent: "각 선택지는 새로운 장면 또는 엔딩으로 이어집니다. 비활성화된 선택지는 필요한 조건을 먼저 충족해야 합니다."
      })
    );
    choicesHeading.append(choicesTitleWrap);

    const choices = document.createElement("div");
    choices.className = "choice-list";

    const choiceViewModels = getChoiceViewModels(store.currentEpisode, store.runState);

    for (const choice of choiceViewModels) {
      const choiceRow = document.createElement("article");
      choiceRow.className = "choice-item surface-card";

      const choiceImage = createImageBlock(choice.imageUrl, `${choice.text} 선택지 이미지`, "choice-image");
      if (choiceImage) {
        choiceRow.append(choiceImage);
      }

      const choiceBody = document.createElement("div");
      choiceBody.className = "choice-body";

      const choiceLabel = document.createElement("p");
      choiceLabel.className = "choice-label";
      choiceLabel.textContent = choice.enabled ? "즉시 선택 가능" : "조건 미충족";

      const button = createButton(choice.text, () => {
        const result = applyChoice(store.currentEpisode, store.runState, choice.id);
        if (result.isEnding && result.node.ending) {
          saveRunState(store.runState);
          renderEnding(result.node.ending, episodeId);
          return;
        }

        saveRunState(store.runState);
        void renderPlay(episodeId);
      }, { className: "choice-button" });
      button.disabled = !choice.enabled;
      choiceBody.append(choiceLabel, button);

      if (!choice.enabled && choice.disabledReason) {
        const reason = document.createElement("p");
        reason.className = "choice-disabled-reason";
        reason.textContent = choice.disabledReason;
        choiceBody.append(reason);
      }

      choiceRow.append(choiceBody);
      choices.append(choiceRow);
    }

    choicesSection.append(choicesHeading, choices);

    const footer = document.createElement("section");
    footer.className = "play-footer surface-card";

    const footerCopy = document.createElement("div");

    const footerTitle = document.createElement("h2");
    footerTitle.textContent = "탐색 제어";

    const footerDescription = document.createElement("p");
    footerDescription.className = "section-description";
    footerDescription.textContent = "이전 분기를 되돌리거나 사건 목록으로 돌아가 다른 에피소드를 시작할 수 있습니다.";

    footerCopy.append(footerTitle, footerDescription);

    const footerActions = document.createElement("div");
    footerActions.className = "play-footer-actions";

    const undoControls = document.createElement("div");
    undoControls.className = "undo-controls";

    for (const steps of [1, 2, 3]) {
      const canUndo = store.runState.history.length - 1 >= steps;
      const undoButton = createButton(`${steps}단계 되돌리기`, () => {
        if (!undoChoice(store.runState, steps)) {
          return;
        }

        saveRunState(store.runState);
        void renderPlay(episodeId);
      }, { variant: "secondary" });
      undoButton.disabled = !canUndo;
      undoControls.append(undoButton);
    }

    const back = createButton("사건 목록", () => {
      resetRun();
      navigate("/");
    }, { variant: "ghost" });

    footerActions.append(undoControls, back);
    footer.append(footerCopy, footerActions);

    shell.append(topbar, sceneCard, choicesSection, footer);
    root.append(shell);

    nodeTitle.tabIndex = -1;
    nodeTitle.focus();
    announceScene(`장면: ${nodeTitle.textContent}`);
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
