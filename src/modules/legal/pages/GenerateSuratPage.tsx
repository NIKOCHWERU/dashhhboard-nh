"use client";
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { FileText, Download, Check, UploadCloud } from "lucide-react";
import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import { saveAs } from "file-saver";

export default function GenerateSuratPage() {
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [placeholders, setPlaceholders] = useState<string[]>([]);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setTemplateFile(file);
    setIsSuccess(false);
    
    // Read the file and extract placeholders
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result;
        if (content) {
          const zip = new PizZip(content);
          const doc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
          });
          
          // Regex to extract all {{variables}} from the doc
          const text = doc.getFullText();
          const regex = /\{\{([^}]+)\}\}/g;
          let match;
          const found = new Set<string>();
          while ((match = regex.exec(text)) !== null) {
            found.add(match[1].trim());
          }
          
          setPlaceholders(Array.from(found));
          setFormData({});
        }
      } catch (err) {
        console.error("Error reading docx template", err);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleInputChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleGenerate = () => {
    if (!templateFile) return;
    setIsGenerating(true);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result;
        if (content) {
          const zip = new PizZip(content);
          const doc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
          });
          
          doc.render(formData);
          
          const out = doc.getZip().generate({
            type: "blob",
            mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          });
          
          saveAs(out, `Generated_${templateFile.name}`);
          setIsSuccess(true);
          setIsGenerating(false);
        }
      } catch (err) {
        console.error("Error generating document", err);
        setIsGenerating(false);
      }
    };
    reader.readAsArrayBuffer(templateFile);
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Generate Surat</h1>
        <p className="text-gray-500">Automate document creation from DOCX templates.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 h-fit">
          <CardHeader>
            <CardTitle>1. Upload Template</CardTitle>
            <CardDescription>Upload a .docx file containing {"{{placeholders}}"}.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:bg-gray-50 transition cursor-pointer">
              <input 
                type="file" 
                accept=".docx" 
                className="hidden" 
                id="template-upload"
                onChange={handleFileUpload}
              />
              <label htmlFor="template-upload" className="cursor-pointer flex flex-col items-center">
                <UploadCloud className="w-10 h-10 text-brand-500 mb-3" />
                <span className="font-medium text-gray-900">Click to upload template</span>
                <span className="text-xs text-gray-500 mt-1">.docx format only</span>
              </label>
            </div>
            
            {templateFile && (
              <div className="mt-4 p-3 bg-brand-50 rounded-lg border border-brand-100 flex items-center gap-3">
                <FileText className="w-5 h-5 text-brand-600" />
                <span className="text-sm font-medium text-brand-900 truncate">{templateFile.name}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>2. Fill Data</CardTitle>
            <CardDescription>
              {placeholders.length > 0 
                ? `Found ${placeholders.length} fields to fill.` 
                : "Upload a template to scan fields automatically."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {placeholders.length > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {placeholders.map((key) => (
                    <div key={key} className="space-y-1">
                      <label className="text-sm font-medium text-gray-700 capitalize">
                        {key.replace(/_/g, ' ')}
                      </label>
                      <Input 
                        placeholder={`Enter ${key.replace(/_/g, ' ')}`} 
                        value={formData[key] || ""}
                        onChange={(e) => handleInputChange(key, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
                
                <div className="pt-4 border-t border-gray-100 flex justify-end gap-3 mt-6">
                  {isSuccess && (
                    <span className="flex items-center text-sm text-emerald-600 font-medium mr-auto">
                      <Check className="w-4 h-4 mr-1" /> Generated Successfully
                    </span>
                  )}
                  <Button 
                    onClick={handleGenerate} 
                    isLoading={isGenerating}
                    disabled={Object.keys(formData).length < placeholders.length}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Generate & Download DOCX
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-100 rounded-xl">
                Please upload a template first to generate the form.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
