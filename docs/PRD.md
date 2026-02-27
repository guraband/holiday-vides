# 스펙시트: 웃긴 추리 게임북 웹앱 (GitHub Pages **No-Build 우선**)

문서 버전: v0.2  
작성일: 2026-02-26

---

## 1. 기술 개요

### 1.1 요구 조건
- 정적 호스팅(GitHub Pages)에서 동작
- **별도의 빌드 단계 없이** 배포 가능
- 서버/DB/로그인 없이 플레이 가능
- 상태 저장: 브라우저 로컬(`localStorage`) + 선택적 백업(JSON import/export)
- 짧은 플레이 타임 + 분기 많은 멀티엔딩 지원
- 데이터(스토리) 기반으로 신규 에피소드 추가 가능

### 1.2 권장 스택(수정안)
- 런타임: **Vanilla TypeScript 스타일의 구조 + 브라우저 네이티브 ESM(JavaScript 배포)**
- UI: **Vanilla DOM 렌더링**(필요 시 Web Components)
- 라우팅: 단일 페이지 + **Hash 라우팅**(`/#/play`)로 404 회피
- 테스트/검증: Node 스크립트 기반 validator(선택)
- 의존성 정책:
  - 1순위: 외부 의존성 최소화(무의존 또는 소수 유틸)
  - 2순위: 꼭 필요하면 CDN ESM(`jsdelivr`, `esm.sh`) 사용 + 버전 고정

> 핵심 원칙: “엔진(core)과 콘텐츠(data) 분리” + “No-build로 즉시 Pages 배포 가능”.

### 1.3 빌드 없는 배포를 위한 기술 제약
- 소스는 브라우저가 바로 실행 가능한 JS 모듈(`.js`)로 저장
- `index.html`에서 `<script type="module" src="./src/main.js"></script>`로 시작
- 경로는 상대경로 고정(`./src/...`)하여 Pages 서브패스에서도 안전하게 동작
- TypeScript 문법(`: string`, `interface`)은 배포/실행되는 JS 파일에 직접 포함하지 않음
  - JSDoc을 사용하거나, TypeScript로 개발 후 빌드된 JavaScript 결과물만 커밋하는 방식으로 타입 명세를 관리할 수 있습니다. (세부 사항은 '12. 구현 메모' 참고)

---

## 2. 앱 구조(모듈)

### 2.1 모듈 구성
1) `core/engine`
- 노드 렌더링 입력을 만들고(현재 노드 + 상태 → 선택지 목록)
- 선택지 적용(선택 → 상태 변경 → 다음 노드 결정)

2) `core/state`
- 런타임 상태 모델
- 세이브/로드(localStorage)
- import/export(JSON)

3) `content/`
- 에피소드별 JSON 데이터
- (선택) Markdown 텍스트 리소스

4) `ui/`
- 화면 컴포넌트
- 접근성(키보드/스크린리더) 처리

5) `tools/validator`
- 콘텐츠 정적 검증(Node 스크립트)
- 누락 참조, 도달 불가 노드, 엔딩 집계, 조건/효과 타입 체크

---

## 3. 화면(페이지) 스펙

### 3.1 홈/사건 선택 화면
- 에피소드 카드 목록
  - 제목, 한 줄 소개, 발견 엔딩 수/총 엔딩 수
  - “시작”, “엔딩 도감”, “리셋(해당 사건)” 버튼
- 전역 메뉴
  - 설정(텍스트 크기, 애니메이션 감소, 사운드 on/off 등)
  - 데이터 백업(내보내기/가져오기)

### 3.2 플레이 화면
- 상단: 에피소드명, 현재 챕터/장면 제목
- 본문: 텍스트(마크다운 렌더링 가능하면 좋음)
- 선택지 영역:
  - 조건 충족 시 버튼 활성화
  - 조건 미충족 시 비활성화 + 간단 사유(예: “단서: 설탕가루 필요”)
- 보조 패널(접기 가능):
  - 단서 목록, 아이템, 주요 플래그(숨김 가능), 진행 로그(선택)
- 하단:
  - “되돌리기(선택)”(최근 1~3단계) 또는 “새 런”

### 3.3 엔딩 화면
- 엔딩 제목/등급(성공/실패/개그)
- 요약 텍스트(짧고 강렬하게)
- 버튼:
  - “바로 다시하기”
  - “이전 분기로 돌아가기(선택)”
  - “엔딩 도감 보기”
  - “사건 선택”

### 3.4 엔딩 도감 화면
- 엔딩 리스트(발견/미발견)
- 미발견 엔딩은 제목 마스킹(예: “??? : 변호사 고양이의 역습”)
- 힌트 단계별 공개:
  - 힌트1(약한 힌트) / 힌트2(강한 힌트)
- 바로 시작(해당 에피소드로)

---

## 4. 데이터 모델 스펙

### 4.1 런타임 상태(State)
```ts
type GameState = {
  episodeId: string;
  nodeId: string;

  stats: Record<string, number>;         // 예: { hp: 5, wit: 2, nerve: 1 }
  inventory: string[];                   // 아이템
  clues: string[];                       // 단서(추리 핵심)
  flags: Record<string, boolean | number | string>; // 분기 플래그

  endingsFound: Record<string, boolean>; // 에피소드별 엔딩 발견 기록(또는 별도 저장소)
  history: Array<{
    nodeId: string;
    choiceId?: string;
    timestamp: number;
    snapshotHash?: string;               // (선택) 되돌리기/디버그용
  }>;

  rng: { seed: string; step: number };   // (선택) 재현 가능한 난수
};
```

### 4.2 에피소드(Episode) 메타
```ts
type Episode = {
  id: string;
  title: string;
  tagline: string;
  version: string;        // 콘텐츠 버전
  startNodeId: string;
  nodes: Record<string, Node>;
  endings?: Record<string, EndingMeta>;  // (선택) 엔딩 카탈로그
};
```

### 4.3 노드(Node)
```ts
type Node = {
  id: string;
  title?: string;
  body: string;                 // markdown 허용 가능
  imageUrl?: string | null;     // 장면(스크립트) 대표 이미지 URL (nullable)
  tags?: string[];              // "investigation", "interrogation", "ending" 등
  choices: Choice[];

  // 엔딩 노드인 경우
  ending?: {
    id: string;
    kind: "success" | "fail" | "gag";
    title: string;
    summary: string;
    hint1?: string;
    hint2?: string;
  };
};
```

### 4.4 선택지(Choice)
```ts
type Choice = {
  id: string;
  text: string;
  imageUrl?: string | null; // 선택지 보조 이미지 URL (nullable)

  // 다음 노드(기본)
  to?: string;

  // 조건: 충족해야 선택 가능
  cond?: Condition[];

  // 효과: 선택 시 상태 변경
  effects?: Effect[];

  // 판정(선택): 성공/실패 분기
  check?: Check;
  onPass?: Transition;
  onFail?: Transition;

  // UI 보조
  disabledReason?: string; // 조건 미충족 시 표시(자동 생성 가능)
};
```

### 4.8 이미지 URL 필드 규칙
- `Node.imageUrl`, `Choice.imageUrl`는 모두 optional + nullable(`string | null`)로 취급
- 값이 `null` 또는 누락되면 텍스트 전용으로 렌더링
- 값이 문자열이면 `https://` 또는 상대경로(`./assets/...`)를 허용
- 이미지 로드 실패 시 대체 텍스트(또는 기본 플레이스홀더)로 폴백
- validator에서 URL 포맷(프로토콜/상대경로)과 빈 문자열(`""`) 사용 여부를 검사

### 4.5 조건(Condition)
지원 타입(초기 버전):
- `hasItem`, `hasClue`
- `flagEquals`
- `statGte`, `statLte`
- `visitedNode` (특정 노드 방문 여부)
- `endingFound` (특정 엔딩 발견 여부: 해금형 루트에 유용)

```ts
type Condition =
  | { type: "hasItem"; item: string }
  | { type: "hasClue"; clue: string }
  | { type: "flagEquals"; flag: string; value: boolean | number | string }
  | { type: "statGte"; stat: string; value: number }
  | { type: "statLte"; stat: string; value: number }
  | { type: "visitedNode"; nodeId: string }
  | { type: "endingFound"; endingId: string };
```

### 4.6 효과(Effect)
지원 타입(초기 버전):
- `addItem`, `removeItem`
- `addClue`, `removeClue`
- `setFlag`
- `addStat` (HP/신경/눈치 등)
- `goto`(강제 이동. `to`/`transition.to`와 동시 사용 금지)

```ts
type Effect =
  | { type: "addItem"; item: string }
  | { type: "removeItem"; item: string }
  | { type: "addClue"; clue: string }
  | { type: "removeClue"; clue: string }
  | { type: "setFlag"; flag: string; value: boolean | number | string }
  | { type: "addStat"; stat: string; delta: number }
  | { type: "goto"; to: string };
```

### 4.7 판정(Check)
- 시드 기반 RNG를 쓰면 “같은 선택 → 같은 결과” 재현이 가능해집니다(공유/리플레이에 유리).
```ts
type Check = {
  stat: string;   // 예: "wit"
  dc: number;     // 난이도
  roll?: "d6" | "d20" | "coin"; // 기본 d20
  bonusFlag?: string; // (선택) 특정 플래그가 있으면 보너스
};
type Transition = {
  to: string;
  effects?: Effect[];
};
```

---

## 5. 엔진 동작 규칙(알고리즘)

### 5.1 선택지 표시 규칙
- `cond`가 없으면 항상 표시/선택 가능
- `cond`가 있으면 모든 조건을 만족해야 선택 가능
- 조건 미충족 시:
  - 버튼 비활성화
  - `disabledReason`이 있으면 표시, 없으면 엔진이 간단 생성(예: “단서 부족”)

### 5.2 선택 처리
1) 현재 노드의 choice를 선택  
2) `check`가 있으면 RNG로 성공/실패 계산  
3) 성공/실패에 따라 `Transition` 결정(`onPass`/`onFail`, 없으면 `to`)  
4) 효과 적용(선택지 `effects` + transition `effects`)  
5) 다음 노드로 이동  
6) 히스토리 기록 + 자동 저장  
7) 다음 노드가 엔딩이면 엔딩 등록(도감 업데이트)

### 5.3 RNG(선택)
- `seed` + `step` 기반의 간단한 PRNG(xorshift 등) 사용
- seed 생성:
  - 기본: `crypto.getRandomValues`로 생성
  - 데일리 모드: 날짜 문자열(YYYY-MM-DD)을 seed로 사용

---

## 6. 저장/데이터 관리

### 6.1 localStorage 키 설계(예시)
- `cl_caseoflaughs_v1_state_{episodeId}` : 진행 중 런 상태
- `cl_caseoflaughs_v1_endings_{episodeId}` : 엔딩 도감(발견 여부)
- `cl_caseoflaughs_v1_settings` : 설정

### 6.2 백업 내보내기/가져오기
- 내보내기(JSON):
  - settings, endings, (선택) 현재 state 포함
- 가져오기:
  - 버전 검사 후 병합(또는 덮어쓰기)
- 보안:
  - 외부 전송 없음(사용자 로컬 파일 처리)

---

## 7. 콘텐츠 검증(필수)

CI 또는 로컬 스크립트에서 아래를 검사해야 합니다.
- 모든 `to`가 존재하는 노드를 가리키는지
- 모든 노드가 `startNodeId`에서 도달 가능한지(옵션: 경고 수준)
- 선택지 id 중복 여부
- 조건/효과 타입이 지원 목록 내인지
- 엔딩 id 중복 여부 + 총 엔딩 수 집계
- `Node.imageUrl`, `Choice.imageUrl`의 URL 형식 규칙 준수 여부(빈 문자열 금지, `https://` 또는 상대 경로만 허용)
- (선택) “막다른 길” 노드 탐지(choices 0이면서 ending 아님)

---

## 8. 접근성/품질 스펙

### 8.1 접근성
- 모든 버튼/링크 키보드로 조작 가능
- 포커스 스타일 명확
- `aria-live`로 장면 전환 시 스크린리더 안내(과도한 읽기 방지)
- 텍스트 크기 옵션(최소 3단계)
- “애니메이션 줄이기(prefers-reduced-motion)” 존중

### 8.2 성능
- 초기 로드 빠르게:
  - 에피소드 데이터는 필요 시 lazy-load 가능
- 번들/파일 크기 목표(권장):
  - 앱 JS 총량 200KB(gzip) 이내(가능하면)
- 이미지 최소화(텍스트 중심), 폰트는 시스템 폰트 우선

---

## 9. 디렉터리 구조(예시, No-build)

```
/
  index.html
  404.html                  # (선택) non-hash 라우팅 실험 시
  /src
    main.js
    /core
      engine.js
      state.js
      rng.js
    /content
      episode_donut.json
      episodes.json         # 에피소드 인덱스
    /ui
      app.js
      /screens
        home.js
        play.js
        ending.js
        codex.js
      /components
        choice-list.js
        clue-panel.js
    /styles
      base.css
  /tools
    validate-content.mjs
  /docs
    PRD.md
```

---

## 10. 배포 스펙(GitHub Pages, No-build)

### 10.1 기본 배포 방식
- 배포 대상: 루트 정적 파일(`index.html`, `src/`, `styles/`, `content/`)
- 별도 build 산출물(`dist/`) 없이 배포
- GitHub Pages 소스:
  - 옵션 A: `main` 브랜치 `/ (root)`
  - 옵션 B: `gh-pages` 브랜치 루트

### 10.2 GitHub Actions(선택)
- 필수 단계:
  - `node tools/validate-content.mjs`
- 선택 단계:
  - 링크 체크, JSON 스키마 검사
- 산출물 업로드/빌드 단계는 필수가 아님

### 10.3 라우팅
- 단일 페이지 + hash 라우팅 권장(`/#/play`)
- hash 사용 시 새로고침/직접 URL 접근 모두 안전

### 10.4 캐시 전략
- `content` 업데이트 시 `episode.version` 증가
- `localStorage` 로드시 버전 불일치 감지 후 마이그레이션/초기화 분기

---

## 11. 수용 기준(Acceptance Criteria)

MVP 완료 기준:
- 에피소드 1개를 끝까지 플레이 가능
- 조건/효과/판정이 명세대로 동작
- 스크립트(노드)와 선택지에 이미지 URL을 붙여도(또는 비워도) UI/엔진이 정상 동작
- 엔딩 도감이 정상 누적/표시
- 새 런 시작/자동 저장/백업 import/export 정상
- 콘텐츠 검증기가 실패 없이 통과
- GitHub Pages에서 **빌드 없이** 배포/새로고침 포함 정상 동작

---

## 12. 구현 메모(권장)
- 타입 안정성이 필요하면 다음 중 하나를 선택:
  - JSDoc + `tsc --noEmit`만 로컬 품질검사로 사용(배포는 JS)
  - 완전 TS 개발 후, 릴리즈 브랜치에 트랜스파일 결과만 커밋(운영은 no-build)
- 초기 MVP는 “무의존 + 브라우저 기본 API”로 시작하고, 병목이 확인되면 점진적으로 도입
