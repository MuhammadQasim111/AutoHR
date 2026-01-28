
import React, { useState, useRef } from 'react';
import { CandidateInputs } from '../types';
import { extractFromPdf } from '../services/pdfService';
import { detectParticulars, extractRecentJobTitle, inferTargetRole } from '../services/regexService';

interface InputFormProps {
  onSubmit: (inputs: CandidateInputs) => void;
  isLoading: boolean;
}

const InputForm: React.FC<InputFormProps> = ({ onSubmit, isLoading }) => {
  const [formData, setFormData] = useState<CandidateInputs>({
    resumeText: '',
    githubUrl: '',
    linkedinUrl: '',
    roleContext: 'Software Engineer'
  });
  const [inferredTitle, setInferredTitle] = useState<string | null>(null);
  const [isAutoInferred, setIsAutoInferred] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [detectionMessage, setDetectionMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.resumeText || !formData.roleContext) {
      alert("Resume text is mandatory for evaluation.");
      return;
    }
    onSubmit(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (e.target.name === 'roleContext') setIsAutoInferred(false); // User override
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert("Only PDF files are supported for auto-extraction.");
      return;
    }

    setExtracting(true);
    setDetectionMessage(null);
    setInferredTitle(null);
    setIsAutoInferred(false);

    try {
      const { text, links } = await extractFromPdf(file);
      const detected = detectParticulars(text, links);
      
      // Autonomous Role Inference
      const rawTitle = extractRecentJobTitle(text);
      const inferredRole = inferTargetRole(rawTitle, text);
      
      setFormData(prev => ({ 
        ...prev, 
        resumeText: text,
        githubUrl: detected.github || prev.githubUrl,
        linkedinUrl: detected.linkedin || prev.linkedinUrl,
        roleContext: inferredRole || prev.roleContext
      }));

      setInferredTitle(rawTitle);
      setIsAutoInferred(true);

      const detectedList = [];
      if (detected.github) detectedList.push(`GitHub`);
      if (detected.linkedin) detectedList.push(`LinkedIn`);
      
      setDetectionMessage(`ANALYSIS SUCCESSFUL: Profile links and role context extracted.`);

    } catch (error) {
      console.error(error);
      alert("Extraction failed. Please paste the resume manually.");
    } finally {
      setExtracting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full max-w-2xl mx-auto p-8 border-2 border-white bg-zinc-900 shadow-[8px_8px_0px_0px_rgba(255,255,255,1)]">
      <div className="space-y-2">
        <div className="flex justify-between items-center mb-1">
          <label className="block text-xs uppercase font-bold tracking-widest text-zinc-400">Target Role</label>
          {isAutoInferred && (
            <span className="text-[9px] bg-green-500 text-black px-2 py-0.5 font-black uppercase tracking-tighter rounded-sm animate-pulse">
              Autonomously Inferred
            </span>
          )}
        </div>
        <select
          name="roleContext"
          value={formData.roleContext}
          onChange={handleChange}
          className={`w-full bg-black border-2 p-3 text-white transition-colors outline-none font-bold ${isAutoInferred ? 'border-green-500' : 'border-zinc-700 focus:border-white'}`}
        >
          <option>Software Engineer</option>
          <option>Product Manager</option>
          <option>Founding Engineer</option>
          <option>Operations Lead</option>
          <option>Data Scientist</option>
          <option>General Autonomy Check</option>
        </select>
        {inferredTitle && (
          <p className="text-[10px] text-zinc-500 mt-1 uppercase font-bold tracking-wider">
            Detected: <span className="text-zinc-300">{inferredTitle}</span>
          </p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-end">
          <label className="block text-xs uppercase font-bold tracking-widest text-zinc-400">Experience Narrative</label>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-[10px] bg-white text-black px-3 py-1 font-black uppercase tracking-tighter hover:bg-zinc-300 transition-colors border border-white"
          >
            {extracting ? 'EXTRACTING...' : 'UPLOAD RESUME (PDF)'}
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".pdf"
            className="hidden"
          />
        </div>
        <textarea
          name="resumeText"
          value={formData.resumeText}
          onChange={handleChange}
          placeholder="Upload a PDF or paste your raw career data here..."
          className="w-full h-48 bg-black border-2 border-zinc-700 p-4 text-white focus:border-white transition-colors outline-none resize-none mono text-sm leading-relaxed"
        />
        {detectionMessage && (
          <div className="bg-white text-black text-[10px] font-black uppercase p-3 tracking-tighter border-2 border-white animate-in slide-in-from-top-2 duration-300">
             {detectionMessage}
          </div>
        )}
      </div>

      <div className="space-y-4 pt-4 border-t border-white/10">
        <div className="space-y-2">
          <label className="block text-xs uppercase font-bold tracking-widest text-zinc-400">GitHub Profile URL</label>
          <input
            type="url"
            name="githubUrl"
            value={formData.githubUrl}
            onChange={handleChange}
            placeholder="https://github.com/your-username"
            className="w-full bg-black border-2 border-zinc-700 p-3 text-white focus:border-white transition-colors outline-none font-bold mono text-sm"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-xs uppercase font-bold tracking-widest text-zinc-400">LinkedIn Profile URL</label>
          <input
            type="url"
            name="linkedinUrl"
            value={formData.linkedinUrl}
            onChange={handleChange}
            placeholder="https://linkedin.com/in/your-profile"
            className="w-full bg-black border-2 border-zinc-700 p-3 text-white focus:border-white transition-colors outline-none font-bold mono text-sm"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading || extracting}
        className={`w-full py-5 text-center text-black font-black uppercase tracking-tighter text-2xl transition-all ${
          isLoading || extracting ? 'bg-zinc-600 cursor-not-allowed' : 'bg-white hover:bg-zinc-200 active:translate-y-1 active:translate-x-1 active:shadow-none shadow-[4px_4px_0px_0px_rgba(200,200,200,1)]'
        }`}
      >
        {isLoading ? 'EXECUTING SIGNAL ANALYSIS...' : 'INITIATE GATE EVALUATION'}
      </button>
      
      <p className="text-[10px] text-zinc-500 uppercase font-bold text-center tracking-widest">
        Stateless Evaluation Engine // Zero Data Retention
      </p>
    </form>
  );
};

export default InputForm;
