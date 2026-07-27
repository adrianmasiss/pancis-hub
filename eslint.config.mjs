import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Material que no es codigo de la app: el runtime del prototipo de diseno
    // y las skills de agentes instaladas. Ninguno se compila ni se despliega.
    "design_handoff_pancis_hub/**",
    ".claude/**",
    ".agents/**",
  ]),
]);

export default eslintConfig;
