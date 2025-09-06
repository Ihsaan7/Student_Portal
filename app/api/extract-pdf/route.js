import { NextResponse } from 'next/server';

// PDF text extraction with proper error handling
async function extractPDFText(buffer) {
  try {
    console.log('extractPDFText called with buffer size:', buffer.length);
    
    // Import pdf-parse
    console.log('Importing pdf-parse...');
    const pdfParse = await import('pdf-parse');
    console.log('pdf-parse imported successfully');
    
    // Configure pdf-parse options for better text extraction
    const options = {
      // Normalize whitespace
      normalizeWhitespace: true,
      // Disable image extraction to focus on text
      disableCombineTextItems: false
    };
    
    console.log('Attempting PDF extraction with pdf-parse...');
    const data = await pdfParse.default(buffer, options);
    
    console.log(`Successfully extracted ${data.text.length} characters from ${data.numpages} pages`);
    
    // Validate that we got actual text content
    if (!data.text || data.text.trim().length === 0) {
      throw new Error('No text content found in PDF');
    }
    
    // Check if the extracted text looks like raw PDF data
    if (data.text.includes('stream') && data.text.includes('endstream') && data.text.includes('%PDF')) {
      throw new Error('Extracted raw PDF metadata instead of text content');
    }
    
    return {
      text: data.text,
      pages: data.numpages,
      info: data.info || {}
    };
  } catch (error) {
    console.error('PDF extraction failed:', error.message);
    
    // Return a proper error message instead of raw PDF data
    return {
      text: `Error: Unable to extract readable text from this PDF file. 

Possible reasons:
• The PDF may contain scanned images instead of selectable text
• The PDF may be password-protected or encrypted
• The PDF may have a complex layout that requires OCR
• The file may be corrupted

Please try:
1. Converting the PDF to a text-based format
2. Using a different PDF file with selectable text
3. Ensuring the PDF is not password-protected

Error details: ${error.message}`,
      pages: 1,
      info: { error: error.message }
    };
  }
}

export async function POST(request) {
  try {
    console.log('PDF extraction API called');
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      console.log('No file provided in request');
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    console.log(`File received: ${file.name}, size: ${file.size}, type: ${file.type}`);

    // Validate file type
    if (file.type !== 'application/pdf') {
      console.log(`Invalid file type: ${file.type}`);
      return NextResponse.json(
        { error: 'File must be a PDF' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      console.log(`File too large: ${file.size} bytes`);
      return NextResponse.json(
        { error: 'File size must be less than 10MB' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    console.log('Converting file to buffer...');
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log(`Buffer created, size: ${buffer.length} bytes`);
    
    // Extract text using our fallback function
    console.log('Starting PDF text extraction...');
    const data = await extractPDFText(buffer);
    let extractedText = data.text;
    
    // Remove excessive whitespace and normalize line breaks
    extractedText = extractedText
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]{2,}/g, ' ')
      .trim();

    // Basic structure detection for better formatting
    const lines = extractedText.split('\n');
    const structuredText = lines
      .map(line => {
        const trimmedLine = line.trim();
        
        // Skip empty lines
        if (!trimmedLine) return '';
        
        // Detect potential headings (short lines, often capitalized)
        if (trimmedLine.length < 100 && 
            (trimmedLine === trimmedLine.toUpperCase() || 
             /^[A-Z][^.!?]*$/.test(trimmedLine) ||
             /^\d+\.?\s/.test(trimmedLine) ||
             /^Chapter|^Section|^Part|^Unit/i.test(trimmedLine))) {
          return `\n## ${trimmedLine}\n`;
        }
        
        return trimmedLine;
      })
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    // Extract metadata
    const metadata = {
      pages: data.pages,
      info: data.info || {},
      filename: file.name,
      size: file.size,
      extractedAt: new Date().toISOString()
    };

    return NextResponse.json({
      text: structuredText,
      metadata: metadata,
      wordCount: structuredText.split(/\s+/).length,
      characterCount: structuredText.length
    });

  } catch (error) {
    console.error('Error extracting PDF text:', error);
    
    // Handle specific PDF parsing errors
    if (error.message?.includes('Invalid PDF')) {
      return NextResponse.json(
        { error: 'Invalid or corrupted PDF file' },
        { status: 400 }
      );
    }
    
    if (error.message?.includes('Password')) {
      return NextResponse.json(
        { error: 'Password-protected PDFs are not supported' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to extract text from PDF. Please try again.' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS(request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}