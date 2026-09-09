# Vampire Survivors Style 2D Auto-Shooter — Development Plan

## 1. Goal

HTML + JavaScript로 **뱀파이어 서바이벌 느낌의 2D 자동 슈터**를 만든다.

포함 기능만 구현한다:

1. 플레이어 이동
2. 적 출현 + 적 이동
3. 적을 향한 무기 자동 발사
4. 경험치 아이템 드롭
5. 레벨업 시스템
6. 간단한 UI

---

## 2. Tech Stack

| 항목 | 선택 |
|------|------|
| 렌더링 | HTML5 Canvas |
| 로직 | Vanilla JavaScript |
| 스타일 | CSS (HUD / 패널용 최소) |

### 파일 구조

```
/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── main.js         # 진입점, 게임 루프
│   ├── input.js        # 키보드 입력
│   ├── player.js       # 이동, HP, 스탯
│   ├── enemy.js        # 스폰, 추적 이동
│   ├── weapon.js       # 자동 발사
│   ├── projectile.js   # 총알
│   ├── xp.js           # 경험치 드롭 / 흡수 / 레벨업
│   ├── collision.js    # 충돌
│   ├── ui.js           # HUD, 레벨업 패널
│   └── utils.js        # 보조 함수
└── PLAN.md
```

---

## 3. Core Loop

```
플레이 시작
    ↓
이동(WASD) + 가까운 적에게 자동 발사
    ↓
적 처치 → 경험치 아이템 드롭 → 흡수
    ↓
경험치 충족 → 레벨업 (강화 선택)
    ↓
HP 0 → 게임 오버 → 재시작
```

---

## 4. Feature Spec

### 4.1 플레이어 이동

- `WASD` / 방향키로 이동
- 스탯: `hp`, `moveSpeed`, `pickupRadius`
- 적과 닿으면 피해 (짧은 무적 시간)

### 4.2 적 출현 / 이동

- 화면 바깥에서 주기적으로 스폰
- 플레이어 위치를 향해 직선 이동
- 적 종류는 **1종**만
- 처치 시 경험치 아이템 드롭

### 4.3 무기 자동 발사

- 가장 가까운 적을 향해 자동 발사
- 파라미터: `damage`, `cooldown`, `projectileSpeed`
- 무기 종류는 **1종**만

### 4.4 경험치 아이템 드롭

- 적 사망 위치에 XP 젬 생성
- 플레이어 `pickupRadius` 안에 들어오면 흡수
- 흡수한 XP를 누적

### 4.5 레벨업 시스템

- `xp >= xpToNext`이면 레벨업
- 게임 잠시 멈추고 강화 선택지 **3개** 표시
- 선택지 예시:
  - 공격력 증가
  - 공격 속도 증가
  - 이동 속도 증가
  - 최대 HP 증가
- 선택 후 플레이 재개, 다음 레벨 필요 XP 증가

### 4.6 간단한 UI

| 화면 | 내용 |
|------|------|
| 시작 | 제목 + Start 버튼 |
| 플레이 중 | HP, Level, XP 바, 킬 수 |
| 레벨업 | 선택 카드 3장 |
| 게임 오버 | 결과 요약 + Retry |

조작:

- 이동: `WASD` / Arrow
- 레벨업 선택: 클릭 또는 `1` `2` `3`

---

## 5. Systems (구현 순서용)

### Game Loop

`requestAnimationFrame` + `dt`  
순서: Input → Update → Collision → Spawn → Render → UI

### Collision

원-원 충돌만 사용

- 총알 ↔ 적 → 데미지 / 적 사망
- 적 ↔ 플레이어 → HP 감소
- 플레이어 ↔ XP → 흡수

### Camera

플레이어를 화면 중심에 두고 월드를 스크롤  
배경은 간단한 그리드로 충분

---

## 6. Implementation Checklist

### Phase 1 — 이동
- [x] 캔버스 / 게임 루프
- [x] 플레이어 이동
- [x] 카메라 추적
- [x] 시작 UI

### Phase 2 — 적
- [x] 적 스폰 (화면 밖)
- [x] 플레이어 추적 이동
- [x] 적-플레이어 충돌 / HP / 게임 오버

### Phase 3 — 자동 발사
- [x] 가장 가까운 적 탐색
- [x] 쿨다운 기반 자동 발사
- [x] 총알-적 충돌 / 처치

### Phase 4 — 경험치 / 레벨업
- [x] XP 아이템 드롭
- [x] 흡입 / 누적
- [x] 레벨업 패널 + 3지선다
- [x] 스탯 반영

### Phase 5 — UI 마무리
- [x] HUD (HP, Level, XP, Kills)
- [x] 게임 오버 / 재시작

---

## 7. Balance (초안)

| 대상 | 값 |
|------|-----|
| Player HP | 100 |
| Player Speed | 180 px/s |
| Pickup Radius | 60 px |
| Weapon Damage | 10 |
| Weapon Cooldown | 0.45 s |
| Enemy HP | 20 |
| Enemy Speed | 70 px/s |
| Enemy Contact Damage | 10 |
| XP per kill | 1~2 |

숫자는 플레이 테스트로 조정한다.

---

## 8. Out of Scope

이번 범위에 **넣지 않음**:

- 추가 무기 / 추가 적 타입
- 보스, 웨이브 이벤트
- 사운드, 파티클, 모바일 조이스틱
- 맵 장애물, 멀티플레이, 외부 엔진

---

## 9. Done 기준

1. 키보드로 이동 가능
2. 적이 계속 나오고 플레이어를 따라옴
3. 무기가 가까운 적에게 자동으로 나감
4. 처치 시 XP가 떨어지고 먹으면 쌓임
5. 레벨업 시 강화 선택이 동작함
6. HP / Level / XP 등 최소 UI가 보임

---

## 10. Next Step

계획 확정 후 **Phase 1(이동)**부터 구현한다.
