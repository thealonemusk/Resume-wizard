import { useState } from "react";
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
                  <div className="max-w-[210mm] mx-auto bg-white shadow-2xl p-12 min-h-[297mm]">
                    <div className="text-center mb-8">
                      <p className="text-slate-500 text-sm">
                        📄 LaTeX Preview
                      </p>
                      <p className="text-slate-400 text-xs mt-2">
                        Compile the .tex file to see the final PDF output
                      </p>
                      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-900 font-medium mb-2">
                          To compile your resume:
                        </p>
                        <ol className="text-xs text-blue-800 text-left space-y-1 max-w-md mx-auto">
                          <li>1. Download the .tex file</li>
                          <li>2. Use Overleaf, TeXShop, or pdflatex to compile</li>
                          <li>3. Generate your final PDF resume</li>
                        </ol>
                      </div>
                    </div>
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