'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload, FileText, AlertCircle, CheckCircle2, Loader2, Download } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Resume, Job, TemplateInjectionResult } from '@/lib/types';
import { injectResumeIntoTemplate, validateLatexTemplate } from '@/utils/actions/latex-template/actions';
import { useDefaultModel } from '@/hooks/use-api-keys';
import { cn } from '@/lib/utils';

interface TemplateInjectionDialogProps {
  resume: Resume;
  job: Job | null;
  onInjected?: (content: string) => void;
  triggerClassName?: string;
  triggerLabel?: string;
}

export function TemplateInjectionDialog({
  resume,
  job,
  triggerClassName,
  triggerLabel,
}: TemplateInjectionDialogProps) {
  const [open, setOpen] = useState(false);
  const [templateContent, setTemplateContent] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<TemplateInjectionResult | null>(null);
  const [inputValidation, setInputValidation] = useState<boolean | null>(null);
  const { defaultModel } = useDefaultModel();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file extension
    if (!file.name.endsWith('.tex')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select a .tex file',
        variant: 'destructive',
      });
      return;
    }

    // Check file size (max 1MB)
    if (file.size > 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please select a file smaller than 1MB',
        variant: 'destructive',
      });
      return;
    }

    try {
      const text = await file.text();
      setTemplateContent(text);
      setFileName(file.name);
      setResult(null);
      setInputValidation(null);

      // Quick validate input
      const validation = await validateLatexTemplate(text);
      setInputValidation(validation.success);

      if (!validation.success) {
        toast({
          title: 'Template validation failed',
          description: validation.error || 'Template has LaTeX syntax errors',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error reading file',
        description: error instanceof Error ? error.message : 'Failed to read file',
        variant: 'destructive',
      });
    }
  };

  const handleInject = async () => {
    if (!templateContent) {
      toast({
        title: 'No template selected',
        description: 'Please select a .tex file first',
        variant: 'destructive',
      });
      return;
    }

    if (!defaultModel) {
      toast({
        title: 'No model selected',
        description: 'Please select an AI model from the banner',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      // Create config object with selected model
      const config = {
        model: defaultModel,
        apiKeys: [],
      };

      const injectionResult = await injectResumeIntoTemplate(
        resume,
        templateContent,
        defaultModel,
        config
      );

      setResult(injectionResult);

      if (injectionResult.success) {
        toast({
          title: 'Template injection successful',
          description: `Resume data successfully injected into ${fileName}`,
        });
      } else {
        toast({
          title: 'Injection failed',
          description: injectionResult.error || 'Failed to inject template',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!result?.content) return;

    const element = document.createElement('a');
    const file = new Blob([result.content], { type: 'application/x-tex' });
    element.href = URL.createObjectURL(file);
    element.download = `Resume_${resume.last_name}_${job?.position_title || ''}_${job?.company_name || ''}.tex`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    URL.revokeObjectURL(element.href);

    toast({
      title: 'Downloaded',
      description: `${element.download} has been downloaded`,
    });
  };

  const handleDownloadAnyway = () => {
    if (!result?.content) return;
    handleDownload();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'h-8 px-3 text-[11px] font-medium transition-all duration-300',
            triggerClassName
          )}
        >
          <Upload className="mr-1.5 h-3.5 w-3.5" />
          {triggerLabel ?? 'Inject Into'}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Inject Resume into LaTeX Template</DialogTitle>
          <DialogDescription>
            Select a .tex template file. Your resume data will be intelligently injected using{' '}
            <span className="font-semibold">{defaultModel || 'your selected model'}</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* File Upload */}
          {!result && (
            <div className="space-y-3">
              <Label>Select .tex Template File</Label>

              <div className="relative border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-purple-400 transition-colors">
                <input
                  type="file"
                  accept=".tex"
                  onChange={handleFileSelect}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="pointer-events-none">
                  <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-600">
                    Click or drag .tex file here
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Maximum 1MB</p>
                </div>
              </div>

              {fileName && (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-start space-x-3">
                    <FileText className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {fileName}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {templateContent.length.toLocaleString()} characters
                      </p>
                    </div>
                    {inputValidation !== null && (
                      <div className="flex-shrink-0">
                        {inputValidation ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-amber-600" />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {templateContent && (
                <div className="space-y-2">
                  <Label className="text-xs text-slate-500">Template Preview</Label>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 max-h-48 overflow-y-auto font-mono text-xs text-slate-600 whitespace-pre-wrap break-words">
                    {templateContent.substring(0, 500)}
                    {templateContent.length > 500 && '...'}
                  </div>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800">
                  <span className="font-semibold">Selected Model:</span> {defaultModel || 'None (select from banner)'}
                </p>
              </div>

              <Button
                onClick={handleInject}
                disabled={!templateContent || !defaultModel || isLoading || inputValidation === false}
                className="w-full"
                size="lg"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? 'Injecting...' : 'Inject Resume Data'}
              </Button>
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-4">
              <div
                className={cn(
                  'p-4 rounded-lg border-2 flex items-start space-x-3',
                  result.success
                    ? 'bg-emerald-50 border-emerald-300'
                    : 'bg-red-50 border-red-300'
                )}
              >
                {result.success ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p
                    className={cn(
                      'font-semibold text-sm',
                      result.success ? 'text-emerald-900' : 'text-red-900'
                    )}
                  >
                    {result.success ? 'Injection Successful' : 'Injection Failed'}
                  </p>
                  {result.error && (
                    <p className="text-xs text-slate-600 mt-1">{result.error}</p>
                  )}
                </div>
              </div>

              {/* Validation Details */}
              {result.validationDetails && (
                <div className="space-y-2">
                  <Label className="text-xs">Validation Details</Label>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-2">
                    {result.validationDetails.errors.length > 0 && (
                      <div>
                        <p className="font-semibold text-red-600">Errors:</p>
                        <ul className="list-disc list-inside space-y-1 text-slate-600 ml-2">
                          {result.validationDetails.errors.map((err, i) => (
                            <li key={i}>{err}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {result.validationDetails.warnings.length > 0 && (
                      <div>
                        <p className="font-semibold text-amber-600">Warnings:</p>
                        <ul className="list-disc list-inside space-y-1 text-slate-600 ml-2">
                          {result.validationDetails.warnings.map((warn, i) => (
                            <li key={i}>{warn}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className="text-slate-600 border-t border-slate-200 pt-2 mt-2">
                      <p>
                        <span className="font-semibold">Lines:</span>{' '}
                        {result.validationDetails.stats.totalLines}
                      </p>
                      <p>
                        <span className="font-semibold">Environments:</span>{' '}
                        {result.validationDetails.stats.environmentCount}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Generated Content Preview */}
              {result.content && (
                <div className="space-y-2">
                  <Label className="text-xs">Generated Template Preview</Label>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 max-h-48 overflow-y-auto font-mono text-xs text-slate-600 whitespace-pre-wrap break-words">
                    {result.content.substring(0, 500)}
                    {result.content.length > 500 && '...'}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                {result.success && result.content && (
                  <Button
                    onClick={handleDownload}
                    className="flex-1"
                    size="lg"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download .tex File
                  </Button>
                )}
                {!result.success && result.content && (
                  <Button
                    onClick={handleDownloadAnyway}
                    variant="outline"
                    className="flex-1"
                    size="lg"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download Anyway
                  </Button>
                )}
                <Button
                  onClick={() => {
                    setResult(null);
                    setTemplateContent('');
                    setFileName('');
                    setInputValidation(null);
                  }}
                  variant="outline"
                  className="flex-1"
                  size="lg"
                >
                  Try Another
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
