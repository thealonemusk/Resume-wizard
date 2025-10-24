import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { ScrollArea } from "./ui/scroll-area";
import { Download, FileText, ArrowLeft, Copy, Check } from "lucide-react";
import { Separator } from "./ui/separator";

interface ResumeEditorProps {
  texCode: string;
  originalTexCode: string;
  onBack: () => void;
}

function ResumeEditor({ texCode, originalTexCode, onBack }: ResumeEditorProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"tailored" | "original">("tailored");
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(texCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTex = () => {
    const blob = new Blob([texCode], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tailored-resume.tex";
    a.click();
    URL.revokeObjectURL(url);
  };

  const mountedRef = useRef(true);

  const renderPreview = useCallback(async () => {
    setIsRendering(true);
    setRenderError(null);
    setPreviewHtml(null);

    // Choose which source to render based on active tab
    const source = activeTab === "tailored" ? texCode : originalTexCode;

    try {
      // If the source doesn't include a \begin{document}, latex.js will
      // complain. For preview purposes we'll wrap fragments in a minimal
      // document so users can preview body-only snippets returned by the
      // generator. We don't modify the downloaded .tex file.
      let toRender = source;
      const hasBegin = /\\begin\{document\}/i.test(source);
      if (!hasBegin) {
        toRender = `\\documentclass{article}\n\\usepackage[utf8]{inputenc}\n\\begin{document}\n${source}\n\\end{document}`;
      }

      // Dynamically import latex.js so the dependency is optional and the
      // app doesn't fail if it's not installed. If it's missing, instruct
      // the user how to install it.
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const mod = await import(/* @vite-ignore */ "latex.js");
      const latex = (mod && (mod.default || mod)) as any;

      // Create a generator and parse
      const generator = new latex.HtmlGenerator({ hyphenate: false });
      latex.parse(toRender, { generator });

      // Prefer full document if available
      const html = (generator.documentElement && generator.documentElement().outerHTML) || (generator.domFragment && generator.domFragment().innerHTML) || generator.toString();

      if (mountedRef.current) setPreviewHtml(String(html));
    } catch (err: any) {
      // If import failed because dependency is missing, show helpful message
      const msg = err && err.message ? err.message : String(err);
      if (mountedRef.current) setRenderError(msg.includes("Cannot find module") ? "Missing dependency 'latex.js'. Install with: pnpm add latex.js (or npm install latex.js)" : `Render error: ${msg}`);
    } finally {
      if (mountedRef.current) setIsRendering(false);
    }
  }, [activeTab, texCode, originalTexCode]);

  useEffect(() => {
    mountedRef.current = true;
    // Render automatically when the component mounts or source/tab changes
    renderPreview();
    return () => {
      mountedRef.current = false;
    };
  }, [renderPreview]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <h1 className="text-2xl font-bold text-slate-900">Tailored Resume</h1>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCopy}>
                {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                {copied ? "Copied!" : "Copy Code"}
              </Button>
              <Button variant="outline" onClick={handleDownloadTex}>
                <Download className="w-4 h-4 mr-2" />
                Download .tex
              </Button>
              <Button variant="default" onClick={renderPreview} disabled={isRendering}>
                {isRendering ? "Rendering..." : "Render Preview"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Dual Pane Editor */}
      <div className="max-w-[1800px] mx-auto p-6">
        <div className="grid grid-cols-2 gap-6 h-[calc(100vh-140px)]">
          {/* Left Pane - LaTeX Code */}
          <Card className="flex flex-col shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  LaTeX Source Code
                </CardTitle>
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "tailored" | "original")}>
                    <TabsList>
                      <TabsTrigger value="tailored">Tailored</TabsTrigger>
                      <TabsTrigger value="original">Original</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-0">
                <ScrollArea className="h-full">
                  <pre className="p-6 text-sm font-mono bg-slate-950 text-slate-50 h-full">
                    <code>{activeTab === "tailored" ? texCode : originalTexCode}</code>
                  </pre>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Right Pane - Preview */}
            <Card className="flex flex-col shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-green-600" />
                  Resume Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 p-0">
                <ScrollArea className="h-full">
                  <div className="p-6 bg-slate-100">
                    <div className="max-w-[210mm] mx-auto bg-white shadow-2xl p-6 min-h-[297mm]">
                    {renderError ? (
                      <div className="text-center p-6 text-sm text-red-700">
                        <p className="font-medium">Could not render preview</p>
                        <p className="mt-2 text-xs">{renderError}</p>
                        <p className="mt-3 text-xs text-slate-500">If you see a missing dependency message, run:</p>
                        <pre className="mt-2 p-2 bg-slate-100 text-xs font-mono">pnpm add latex.js</pre>
                      </div>
                    ) : previewHtml ? (
                      <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: previewHtml }} />
                    ) : (
                      <div className="text-center mb-8 p-6">
                        <p className="text-slate-500 text-sm">📄 LaTeX Preview</p>
                        <p className="text-slate-400 text-xs mt-2">Click "Render Preview" to convert LaTeX to HTML in the browser (requires <code>latex.js</code>).</p>
                        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <p className="text-sm text-blue-900 font-medium mb-2">To compile your resume:</p>
                          <ol className="text-xs text-blue-800 text-left space-y-1 max-w-md mx-auto">
                            <li>1. Download the .tex file</li>
                            <li>2. Use Overleaf, TeXShop, or pdflatex to compile</li>
                            <li>3. Generate your final PDF resume</li>
                          </ol>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default ResumeEditor;