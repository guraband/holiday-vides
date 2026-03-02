# Holiday Vides

GitHub Pages에 바로 배포 가능한 **No-build 인터랙티브 추리 게임북 웹앱**입니다.  
브라우저 네이티브 ESM + 해시 라우팅 기반으로 동작하며, 콘텐츠(JSON)만 추가해 에피소드를 확장할 수 있습니다.

## 개발 진행 상황 점검
문서 기준 현재 진행 상태는 다음과 같습니다.

- `docs/development-checklist.md`의 **Phase 1~5 전 항목이 체크 완료** 상태입니다.
- 구현/운영 핵심 축(엔진, 상태 저장, 조건/효과/판정, 접근성, validator, 배포 문서화)이 모두 반영되어 있습니다.
- 현재 샘플 에피소드(`donut-case`)는 콘텐츠 validator를 통과하며, 로컬에서 즉시 플레이 가능한 상태입니다.

> 참고: 상세 요구사항은 `docs/PRD.md`, 운영 절차는 `docs/deployment-guide.md`, 콘텐츠 작성 방법은 `docs/episode-authoring-guide.md`를 확인하세요.

## 주요 기능
- 해시 라우팅 기반 단일 페이지 플레이(`/#/`, `/#/play/:episodeId`)
- 데이터 기반 에피소드 로딩(`src/content/*.json`)
- 분기/조건/효과/판정(Check) 엔진
- 로컬 저장소 기반 진행 상태 저장/불러오기
- 엔딩 도감 누적, 설정 저장, JSON 백업/복구
- 콘텐츠 무결성 검사 스크립트(`tools/validate-content.mjs`)

## 프로젝트 구조
```text
.
├─ index.html
├─ src/
│  ├─ main.js
│  ├─ ui/
│  ├─ core/
│  ├─ content/
│  └─ styles/
├─ docs/
│  ├─ PRD.md
│  ├─ development-checklist.md
│  ├─ deployment-guide.md
│  └─ episode-authoring-guide.md
└─ tools/
   └─ validate-content.mjs
```

## 로컬 실행 방법
빌드가 필요 없습니다. 정적 서버로 열어 확인하세요.

```bash
# 예시 1) Python
python3 -m http.server 8080

# 예시 2) Node (serve가 설치된 경우)
npx serve .
```

브라우저에서 `http://localhost:8080`(또는 serve가 안내한 포트)로 접속합니다.

## 콘텐츠 검증
에피소드 추가/수정 시 아래 명령을 반드시 실행하세요.

```bash
node tools/validate-content.mjs
```


## GitHub Actions (콘텐츠 검증)
저장소에는 `Validate Content` 워크플로우가 포함되어 있으며, 아래 이벤트에서 실행됩니다.

- 모든 브랜치로의 `push`
- 모든 `pull_request`
- 수동 실행(`workflow_dispatch`)

로컬에서 동일한 검증을 먼저 수행하려면 아래 명령을 실행하세요.

```bash
node tools/validate-content.mjs
```

## 문서 바로가기
- 제품/기술 요구사항: `docs/PRD.md`
- 개발 단계 체크리스트: `docs/development-checklist.md`
- 배포 가이드: `docs/deployment-guide.md`
- 에피소드 작성 가이드: `docs/episode-authoring-guide.md`

## 배포
`main` 브랜치 루트를 GitHub Pages로 배포하면 됩니다.
상세 절차는 `docs/deployment-guide.md`를 따릅니다.
