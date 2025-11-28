import React, { useState } from 'react';
import { AnalysisReport, Marker, LayerType, Persona } from '../types';
import { Download, Users, Lock, Share2, Check, Heart, Brain, Lightbulb, TrendingUp, CheckCircle2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import LeadModal from './LeadModal';
import { saveLead } from '../services/supabaseService';
import { EMOTIONS } from '../constants';

interface ReportPanelProps {
  report: AnalysisReport | null;
  markers: Marker[];
  isAnalyzing: boolean;
  currentUrl: string;
  activeLayer: LayerType;
  setActiveLayer: (layer: LayerType) => void;
}

const UnlockOverlay: React.FC<{ onUnlock: () => void }> = ({ onUnlock }) => (
    <div className="absolute inset-0 bg-white/50 backdrop-blur-md z-10 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 bg-lem-orange/10 rounded-full flex items-center justify-center mb-4">
            <Lock size={32} className="text-lem-orange" />
        </div>
        <h3 className="text-lg font-bold text-gray-900">Unlock Deep Insights</h3>
        <p className="text-sm text-gray-600 my-2">Get detailed persona breakdowns, psychological needs analysis, and a strategic design brief.</p>
        <button onClick={onUnlock} className="mt-4 bg-lem-orange text-white font-bold py-2 px-6 rounded-lg shadow-md hover:bg-orange-600 transition-all">
            Unlock Full Report
        </button>
    </div>
);

const PersonaCard: React.FC<{ persona: Persona }> = ({ persona }) => (
    <div className="p-4 border border-gray-200 rounded-lg bg-white shadow-sm">
        <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex-shrink-0 flex items-center justify-center text-lem-orange">
                <Users size={20} />
            </div>
            <div>
                <h4 className="font-bold text-gray-900">{persona.name}</h4>
                <p className="text-xs text-gray-500 font-medium">{persona.role}</p>
            </div>
            <span className="ml-auto text-xs font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{persona.techLiteracy} Tech</span>
        </div>
        <p className="text-xs text-gray-500 italic my-3 p-3 bg-gray-50 rounded-md">"{persona.quote}"</p>
        <div className="text-xs space-y-2">
            <p><strong className="font-bold text-gray-800">Bio:</strong> {persona.bio}</p>
            <p><strong className="font-bold text-gray-800">Goals:</strong> {persona.goals}</p>
            <p><strong className="font-bold text-gray-800">Psychographics:</strong> {persona.psychographics}</p>
            {persona.values?.length > 0 && <p><strong className="font-bold text-gray-800">Values:</strong> {persona.values.join(', ')}</p>}
            {persona.frustrations?.length > 0 && <p><strong className="font-bold text-gray-800">Frustrations:</strong> {persona.frustrations.join(', ')}</p>}
        </div>
    </div>
);

// Helper to load image for PDF
const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => resolve(img);
        img.onerror = () => {
            console.warn(`Failed to load image: ${src}`);
            reject(new Error(`Failed to load image: ${src}`));
        };
        img.src = src;
    });
};

const ReportPanel: React.FC<ReportPanelProps> = ({ report, markers, isAnalyzing, currentUrl, activeLayer, setActiveLayer }) => {
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  
  const generatePDF = async () => {
    if (!report) return;

    // A4 Size: 210mm x 297mm
    const doc = new (jsPDF as any)({ orientation: 'p', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 15;
    
    // Pre-load emotion icons
    const emotionIcons: Record<string, HTMLImageElement> = {};
    const loadPromises = Object.values(EMOTIONS).map(async (def) => {
        try {
            const img = await loadImage(def.src);
            emotionIcons[def.id] = img;
        } catch (e) {
            console.warn("Failed to load icon for PDF", def.id);
        }
    });
    await Promise.all(loadPromises);

    // Helper for header/footer
    const addHeader = (title: string) => {
        doc.setFont('helvetica', 'bold'); doc.setFontSize(18); doc.setTextColor('#F26522');
        doc.text('LEM', margin, margin);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor('#555555');
        doc.text('by METODIC', margin + 14, margin);
        
        doc.setFontSize(8); doc.setTextColor('#6B7280');
        doc.text(title, pageWidth - margin, margin, { align: 'right' });
        doc.text(`Target: ${currentUrl.substring(0, 35)}...`, pageWidth - margin, margin + 4, { align: 'right' });
        
        doc.setDrawColor('#F26522'); doc.setLineWidth(0.5); 
        doc.line(margin, margin + 8, pageWidth - margin, margin + 8);
        return margin + 18;
    };

    // --- PAGE 1: EXECUTIVE SUMMARY & BRAND VITALS ---
    let y = addHeader('Executive Summary');

    // Score Card
    doc.setFillColor('#FFF7ED'); doc.roundedRect(margin, y, pageWidth - 2 * margin, 35, 3, 3, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor('#F26522');
    doc.text('EMOTIONAL IMPACT SCORE', margin + 5, y + 10);
    doc.setFontSize(32); doc.setTextColor('#111827');
    doc.text(`${report.overallScore}/100`, margin + 5, y + 24);
    
    // Stats
    const statsX = pageWidth - margin - 60;
    doc.setFontSize(10); doc.setTextColor('#6B7280');
    doc.text('Total Insights', statsX, y + 10);
    doc.text('Personas ID', statsX, y + 18);
    doc.text('Key Emotions', statsX, y + 26);
    doc.setFontSize(10); doc.setTextColor('#111827'); doc.setFont('helvetica', 'bold');
    doc.text(markers.length.toString(), statsX + 35, y + 10, {align: 'right'});
    doc.text(report.personas.length.toString(), statsX + 35, y + 18, {align: 'right'});
    doc.text('Joy, Interest', statsX + 35, y + 26, {align: 'right'}); // Dynamic in real app
    y += 45;

    // Summary Text
    doc.setFontSize(14); doc.setTextColor('#111827'); doc.setFont('helvetica', 'bold');
    doc.text('Executive Summary', margin, y); y += 6;
    doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor('#374151');
    const summaryLines = doc.splitTextToSize(report.summary, pageWidth - 2 * margin);
    doc.text(summaryLines, margin, y);
    y += (summaryLines.length * 5) + 10;

    // Brand Values
    doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor('#111827');
    doc.text('Detected Brand Values', margin, y); y += 6;
    doc.setFontSize(9); doc.setTextColor('#4B5563');
    const valuesStr = report.brandValues.join(' • ');
    const valuesLines = doc.splitTextToSize(valuesStr, pageWidth - 2 * margin);
    doc.text(valuesLines, margin, y);
    y += (valuesLines.length * 5) + 10;

    // Audience Split
    doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor('#111827');
    doc.text('Audience Breakdown', margin, y); y += 8;
    report.audienceSplit.forEach((split, idx) => {
        doc.setFillColor('#E5E7EB');
        doc.rect(margin, y + (idx * 10), pageWidth - 2 * margin, 6, 'F');
        doc.setFillColor('#F26522');
        doc.rect(margin, y + (idx * 10), (pageWidth - 2 * margin) * (split.percentage / 100), 6, 'F');
        doc.setFontSize(8); doc.setTextColor('#111827');
        doc.text(`${split.label} (${split.percentage}%)`, margin, y + (idx * 10) - 1);
    });

    // --- MULTI-PAGE VISUAL HEATMAP ---
    if (report.screenshot) {
        // Load image to get dimensions
        const img = await loadImage(report.screenshot);

        const imgWidth = img.width;
        const imgHeight = img.height;
        const pdfContentWidth = pageWidth - 2 * margin;
        const pdfContentHeight = pageHeight - 35; // Account for header and margin
        
        // Calculate the height of the image slice in the source image that corresponds to one PDF page
        // Scale Factor: How much we scale down the image to fit PDF width
        const scaleFactor = pdfContentWidth / imgWidth;
        
        // The height of the image slice (in source pixels) that fits on one PDF page
        const sourceSliceHeight = pdfContentHeight / scaleFactor;
        
        // Total pages needed
        const totalHeatmapPages = Math.ceil(imgHeight / sourceSliceHeight);
        
        for (let i = 0; i < totalHeatmapPages; i++) {
            doc.addPage();
            y = addHeader(`Visual Heatmap (${i + 1}/${totalHeatmapPages})`);
            
            // Render the slice to a canvas
            const canvas = document.createElement('canvas');
            const sliceY = i * sourceSliceHeight;
            const sliceHeight = Math.min(sourceSliceHeight, imgHeight - sliceY);
            
            canvas.width = imgWidth;
            canvas.height = sliceHeight;
            const ctx = canvas.getContext('2d');
            
            if (ctx) {
                ctx.drawImage(img, 0, sliceY, imgWidth, sliceHeight, 0, 0, imgWidth, sliceHeight);
                const sliceDataUrl = canvas.toDataURL('image/png');
                
                // Add slice to PDF
                const pdfSliceHeight = sliceHeight * scaleFactor;
                doc.addImage(sliceDataUrl, 'PNG', margin, y, pdfContentWidth, pdfSliceHeight);
                
                // Overlay markers for this slice
                // Filter markers that fall within this Y range
                const startPercent = (sliceY / imgHeight) * 100;
                const endPercent = ((sliceY + sliceHeight) / imgHeight) * 100;
                
                markers.forEach(m => {
                    if (m.y >= startPercent && m.y <= endPercent) {
                        // Calculate position relative to this slice
                        // m.y is percentage of TOTAL height
                        // We need percentage of SLICE height to place on PDF
                        
                        // Convert global % to global pixels
                        const globalYPx = (m.y / 100) * imgHeight;
                        // Local pixel relative to slice start
                        const localYPx = globalYPx - sliceY;
                        
                        const pdfX = margin + (m.x / 100) * pdfContentWidth;
                        const pdfY = y + (localYPx * scaleFactor);
                        
                        if (m.layer === 'emotions' && m.emotion && emotionIcons[m.emotion]) {
                             const icon = emotionIcons[m.emotion];
                             // Draw Icon centered
                             const iconSize = 8;
                             doc.addImage(icon, 'PNG', pdfX - iconSize/2, pdfY - iconSize/2, iconSize, iconSize);
                        } else {
                            // Fallback Pill
                            let color = '#F26522';
                            let label = 'MKR';
                            if (m.layer === 'needs') { color = '#3B82F6'; label = m.need?.substring(0,3).toUpperCase() || 'NEED'; }
                            if (m.layer === 'strategy') { color = '#EF4444'; label = m.brief_type?.substring(0,3).toUpperCase() || 'STR'; }
                            
                            doc.setFillColor(color);
                            doc.roundedRect(pdfX - 6, pdfY - 2.5, 12, 5, 1, 1, 'F');
                            doc.setTextColor('#FFFFFF'); doc.setFontSize(6); doc.setFont('helvetica', 'bold');
                            doc.text(label, pdfX, pdfY + 1.5, { align: 'center' });
                        }
                    }
                });
            }
        }
    }

    // --- PAGE: DEEP PERSONAS ---
    doc.addPage();
    y = addHeader('Target Personas');
    
    report.personas.forEach((p, i) => {
        // Simple calculation to ensure we don't overflow
        if (y > pageHeight - 60) {
            doc.addPage();
            y = addHeader('Target Personas (Cont.)');
        }

        doc.setFillColor('#F9FAFB'); doc.setDrawColor('#E5E7EB');
        doc.roundedRect(margin, y, pageWidth - 2 * margin, 50, 2, 2, 'FD');
        
        // Name & Role
        doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor('#111827');
        doc.text(p.name, margin + 5, y + 8);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor('#6B7280');
        doc.text(p.role, margin + 5, y + 13);
        
        // Tags
        doc.setFillColor('#F3F4F6');
        doc.roundedRect(pageWidth - margin - 30, y + 5, 25, 6, 1, 1, 'F');
        doc.setFontSize(7); doc.setTextColor('#4B5563');
        doc.text(`${p.techLiteracy} Tech`, pageWidth - margin - 17.5, y + 9, {align: 'center'});
        
        // Quote
        doc.setFont('helvetica', 'italic'); doc.setFontSize(9); doc.setTextColor('#4B5563');
        doc.text(`"${p.quote}"`, margin + 5, y + 20);

        // Bio (Truncated if too long for card)
        doc.setFont('helvetica', 'normal');
        const bioLines = doc.splitTextToSize(p.bio, pageWidth - 2 * margin - 10);
        // Limit to 3 lines
        doc.text(bioLines.slice(0, 3), margin + 5, y + 28);
        
        y += 55;
    });

    // --- PAGE: STRATEGIC ROADMAP ---
    doc.addPage();
    y = addHeader('Strategic Roadmap');
    
    // Creative Brief
    doc.setFont('helvetica', 'bold'); doc.setFontSize(14); doc.setTextColor('#111827');
    doc.text('Creative Brief', margin, y); y += 8;
    
    doc.setFontSize(10);
    const sections = [
        { label: 'Problem Statement', text: report.creativeBrief.problemStatement },
        { label: 'How Might We', text: report.creativeBrief.howMightWe },
        { label: 'Target Emotion', text: report.creativeBrief.targetEmotion },
        { label: 'Strategic Direction', text: report.creativeBrief.strategicDirection },
    ];

    sections.forEach(sec => {
        doc.setFont('helvetica', 'bold'); doc.setTextColor('#F26522');
        doc.text(sec.label, margin, y); y += 5;
        doc.setFont('helvetica', 'normal'); doc.setTextColor('#374151');
        const lines = doc.splitTextToSize(sec.text, pageWidth - 2 * margin);
        doc.text(lines, margin, y);
        y += (lines.length * 5) + 6;
    });

    // Actionable Steps
    if (report.creativeBrief.actionableSteps && report.creativeBrief.actionableSteps.length > 0) {
        y += 5;
        doc.setFont('helvetica', 'bold'); doc.setTextColor('#F26522');
        doc.text('Actionable UX Improvements (Appraisal Theory)', margin, y); y += 5;
        report.creativeBrief.actionableSteps.forEach(step => {
            doc.setFont('helvetica', 'normal'); doc.setTextColor('#374151');
            const lines = doc.splitTextToSize(`• ${step}`, pageWidth - 2 * margin);
            doc.text(lines, margin, y);
            y += (lines.length * 5) + 2;
        });
    }

    // Benchmarks
    if (report.creativeBrief.benchmarks && report.creativeBrief.benchmarks.length > 0) {
        y += 5;
        doc.setFont('helvetica', 'bold'); doc.setTextColor('#F26522');
        doc.text('Benchmark Inspiration', margin, y); y += 5;
        report.creativeBrief.benchmarks.forEach(bm => {
             doc.setFont('helvetica', 'bold'); doc.setTextColor('#111827');
             doc.text(bm.name, margin, y);
             doc.setFont('helvetica', 'normal'); doc.setTextColor('#374151');
             const lines = doc.splitTextToSize(` - ${bm.reason}`, pageWidth - 2 * margin - 30);
             doc.text(lines, margin + 30, y);
             y += (lines.length * 5) + 2;
        });
    }
    
    y += 5;

    // SDT Scores Chart
    doc.setFont('helvetica', 'bold'); doc.setFontSize(14); doc.setTextColor('#111827');
    doc.text('Psychological Needs Assessment (SDT)', margin, y); y += 10;

    const sdtData = [
        { label: 'Autonomy', score: report.sdtScores.autonomy.score, color: [59, 130, 246] }, // Blue
        { label: 'Competence', score: report.sdtScores.competence.score, color: [34, 197, 94] }, // Green
        { label: 'Relatedness', score: report.sdtScores.relatedness.score, color: [236, 72, 153] }, // Pink
    ];

    sdtData.forEach(item => {
        doc.setFontSize(10); doc.setTextColor('#374151');
        doc.text(item.label, margin, y);
        doc.text(`${item.score}/100`, pageWidth - margin, y, {align: 'right'});
        y += 3;
        
        // Bar bg
        doc.setFillColor('#F3F4F6');
        doc.rect(margin, y, pageWidth - 2 * margin, 5, 'F');
        // Bar val
        doc.setFillColor(item.color[0], item.color[1], item.color[2]);
        doc.rect(margin, y, (pageWidth - 2 * margin) * (item.score / 100), 5, 'F');
        y += 12;
    });

    doc.save(`LEM_Report_${currentUrl.replace(/[^a-z0-9]/gi, '_')}.pdf`);
  };


  const handleShare = async () => {
    const shareUrl = `${window.location.origin}?target=${encodeURIComponent(currentUrl)}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: `LEMtool AI Analysis for ${currentUrl}`, url: shareUrl });
      } catch (error) {
        navigator.clipboard.writeText(shareUrl);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };
  
  const handleLeadSubmit = async (name: string, email: string) => {
    await saveLead(name, email, currentUrl);
    setIsUnlocked(true);
    setShowLeadModal(false);
  };

  const TabButton = ({ layer, label, icon }: { layer: LayerType, label: string, icon: React.ReactNode }) => (
    <button onClick={() => setActiveLayer(layer)} className={`flex-grow flex items-center justify-center gap-2 py-3 text-sm font-bold border-b-2 transition-all ${activeLayer === layer ? 'text-lem-orange border-lem-orange' : 'text-gray-400 border-transparent hover:text-gray-700'}`}>{icon}{label}</button>
  );

  const renderEmptyState = () => (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center text-gray-400">
      <div className="w-24 h-24 bg-gray-100 rounded-full mb-6 flex items-center justify-center border-4 border-gray-200">
        <span className="text-4xl">...</span>
      </div>
      <h3 className="font-bold text-gray-600">Enter a URL to generate an emotional profile.</h3>
    </div>
  );
  
  if (isAnalyzing) return <div className="h-full flex items-center justify-center text-gray-400 text-sm">Thinking...</div>;
  if (!report) return renderEmptyState();

  return (
    <>
      <LeadModal isOpen={showLeadModal} onClose={() => setShowLeadModal(false)} onSubmit={handleLeadSubmit} websiteUrl={currentUrl} />
      <div className="h-full flex flex-col bg-white">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Analysis</h2>
            <div className="flex items-center gap-2">
              <button onClick={handleShare} className="p-2 rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-100">{isCopied ? <Check size={16} /> : <Share2 size={16} />}</button>
              <button onClick={() => isUnlocked ? generatePDF() : setShowLeadModal(true)} className="flex items-center gap-1.5 text-sm font-bold px-3 py-2 rounded-lg bg-gray-800 text-white hover:bg-black">{isUnlocked ? <Download size={14} /> : <Lock size={14} />}{isUnlocked ? 'Download PDF' : 'Full Report'}</button>
            </div>
          </div>
          <div className="flex items-center justify-between bg-gray-800 text-white p-4 rounded-xl shadow-lg">
            <div><div className="text-xs text-gray-400 uppercase tracking-wider font-semibold">UX Emotion Score</div><div className="text-3xl font-bold">{report.overallScore}/100</div></div>
            <div className="flex flex-col items-center"><div className="h-12 w-12 rounded-full border-4 border-lem-orange flex items-center justify-center bg-gray-700"><span className="text-lg font-bold">{markers.length}</span></div><div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mt-1">Total Insights</div></div>
          </div>
        </div>
        
        <nav className="flex border-b border-gray-200 bg-gray-50/50 flex-shrink-0">
           <TabButton layer="emotions" label="Emotions" icon={<Heart size={14} />} />
           <TabButton layer="needs" label="Psych Needs" icon={<Brain size={14} />} />
           <TabButton layer="strategy" label="Strategy" icon={<Lightbulb size={14} />} />
        </nav>

        <div className="flex-1 overflow-y-auto p-6 relative">
          {!isUnlocked && <UnlockOverlay onUnlock={() => setShowLeadModal(true)} />}
          <div className={!isUnlocked ? 'filter blur-sm select-none pointer-events-none opacity-50' : ''}>
              {activeLayer === 'emotions' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-bold mb-2 text-gray-900">Executive Summary</h3>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border">{report.summary}</p>
                  </div>
                  <div>
                    <h3 className="font-bold mb-4 text-gray-900">Deep Personas</h3>
                    <div className="space-y-4">
                       {report.personas.map((p, index) => <PersonaCard key={p.name + index} persona={p} />)}
                    </div>
                  </div>
                </div>
              )}
              {activeLayer === 'needs' && (
                <div className="space-y-6">
                  <h3 className="font-bold mb-4 text-gray-900">Psychological Needs (SDT)</h3>
                  <div className="space-y-4 p-4 bg-gray-50 rounded-lg border">
                    <div>
                      <div className="flex justify-between text-sm font-bold mb-1 text-gray-800"><p>Autonomy</p><p>{report.sdtScores.autonomy.score}/100</p></div>
                      <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-blue-500 h-2 rounded-full" style={{width: `${report.sdtScores.autonomy.score}%`}}></div></div>
                       <p className="text-xs text-gray-500 mt-1">{report.sdtScores.autonomy.justification}</p>
                    </div>
                     <div>
                      <div className="flex justify-between text-sm font-bold mb-1 text-gray-800"><p>Competence</p><p>{report.sdtScores.competence.score}/100</p></div>
                      <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-green-500 h-2 rounded-full" style={{width: `${report.sdtScores.competence.score}%`}}></div></div>
                       <p className="text-xs text-gray-500 mt-1">{report.sdtScores.competence.justification}</p>
                    </div>
                     <div>
                      <div className="flex justify-between text-sm font-bold mb-1 text-gray-800"><p>Relatedness</p><p>{report.sdtScores.relatedness.score}/100</p></div>
                      <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-pink-500 h-2 rounded-full" style={{width: `${report.sdtScores.relatedness.score}%`}}></div></div>
                       <p className="text-xs text-gray-500 mt-1">{report.sdtScores.relatedness.justification}</p>
                    </div>
                  </div>
                </div>
              )}
              {activeLayer === 'strategy' && (
                 <div className="space-y-6">
                    <h3 className="font-bold mb-4 text-gray-900">Strategic Creative Brief</h3>
                    <div className="p-4 bg-gray-50 border rounded-lg space-y-3">
                      <p className="text-sm text-gray-700"><strong className="text-gray-900">Problem:</strong> {report.creativeBrief.problemStatement}</p>
                       <p className="text-sm font-bold text-gray-900 border-t border-gray-200 pt-3 mt-3">How might we: <span className="font-normal text-blue-600">{report.creativeBrief.howMightWe}</span></p>
                       <p className="text-sm text-gray-700"><strong className="text-gray-900">Direction:</strong> {report.creativeBrief.strategicDirection}</p>
                       <p className="text-sm text-gray-700"><strong className="text-gray-900">Target Emotion:</strong> {report.creativeBrief.targetEmotion}</p>
                    </div>
                    
                    {report.creativeBrief.actionableSteps && (
                        <div>
                            <h4 className="font-bold text-sm text-gray-900 mb-2 flex items-center gap-2"><CheckCircle2 size={16} className="text-green-500" /> Actionable Improvements</h4>
                            <ul className="text-sm text-gray-600 space-y-2 pl-2">
                                {report.creativeBrief.actionableSteps.map((step, i) => (
                                    <li key={i} className="flex gap-2 items-start">
                                        <span className="text-lem-orange font-bold text-xs mt-0.5">{i+1}.</span>
                                        <span>{step}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {report.creativeBrief.benchmarks && (
                        <div>
                            <h4 className="font-bold text-sm text-gray-900 mb-2 flex items-center gap-2"><TrendingUp size={16} className="text-blue-500" /> Benchmarks & Inspiration</h4>
                            <div className="space-y-3">
                                {report.creativeBrief.benchmarks.map((bm, i) => (
                                    <div key={i} className="bg-blue-50 p-3 rounded-md border border-blue-100">
                                        <p className="font-bold text-sm text-gray-800">{bm.name}</p>
                                        <p className="text-xs text-gray-600 mt-1">{bm.reason}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                 </div>
              )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ReportPanel;