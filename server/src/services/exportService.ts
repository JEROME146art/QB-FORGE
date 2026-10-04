import fs from 'fs';
import path from 'path';
import * as docx from 'docx';
import puppeteer from 'puppeteer';
import { logger } from '../utils/logger';

interface PaperData {
  id: string;
  title: string;
  totalMarks: number;
  duration: number;
  instructions?: string | null;
  collegeHeader?: any;
  sets: {
    id: string;
    setLabel: string;
    questions: {
      order: number;
      marks: number;
      question: {
        text: string;
        type: string;
        options?: any;
        modelAnswer?: string | null;
        difficulty: string;
        bloomLevel: string;
      };
    }[];
  }[];
}

// ─── DOCX Export ───────────────────────────────────────────────────────────

async function buildPaperDOCX(paper: PaperData): Promise<Buffer> {
  const { Document, Packer, Paragraph, TextRun, AlignmentType } = docx;

  const children: any[] = [];

  // Header
  const ch = paper.collegeHeader as Record<string, any> | undefined;
  if (ch?.collegeName) {
    children.push(new Paragraph({
      children: [new TextRun({ text: ch.collegeName, bold: true, size: 32, font: 'Times New Roman' })],
      alignment: AlignmentType.CENTER,
    }));
  }
  if (ch?.department) {
    children.push(new Paragraph({
      children: [new TextRun({ text: ch.department, size: 24, font: 'Times New Roman' })],
      alignment: AlignmentType.CENTER,
    }));
  }

  // Title
  children.push(new Paragraph({
    children: [new TextRun({ text: paper.title, bold: true, size: 28, font: 'Times New Roman' })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 200 },
  }));

  // Meta row
  const metaItems: string[] = [];
  if (ch?.subjectCode) metaItems.push(`Subject Code: ${ch.subjectCode}`);
  if (ch?.subjectName) metaItems.push(`Subject: ${ch.subjectName}`);
  metaItems.push(`Duration: ${Math.floor(paper.duration / 60)}h ${paper.duration % 60}m`);
  metaItems.push(`Max Marks: ${paper.totalMarks}`);
  children.push(new Paragraph({
    children: [new TextRun({ text: metaItems.join('  |  '), size: 20, font: 'Times New Roman' })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 100 },
  }));

  if (paper.instructions) {
    children.push(new Paragraph({
      children: [new TextRun({ text: paper.instructions, italics: true, size: 20, font: 'Times New Roman' })],
      alignment: AlignmentType.LEFT,
      spacing: { before: 200 },
    }));
  }

  // Sections
  for (const set of paper.sets) {
    children.push(new Paragraph({
      children: [new TextRun({ text: set.setLabel, bold: true, size: 24, font: 'Times New Roman' })],
      spacing: { before: 300 },
    }));

    let qNum = 1;
    for (const pq of set.questions) {
      const q = pq.question;
      const options = q.options as any[];
      const optionTexts = options
        ?.filter((o) => o.text)
        .map((o) => `  ${o.label}) ${o.text}`)
        .join('\n');

      const textParts = [`${qNum}. ${q.text} (${pq.marks} Marks)`];
      if (optionTexts) textParts.push(optionTexts);

      children.push(new Paragraph({
        children: [new TextRun({ text: textParts.join('\n'), size: 22, font: 'Times New Roman' })],
        spacing: { before: 100 },
      }));
      qNum++;
    }
  }

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: 'Times New Roman', size: 22 },
        },
      },
    },
    sections: [{ children }],
  });

  return await Packer.toBuffer(doc);
}

// ─── PDF Export ────────────────────────────────────────────────────────────

function buildPaperHTML(paper: PaperData): string {
  const ch = (paper.collegeHeader || {}) as Record<string, any>;
  const cols = paper.sets.map((set) => {
    let qNum = 1;
    const rows = set.questions.map((pq) => {
      const q = pq.question;
      const options = (q.options as any[])
        ?.filter((o: any) => o.text)
        .map((o: any) => `  ${o.label}) ${o.text}`)
        .join('<br/>');
      const itemHtml = `<div style="margin-bottom:14px">
        <strong>${qNum}. ${q.text} (${pq.marks} Marks)</strong>
        ${options ? `<div style="margin-left: 20px; margin-top: 4px;">${options}</div>` : ''}
      </div>`;
      qNum++;
      return itemHtml;
    }).join('');
    return `<h2 style="text-align:center; margin-top: 20px;">${set.setLabel}</h2>${rows}`;
  }).join('');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
body { font-family: 'Times New Roman', serif; padding: 40px; color: #111; }
h1 { text-align: center; font-size: 18pt; margin-bottom: 4px; }
h2 { text-align: center; font-size: 14pt; margin: 16px 0 10px 0; }
.meta { text-align: center; font-size: 11pt; margin-bottom: 20px; font-weight: 500; }
.instructions { font-style: italic; font-size: 11pt; margin: 10px 0 20px 0; padding: 8px; border: 1px dashed #666; }
</style>
</head>
<body>
${ch.collegeName ? `<h1>${ch.collegeName}</h1>` : ''}
${ch.department ? `<div style="text-align:center;font-size:13pt;font-weight:600;">${ch.department}</div>` : ''}
<h1 style="margin-top:16px">${paper.title}</h1>
<div class="meta">
  ${ch.subjectCode ? `Subject Code: ${ch.subjectCode}` : ''}
  ${ch.subjectName ? `  |  ${ch.subjectName}` : ''}
  | Duration: ${Math.floor(paper.duration / 60)}h ${paper.duration % 60}m | Max Marks: ${paper.totalMarks}
</div>
${paper.instructions ? `<div class="instructions"><strong>Instructions:</strong> ${paper.instructions}</div>` : ''}
${cols}
</body>
</html>`;
}

export async function exportPaperToPDF(paper: PaperData): Promise<string> {
  const html = buildPaperHTML(paper);
  const outDir = path.resolve(process.env.UPLOAD_DIR || './uploads');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  const pdfPath = path.join(outDir, `paper-${paper.id}.pdf`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html);
    await page.pdf({ path: pdfPath, format: 'A4', printBackground: true });
    await browser.close();
    return pdfPath;
  } catch (err) {
    await browser.close();
    logger.error('PDF generation failed:', err);
    throw err;
  }
}

export async function exportPaperToDOCX(paper: PaperData): Promise<string> {
  const buf = await buildPaperDOCX(paper);
  const outDir = path.resolve(process.env.UPLOAD_DIR || './uploads');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  const docxPath = path.join(outDir, `paper-${paper.id}.docx`);
  fs.writeFileSync(docxPath, buf);
  return docxPath;
}