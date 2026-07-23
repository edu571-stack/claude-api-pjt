const config = require('../../config');

async function chatCompletion(model, content, extra = {}) {
  config.validateEnv();

  const response = await fetch(`${config.openrouter.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.openrouter.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content }],
      ...extra,
    }),
  });

  const data = await response.json();
  if (!response.ok || data.error) {
    throw new Error(`OpenRouter error: ${data.error?.message || response.statusText}`);
  }
  return data.choices[0].message.content;
}

// textModel은 reasoning 모델이라 답변 전에 긴 사고 과정을 토큰으로 소모한다.
// max_tokens가 낮으면 최종 JSON 답변 전에 잘리므로 넉넉히 잡고, effort는 낮춰 속도를 확보한다.
async function recognizeText(prompt) {
  return chatCompletion(config.openrouter.textModel, prompt, {
    max_tokens: 2000,
    reasoning: { effort: 'low' },
  });
}

// OpenRouter의 nvidia 비전 모델은 외부 image_url을 서버에서 직접 fetch하다 403으로
// 실패하는 경우가 있어(테스트로 확인됨), base64 data URI로 인코딩해 보낸다.
async function recognizeImage(imageBuffer, mimeType, prompt) {
  const dataUrl = `data:${mimeType};base64,${imageBuffer.toString('base64')}`;
  return chatCompletion(config.openrouter.visionModel, [
    { type: 'text', text: prompt },
    { type: 'image_url', image_url: { url: dataUrl } },
  ]);
}

module.exports = { recognizeText, recognizeImage };
