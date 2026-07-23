require('dotenv').config();

const REQUIRED_ENV_VARS = ['OPENROUTER_API_KEY'];

function validateEnv() {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

module.exports = {
  validateEnv,
  openrouter: {
    apiKey: process.env.OPENROUTER_API_KEY,
    baseUrl: 'https://openrouter.ai/api/v1',
    // 이미지 인식: 무료 VL(vision-language) 모델 중 유일한 옵션.
    visionModel: process.env.OPENROUTER_VISION_MODEL || 'nvidia/nemotron-nano-12b-v2-vl:free',
    // 레시피 생성(텍스트): nano-vl 모델은 한국어 레시피 생성 시 재료와 무관한 내용,
    // 문법이 깨진 문장을 생성하는 문제가 확인됨. super-120b도 가끔 빈 문자열/무관한
    // 재료를 생성해 ultra-550b로 대체(3회 반복 테스트에서 모두 입력 재료를 정확히 반영).
    textModel: process.env.OPENROUTER_TEXT_MODEL || 'nvidia/nemotron-3-ultra-550b-a55b:free',
  },
};
