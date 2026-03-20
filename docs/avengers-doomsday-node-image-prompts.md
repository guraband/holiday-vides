# Avengers Doomsday node image prompts

이 문서는 `src/content/episode_avengers_doomsday.json`의 각 node를 기준으로, ComfyUI에서 `z-image turbo` 모델로 바로 사용할 수 있도록 장면별 이미지 프롬프트를 정리한 문서다. 프롬프트는 모델 호환성을 고려해 영어 중심으로 작성했고, 노드의 분위기와 서사를 유지하기 위해 핵심 소품·배경·감정선을 함께 포함했다.

## Recommended global settings

- **Model**: z-image turbo
- **Aspect ratio**: 16:9
- **Prompt style**: cinematic comic-book realism, high detail, dramatic lighting, clean composition
- **Character consistency tip**: keep recurring descriptors stable across scenes, e.g. `Sam Wilson in modern Captain America suit`, `Doctor Strange with red cloak`, `Thor with long hair and armor`, `Bruce Banner in smart casual science gear`, `Doctor Doom in regal green cloak and metal armor`
- **Useful base negative prompt**: `lowres, blurry, deformed hands, bad anatomy, extra fingers, duplicate character, cropped face, unreadable text, watermark, logo, overexposed, underexposed, messy composition`

---

## 1. `start`
- **Scene title**: 어벤져스 타워 긴급 브리핑
- **Scene intent**: 둠스데이 위협이 처음 제시되는 팀 브리핑 장면. 긴장감 속에서도 어벤져스 특유의 산만한 코미디가 살아 있어야 한다.
- **Prompt**:
  ```
  Avengers Tower briefing room, Sam Wilson leading an urgent team meeting, Doctor Strange projecting a glowing red magical screen with the words DOOMSDAY PROTOCOL, Thor casually eating snacks at the conference table, Bruce Banner explaining a multiverse collapse threat, futuristic holo displays, tense but slightly comedic team dynamics, cinematic comic-book realism, dramatic rim light, wide shot, high detail, polished Marvel-inspired atmosphere
  ```
- **Optional negative prompt**:
  ```
  lowres, blurry, crowd confusion, extra limbs, duplicate heroes, unreadable interface, flat lighting, watermark
  ```

## 2. `briefing`
- **Scene title**: 브리핑: 둠의 계획은 너무 꼼꼼하다
- **Scene intent**: 둠의 삼중 계획이 설명되는 분석 브리핑 장면. 전략 지도가 명확하게 보이는 정보성 컷이 좋다.
- **Prompt**:
  ```
  high-tech Avengers briefing room, Doctor Strange presenting a three-part plan on layered holographic displays, portals, TVA documents, and lunar barrier schematics visualized around him, Sam Wilson watching seriously, Peter Parker reacting with nervous humor, sharp blue and red interface glow, cinematic comic-book realism, strategic war-room composition, medium wide shot, high detail
  ```
- **Optional negative prompt**:
  ```
  blurry holograms, cluttered screen, unreadable diagrams, distorted faces, bad anatomy, low detail
  ```

## 3. `sanctum`
- **Scene title**: 생텀의 포탈 잔향실
- **Scene intent**: 생텀의 마법 흔적과 서류 섬유, 라트베리아 금속 문양이 섞인 미스터리 조사 장면.
- **Prompt**:
  ```
  Sanctum Sanctorum chamber filled with fading circular portal residue glowing on scorched walls, Wong examining magically rearranged runes, Doctor Strange style arcane geometry mixed with Latverian metal engravings and tiny paper fibers floating in the air, mystical detective atmosphere, gold and teal magic light, cinematic comic-book realism, detailed environment, mysterious mood
  ```
- **Optional negative prompt**:
  ```
  generic wizard room, muddy lighting, low detail runes, messy background, blurry particles
  ```

## 4. `snack-table`
- **Scene title**: 회의실 간식 테이블
- **Scene intent**: 우스운 분위기 속에 핵심 단서가 발견되는 장면. 먹다 남은 간식과 둠의 백업 연설 칩이 포인트다.
- **Prompt**:
  ```
  Avengers conference snack table in chaotic aftermath, crushed muffins and spilled snacks, Thor nearby with unapologetic confidence, a half-burned metal fragment and a small data chip engraved DOOMSDAY BACKUP SPEECH v12 revealed under the crumbs, comedic clue discovery, warm indoor lighting, cinematic comic-book realism, close-up with character presence, high detail props
  ```
- **Optional negative prompt**:
  ```
  gross food mess, unreadable chip, blurry close-up, extra hands, distorted objects
  ```

## 5. `tva-archive`
- **Scene title**: TVA 아카이브 복도
- **Scene intent**: 시간 관료주의와 둠의 문서 위조 흔적이 공존하는 TVA 복도. 로키의 존재감도 어울린다.
- **Prompt**:
  ```
  TVA archive corridor with endless retro-futuristic filing cabinets, suspicious paperwork drawers, timeline stamps and official forms, Loki observing with amused intelligence, Peter Parker confused by the bureaucracy, subtle signs of forged records and a folder labeled meeting minutes draft, yellow industrial lighting, cinematic comic-book realism, bureaucratic sci-fi mystery, high detail
  ```
- **Optional negative prompt**:
  ```
  empty hallway, modern office look, blurry cabinets, unreadable folders, poor perspective
  ```

## 6. `moon-base`
- **Scene title**: 블루문 기지 연구실
- **Scene intent**: 리드 리처즈의 연구실에서 반쯤 잘린 차원 배리어 도식을 조사하는 SF 추리 장면.
- **Prompt**:
  ```
  futuristic Blue Moon base laboratory, Reed Richards standing beside a partially corrupted holographic barrier schematic, missing key values highlighted in the projection, sleek lunar research architecture, advanced consoles, cosmic blue light through reinforced windows, brilliant scientific mystery mood, cinematic comic-book realism, clean sci-fi composition, high detail
  ```
- **Optional negative prompt**:
  ```
  generic spaceship interior, blurry hologram, low detail lab, broken perspective, bad hands
  ```

## 7. `latveria-gate`
- **Scene title**: 라트베리아 성 외곽
- **Scene intent**: 압도적인 성문, 예의 바른 드론, 마법과 행정이 결합된 둠의 브랜딩이 드러나는 외곽 침투 장면.
- **Prompt**:
  ```
  exterior of Castle Doom in Latveria, towering gothic fortress walls with arcane portal symbols embedded in the stone, polite security drones hovering near the gate, power cores marked with bureaucratic identification codes, stormy sky, ominous but strangely refined atmosphere, cinematic comic-book realism, epic wide shot, high detail, green and steel color palette
  ```
- **Optional negative prompt**:
  ```
  fantasy castle only, cute drones, flat daylight, low detail stonework, cluttered layout
  ```

## 8. `doom-throne`
- **Scene title**: 둠의 왕좌실
- **Scene intent**: 닥터 둠이 직접 등장하는 핵심 대면 장면. 장엄함과 설득력, 그리고 위험한 통제 욕망이 동시에 보여야 한다.
- **Prompt**:
  ```
  Doctor Doom seated on an imposing throne inside a vast royal-tech chamber, green cloak and metal armor, calm authoritarian posture, holographic framework behind him showing a reality-stabilizing machine and a permanent rule system, heroes confronting him in the foreground, regal lighting, cinematic comic-book realism, dramatic symmetry, high detail, intimidating and intelligent villain presence
  ```
- **Optional negative prompt**:
  ```
  cartoon villain, goofy armor, low detail throne room, distorted mask, unreadable holograms
  ```

## 9. `deduction-1`
- **Scene title**: 중간 추리 1: 둠은 너무 준비되어 있다
- **Scene intent**: 단서들이 한데 엮이며 둠의 계획이 단순 침공이 아니라는 사실을 깨닫는 분석 몽타주 장면.
- **Prompt**:
  ```
  investigative montage of Avengers clues on a floating holographic board, portal residue, snack table metal fragment, briefing documents, red string style visual logic connecting every clue to Doctor Doom, Sam Wilson and Bruce Banner studying the pattern, tense realization, cinematic comic-book realism, detective board energy, medium wide shot, high detail
  ```
- **Optional negative prompt**:
  ```
  random collage, unreadable clues, messy composition, low contrast, blurry faces
  ```

## 10. `deduction-2`
- **Scene title**: 중간 추리 2: 행정과 마법과 공학의 삼중주
- **Scene intent**: TVA 문서, 생텀 마법, 블루문 공학이 하나의 체계로 연결되는 순간의 개념적 장면.
- **Prompt**:
  ```
  conceptual cinematic scene showing three systems merging: TVA documents, Sanctum portal magic, and Blue Moon barrier engineering, layered around the Avengers as a unified operating structure of the multiverse, Sam Wilson uneasy, Bruce Banner intellectually alarmed, glowing papers, runes, and schematics interwoven, comic-book realism, high detail, dynamic composition
  ```
- **Optional negative prompt**:
  ```
  abstract blur, unreadable components, low detail, chaotic layering, muddy colors
  ```

## 11. `deduction-3`
- **Scene title**: 중간 추리 3: 둠스데이는 파괴보다 설득이다
- **Scene intent**: 둠의 계획이 단순 파괴가 아니라 통제와 구조조정이라는 본질을 드러내는 철학적 장면.
- **Prompt**:
  ```
  symbolic multiverse control scene, Doctor Doom framed like a cosmic administrator rather than a destroyer, fractured realities being organized into orderly grids instead of exploding, authoritarian beauty mixed with danger, uneasy moral tension, cinematic comic-book realism, surreal but readable composition, high detail, dark majestic lighting
  ```
- **Optional negative prompt**:
  ```
  pure explosion scene, generic apocalypse, low detail cosmos, confusing abstraction, washed colors
  ```

## 12. `final-lock`
- **Scene title**: 최종 잠금 해제
- **Scene intent**: 모든 추리가 완성되고 최종 선택 직전의 클라이맥스. 자유와 통제의 대비가 중요하다.
- **Prompt**:
  ```
  climactic chamber with a multiverse sealing device activating, forged TVA legitimacy, Sanctum portal access patterns, and Blue Moon barrier keys all converging into one machine, Avengers facing the mechanism at the decisive moment, freedom versus control theme, intense cinematic lighting, comic-book realism, epic scale, high detail, dramatic final confrontation energy
  ```
- **Optional negative prompt**:
  ```
  generic machine room, low scale, blurry device, flat staging, unreadable effects
  ```

## 13. `gag-assembly`
- **Scene title**: 브리핑 12초 만의 파국
- **Scene intent**: 브리핑이 시작도 전에 망가지는 코믹 팀 장면. 어수선하지만 캐릭터 표정은 잘 살아야 한다.
- **Prompt**:
  ```
  comedic Avengers team meeting collapsing into chaos almost instantly, one hero launching into an emotional speech too early, Sam Wilson frustrated, Bruce Banner trying to restore order, Thor clapping enthusiastically, Peter Parker whispering in confusion, half-finished holographic briefing in the background, cinematic comic-book realism, expressive faces, dynamic comedy composition, high detail
  ```
- **Optional negative prompt**:
  ```
  slapstick exaggeration, blurry crowd, distorted expressions, low detail room, cluttered framing
  ```

## 14. `gag-drone`
- **Scene title**: 예의 바른 드론의 역습
- **Scene intent**: 해킹 실패 후 정중한 경고를 받는 민망한 코미디 장면. 라트베리아의 품격 있는 조롱이 포인트다.
- **Prompt**:
  ```
  outside Castle Doom, a sleek Latverian security drone politely scolding the heroes after a failed hack, a glowing banner reading rude visitor detected on the fortress wall, Thor amused and taking a photo, embarrassed team reaction, refined villain technology with comedic humiliation, cinematic comic-book realism, high detail, crisp night lighting
  ```
- **Optional negative prompt**:
  ```
  silly cartoon drone, unreadable banner, blurry characters, low detail fortress, chaotic perspective
  ```

## 15. `gag-lunch`
- **Scene title**: 점심시간의 승리
- **Scene intent**: 전술 회의가 샌드위치 토론으로 바뀌는 유쾌한 휴식 장면. 전투 전 사기가 올라가는 분위기면 좋다.
- **Prompt**:
  ```
  Avengers war room transformed into an absurd sandwich strategy debate, Thor enthusiastically championing the lunch plan, heroes gathered around a table comparing ridiculous sandwich combinations Doctor Doom would hate, laughter and relief before battle, warm light, cinematic comic-book realism, team chemistry, high detail, lighthearted heroic mood
  ```
- **Optional negative prompt**:
  ```
  gross food focus, low detail faces, messy clutter, childish cartoon style, blurry table
  ```

## 16. `ending-truth`
- **Scene title**: 정답 엔딩
- **Scene intent**: 장치를 완전히 파괴하지 않고 지배 권한만 반전시키는 가장 이상적인 승리 장면. 지적 승리와 안도감이 핵심이다.
- **Prompt**:
  ```
  triumphant final scene in Doctor Doom's chamber, the reality-collapse machine reconfigured rather than destroyed, Sue Storm's inverse barrier energy, Reed Richards' missing keys, Sanctum rune patterns, and TVA forgery evidence woven together to reverse control authority, Doctor Doom stunned into silence, Avengers preparing to withdraw, cinematic comic-book realism, intelligent victory, glowing controlled energy, high detail
  ```
- **Optional negative prompt**:
  ```
  explosion-only ending, low detail machine, goofy expressions, blurry energy effects, overexposed light
  ```

## 17. `ending-bittersweet`
- **Scene title**: 비터스위트 엔딩
- **Scene intent**: 완전한 승리는 아니지만 모두가 살아남는 후퇴 장면. 영웅적이되 약간 쓸쓸해야 한다.
- **Prompt**:
  ```
  bittersweet retreat scene, Doctor Strange and Sue Storm delaying the core device while Sam Wilson leads civilians from unstable dimensional portals, Doctor Doom withdrawing in the distance with controlled menace, exhausted heroes illuminated by damaged machinery and fading portal light, cinematic comic-book realism, emotional aftermath, high detail, heroic but melancholic tone
  ```
- **Optional negative prompt**:
  ```
  total victory celebration, bright cheerful ending, blurry civilians, messy action blur, low detail environment
  ```

## 18. `ending-almost`
- **Scene title**: 아슬아슬 엔딩
- **Scene intent**: 거의 성공했지만 한 박자 늦은 불완전한 승부. 남은 위기와 다음 라운드의 예감이 필요하다.
- **Prompt**:
  ```
  unstable near-victory in the multiverse chamber, the machine half-reversed and half-active, realities only partially stabilized, Doctor Doom escaping through the opening with quiet confidence, Sam Wilson disappointed but steady, Loki observing with ambiguous amusement, cinematic comic-book realism, unresolved tension, high detail, fractured energy effects
  ```
- **Optional negative prompt**:
  ```
  complete defeat scene, pure explosion, blurry escape figure, low detail energy cracks, flat mood
  ```

## 19. `ending-punch`
- **Scene title**: 오판 엔딩
- **Scene intent**: 멋진 한 방이 오히려 상황을 꼬이게 만든 장면. 액션과 코미디가 동시에 살아야 한다.
- **Prompt**:
  ```
  dramatic action scene where a powerful punch hits Doctor Doom's device, triggering an emergency lockdown across all dimensions, bold cinematic impact frozen at the worst possible moment, Wong staring in long silent disappointment, sealed portals and warning lights everywhere, comic-book realism, trailer-worthy action with ironic consequences, high detail
  ```
- **Optional negative prompt**:
  ```
  generic fistfight, low detail impact, blurry Wong, unreadable warning lights, messy composition
  ```

## 20. `ending-gag`
- **Scene title**: 개그 엔딩
- **Scene intent**: 완벽한 전략 대신 엉킨 일정표와 샌드위치 토론으로 기억되는 팀 개그 엔딩. 가볍지만 따뜻한 팀 분위기.
- **Prompt**:
  ```
  humorous ensemble aftermath in Avengers headquarters, team members laughing after a chaotic mission, one hero embarrassed by a polite drone incident, another still talking about lunch strategy, Thor more invested in sandwich combinations than tactics, Bruce Banner observing the team dynamic with dry amusement, cinematic comic-book realism, warm closure, high detail, playful but heartfelt tone
  ```
- **Optional negative prompt**:
  ```
  grim ending, low detail group shot, blurry faces, random background clutter, flat lighting
  ```
