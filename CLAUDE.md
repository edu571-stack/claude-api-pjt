# CLAUDE.md

## Project Overview

**claude-api-pjt**는 냉장고 내부 사진을 업로드하면 OpenRouter의 Vision 모델로 식재료를 인식하고, 인식된 재료로 만들 수 있는 요리 레시피를 텍스트 모델로 추천해주는 웹 서비스입니다. Node.js/Express 백엔드와 Vanilla HTML/CSS/JS 프론트엔드로 구성되어 있으며, GitHub 저장소(`edu571-stack/claude-api-pjt`)와 연동된 Vercel에 배포되어 있습니다.

하드웨어 센서 연동이나 데이터베이스는 아직 구현되어 있지 않습니다 (`docs/PRD_03.md`에 사용자 프로필/레시피 저장 기획만 존재).

## Common Commands

```bash
npm install              # 의존성 설치
npm run dev               # 로컬 개발 서버 실행 (server/index.js, http://localhost:3000)
npm run test:openrouter   # OpenRouter API 연결 테스트 (scripts/test-connection.js)
```

`build`/`test`/`lint`/`migrate`/`seed` 같은 스크립트는 `package.json`에 존재하지 않습니다.

## Architecture Overview

```
server/app.js      # Express 앱 정의 + 라우트 (실질적인 서버 로직)
server/index.js    # 로컬 개발 진입점 (app.listen)
api/index.js       # Vercel 서버리스 함수 진입점 (server/app.js를 그대로 export)
vercel.json        # 모든 요청을 /api(=api/index.js)로 라우팅
config.js          # 환경 변수 로드/검증 (validateEnv)
src/services/openrouterClient.js   # OpenRouter API 호출 (recognizeText, recognizeImage)
src/utils/parseIngredients.js      # 이미지 인식 응답 → 재료 배열 파싱
src/utils/parseRecipes.js          # 레시피 생성 응답 파싱 및 유효성 검증
public/index.html                  # 단일 페이지 프론트엔드
docs/PRD_01~03.md                  # 기능별 기획 문서 (PRD_03은 미구현)
```

로컬 실행과 Vercel 배포가 같은 Express 앱(`server/app.js`)을 공유하는 구조이므로, 라우트를 수정할 때는 `server/app.js`만 고치면 됩니다.

## API Routes

- `POST /api/vision/recognize` — `multipart/form-data`, `image` 필드 (jpg/png/webp, 서버 측 4MB 제한) → `{ ingredients, rawModelResponse }`
- `POST /api/recipes/generate` — `{ ingredients: string[] }` → `{ recipes: [...] }` (모델 응답이 유효하지 않으면 최대 4회 재시도)

## Environment Setup

1. `.env.example`을 복사해 `.env` 생성 후 `OPENROUTER_API_KEY` 입력 (필수). `OPENROUTER_VISION_MODEL`, `OPENROUTER_TEXT_MODEL`은 선택.
2. `.env`는 `.gitignore`에 포함되어 커밋되지 않음.
3. **Vercel 배포 시**: Project Settings → Environment Variables에 동일한 키를 등록해야 하며, 반드시 **Production** 스코프를 체크해야 합니다. 배포 후에 환경 변수를 추가/변경했다면 기존 배포에는 소급 적용되지 않으므로 **Redeploy**가 필요합니다.

## Development Notes

- `config.validateEnv()`는 모듈이 로드되는 시점(`server/app.js` 최상단)에 즉시 실행됩니다. 환경 변수가 없으면 이 시점에 예외가 발생해 앱 전체가 뜨지 못하며, Vercel에서는 모든 API 요청이 `FUNCTION_INVOCATION_FAILED`로 나타납니다 — 특정 라우트만의 문제가 아니라 함수 초기화 실패인지부터 의심할 것.
- Vercel 서버리스 함수는 요청 본문 크기가 4.5MB로 고정 제한되어 있어, `public/index.html`은 업로드 전 브라우저에서 이미지를 canvas로 리사이즈(최대 1600px)·JPEG 압축한 뒤 전송합니다. 서버 측 `MAX_FILE_SIZE_BYTES`(4MB)도 이 한도보다 낮게 잡혀 있습니다.
- Vercel Hobby 플랜은 함수 실행 시간이 기본 10초로 제한되어, 레시피 생성처럼 오래 걸리는 요청은 타임아웃될 수 있습니다.
- 모델 응답은 자유 서술형일 수 있어 `parseIngredients`/`parseRecipes`가 방어적으로 파싱하며, `isValidRecipe`는 모델이 지어낸 재료를 걸러내기 위해 입력 재료 목록과의 일치 여부를 검증합니다.
- API 키는 서버(`config.js`)에서만 사용하며 클라이언트에 노출되지 않습니다.
