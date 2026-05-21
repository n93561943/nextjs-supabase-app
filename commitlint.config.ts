import type { UserConfig } from "@commitlint/types";

/**
 * Commitlint 설정
 *
 * 커밋 메시지 형식: {이모지} {type}: {한국어 설명}
 * 예시: ✨ feat: 로그인 기능 추가
 *       🐛 fix: 세션 만료 오류 수정
 *       📝 docs: README 업데이트
 */
const config: UserConfig = {
  extends: ["@commitlint/config-conventional"],

  // 이모지 prefix를 허용하는 커스텀 파서
  parserPreset: {
    parserOpts: {
      // 이모지(선택) + type(필수) + scope(선택) + subject(필수)
      headerPattern:
        /^(?:[\p{Emoji_Presentation}\p{Extended_Pictographic}]\s)?(\w+)(?:\(([^)]+)\))?!?:\s(.+)$/u,
      headerCorrespondence: ["type", "scope", "subject"],
    },
  },

  rules: {
    // 허용 커밋 타입
    "type-enum": [
      2,
      "always",
      [
        "feat", // 새 기능
        "fix", // 버그 수정
        "docs", // 문서 변경
        "style", // 코드 포맷 (로직 변경 없음)
        "refactor", // 리팩토링
        "test", // 테스트 추가/수정
        "chore", // 빌드/설정 변경
        "perf", // 성능 개선
        "ci", // CI/CD 설정
        "build", // 빌드 시스템 변경
        "revert", // 커밋 되돌리기
      ],
    ],

    // 헤더 최대 길이
    "header-max-length": [2, "always", 100],

    // 한국어 허용: subject-case 비활성화
    "subject-case": [0],

    // subject 빈 값 금지
    "subject-empty": [2, "never"],

    // type 빈 값 금지
    "type-empty": [2, "never"],
  },
};

export default config;
