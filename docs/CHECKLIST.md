# 콘텐츠/구현 체크리스트

## 이미지 URL(nullable) 확장
- [ ] `Node.imageUrl?: string | null` 필드를 지원한다.
- [ ] `Choice.imageUrl?: string | null` 필드를 지원한다.
- [ ] `imageUrl`이 누락되거나 `null`이어도 렌더링이 깨지지 않는다.
- [ ] `imageUrl`이 `""`(빈 문자열)인 경우 validator가 에러를 낸다.
- [ ] `imageUrl`이 문자열일 때 `https://` 또는 상대경로만 허용한다.
- [ ] 이미지 로드 실패 시 대체 UI(alt/placeholder)를 보여준다.

## 검증/품질
- [ ] 콘텐츠 validator가 `Node.imageUrl`, `Choice.imageUrl` 규칙을 검사한다.
- [ ] CI에서 validator 실행 시 이미지 URL 규칙 위반을 실패로 처리한다.
- [ ] 기존 이미지 없는 에피소드 데이터와 하위 호환된다.
