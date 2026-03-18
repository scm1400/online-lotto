export function generateAiPrompt(userId: string, roundId: string): string {
  const origin = window.location.origin;

  return `1~45 사이의 숫자 6개를 랜덤으로 골라서 아래 API에 JSON POST 요청을 보내줘.
pickTag에는 번호를 고른 이유나 느낌을 자유롭게 한마디로 적어줘
중요: pickTag에 한글을 넣을 거라 curl은 인코딩이 깨질 수 있어. node 또는 python 이 설치되어있다면 스크립트나 코드로 요청을 보내줘.
URL: ${origin}/api/tickets
Body:
{
  "numbers": [선택한 6개 숫자],
  "mode": "ai",
  "pickTag": "한마디",
  "userId": "${userId}",
  "roundId": "${roundId}"
}`;
}
