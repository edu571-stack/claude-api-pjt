// 모델이 "계란, 우유, 당근" 같은 쉼표 구분 목록으로 응답하도록 프롬프트를 설계했지만,
// 자유 서술형으로 응답할 가능성에 대비해 줄바꿈도 구분자로 허용하고 방어적으로 정리한다.
function parseIngredients(text) {
  if (!text) return [];

  return [
    ...new Set(
      text
        .split(/[,\n]/)
        .map((item) => item.trim())
        .filter((item) => item.length > 0 && item.length < 30)
    ),
  ];
}

module.exports = { parseIngredients };
