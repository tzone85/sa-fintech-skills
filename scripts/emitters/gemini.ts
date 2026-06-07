import type { SkillInput, EmitOptions, EmitResult, EmittedFile } from './types.ts';

export function emitGemini(skills: SkillInput[], opts: EmitOptions): EmitResult {
  const eligible = skills.filter(s => s.parsed.frontmatter.metadata.targets.includes('gemini'));
  const files: EmittedFile[] = [];

  const manifest = {
    name: 'sa-fintech-skills',
    version: opts.version,
    skills: eligible.map(s => ({
      name: s.parsed.frontmatter.name,
      description: s.parsed.frontmatter.description,
      body: `skills/${s.parsed.frontmatter.name}.md`
    }))
  };

  files.push({
    path: 'skills.json',
    content: JSON.stringify(manifest, null, 2) + '\n'
  });

  for (const { parsed } of eligible) {
    files.push({
      path: `skills/${parsed.frontmatter.name}.md`,
      content: `<!-- sa-fintech-skills@${opts.version} -->\n` + parsed.body
    });
  }

  return { files };
}
