import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Separator } from "./ui/separator";
import { Upload, Settings, Sparkles, Link as LinkIcon, Zap, Shield, Clock } from "lucide-react";
import ResumeEditor from "./ResumeEditor";
import { GoogleGenerativeAI } from "@google/generative-ai";

function Home() {
  const [jobDescription, setJobDescription] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [extractedSkills, setExtractedSkills] = useState<string[]>([]);
  const [tailoredContent, setTailoredContent] = useState("");
  const [originalContent, setOriginalContent] = useState("");
  const [showEditor, setShowEditor] = useState(false);
  const [tailoringStrength, setTailoringStrength] = useState<"light" | "medium" | "strong">("medium");

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setResumeFile(e.target.files[0]);
      const reader = new FileReader();
      reader.onload = (event) => {
        setOriginalContent(event.target?.result as string || "");
      };
      reader.readAsText(e.target.files[0]);
    }
  };

  const handleTailorResume = async () => {
    if (!jobDescription && !jobUrl) {
      alert("Please provide a job description or URL");
      return;
    }
    if (!resumeFile) {
      alert("Please upload your resume");
      return;
    }
    if (!apiKey) {
      alert("Please provide your Gemini API key in Settings");
      return;
    }

    setIsProcessing(true);
    setProgress(10);

    try {
      const genAI = new GoogleGenerativeAI(apiKey);

      // Choose a model dynamically when possible. Many users see 404 for
      // hard-coded model names because their API/account doesn't have access
      // to that specific model or the API version differs. Try to list
      // available models and pick a Gemini model or any model that supports
      // generateContent. Fall back to the original value if listing fails.
      let chosenModelName: string = "gemini-2.5-flash";
      try {
        if (typeof (genAI as any).listModels === "function") {
          const listResp = await (genAI as any).listModels();
          const modelsArr = Array.isArray(listResp)
            ? listResp
            : (listResp && (listResp.models || listResp.model || []));

          if (Array.isArray(modelsArr) && modelsArr.length > 0) {
            // Look for a gemini model that supports generateContent
            const found = modelsArr.find((m: any) => {
              const name = m.name || m.model || "";
              const methods = m.supportedMethods || m.methods || [];
              return /gemini/i.test(name) && (methods.includes("generateContent") || methods.includes("generate"));
            });
            if (found) {
              chosenModelName = found.name || found.model;
            } else {
              // fallback: first model that advertises generateContent
              const anyGen = modelsArr.find((m: any) => (m.supportedMethods || m.methods || []).includes("generateContent"));
              if (anyGen) chosenModelName = anyGen.name || anyGen.model;
            }
          }
        }
      } catch (listErr) {
        // Keep the original fallback and log the listing error. The 404
        // likely comes from using a model not available for your API key.
        // We'll continue with the chosenModelName fallback.
        // eslint-disable-next-line no-console
        console.warn("Could not list models:", listErr);
      }

      const model = genAI.getGenerativeModel({ model: chosenModelName });

      setProgress(20);

      // Extract skills from job description
      const skillsPrompt = `Extract the key skills, technologies, and requirements from this job description. Return ONLY a comma-separated list of skills, nothing else:\n\n${jobDescription}`;
      
      const skillsResult = await model.generateContent(skillsPrompt);
      const skillsText = skillsResult.response.text();
      const skills = skillsText.split(',').map(s => s.trim()).filter(s => s.length > 0).slice(0, 10);
      setExtractedSkills(skills);
      
      setProgress(40);

      // Tailor the resume
      const strengthInstructions = {
        light: "Make minimal, subtle changes to better align with the job requirements. Keep most of the original content intact.",
        medium: "Make moderate changes to highlight relevant experience and skills. Reword bullet points to match job requirements while maintaining authenticity.",
        strong: "Significantly optimize the resume for ATS and job requirements. Rewrite sections to strongly emphasize matching qualifications and use keywords from the job description."
      };

      const tailorPrompt = `You are an expert resume writer specializing in ATS-friendly resumes. 

JOB DESCRIPTION:
${jobDescription}

ORIGINAL RESUME (LaTeX):
${originalContent}

INSTRUCTIONS:
${strengthInstructions[tailoringStrength]}

Your task:
1. Analyze the job description and identify key requirements, skills, and keywords
2. Modify the ORIGINAL resume to better match the job requirements
3. Make it ATS-friendly by incorporating relevant keywords naturally
4. Maintain the LaTeX formatting and structure from the original
5. Keep all personal information (name, contact, etc.) exactly as in the original
6. Return ONLY the modified LaTeX code, nothing else - no explanations, no markdown formatting

IMPORTANT: Return the complete LaTeX document with all sections, properly formatted.`;

      setProgress(60);

      const result = await model.generateContent(tailorPrompt);
      const tailoredTex = result.response.text();
      
      // Clean up the response - remove markdown code blocks if present
      let cleanedTex = tailoredTex.trim();
      if (cleanedTex.startsWith('```')) {
        cleanedTex = cleanedTex.replace(/```latex\n?/g, '').replace(/```\n?/g, '');
      }
      
      setTailoredContent(cleanedTex);
      setProgress(100);
      setIsProcessing(false);
      setShowEditor(true);
    } catch (error) {
      console.error("Error tailoring resume:", error);
      alert("Error: " + (error instanceof Error ? error.message : "Failed to tailor resume. Please check your API key and try again."));
      setIsProcessing(false);
      setProgress(0);
    }
  };

  if (showEditor) {
    return <ResumeEditor texCode={tailoredContent} originalTexCode={originalContent} onBack={() => setShowEditor(false)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Enhanced Header */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl shadow-lg">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Resume Tailor
            </h1>
          </div>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Transform your resume with AI-powered customization. Tailor your LaTeX resume to match any job description perfectly.
          </p>
          
          {/* Feature Pills */}
          <div className="flex flex-wrap justify-center gap-3 mt-6">
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-slate-200">
              <Zap className="w-4 h-4 text-yellow-600" />
              <span className="text-sm font-medium text-slate-700">AI-Powered</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-slate-200">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-slate-700">Instant Results</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-slate-200">
              <Shield className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-slate-700">Secure & Private</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Input Section */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-lg border-slate-200">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
                <CardTitle className="text-xl">Job Information</CardTitle>
                <CardDescription>Paste the job description or provide a URL to get started</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <Tabs defaultValue="description" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="description">Job Description</TabsTrigger>
                    <TabsTrigger value="url">Job URL</TabsTrigger>
                  </TabsList>
                  <TabsContent value="description" className="space-y-4">
                    <Textarea
                      placeholder="Paste the complete job description here... Include requirements, responsibilities, and qualifications."
                      className="min-h-[240px] resize-none"
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                    />
                  </TabsContent>
                  <TabsContent value="url" className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="https://example.com/job-posting"
                        value={jobUrl}
                        onChange={(e) => setJobUrl(e.target.value)}
                        className="flex-1"
                      />
                      <Button variant="outline" size="icon">
                        <LinkIcon className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-slate-500">
                      We'll automatically extract the job description from the URL
                    </p>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-slate-200">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
                <CardTitle className="text-xl">Upload Resume</CardTitle>
                <CardDescription>Upload your base LaTeX resume file (.tex)</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-12 text-center hover:border-blue-400 hover:bg-blue-50/50 transition-all cursor-pointer group">
                  <Input
                    type="file"
                    accept=".tex"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="resume-upload"
                  />
                  <label htmlFor="resume-upload" className="cursor-pointer">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Upload className="w-8 h-8 text-blue-600" />
                    </div>
                    <p className="text-base font-medium text-slate-700 mb-2">
                      {resumeFile ? (
                        <span className="text-blue-600">{resumeFile.name}</span>
                      ) : (
                        "Click to upload or drag and drop"
                      )}
                    </p>
                    <p className="text-sm text-slate-500">LaTeX files (.tex) only • Max 10MB</p>
                  </label>
                </div>
              </CardContent>
            </Card>

            {isProcessing && (
              <Card className="shadow-lg border-blue-200 bg-blue-50/50">
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm font-medium">
                      <span className="text-blue-900">Processing with Gemini AI...</span>
                      <span className="text-blue-600">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <p className="text-xs text-blue-700">
                      Analyzing job requirements and tailoring your resume...
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {extractedSkills.length > 0 && !showEditor && (
              <Card className="shadow-lg border-green-200 bg-green-50/50">
                <CardHeader>
                  <CardTitle className="text-lg text-green-900">Extracted Key Skills</CardTitle>
                  <CardDescription className="text-green-700">
                    Skills and requirements identified from the job posting
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {extractedSkills.map((skill, index) => (
                      <Badge key={index} variant="secondary" className="bg-white border-green-300 text-green-800 px-3 py-1">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Button
              onClick={handleTailorResume}
              disabled={isProcessing || !resumeFile || (!jobDescription && !jobUrl)}
              className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
              size="lg"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              {isProcessing ? "Tailoring Resume..." : "Tailor Resume with AI"}
            </Button>
          </div>

          {/* Enhanced Sidebar */}
          <div className="space-y-6">
            <Card className="shadow-lg border-slate-200">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Settings className="w-5 h-5 text-slate-700" />
                  Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="api-key" className="text-sm font-semibold">Gemini API Key</Label>
                  <Input
                    id="api-key"
                    type="password"
                    placeholder="Enter your API key"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Get your free API key from{" "}
                    <a 
                      href="https://makersuite.google.com/app/apikey" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-blue-600 hover:underline font-medium"
                    >
                      Google AI Studio
                    </a>
                  </p>
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Tailoring Strength</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button 
                      variant={tailoringStrength === "light" ? "default" : "outline"} 
                      size="sm"
                      onClick={() => setTailoringStrength("light")}
                      className="text-xs"
                    >
                      Light
                    </Button>
                    <Button 
                      variant={tailoringStrength === "medium" ? "default" : "outline"} 
                      size="sm"
                      onClick={() => setTailoringStrength("medium")}
                      className="text-xs"
                    >
                      Medium
                    </Button>
                    <Button 
                      variant={tailoringStrength === "strong" ? "default" : "outline"} 
                      size="sm"
                      onClick={() => setTailoringStrength("strong")}
                      className="text-xs"
                    >
                      Strong
                    </Button>
                  </div>
                  <p className="text-xs text-slate-500">
                    {tailoringStrength === "light" && "Subtle adjustments to match job requirements"}
                    {tailoringStrength === "medium" && "Balanced customization with key optimizations"}
                    {tailoringStrength === "strong" && "Comprehensive tailoring for maximum impact"}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100">
              <CardHeader>
                <CardTitle className="text-lg">How It Works</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-600">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                    1
                  </div>
                  <p>Paste the job description or URL</p>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                    2
                  </div>
                  <p>Upload your LaTeX resume file</p>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                    3
                  </div>
                  <p>AI analyzes and tailors your resume</p>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                    4
                  </div>
                  <p>Download your customized resume</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;