# 스펙시트: 웃긴 추리 게임북 웹앱 (정적 호스팅 / GitHub Pages)

문서 버전: v0.1  
작성일: 2026-02-26

---

## 1. 기술 개요

### 1.1 요구 조건
- 정적 호스팅(GitHub Pages)에서 동작
- 서버/DB/로그인 없이 플레이 가능
- 상태 저장: 브라우저 로컬(`localStorage`) + 선택적 백업(JSON import/export)
- 짧은 플레이 타임 + 분기 많은 멀티엔딩 지원
- 데이터(스토리) 기반으로 신규 에피소드 추가 가능

### 1.2 권장 스택(예시)
- 빌드: **Vite**
- 언어: **TypeScript**
- UI: React / Preact / Svelte / Vanilla 중 택1  
  - MVP는 **Vanilla + TS** 또는 **Preact**를 권장(번들 가볍게)
- 라우팅: 단일 페이지 + **Hash 라우팅**(GitHub Pages 새로고침 404 회피)
- 테스트: Vitest(선택), 또는 Node 기반 검증 스크립트

> 프레임워크는 자유이나, “엔진(core)과 콘텐츠(data)를 분리”하는 아키텍처는 고정 권장입니다.

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
- 콘텐츠 정적 검증(빌드/CI에서 실행)
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
- `goto`(강제 이동을 효과로 처리할지 여부는 취향. 권장은 transition로 처리)

```ts
type Effect =
  | { type: "addItem"; item: string }
  | { type: "removeItem"; item: string }
  | { type: "addClue"; clue: string }
  | { type: "removeClue"; clue: string }
  | { type: "setFlag"; flag: string; value: boolean | number | string }
  | { type: "addStat"; stat: string; delta: number }
  | { type: "goto"; to: string }; // 사용 시 choice.to/transition.to와 중복되지 않도록 규칙화 권장
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

CI에서 아래를 검사해야 합니다.
- 모든 `to`가 존재하는 노드를 가리키는지
- 모든 노드가 `startNodeId`에서 도달 가능한지(옵션: 경고 수준)
- 선택지 id 중복 여부
- 조건/효과 타입이 지원 목록 내인지
- 엔딩 id 중복 여부 + 총 엔딩 수 집계
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
- 번들 크기 목표(권장):
  - 엔진+UI 200KB(gzip) 이내(가능하면)
- 이미지 최소화(텍스트 중심), 폰트는 시스템 폰트 우선

---

## 9. 디렉터리 구조(예시)

```
/src
  /core
    engine.ts
    state.ts
    rng.ts
    validator.ts
  /content
    episode_donut.json
    episode_donut.meta.json (선택)
  /ui
    App.tsx
    screens/
      Home.tsx
      Play.tsx
      Ending.tsx
      Codex.tsx
    components/
      ChoiceList.tsx
      CluePanel.tsx
  /styles
    base.css
/index.html
/vite.config.ts
```

---

## 10. 배포 스펙(GitHub Pages)

- 빌드 산출물: `dist/`
- GitHub Actions로
  - `npm ci`
  - `npm run test`(validator 포함)
  - `npm run build`
  - Pages에 `dist` 배포
- 라우팅:
  - 단일 페이지 + hash 라우팅 권장(`/#/play`)
  - 또는 404.html 트릭 사용(선택)

---

## 11. 수용 기준(Acceptance Criteria)

MVP 완료 기준:
- 에피소드 1개를 끝까지 플레이 가능
- 조건/효과/판정이 명세대로 동작
- 엔딩 도감이 정상 누적/표시
- 새 런 시작/자동 저장/백업 import/export 정상
- 콘텐츠 검증기가 실패 없이 통과
- GitHub Pages에서 새로고침 포함 정상 동작
