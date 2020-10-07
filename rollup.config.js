import svelte from "rollup-plugin-svelte";
import resolve from "rollup-plugin-node-resolve";
import typescript from "rollup-plugin-typescript2";
import sveltePreprocess from "svelte-preprocess";
const pkg = require("./package.json");

export default {
  input: "./src/main.ts",
  output: [
    { file: pkg.main, format: "umd", name: "Datepicker" },
    { file: pkg.module, format: "es" },
  ],
  plugins: [
    svelte({
      // enable run-time checks when not in production
      preprocess: sveltePreprocess(),
    }),
    resolve({
      browser: true,
      extensions: [".js", ".jsx", ".ts", ".tsx"],
      dedupe: (importee) =>
        importee === "svelte" || importee.startsWith("svelte/"),
    }),
    typescript(),
  ],
};
