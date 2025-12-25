'use server';

import { Resume, TemplateInjectionResult } from '@/lib/types';
import { validateTexStructure } from '@/utils/latex/template-validator';
import { buildTemplateInjectionPrompt } from '@/utils/latex/prompt-engineering';
import { generateText } from 'ai';
import { initializeAIClient, type AIConfig } from '@/utils/ai-tools';
import { getSubscriptionPlan } from '@/utils/actions/stripe/actions';

/**
 * Server action to inject resume data into a LaTeX template
 * Uses the selected AI model from banner to perform the injection
 */
export async function injectResumeIntoTemplate(
  resumeData: Resume,
  templateContent: string,
  selectedModel: string,
  config?: AIConfig
): Promise<TemplateInjectionResult> {
  try {
    // Step 1: Validate input template structure
    const inputValidation = validateTexStructure(templateContent);
    if (!inputValidation.isValid) {
      return {
        success: false,
        error: 'Input template has LaTeX structural errors and cannot be processed',
        validationDetails: inputValidation,
      };
    }

    if (inputValidation.stats.documentEnvironmentFound === false) {
      return {
        success: false,
        error: 'Input template must contain \\begin{document}...\\end{document}',
        validationDetails: inputValidation,
      };
    }

    // Verify model is provided
    if (!selectedModel) {
      return {
        success: false,
        error: 'No AI model selected. Please select a model from the banner.',
      };
    }

    console.log(`[LaTeX Injection] Using model: ${selectedModel}`);
    console.log(`[LaTeX Injection] Template lines: ${inputValidation.stats.totalLines}`);

    // Step 2: Build intelligent prompt with template structure insights
    const prompt = buildTemplateInjectionPrompt(resumeData, templateContent);

    // Step 3: Call the selected AI model
    console.log(`[LaTeX Injection] Calling AI model for template injection...`);
    
    // Get subscription plan to determine if pro
    const { plan } = await getSubscriptionPlan(true);
    const isPro = plan === 'pro';
    
    // Initialize AI client - use provided config or create one
    const aiClientConfig = config || { model: selectedModel, apiKeys: [] };
    const aiClient = initializeAIClient(aiClientConfig, isPro);

    const { text: generatedContent } = await generateText({
      model: aiClient,
      prompt,
      temperature: 0.2, // Low temperature for consistency
      maxTokens: 8000,
    });

    if (!generatedContent) {
      return {
        success: false,
        error: 'AI model returned empty response',
      };
    }

    let finalContent = generatedContent;

    // Remove markdown code blocks if present (some models wrap output)
    finalContent = finalContent
      .replace(/^```(?:tex|latex)?\n?/i, '')
      .replace(/\n?```$/i, '')
      .trim();

    console.log(`[LaTeX Injection] Generated content length: ${finalContent.length} chars`);

    // Step 4: Validate output template structure
    const outputValidation = validateTexStructure(finalContent);

    if (!outputValidation.isValid) {
      console.error('[LaTeX Injection] Output validation failed:', outputValidation.errors);
      return {
        success: false,
        error: 'Generated template has LaTeX structural issues',
        validationDetails: outputValidation,
        content: finalContent, // Return content for manual review
      };
    }

    // All checks passed
    console.log('[LaTeX Injection] Successfully completed template injection');
    return {
      success: true,
      content: finalContent,
      validationDetails: outputValidation,
    };
  } catch (error) {
    console.error('[LaTeX Injection] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      success: false,
      error: `Failed to inject template: ${errorMessage}`,
    };
  }
}

/**
 * Validate a LaTeX template without injection
 * Useful for checking if a template file is valid before injection
 */
export async function validateLatexTemplate(
  templateContent: string
): Promise<TemplateInjectionResult> {
  try {
    const validation = validateTexStructure(templateContent);
    return {
      success: validation.isValid,
      error: validation.isValid
        ? undefined
        : `Template validation failed: ${validation.errors.join(', ')}`,
      validationDetails: validation,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: `Validation error: ${errorMessage}`,
    };
  }
}
