/**
 * Prompt Engineering for LaTeX Template Injection
 * Builds comprehensive prompts for AI models to inject resume data into templates
 */

import { Resume } from '@/lib/types';
import { parseTemplateStructure } from './template-parser';

/**
 * Build a comprehensive prompt for LaTeX template injection
 */
export function buildTemplateInjectionPrompt(
  resume: Resume,
  templateContent: string
): string {
  const templateStructure = parseTemplateStructure(templateContent);
  const availableSections = templateStructure.sections.map(s => s.name);

  const resumeDataJson = JSON.stringify(
    {
      name: `${resume.first_name} ${resume.last_name}`,
      email: resume.email,
      phone: resume.phone_number,
      location: resume.location,
      website: resume.website,
      linkedin: resume.linkedin_url,
      github: resume.github_url,
      skills: resume.skills,
      experience: resume.work_experience,
      education: resume.education,
      projects: resume.projects,
    },
    null,
    2
  );

  return `You are an expert LaTeX resume template engineer specializing in intelligent data injection.

CRITICAL TASK: Inject resume data into a LaTeX template while maintaining perfect LaTeX syntax and document structure.

IMPORTANT INSTRUCTIONS:
1. PRESERVE TEMPLATE STRUCTURE: Keep all LaTeX commands, packages, and formatting intact
2. IDENTIFY SECTIONS: Analyze the template structure and identify where data should go
3. REMOVE OLD DATA: Before injecting new data, remove placeholder text and old content
4. ESCAPE SPECIAL CHARACTERS: Escape LaTeX special chars in resume data: \\, $, &, %, #, _, {}, ^, ~
5. MAINTAIN FORMATTING: Keep consistent with the template's existing style
6. USE APPROPRIATE MARKUP: Use the template's existing commands for lists, spacing, formatting

TEMPLATE ANALYSIS:
- Available sections detected: ${availableSections.join(', ')}
- Preamble preserved: Yes (do not modify)
- Document environment: Identified for content injection

DATA TO INJECT:
${resumeDataJson}

TEMPLATE:
\`\`\`tex
${templateContent}
\`\`\`

INJECTION STRATEGY:
1. For each section in the template:
   - Identify the section (e.g., \\section{Experience})
   - Remove any placeholder text or old content between section header and next section
   - Inject relevant resume data in the same format as existing entries
   - Preserve all LaTeX styling commands

2. For work experience/projects (if exists):
   - Use template's existing bullet/entry format
   - Inject: company/title, date, location, description
   - Format dates to match template pattern

3. For education (if exists):
   - Inject: school, degree, field, graduation date
   - Include GPA if available and template has space

4. For skills (if exists):
   - Group by category if template supports it
   - Use comma-separated items or \\item commands as template dictates

5. For contact info/header:
   - Update name, email, phone, location, links
   - Preserve header formatting and spacing

SPECIAL HANDLING:
- Replace placeholder text like "Add your experience here" with actual data
- Remove sample/example entries
- Keep all comments that begin with % (likely explanatory)
- Maintain paragraph spacing and margins
- If section is empty in resume, either remove section or leave empty formatted section

OUTPUT REQUIREMENTS:
- Return ONLY valid, compilable LaTeX code
- No explanations, markdown formatting, or code blocks
- Code fence (triple backticks) will be removed
- Ensure all braces are balanced
- Verify all \\begin{} have matching \\end{}
- The output must be immediately compilable with pdflatex

START INJECTING NOW - Output the complete modified LaTeX template:`;
}