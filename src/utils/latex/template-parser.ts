/**
 * LaTeX Template Structure Parser
 * Analyzes template to identify sections and injection points
 */

export interface TemplateSection {
  name: string;
  startLine: number;
  endLine: number;
  pattern: RegExp;
  content: string;
}

export interface TemplateStructure {
  sections: TemplateSection[];
  preamble: string;
  documentContent: string;
}

/**
 * Parse template structure to identify sections and placeholders
 */
export function parseTemplateStructure(content: string): TemplateStructure {
  const lines = content.split('\n');
  
  // Find document environment boundaries
  const documentStartIdx = lines.findIndex(line => /\\begin\s*\{\s*document\s*\}/.test(line));
  const documentEndIdx = lines.findIndex(line => /\\end\s*\{\s*document\s*\}/.test(line));

  const preamble = documentStartIdx > 0 ? lines.slice(0, documentStartIdx).join('\n') : '';
  const documentContent = documentStartIdx >= 0 && documentEndIdx > documentStartIdx 
    ? lines.slice(documentStartIdx + 1, documentEndIdx).join('\n')
    : content;

  // Identify sections
  const sections = identifySections(content);

  return {
    sections,
    preamble,
    documentContent,
  };
}

/**
 * Identify standard LaTeX sections in the template
 */
function identifySections(content: string): TemplateSection[] {
  const sections: TemplateSection[] = [];
  const lines = content.split('\n');

  const sectionPatterns = [
    { name: 'experience', pattern: /\\section\s*\{\s*experience\s*\}/i },
    { name: 'education', pattern: /\\section\s*\{\s*education\s*\}/i },
    { name: 'skills', pattern: /\\section\s*\{\s*skills\s*\}/i },
    { name: 'projects', pattern: /\\section\s*\{\s*projects\s*\}/i },
    { name: 'certifications', pattern: /\\section\s*\{\s*certifications\s*\}/i },
    { name: 'work experience', pattern: /\\section\s*\{\s*(work\s+)?experience\s*\}/i },
    { name: 'summary', pattern: /\\section\s*\{\s*(professional\s+)?summary\s*\}/i },
  ];

  let currentSection: TemplateSection | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    for (const { name, pattern } of sectionPatterns) {
      if (pattern.test(line)) {
        if (currentSection) {
          currentSection.endLine = i - 1;
          sections.push(currentSection);
        }

        currentSection = {
          name,
          startLine: i,
          endLine: lines.length - 1,
          pattern,
          content: '',
        };
      }
    }
  }

  if (currentSection) {
    sections.push(currentSection);
  }

  // Set content for each section
  sections.forEach(section => {
    section.content = lines.slice(section.startLine, section.endLine + 1).join('\n');
  });

  return sections;
}
