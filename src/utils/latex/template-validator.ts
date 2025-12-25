/**
 * LaTeX Template Validator
 * Uses regex-based validation for LaTeX document structure
 */

import type { TexValidationResult } from '@/lib/types';

/**
 * Validate LaTeX document structure and syntax
 * Uses regex to check for valid LaTeX structure
 */
export function validateTexStructure(content: string): TexValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const lines = content.split('\n');
  const stats = {
    documentclassCount: 0,
    documentEnvironmentFound: false,
    environmentCount: 0,
    totalLines: lines.length,
  };

  try {

    // Check for documentclass
    const hasDocumentClass = /\\documentclass\s*(\[.*?\])?\s*\{.*?\}/.test(content);
    if (!hasDocumentClass) {
      errors.push('Missing \\documentclass{...} declaration');
    } else {
      const docclassMatches = content.match(/\\documentclass/g);
      stats.documentclassCount = docclassMatches?.length || 0;
      if (stats.documentclassCount > 1) {
        errors.push(`Multiple \\documentclass declarations found (${stats.documentclassCount})`);
      }
    }

    // Check for document environment
    const hasBeginDocument = /\\begin\s*\{\s*document\s*\}/.test(content);
    const hasEndDocument = /\\end\s*\{\s*document\s*\}/.test(content);

    if (!hasBeginDocument) {
      errors.push('Missing \\begin{document}');
    }
    if (!hasEndDocument) {
      errors.push('Missing \\end{document}');
    }
    if (hasBeginDocument && hasEndDocument) {
      stats.documentEnvironmentFound = true;
    }

    // Count environments
    const envRegex = /\\begin\s*\{\s*\w+\s*\}/g;
    const envMatches = content.match(envRegex);
    stats.environmentCount = envMatches?.length || 0;

    // Check for unmatched braces (simple check)
    let braceCount = 0;
    let braceLine = 0;
    for (let i = 0; i < content.length; i++) {
      if (content[i] === '\n') braceLine++;
      // Skip escaped braces
      if (content[i] === '\\' && (content[i + 1] === '{' || content[i + 1] === '}')) {
        i++;
        continue;
      }
      if (content[i] === '{') braceCount++;
      if (content[i] === '}') braceCount--;
      if (braceCount < 0) {
        errors.push(`Unmatched closing brace at line ${braceLine}`);
        break;
      }
    }
    if (braceCount > 0) {
      errors.push(`${braceCount} unclosed brace(s) detected`);
    }

    // Check for common unmatched environments
    const beginMatches = (content.match(/\\begin\s*\{\s*(\w+)\s*\}/g) || []).map(m => 
      m.match(/\{(\w+)\}/)?.[1]
    );
    const endMatches = (content.match(/\\end\s*\{\s*(\w+)\s*\}/g) || []).map(m =>
      m.match(/\{(\w+)\}/)?.[1]
    );

    // Simple check for common mismatches
    const commonEnvs = ['enumerate', 'itemize', 'tabular', 'align', 'equation', 'figure', 'table'];
    for (const env of commonEnvs) {
      const beginCount = beginMatches.filter(m => m === env).length;
      const endCount = endMatches.filter(m => m === env).length;
      if (beginCount !== endCount) {
        errors.push(`Unmatched \\begin{${env}} and \\end{${env}} (${beginCount} begin, ${endCount} end)`);
      }
    }

    // Check for common unescaped special characters in content
    const unescapedSpecialChars = /(^|[^\\])[$%_&#^~](?![\w\}])/gm;
    let match;
    const charCounts: Record<string, number> = {};
    // Count but don't error - these might be intentional
    while ((match = unescapedSpecialChars.exec(content)) !== null) {
      const char = match[0].slice(-1);
      charCounts[char] = (charCounts[char] || 0) + 1;
    }

    if (charCounts['%'] && charCounts['%'] > 5) {
      warnings.push(`Many unescaped % characters (${charCounts['%']}) - might be comments`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      stats,
    };
  } catch (error) {
    // Parser caught a syntax error
    const errorMessage = error instanceof Error ? error.message : 'Unknown parse error';
    return {
      isValid: false,
      errors: [`LaTeX Parse Error: ${errorMessage}`],
      warnings: [],
      stats,
    };
  }
}
