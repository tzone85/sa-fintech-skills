import type { SkillInput, EmitOptions, EmitResult } from "./types.ts";

export function emitCodex(skills: SkillInput[], opts: EmitOptions): EmitResult {
  const eligible = skills.filter((s) =>
    s.parsed.frontmatter.metadata.targets.includes("codex"),
  );
  if (eligible.length === 0) return { files: [] };

  const parts: string[] = [
    `<!-- sa-fintech-skills@${opts.version} -->`,
    "# Agent guidance — SA fintech",
    "",
    "Project-specific instructions for any agent (Codex, Copilot CLI, Cursor, Claude Code) touching South African payment APIs, POPIA, or SARS workflows.",
    "",
  ];

  for (const { parsed } of eligible) {
    parts.push(`## ${parsed.frontmatter.name}`, "");
    parts.push(`> ${parsed.frontmatter.description}`, "");
    parts.push(parsed.body.trim(), "");
  }

  return {
    files: [
      {
        path: "AGENTS.md",
        content: parts.join("\n") + "\n",
      },
    ],
  };
}
