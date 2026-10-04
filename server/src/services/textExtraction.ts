import fs from 'fs';
import * as mammoth from 'mammoth';
import { logger } from '../utils/logger';

// Simple built-in UTF-8 byte extractor for TXT files
export function readTxt(file: string): string {
  return fs.readFileSync(file, 'utf-8');
}

export async function readPDF(file: string): Promise<string> {
  try {
    const PDFParse = require('pdf-parse');
    const pdfData = fs.readFileSync(file);
    const parsed = await PDFParse(pdfData);
    return parsed.text || '';
  } catch (err: any) {
    logger.error('PDF parse error:', err.message);
    return '';
  }
}

export async function readDOCX(file: string): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ path: file });
    return result.value;
  } catch (err: any) {
    logger.error('DOCX parse error:', err.message);
    return '';
  }
}

export function readPPTX(file: string): string {
  try {
    const AdmZip = require('adm-zip');
    const zip = new AdmZip(file);
    const entries = zip.getEntries();
    let text = '';
    for (const entry of entries) {
      if (entry.entryName.includes('slide') && entry.entryName.endsWith('.xml')) {
        const xml = entry.getData().toString('utf8');
        const matches = xml.match(/<a:t>([^<]*)<\/a:t>/g);
        if (matches) {
          text += matches.map((m: string) => m.replace(/<\/?a:t>/g, '')).join(' ');
        }
      }
    }
    return text;
  } catch (err: any) {
    logger.error('PPTX parse error:', err.message);
    return '';
  }
}

export async function extractTextFromUpload(filePath: string, mimeType: string): Promise<string> {
  switch (mimeType) {
    case 'application/pdf':
      return await readPDF(filePath);
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return await readDOCX(filePath);
    case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
      return readPPTX(filePath);
    case 'text/plain':
      return readTxt(filePath);
    default:
      logger.warn(`Unsupported mime type: ${mimeType}`);
      return '';
  }
}

export async function splitByUnits(filePath: string, mimeType: string): Promise<Record<string, string>> {
  const text = await extractTextFromUpload(filePath, mimeType);

  const units: Record<string, string> = {};
  const lines = text.split('\n');
  let currentUnit = 'General';
  let currentContent: string[] = [];

  for (const line of lines) {
    const unitMatch = line.match(/^unit\s+(\d+)\.?\s*(.*)/i);
    if (unitMatch) {
      if (currentContent.length > 0) {
        units[currentUnit] = currentContent.join('\n');
      }
      currentUnit = `Unit ${unitMatch[1]}${unitMatch[2] ? ': ' + unitMatch[2] : ''}`;
      currentContent = [];
    } else {
      currentContent.push(line);
    }
  }

  if (currentContent.length > 0) {
    units[currentUnit] = currentContent.join('\n');
  }

  return units;
}