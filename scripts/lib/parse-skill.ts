import matter from "gray-matter";
import { ALL_TARGETS, type RuntimeTarget } from "./runtime-config.ts";

export type { RuntimeTarget };

export interface SkillFrontmatter {
  name: string;
  description: string;
  metadata: {
    targets: RuntimeTarget[];
  };
}

export interface ParsedSkill {
  frontmatter: SkillFrontmatter;
  body: string;
  sections: {
    triggers: string | null;
    examples: string | null;
    commonMistakes: string | null;
  };
}

function extractSection(body: string, heading: string): string | null {
  // Anchored to start-of-string OR newline (gray-matter strips leading newline when body opens with H2);
  // captures section body up to the next "\n## " heading or true end-of-string.
  const re = new RegExp(
    `(?:^|\\n)## ${heading}[^\\n]*\\n([\\s\\S]*?)(?=\\n## |$)`,
  );
  const m = body.match(re);
  return m ? m[1].trim() : null;
}

export function parseSkill(source: string): ParsedSkill {
  const parsed = matter(source);
  if (!parsed.data || Object.keys(parsed.data).length === 0) {
    throw new Error("SKILL.md: missing YAML frontmatter");
  }
  const fm = parsed.data as Partial<SkillFrontmatter>;
  if (!fm.name)
    throw new Error('SKILL.md: frontmatter missing required key "name"');
  if (!fm.description)
    throw new Error('SKILL.md: frontmatter missing required key "description"');
  if (!fm.metadata?.targets?.length) {
    throw new Error(
      'SKILL.md: frontmatter missing required key "metadata.targets"',
    );
  }
  const invalid = fm.metadata.targets.filter(
    (t) => !ALL_TARGETS.includes(t as RuntimeTarget),
  );
  if (invalid.length > 0) {
    throw new Error(
      `SKILL.md: invalid metadata.targets: ${invalid.join(", ")}. ` +
        `Valid: claude, cursor, copilot, codex, gemini`,
    );
  }

  return {
    frontmatter: fm as SkillFrontmatter,
    body: parsed.content,
    sections: {
      triggers: extractSection(parsed.content, "Triggers"),
      examples: extractSection(parsed.content, "Examples"),
      commonMistakes: extractSection(parsed.content, "Common mistakes"),
    },
  };
}
