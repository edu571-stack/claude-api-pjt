# 🧊 냉장고 레시피 도우미 (claude-api-pjt)

냉장고 내부 사진을 업로드하면 AI가 재료를 인식하고, 인식된 재료로 만들 수 있는 요리 레시피를 추천해주는 웹 서비스입니다.

## 주요 기능

1. **재료 인식** — 냉장고 사진을 업로드하면 Vision 모델이 사진 속 식재료 목록을 추출합니다.
2. **레시피 추천** — 인식된(또는 직접 추가/수정한) 재료를 기반으로 텍스트 모델이 실행 가능한 레시피 3개를 추천합니다.
3. **재료 수동 편집** — 인식 결과가 부정확할 경우 사용자가 재료를 직접 추가하거나 삭제할 수 있습니다.

## 기술 스택

- **Backend**: Node.js, Express, Multer (이미지 업로드)
- **Frontend**: Vanilla HTML/CSS/JS (`public/index.html`)
- **AI**: [OpenRouter](https://openrouter.ai) API (Vision 모델 + 텍스트 모델)

## 프로젝트 구조

```
├── server/index.js               # Express 서버, API 라우트
├── src/services/openrouterClient.js  # OpenRouter API 호출
├── src/utils/parseIngredients.js     # 재료 인식 응답 파싱
├── src/utils/parseRecipes.js         # 레시피 생성 응답 파싱/검증
├── public/index.html             # 프론트엔드 UI
├── config.js                     # 환경 변수 로드/검증
├── scripts/test-connection.js    # OpenRouter API 연결 테스트 스크립트
└── docs/PRD_01~03.md             # 기능별 PRD 문서
```

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.example`을 참고해 `.env` 파일을 생성하고 OpenRouter API 키를 입력합니다.

```bash
cp .env.example .env
```

```
OPENROUTER_API_KEY=your_key_here
```

### 3. 개발 서버 실행

```bash
npm run dev
```

서버가 실행되면 `http://localhost:3000` 에서 확인할 수 있습니다.

### 4. API 연결 테스트 (선택)

```bash
npm run test:openrouter
```

## API

### `POST /api/vision/recognize`

`multipart/form-data`로 이미지(`image` 필드, jpg/png/webp, 최대 5MB)를 업로드하면 인식된 재료 목록을 반환합니다.

```json
{ "ingredients": ["계란", "우유", "당근", "양파"], "rawModelResponse": "..." }
```

### `POST /api/recipes/generate`

재료 배열을 받아 레시피 목록을 반환합니다.

```json
// Request
{ "ingredients": ["계란", "우유", "당근", "양파"] }

// Response
{
  "recipes": [
    {
      "title": "당근 오믈렛",
      "usedIngredients": ["계란", "당근", "양파"],
      "missingIngredients": ["소금", "식용유"],
      "steps": ["당근과 양파를 잘게 썬다.", "계란을 풀어 채소와 섞는다."],
      "estimatedCookTimeMinutes": 15
    }
  ]
}
```

자세한 기능 명세는 [`docs/`](./docs) 디렉터리의 PRD 문서를 참고하세요.
