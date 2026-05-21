import { FlatCompat } from "@eslint/eslintrc";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import unusedImports from "eslint-plugin-unused-imports";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // 무시 경로
  {
    ignores: [".next/**", "node_modules/**", "public/**"],
  },

  // 기본 Next.js + TypeScript + Prettier 규칙
  ...compat.extends("next/core-web-vitals", "next/typescript", "prettier"),

  // 커스텀 규칙
  {
    plugins: {
      "unused-imports": unusedImports,
      "simple-import-sort": simpleImportSort,
    },
    rules: {
      // ────────────── Import 관리 ──────────────
      // 미사용 import 자동 제거
      "unused-imports/no-unused-imports": "error",
      // 미사용 변수 경고 (언더스코어 prefix 허용)
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],
      // Import 자동 정렬 (저장 시 ESLint --fix로 자동 정리)
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",

      // ────────────── 코드 품질 ──────────────
      // console.log 경고 (warn/error는 허용)
      "no-console": ["warn", { allow: ["warn", "error"] }],
      // debugger 금지
      "no-debugger": "error",
      // 중복 import 금지
      "no-duplicate-imports": "error",

      // ────────────── TypeScript 강화 ──────────────
      // any 타입 경고
      "@typescript-eslint/no-explicit-any": "warn",
      // 빈 함수 허용 (콜백 등에서 필요)
      "@typescript-eslint/no-empty-function": "off",
      // @ts-expect-error 대신 @ts-expect-error 권장
      "@typescript-eslint/prefer-ts-expect-error": "warn",
    },
  },
];

export default eslintConfig;
