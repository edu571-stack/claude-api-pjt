# PRD_03 — 사용자 프로필 및 레시피 저장

## 1. 개요
사용자 프로필을 생성하고, PRD_02에서 생성된 레시피를 프로필에 저장/조회할 수 있게 한다.

## 2. 목표
- 사용자가 자신의 프로필을 만들고 식별될 수 있다.
- 생성된 레시피를 프로필에 저장하고, 나중에 다시 조회할 수 있다.

## 3. 범위

### In Scope
- 사용자 프로필 생성/조회 API
- 레시피 저장(북마크) API
- 저장된 레시피 목록 조회 API
- 최소한의 인증(이메일 기반, 세션 또는 토큰)

### Out of Scope
- 소셜 로그인(OAuth) — 향후 확장 가능
- 레시피 공유/커뮤니티 기능
- 알레르기/식단 선호도 기반 추천 반영(향후 PRD_02 확장 후보)

## 4. 사용자 플로우
1. 사용자가 이메일로 프로필을 생성(가입)한다.
2. 로그인 후, PRD_02에서 추천받은 레시피 카드에서 "저장" 버튼을 누른다.
3. 백엔드가 해당 레시피를 사용자 프로필에 연결해 저장한다.
4. 사용자는 "저장한 레시피" 페이지에서 목록을 조회한다.

## 5. 데이터 모델 (Supabase / PostgreSQL)

### `users`
| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | uuid (PK) | |
| email | text (unique) | |
| created_at | timestamp | |

### `saved_recipes`
| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | uuid (PK) | |
| user_id | uuid (FK → users.id) | |
| title | text | |
| used_ingredients | jsonb | PRD_02 `usedIngredients` |
| missing_ingredients | jsonb | PRD_02 `missingIngredients` |
| steps | jsonb | PRD_02 `steps` |
| estimated_cook_time_minutes | integer | |
| created_at | timestamp | |

## 6. API 설계

### `POST /api/users`
프로필 생성.
```json
// Request
{ "email": "user@example.com" }
// Response
{ "id": "uuid", "email": "user@example.com" }
```

### `POST /api/users/:userId/recipes`
레시피 저장 (PRD_02 응답 형식을 그대로 받음).
```json
// Request
{
  "title": "당근 오믈렛",
  "usedIngredients": ["계란", "당근", "양파"],
  "missingIngredients": ["소금", "식용유"],
  "steps": ["...", "..."],
  "estimatedCookTimeMinutes": 15
}
```

### `GET /api/users/:userId/recipes`
저장된 레시피 목록 조회.
```json
{ "recipes": [ /* saved_recipes rows */ ] }
```

## 7. 기술 의존성
- DB: Supabase (CLAUDE.md 아키텍처와 일치)
- PRD_02의 레시피 응답 스키마
- 인증 방식 확정 필요 (아래 오픈 이슈 참고)

## 8. 비기능 요구사항
- 이메일은 유효성 검사 후 저장
- 사용자 데이터는 본인만 조회 가능하도록 접근 제어
- 저장 API는 PRD_02 레시피 구조가 변경되어도 최소한의 필드(`title`, `steps`)만 있으면 동작하도록 방어적으로 파싱

## 9. 완료 기준 (Acceptance Criteria)
- [ ] 이메일로 프로필 생성 가능
- [ ] 생성된 레시피를 프로필에 저장 가능
- [ ] 저장된 레시피 목록을 사용자별로 정확히 조회 가능
- [ ] 다른 사용자의 저장 레시피에 접근할 수 없음

## 10. 오픈 이슈
- 인증 방식: 비밀번호 기반 vs 매직 링크 vs 익명 세션 — 결정 필요
- 저장 개수 제한 여부
- 레시피 삭제/수정 기능 포함 여부
