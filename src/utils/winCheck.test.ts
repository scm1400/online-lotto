import { checkWin } from './winCheck';

// Simple test runner (no test framework in deps)
function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`FAIL: ${message}`);
  console.log(`PASS: ${message}`);
}

export function runWinCheckTests() {
  const winning = [1, 2, 3, 4, 5, 6];
  const bonus = 7;

  // 1등: 6개 일치
  assert(checkWin([1, 2, 3, 4, 5, 6], winning, bonus) === 1, '1등: 6개 일치');
  assert(checkWin([6, 5, 4, 3, 2, 1], winning, bonus) === 1, '1등: 순서 무관');

  // 2등: 5개 + 보너스
  assert(checkWin([1, 2, 3, 4, 5, 7], winning, bonus) === 2, '2등: 5개 + 보너스');
  assert(checkWin([7, 2, 3, 4, 5, 6], winning, bonus) === 2, '2등: 보너스 포함 5개');

  // 3등: 5개 (보너스 없음)
  assert(checkWin([1, 2, 3, 4, 5, 10], winning, bonus) === 3, '3등: 5개 일치');

  // 4등: 4개
  assert(checkWin([1, 2, 3, 4, 10, 11], winning, bonus) === 4, '4등: 4개 일치');

  // 5등: 3개
  assert(checkWin([1, 2, 3, 10, 11, 12], winning, bonus) === 5, '5등: 3개 일치');

  // 낙첨: 2개 이하
  assert(checkWin([1, 2, 10, 11, 12, 13], winning, bonus) === null, '낙첨: 2개 일치');
  assert(checkWin([10, 11, 12, 13, 14, 15], winning, bonus) === null, '낙첨: 0개 일치');

  // Edge: 보너스가 당첨 번호에 포함된 경우
  assert(checkWin([1, 2, 3, 4, 5, 7], [1, 2, 3, 4, 5, 7], 6) === 1, '보너스가 당첨번호에 포함: 6개 일치 = 1등');

  // Edge: 보너스 + 2개만 일치 (5등 아님, 낙첨)
  assert(checkWin([1, 2, 7, 10, 11, 12], winning, bonus) === null, '2개 + 보너스 = 낙첨');

  console.log('All winCheck tests passed!');
}
