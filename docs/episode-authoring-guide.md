# 에피소드 추가 가이드

이 문서는 `src/content`에 신규 에피소드를 안전하게 추가하는 절차를 설명합니다.

## 1) 파일 구성
- 에피소드 인덱스: `src/content/episodes.json`
- 에피소드 본문: `src/content/episode_<id>.json` (권장 네이밍)

## 2) 등록 순서
1. `src/content`에 새 JSON 파일 생성
2. `episodes.json`에 메타 항목 추가
3. validator 실행으로 참조/스키마 검증

```bash
node tools/validate-content.mjs
```

## 3) 메타(episodes.json) 예시
```json
{
  "id": "mystery_cafe",
  "title": "카페의 사라진 영수증",
  "tagline": "사소한 단서가 사건을 뒤집는다",
  "file": "./episode_mystery_cafe.json"
}
```

- `id`: 전체 에피소드에서 유일해야 함
- `file`: `episodes.json` 기준 상대경로

## 4) 에피소드 본문 최소 예시
```json
{
  "id": "mystery_cafe",
  "title": "카페의 사라진 영수증",
  "tagline": "사소한 단서가 사건을 뒤집는다",
  "version": "1.0.0",
  "startNodeId": "start",
  "nodes": {
    "start": {
      "id": "start",
      "title": "사건 시작",
      "body": "카운터에서 영수증이 사라졌다.",
      "choices": [
        { "id": "c1", "text": "주방을 확인한다", "to": "kitchen" },
        { "id": "c2", "text": "바로 결론을 낸다", "to": "bad_end" }
      ]
    },
    "kitchen": {
      "id": "kitchen",
      "body": "설탕가루가 바닥에 흩어져 있다.",
      "choices": [
        {
          "id": "c3",
          "text": "단서를 확보한다",
          "effects": [{ "type": "addClue", "clue": "sugar_trace" }],
          "to": "good_end"
        }
      ]
    },
    "good_end": {
      "id": "good_end",
      "body": "단서로 범인을 특정했다.",
      "choices": [],
      "ending": {
        "id": "ending_good",
        "kind": "success",
        "title": "달콤한 역전",
        "summary": "설탕가루 단서로 사건 해결"
      }
    },
    "bad_end": {
      "id": "bad_end",
      "body": "성급한 추리로 사건을 망쳤다.",
      "choices": [],
      "ending": {
        "id": "ending_bad",
        "kind": "fail",
        "title": "성급한 결론",
        "summary": "단서 없이 결론을 내려 실패"
      }
    }
  }
}
```

## 5) 작성 규칙 요약
- 모든 `node.id`는 에피소드 내에서 유일
- 모든 `choice.to` / `onPass.to` / `onFail.to`는 존재하는 노드를 참조
- 엔딩 노드는 `ending.id`를 유일하게 유지
- `imageUrl` 규칙
  - 허용: `https://...`, `./...`, `../...`, `null`, 생략
  - 금지: 빈 문자열 `""`

## 6) 품질 점검 루틴
1. validator 실행
2. 실제 플레이로 분기 점검
   - 최소 1개 성공 엔딩 도달
   - 실패/개그 엔딩 포함 시 각각 도달 확인
3. 접근성 확인
   - 키보드만으로 선택지 이동/선택 가능 여부

## 7) 자주 발생하는 실수
- `episodes.json`에는 등록했지만 실제 파일명이 다른 경우
- 노드 이름 변경 후 선택지 참조를 갱신하지 않은 경우
- 엔딩 노드인데 `choices`를 비우지 않아 의도치 않은 진행이 생기는 경우
