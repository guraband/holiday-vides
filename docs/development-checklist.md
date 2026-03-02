# 개발 체크리스트 (통합)

## 개요
- 목표: PRD 기준으로 GitHub Pages No-build 웹앱을 단계적으로 완성
- 방식: 구현 순서에 맞춰 Phase를 재구성하고, 각 항목을 해당 Phase에 배치해 관리

## Phase 1 — 프로젝트 골격 & 플레이 가능한 최소 루프(Minimum Playable Slice)
목표: 빌드 없이 실행 가능한 앱 껍데기와 샘플 에피소드 1개를 로컬에서 플레이 가능하게 만든다.

체크리스트:
- [x] No-build 구조의 파일/폴더 스캐폴딩 (`index.html`, `src/*`)
- [x] 해시 라우팅 기반 단일 페이지 진입/화면 전환(`/#/`, `/#/play/:episodeId`)
- [x] 샘플 에피소드 인덱스/본편 JSON 작성
- [x] 기본 엔진 로직(노드 조회, 선택지 이동, 엔딩 감지) 구현
- [x] 홈/플레이/엔딩 최소 UI 구현
- [x] 기본 스타일 적용(가독성/버튼/레이아웃)
- [x] 콘텐츠 검증기 초안(`tools/validate-content.mjs`) 추가

완료 기준:
- 홈에서 샘플 에피소드 시작 가능
- 최소 1개 엔딩까지 도달 가능
- 콘텐츠 검증 스크립트가 샘플 데이터 통과

## Phase 2 — 콘텐츠 모델 확장 (imageUrl nullable)
목표: 이미지 필드를 안전하게 확장하고, 기존 데이터와의 호환성을 보장한다.

체크리스트:
- [x] `Node.imageUrl?: string | null` 필드를 지원한다.
- [x] `Choice.imageUrl?: string | null` 필드를 지원한다.
- [x] `imageUrl`이 누락되거나 `null`이어도 렌더링이 깨지지 않는다.
- [x] 이미지 로드 실패 시 대체 UI(alt/placeholder)를 보여준다.
- [x] 기존 이미지 없는 에피소드 데이터와 하위 호환된다.

## Phase 3 — 상태 저장/도감/설정
목표: 실제 플레이 지속성을 제공한다.

체크리스트:
- [x] `core/state`에 세이브/로드(localStorage) 구현
- [x] 엔딩 도감 누적 및 마스킹/힌트 UI 구현
- [x] 텍스트 크기/애니메이션 감소 등 설정 저장
- [x] JSON import/export(백업/복구) 구현
- [x] 버전 불일치 처리(초기화/마이그레이션 전략)
- [x] 히스토리(되돌리기 1~3단계) 구현

## Phase 4 — 조건/효과/판정 시스템 확장
목표: PRD의 분기 규칙을 본격 지원한다.

체크리스트:
- [x] Condition 타입 전체 지원
- [x] Effect 타입 전체 지원
- [x] Check(주사위/코인) + seed RNG 구현
- [x] 선택지 비활성화 사유 자동 생성

## Phase 5 — 검증/접근성/배포 자동화
목표: 운영 가능한 수준의 품질 보증과 배포 안정성을 확보한다.

체크리스트:
- [x] 콘텐츠 validator가 `Node.imageUrl`, `Choice.imageUrl` 규칙을 검사한다.
- [x] `imageUrl`이 `""`(빈 문자열)인 경우 validator가 에러를 낸다.
- [x] `imageUrl`이 문자열일 때 `https://`로 시작하거나, `./` 또는 `../`로 시작하는 상대경로만 허용한다.
- [x] validator에 도달 불가 노드/중복 id/막다른 길 검증 강화
- [x] CI에서 validator 실행 시 이미지 URL 규칙 위반을 실패로 처리한다.
- [x] GitHub Actions에서 validator 실행
- [x] 키보드 포커스/aria-live/reduced-motion 대응
- [ ] 배포 문서화(GitHub Pages 설정, 릴리즈 절차)
- [ ] 에피소드 추가 가이드 문서화
