import { NextResponse } from 'next/server';

// Enhanced text extraction for both PDF and TXT files with robust error handling
async function extractTextFromFile(buffer, fileType, fileName) {
  try {
    console.log(`extractTextFromFile called for ${fileName} (${fileType}) with buffer size:`, buffer.length);
    
    if (fileType === 'text/plain') {
      // Handle TXT files with multiple encoding attempts
      console.log('Processing TXT file...');
      
      let text;
      try {
        // Try UTF-8 first
        text = buffer.toString('utf-8');
      } catch (utf8Error) {
        console.log('UTF-8 failed, trying latin1...');
        try {
          text = buffer.toString('latin1');
        } catch (latin1Error) {
          console.log('Latin1 failed, trying ascii...');
          text = buffer.toString('ascii');
        }
      }
      
      // Validate that we got actual text content
      if (!text || text.trim().length === 0) {
        throw new Error('TXT_EMPTY: No readable text content found in the file');
      }
      
      // Check for binary content that might be misidentified as text
      const binaryIndicators = /[\x00-\x08\x0E-\x1F\x7F-\xFF]{10,}/;
      if (binaryIndicators.test(text)) {
        throw new Error('TXT_BINARY: File appears to contain binary data, not readable text');
      }
      
      // Clean and normalize the text
      const cleanedText = text
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .replace(/[ \t]{2,}/g, ' ')
        .replace(/[\x00-\x08\x0E-\x1F\x7F]/g, '') // Remove control characters
        .trim();
      
      console.log(`Successfully extracted ${cleanedText.length} characters from TXT file`);
      
      return {
        text: cleanedText,
        pages: 1, // TXT files are considered single page
        info: { title: fileName, encoding: 'utf-8' }
      };
    } else if (fileType === 'application/pdf') {
      // Handle PDF files with enhanced processing and fallback mechanisms
      console.log('Processing PDF file...');
      
      try {
        // Import pdf-parse
        console.log('Importing pdf-parse...');
        const pdfParse = await import('pdf-parse');
        console.log('pdf-parse imported successfully');
        
        // Try multiple extraction strategies
        const strategies = [
          {
            name: 'standard',
            options: {
              normalizeWhitespace: true,
              disableCombineTextItems: false
            }
          },
          {
            name: 'aggressive',
            options: {
              normalizeWhitespace: true,
              disableCombineTextItems: true,
              max: 0 // No page limit
            }
          },
          {
            name: 'minimal',
            options: {
              normalizeWhitespace: false,
              disableCombineTextItems: false
            }
          }
        ];
        
        let lastError = null;
        
        for (const strategy of strategies) {
          try {
            console.log(`Attempting PDF extraction with ${strategy.name} strategy...`);
            const data = await pdfParse.default(buffer, strategy.options);
            
            console.log(`Strategy ${strategy.name}: extracted ${data.text.length} characters from ${data.numpages} pages`);
            
            // Validate that we got actual text content
            if (!data.text || data.text.trim().length === 0) {
              throw new Error(`PDF_EMPTY_${strategy.name.toUpperCase()}: No text content found with ${strategy.name} strategy`);
            }
            
            // Check if the extracted text looks like raw PDF data
            if (data.text.includes('stream') && data.text.includes('endstream') && data.text.includes('%PDF')) {
              throw new Error(`PDF_RAW_DATA_${strategy.name.toUpperCase()}: Extracted raw PDF metadata instead of text content`);
            }
            
            // Check for meaningful content (not just whitespace and special characters)
            const meaningfulText = data.text.replace(/[\s\n\r\t\f\v]/g, '');
            if (meaningfulText.length < 10) {
              throw new Error(`PDF_INSUFFICIENT_CONTENT_${strategy.name.toUpperCase()}: Extracted text too short (${meaningfulText.length} chars)`);
            }
            
            // Success! Return the extracted data
            console.log(`Successfully extracted PDF content using ${strategy.name} strategy`);
            return {
              text: data.text,
              pages: data.numpages,
              info: { ...data.info, extractionStrategy: strategy.name }
            };
            
          } catch (strategyError) {
            console.log(`Strategy ${strategy.name} failed:`, strategyError.message);
            lastError = strategyError;
            continue;
          }
        }
        
        // All strategies failed
        throw new Error(`PDF_ALL_STRATEGIES_FAILED: All extraction strategies failed. Last error: ${lastError?.message}`);
        
      } catch (pdfError) {
        console.error('PDF processing error:', pdfError.message);
        
        // Determine the type of PDF error and provide appropriate guidance
        if (pdfError.message.includes('PDF_ALL_STRATEGIES_FAILED')) {
          throw new Error('PDF_CONVERSION_NEEDED: This PDF cannot be processed automatically');
        } else if (pdfError.message.includes('Invalid PDF')) {
          throw new Error('PDF_CORRUPTED: The PDF file appears to be corrupted or invalid');
        } else if (pdfError.message.includes('password') || pdfError.message.includes('encrypted')) {
          throw new Error('PDF_ENCRYPTED: This PDF is password-protected and cannot be processed');
        } else {
          throw new Error(`PDF_PROCESSING_ERROR: ${pdfError.message}`);
        }
      }
    } else {
      throw new Error(`Unsupported file type: ${fileType}`);
    }
  } catch (error) {
    console.error('Text extraction failed:', error.message);
    
    // Return a proper error message based on file type and error
    const fileTypeLabel = fileType === 'text/plain' ? 'TXT' : 'PDF';
    const isPdfConversionNeeded = error.message?.includes('PDF_CONVERSION_NEEDED');
    
    let errorText;
    if (isPdfConversionNeeded) {
      errorText = `Error: This PDF contains complex formatting that cannot be extracted directly.

🔄 **Recommended Solution:**
• **Convert PDF to TXT**: Use a PDF reader (like Adobe Reader, browser, or online converter) to:
  1. Open the PDF file
  2. Select all text (Ctrl+A)
  3. Copy the text (Ctrl+C)
  4. Paste into a text editor (Notepad, etc.)
  5. Save as a .txt file
  6. Upload the TXT file here instead

📝 **Alternative Options:**
• Use online PDF to TXT converters
• Try OCR software if the PDF contains scanned images
• Contact support if you continue having issues

💡 **Why this happens:** Some PDFs use complex formatting, embedded fonts, or are scanned images rather than selectable text.`;
    } else {
      errorText = `Error: Unable to extract readable text from this ${fileTypeLabel} file. 

Possible reasons:
• The file may be corrupted or in an unsupported format
• The file may be empty or contain only non-text data
• For PDF files: The PDF may contain scanned images instead of selectable text
• For PDF files: The PDF may be password-protected or encrypted
• The file encoding may not be supported (for TXT files)

Please try:
1. Converting the file to a different format
2. Ensuring the file contains readable text
3. For PDFs: Using OCR software to convert scanned images to text
4. For TXT files: Saving with UTF-8 encoding
5. **For PDFs: Try converting to TXT format first (see instructions above)**`;
    }
    
    return {
      text: errorText,
      pages: 0,
      info: { error: true, originalError: error.message, conversionNeeded: isPdfConversionNeeded }
    };
  }
}

export async function POST(request) {
  try {
    console.log('Text extraction API called');
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
    const allowedTypes = ['application/pdf', 'text/plain'];
    if (!allowedTypes.includes(file.type)) {
      console.log(`Invalid file type: ${file.type}`);
      return NextResponse.json(
        { error: 'File must be a PDF or TXT file' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB for PDF, 5MB for TXT)
    const maxSize = file.type === 'application/pdf' ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      const maxSizeMB = file.type === 'application/pdf' ? '10MB' : '5MB';
      console.log(`File too large: ${file.size} bytes (max: ${maxSizeMB})`);
      return NextResponse.json(
        { error: `File size must be less than ${maxSizeMB}` },
        { status: 400 }
      );
    }

    // Convert file to buffer
    console.log('Converting file to buffer...');
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log(`Buffer created, size: ${buffer.length} bytes`);
    
    // Extract text using our unified function
    console.log('Starting text extraction...');
    const data = await extractTextFromFile(buffer, file.type, file.name);
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
      type: file.type,
      extractedAt: new Date().toISOString()
    };

    return NextResponse.json({
      text: structuredText,
      metadata: metadata,
      wordCount: structuredText.split(/\s+/).length,
      characterCount: structuredText.length
    });

  } catch (error) {
    console.error('Error extracting text:', error);
    
    // Handle specific parsing errors
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

    if (error.message?.includes('encoding')) {
      return NextResponse.json(
        { error: 'Text file encoding not supported. Please save as UTF-8.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to extract text from file. Please try again.' },
      { status: 500 }
    );
  }
}

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