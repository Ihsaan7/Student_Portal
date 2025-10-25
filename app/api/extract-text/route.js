import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'text/plain'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Only PDF and TXT files are supported" },
        { status: 400 }
      );
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size must be less than 10MB" },
        { status: 400 }
      );
    }

    let extractedText = '';

    if (file.type === 'text/plain') {
      // Handle text files
      const arrayBuffer = await file.arrayBuffer();
      const text = new TextDecoder().decode(arrayBuffer);
      extractedText = text;
    } else if (file.type === 'application/pdf') {
      // Handle PDF files using pdf-parse
      try {
        const pdfParse = (await import('pdf-parse')).default;
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const data = await pdfParse(buffer);
        extractedText = data.text;
      } catch (error) {
        console.error('Error parsing PDF:', error);
        
        // Try alternative PDF processing approaches
        try {
          // Alternative approach: try to extract as raw text
          const arrayBuffer = await file.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);
          const text = new TextDecoder('utf-8', { fatal: false }).decode(uint8Array);
          
          // Look for readable text patterns in the PDF
          const textMatches = text.match(/[a-zA-Z0-9\s.,!?;:'"()-]{10,}/g);
          if (textMatches && textMatches.length > 0) {
            extractedText = textMatches.join(' ').substring(0, 5000);
            console.log('Extracted text using alternative method');
          } else {
            throw new Error('No readable text found');
          }
        } catch (altError) {
          console.error('Alternative PDF extraction also failed:', altError);
          
          // Provide helpful error message with solutions
          extractedText = `⚠️ PDF Text Extraction Failed

**File:** ${file.name} (${Math.round(file.size / 1024)}KB)

**Why this happened:**
• Your PDF contains scanned images instead of selectable text
• The PDF might be password protected
• The file could be corrupted or in an unsupported format

**Solutions:**

**Option 1: Use the "Paste Text" button**
• Copy text from your PDF manually
• Click the "Paste Text" button below
• Paste your content and proceed

**Option 2: Convert your PDF**
• Use online tools like SmallPDF or ILovePDF
• Convert PDF to TXT format
• Upload the TXT file instead

**Option 3: Try a different PDF**
• Use a PDF with selectable text (not scanned images)
• Ensure the PDF is not password protected

**Quick Test:** Try selecting text in your PDF with your mouse. If you can't select text, it's a scanned image and needs conversion.

Click "Paste Text" below to manually input your content! 📝`;
        }
      }
    }

    // Format the extracted text
    const formattedText = formatExtractedText(extractedText);

    // Calculate metadata
    const wordCount = extractedText.split(/\s+/).filter(word => word.length > 0).length;
    const characterCount = extractedText.length;

    return NextResponse.json({
      text: formattedText,
      metadata: {
        filename: file.name,
        size: file.size,
        type: file.type
      },
      wordCount,
      characterCount
    });

  } catch (error) {
    console.error('Error extracting text:', error);
    return NextResponse.json(
      { error: "Failed to extract text from file" },
      { status: 500 }
    );
  }
}

function formatExtractedText(text) {
  if (!text || text.trim().length === 0) {
    return "No text content could be extracted from this file.";
  }

  // Clean up the text and handle special characters
  let formatted = text
    .replace(/\r\n/g, '\n')  // Normalize line endings
    .replace(/\r/g, '\n')    // Handle old Mac line endings
    .replace(/\n{3,}/g, '\n\n')  // Reduce multiple line breaks
    .replace(/�/g, '')       // Remove replacement characters
    .replace(/\u00A0/g, ' ') // Replace non-breaking spaces
    .replace(/\u2013/g, '-') // Replace en-dash
    .replace(/\u2014/g, '--') // Replace em-dash
    .replace(/\u2018/g, "'") // Replace left single quote
    .replace(/\u2019/g, "'") // Replace right single quote
    .replace(/\u201C/g, '"') // Replace left double quote
    .replace(/\u201D/g, '"') // Replace right double quote
    .replace(/\u2022/g, '•') // Replace bullet point
    .replace(/\u2026/g, '...') // Replace ellipsis
    .replace(/e\?/g, 'ef')   // Fix common OCR errors
    .replace(/\?/g, 'fi')    // Fix ligature issues
    .replace(/\s+/g, ' ')    // Normalize whitespace
    .trim();

  // Try to identify and format headings
  const lines = formatted.split('\n');
  const formattedLines = lines.map(line => {
    const trimmed = line.trim();
    
    // Skip empty lines
    if (!trimmed) return line;
    
    // Detect potential headings (short lines, all caps, or starting with numbers)
    if (trimmed.length < 60 && 
        (trimmed === trimmed.toUpperCase() || 
         /^\d+\.?\s/.test(trimmed) ||
         /^[A-Z][A-Z\s]+$/.test(trimmed))) {
      return `\n## ${trimmed}\n`;
    }
    
    return line;
  });

  return formattedLines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

// Handle OPTIONS request for CORS
export async function OPTIONS(request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}