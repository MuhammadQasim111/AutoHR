
import * as pdfjsLib from 'pdfjs-dist';

// Configure worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.mjs`;

export interface PdfExtractionResult {
  text: string;
  links: string[];
}

export async function extractFromPdf(file: File): Promise<PdfExtractionResult> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  
  try {
    const pdf = await loadingTask.promise;
    let fullText = "";
    const extractedLinks: string[] = [];
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      
      // Extract visible text
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(" ");
      fullText += pageText + "\n";

      // Extract annotations (hyperlinks)
      const annotations = await page.getAnnotations();
      annotations.forEach((annot: any) => {
        if (annot.subtype === 'Link' && annot.url) {
          extractedLinks.push(annot.url);
        }
      });
    }
    
    return {
      text: fullText.trim(),
      links: Array.from(new Set(extractedLinks)) // De-duplicate links
    };
  } catch (error) {
    console.error("PDF Extraction Error:", error);
    throw new Error("Failed to extract data from PDF. Ensure it's not a scanned image.");
  }
}
