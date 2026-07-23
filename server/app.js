const path = require('path');
const express = require('express');
const multer = require('multer');
const config = require('../config');
const { recognizeImage, recognizeText } = require('../src/services/openrouterClient');
const { parseIngredients } = require('../src/utils/parseIngredients');
const { parseRecipes, isValidRecipe } = require('../src/utils/parseRecipes');

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
// Vercel 서버리스 함수의 요청 본문 크기 제한(4.5MB)보다 여유 있게 낮춰,
// 플랫폼이 아닌 서버 코드가 먼저 명확한 에러 메시지를 반환하게 한다.
const MAX_FILE_SIZE_BYTES = 4 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(new Error('UNSUPPORTED_FILE_TYPE'));
    }
    cb(null, true);
  },
});

const RECOGNIZE_PROMPT = `이 이미지는 냉장고 내부 사진이다.
사진에서 식별 가능한 식재료 이름만 한국어로, 쉼표로 구분된 목록으로 답해라.
설명이나 다른 문장은 포함하지 마라.
예: 계란, 우유, 당근, 양파`;

function buildRecipePrompt(ingredients) {
  return `아래 재료로 만들 수 있는 요리 레시피 3개를 추천해라.
각 레시피는 다음 JSON 형식의 배열로만 응답해라. 다른 설명은 포함하지 마라.
아래 형식의 <> 부분은 자리표시자일 뿐이며, 실제 값으로 채워야 한다.
빈 문자열이나 "재료" 같은 일반 단어를 그대로 쓰지 말고, 주어진 재료 목록에 있는 구체적인 이름을 써라.

재료: ${ingredients.join(', ')}

형식:
[
  {
    "title": "<구체적인 요리 이름>",
    "usedIngredients": ["<입력 재료 목록 중 실제로 사용한 재료명>"],
    "missingIngredients": ["<추가로 필요한 재료명>"],
    "steps": ["<조리 순서 1>", "<조리 순서 2>"],
    "estimatedCookTimeMinutes": <숫자>
  }
]`;
}

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.post('/api/vision/recognize', (req, res) => {
  upload.single('image')(req, res, async (err) => {
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: '이미지 크기는 4MB를 초과할 수 없습니다.' });
    }
    if (err) {
      return res.status(400).json({ error: '지원하지 않는 이미지 형식입니다.' });
    }
    if (!req.file) {
      return res.status(400).json({ error: '이미지 파일이 필요합니다.' });
    }

    try {
      const rawModelResponse = await recognizeImage(req.file.buffer, req.file.mimetype, RECOGNIZE_PROMPT);
      const ingredients = parseIngredients(rawModelResponse);
      res.json({ ingredients, rawModelResponse });
    } catch (error) {
      console.error('recognizeImage failed:', error.message);
      res.status(502).json({ error: '이미지 인식 중 오류가 발생했습니다.' });
    }
  });
});

app.post('/api/recipes/generate', async (req, res) => {
  const { ingredients } = req.body || {};
  if (!Array.isArray(ingredients) || ingredients.length === 0) {
    return res.status(400).json({ error: 'ingredients 배열이 필요합니다.' });
  }

  const prompt = buildRecipePrompt(ingredients);

  try {
    let recipes = [];
    for (let attempt = 0; attempt < 4 && recipes.length === 0; attempt += 1) {
      const rawModelResponse = await recognizeText(prompt);
      recipes = parseRecipes(rawModelResponse).filter((r) => isValidRecipe(r, ingredients));
    }

    if (recipes.length === 0) {
      return res.status(502).json({ error: '레시피 생성 응답을 해석할 수 없습니다.' });
    }

    res.json({ recipes });
  } catch (error) {
    console.error('recipe generation failed:', error.message);
    res.status(502).json({ error: '레시피 생성 중 오류가 발생했습니다.' });
  }
});

config.validateEnv();

module.exports = app;
