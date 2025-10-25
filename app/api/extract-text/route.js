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
        // Fallback response for PDF files
        extractedText = `PDF file "${file.name}" was uploaded successfully, but text extraction failed.

This could be due to:
• The PDF contains scanned images instead of text
• The PDF is password protected
• The file is corrupted

Please try:
1. Converting your PDF to a text file
2. Copy and paste the text content manually
3. Using a different PDF file

File size: ${Math.round(file.size / 1024)}KB`;
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

  // Clean up the text
  let formatted = text
    .replace(/\r\n/g, '\n')  // Normalize line endings
    .replace(/\r/g, '\n')    // Handle old Mac line endings
    .replace(/\n{3,}/g, '\n\n')  // Reduce multiple line breaks
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