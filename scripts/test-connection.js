const { recognizeText, recognizeImage } = require('../src/services/openrouterClient');

// 1x1 빨간 픽셀 PNG. 실제 이미지 인식 품질이 아니라
// base64 인코딩 경로가 끝까지 동작하는지(연결 확인)를 검증하는 용도.
const SAMPLE_IMAGE_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

async function main() {
  console.log('[1/2] 텍스트 연결 테스트');
  const textResult = await recognizeText('Say OK');
  console.log('  응답:', textResult.trim());

  console.log('[2/2] 이미지 연결 테스트 (base64)');
  const imageBuffer = Buffer.from(SAMPLE_IMAGE_BASE64, 'base64');
  const imageResult = await recognizeImage(imageBuffer, 'image/png', '이 이미지에 무엇이 보이는지 설명해줘.');
  console.log('  응답:', imageResult.trim());

  console.log('\n✅ 텍스트/이미지 API 연결 모두 정상');
}

main().catch((err) => {
  console.error('❌ 연결 테스트 실패:', err.message);
  process.exitCode = 1;
});
