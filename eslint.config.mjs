// eslint-config-next v16 ships a native flat config, so we spread it directly.
import next from "eslint-config-next/core-web-vitals";

const eslintConfig = [
  ...next,
  {
    ignores: [".next/**", "node_modules/**", "public/sw.js", "supabase/**"],
  },
];

export default eslintConfig;
