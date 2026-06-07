import type {
  SkillInput,
  EmittedFile,
  EmitOptions,
  EmitResult,
} from "./types.ts";

const versionHeader = (v: string): string => `# sa-fintech-skills@${v}\n`;

export function emitClaude(
  skills: SkillInput[],
  opts: EmitOptions,
): EmitResult {
  const claudeSkills = skills.filter((s) =>
    s.parsed.frontmatter.metadata.targets.includes("claude"),
  );

  const skillFiles: EmittedFile[] = claudeSkills.map((s) => ({
    path: `skills/${s.parsed.frontmatter.name}/SKILL.md`,
    content: versionHeader(opts.version) + s.source,
  }));

  const manifest = {
    name: "sa-fintech-skills",
    version: opts.version,
    skills: claudeSkills.map((s) => ({
      name: s.parsed.frontmatter.name,
      description: s.parsed.frontmatter.description,
      path: `skills/${s.parsed.frontmatter.name}/SKILL.md`,
    })),
  };

  const manifestFile: EmittedFile = {
    path: ".claude-plugin/marketplace.json",
    content: JSON.stringify(manifest, null, 2) + "\n",
  };

  return { files: [...skillFiles, manifestFile] };
}
