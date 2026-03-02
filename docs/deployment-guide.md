# 배포 가이드 (GitHub Pages)

이 프로젝트는 **No-build 정적 웹앱**이므로, 저장소의 루트 파일(`index.html`, `src/*`)을 그대로 GitHub Pages로 배포합니다.

## 1) 사전 준비
- 기본 브랜치: `main`(또는 `master`)
- 루트에 `index.html` 존재
- 콘텐츠 검증 통과

```bash
node tools/validate-content.mjs
```

## 2) GitHub Pages 설정
1. GitHub 저장소에서 **Settings → Pages** 이동
2. **Build and deployment**에서 아래처럼 설정
   - Source: **Deploy from a branch**
   - Branch: **main** (또는 운영 브랜치)
   - Folder: `/(root)`
3. Save 후 배포 URL 생성 대기

> 이 프로젝트는 해시 라우팅(`/#/...`)을 사용하므로 Pages의 404 재작성 없이도 라우팅이 동작합니다.

## 3) 배포 전 체크리스트
- [ ] `node tools/validate-content.mjs` 통과
- [ ] 로컬에서 홈 → 플레이 → 엔딩 흐름 수동 확인
- [ ] 신규/수정 에피소드 JSON이 validator 경고 없이 통과
- [ ] 접근성 핵심 동작(키보드 포커스 이동, `aria-live`) 확인

## 4) GitHub Actions 실행/확인
- 워크플로우 파일: `.github/workflows/validate-content.yml`
- 트리거
  - 모든 브랜치 `push`
  - 모든 `pull_request`
  - 수동 실행(`Actions → Validate Content → Run workflow`)
- 확인 방법
  1. GitHub 저장소의 **Actions** 탭 이동
  2. 좌측에서 **Validate Content** 선택
  3. 최신 실행이 `success`인지 확인

## 5) 릴리즈 절차(권장)
1. 기능 브랜치에서 작업
2. 로컬 검증 실행
   ```bash
   node tools/validate-content.mjs
   ```
3. PR 생성 및 리뷰 반영
4. 기본 브랜치 머지
5. GitHub Actions `Validate Content` 성공 확인
6. Pages 배포 URL에서 최종 스모크 테스트

## 6) 장애 대응
- 배포 후 화면이 비는 경우
  - 브라우저 콘솔 오류 확인
  - `index.html`의 모듈 경로가 상대경로(`./src/main.js`)인지 확인
- 특정 에피소드가 열리지 않는 경우
  - `src/content/episodes.json`의 `file` 경로 확인
  - `tools/validate-content.mjs` 재실행
- 캐시 이슈가 의심되는 경우
  - 강력 새로고침(Ctrl/Cmd + Shift + R)
