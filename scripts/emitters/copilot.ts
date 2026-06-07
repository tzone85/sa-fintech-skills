import type { SkillInput, EmitOptions, EmitResult } from "./types.ts";

export function emitCopilot(
  skills: SkillInput[],
  opts: EmitOptions,
): EmitResult {
  const eligible = skills.filter((s) =>
    s.parsed.frontmatter.metadata.targets.includes("copilot"),
  );
  if (eligible.length === 0) return { files: [] };

  const parts: string[] = [
    `<!-- sa-fintech-skills@${opts.version} -->`,
    "# SA fintech skills",
    "",
    "When the user is writing code that touches South African payment APIs (Paystack, PayFast), POPIA personal information, or SARS tax workflows, apply the skill below whose triggers best match.",
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
        path: ".github/copilot-instructions.md",
        content: parts.join("\n") + "\n",
      },
    ],
  };
}
