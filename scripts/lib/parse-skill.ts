import matter from 'gray-matter';

export type RuntimeTarget = 'claude' | 'cursor' | 'copilot' | 'codex' | 'gemini';

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
  // Match from the heading to the next H2 or end of string.
  // \Z is not a valid JS regex anchor — use (?=^## ) with a trailing fallback via [\s\S]*?
  // The negative lookahead (?=^## ) combined with the 'm' flag handles section boundaries.
  // We use [\s\S]*? (non-greedy) and stop at the next ## heading or end of input.
  const re = new RegExp(`^## ${heading}\\s*\\n([\\s\\S]*?)(?=^## |\\s*$)`, 'mi');
  const m = body.match(re);
  return m ? m[1].trim() : null;
}

export function parseSkill(source: string): ParsedSkill {
  const parsed = matter(source);
  if (!parsed.data || Object.keys(parsed.data).length === 0) {
    throw new Error('SKILL.md: missing YAML frontmatter');
  }
  const fm = parsed.data as Partial<SkillFrontmatter>;
  if (!fm.name) throw new Error('SKILL.md: frontmatter missing required key "name"');
  if (!fm.description) throw new Error('SKILL.md: frontmatter missing required key "description"');
  if (!fm.metadata?.targets?.length) {
    throw new Error('SKILL.md: frontmatter missing required key "metadata.targets"');
  }

  return {
    frontmatter: fm as SkillFrontmatter,
    body: parsed.content,
    sections: {
      triggers: extractSection(parsed.content, 'Triggers'),
      examples: extractSection(parsed.content, 'Examples'),
      commonMistakes: extractSection(parsed.content, 'Common mistakes'),
    },
  };
}
