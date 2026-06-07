import type {
  SkillInput,
  EmitOptions,
  EmitResult,
  EmittedFile,
} from "./types.ts";

const DEFAULT_GLOBS = ["**/*.ts", "**/*.tsx", "**/*.py", "**/*.js"];

export function emitCursor(
  skills: SkillInput[],
  opts: EmitOptions,
): EmitResult {
  const files: EmittedFile[] = [];

  for (const { parsed } of skills) {
    if (!parsed.frontmatter.metadata.targets.includes("cursor")) continue;

    const fm = [
      "---",
      `description: ${parsed.frontmatter.description}`,
      `globs: ${JSON.stringify(DEFAULT_GLOBS)}`,
      "alwaysApply: false",
      `# sa-fintech-skills@${opts.version}`,
      "---",
      "",
    ].join("\n");

    files.push({
      path: `.cursor/rules/${parsed.frontmatter.name}.mdc`,
      content: fm + parsed.body,
    });
  }

  return { files };
}
