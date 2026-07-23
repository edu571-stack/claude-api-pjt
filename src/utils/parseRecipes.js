// 모델이 순수 JSON만 반환하도록 프롬프트에서 요청하지만, 코드블록(```json)이나
// 앞뒤 설명 문장을 덧붙이는 경우가 있어 방어적으로 JSON 배열 부분만 추출한다.
function parseRecipes(text) {
  if (!text) return [];

  const match = text.match(/\[[\s\S]*\]/);
  if (!match) return [];

  try {
    const parsed = JSON.parse(match[0]);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;

// 모델이 usedIngredients에 입력 재료 목록과 무관한 단어("재료1", "김치" 등 입력에 없는 것)를
// 그대로 지어내는 경우가 관찰되어, 모든 usedIngredients가 입력 재료 중 하나와 실제로
// 대응되는지(부분 문자열 일치) 확인한다.
function ingredientsGrounded(usedIngredients, inputIngredients) {
  if (!Array.isArray(inputIngredients) || inputIngredients.length === 0) return true;
  const normalizedInputs = inputIngredients.map((i) => i.trim());
  return usedIngredients.every((used) =>
    normalizedInputs.some((input) => used.includes(input) || input.includes(used))
  );
}

// 모델이 가끔 구조는 맞지만 내용이 빈 문자열이거나(예: "usedIngredients": ["", "", ""])
// 입력 재료와 무관한 값을 채우는 경우가 있어 실제로 유효한지 검증한다.
function isValidRecipe(recipe, inputIngredients) {
  return (
    recipe &&
    isNonEmptyString(recipe.title) &&
    Array.isArray(recipe.usedIngredients) &&
    recipe.usedIngredients.length > 0 &&
    recipe.usedIngredients.every(isNonEmptyString) &&
    Array.isArray(recipe.steps) &&
    recipe.steps.length > 0 &&
    recipe.steps.every(isNonEmptyString) &&
    ingredientsGrounded(recipe.usedIngredients, inputIngredients)
  );
}

module.exports = { parseRecipes, isValidRecipe };
