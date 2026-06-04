import * as esbuild from "esbuild";
const watch = process.argv.includes("--watch");
const ctx = await esbuild.context({
  entryPoints: ["src/mentor.js"],
  bundle: true,
  outfile: "mentor.js",
  format: "iife",
  globalName: "AiudaMentor",
  minify: false,
  sourcemap: false,
  external: [],
  logLevel: "info",
});
if (watch) {
  await ctx.watch();
  console.log("Watching...");
} else {
  await ctx.rebuild();
  await ctx.dispose();
}
