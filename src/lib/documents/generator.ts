/**
 * Document Generation Engine
 * Produces DOCX, PDF, and PPTX files with deterministic formatting.
 */

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Header,
  Footer,
  PageNumber,
  NumberFormat,
  Tab,
  TabStopPosition,
  TabStopType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  SectionType,
  convertMillimetersToTwip,
  LevelFormat,
} from 'docx';

export interface DocumentConfig {
  pageSize?: { width: number; height: number }; // mm
  margins?: { top: number; bottom: number; left: number; right: number }; // mm
  fonts?: {
    body: { name: string; size: number };
    heading: { name: string; size: number };
    title: { name: string; size: number };
  };
  lineSpacing?: number; // multiplier, e.g. 1.5
  paragraphSpacing?: { before: number; after: number }; // pt
  pageNumbering?: {
    start: number;
    format: 'decimal' | 'roman' | 'romanUpper';
    position: 'bottom-center' | 'bottom-right' | 'top-right';
  };
}

export interface DocumentSection {
  type: 'title-page' | 'heading' | 'subheading' | 'paragraph' | 'list' | 'table' | 'page-break' | 'references';
  level?: number; // For headings: 1, 2, 3
  content?: string;
  items?: string[]; // For lists
  tableData?: string[][]; // For tables
  bold?: boolean;
  italic?: boolean;
  alignment?: 'left' | 'center' | 'right' | 'justify';
}

export interface TitlePageData {
  universityName: string;
  facultyName?: string;
  departmentName?: string;
  documentType: string;
  topic: string;
  studentName: string;
  studentGroup?: string;
  instructorName?: string;
  instructorTitle?: string;
  city?: string;
  year: number;
}

const DEFAULT_CONFIG: DocumentConfig = {
  pageSize: { width: 210, height: 297 }, // A4
  margins: { top: 20, bottom: 20, left: 30, right: 15 },
  fonts: {
    body: { name: 'Times New Roman', size: 14 },
    heading: { name: 'Times New Roman', size: 14 },
    title: { name: 'Times New Roman', size: 16 },
  },
  lineSpacing: 1.5,
  paragraphSpacing: { before: 0, after: 0 },
  pageNumbering: {
    start: 1,
    format: 'decimal',
    position: 'bottom-center',
  },
};

/**
 * Generate a DOCX document from structured content.
 */
export async function generateDocx(params: {
  titlePage?: TitlePageData;
  sections: DocumentSection[];
  config?: Partial<DocumentConfig>;
}): Promise<Buffer> {
  const config = { ...DEFAULT_CONFIG, ...params.config };
  const margins = config.margins || DEFAULT_CONFIG.margins!;
  const bodyFont = config.fonts?.body || DEFAULT_CONFIG.fonts!.body;
  const headingFont = config.fonts?.heading || DEFAULT_CONFIG.fonts!.heading;
  const lineSpacingValue = (config.lineSpacing || 1.5) * 240; // Convert to twips

  const children: Paragraph[] = [];

  // Title page
  if (params.titlePage) {
    const tp = params.titlePage;
    
    // University name
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: tp.universityName.toUpperCase(),
            bold: true,
            font: headingFont.name,
            size: headingFont.size * 2,
          }),
        ],
      })
    );

    // Faculty
    if (tp.facultyName) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
          children: [
            new TextRun({
              text: tp.facultyName,
              font: bodyFont.name,
              size: bodyFont.size * 2,
            }),
          ],
        })
      );
    }

    // Department
    if (tp.departmentName) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
          children: [
            new TextRun({
              text: tp.departmentName,
              font: bodyFont.name,
              size: bodyFont.size * 2,
            }),
          ],
        })
      );
    }

    // Spacing before document type
    for (let i = 0; i < 6; i++) {
      children.push(new Paragraph({ children: [] }));
    }

    // Document type
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: tp.documentType.toUpperCase(),
            bold: true,
            font: config.fonts?.title?.name || 'Times New Roman',
            size: (config.fonts?.title?.size || 16) * 2,
          }),
        ],
      })
    );

    // Topic
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
        children: [
          new TextRun({
            text: `Mövzu: ${tp.topic}`,
            bold: true,
            font: headingFont.name,
            size: headingFont.size * 2,
          }),
        ],
      })
    );

    // Spacing
    for (let i = 0; i < 6; i++) {
      children.push(new Paragraph({ children: [] }));
    }

    // Student info (right-aligned)
    children.push(
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [
          new TextRun({
            text: `Tələbə: ${tp.studentName}`,
            font: bodyFont.name,
            size: bodyFont.size * 2,
          }),
        ],
      })
    );

    if (tp.studentGroup) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [
            new TextRun({
              text: `Qrup: ${tp.studentGroup}`,
              font: bodyFont.name,
              size: bodyFont.size * 2,
            }),
          ],
        })
      );
    }

    // Instructor info
    if (tp.instructorName) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          spacing: { before: 200 },
          children: [
            new TextRun({
              text: `Rəhbər: ${tp.instructorTitle ? tp.instructorTitle + ' ' : ''}${tp.instructorName}`,
              font: bodyFont.name,
              size: bodyFont.size * 2,
            }),
          ],
        })
      );
    }

    // Spacing before city/year
    for (let i = 0; i < 4; i++) {
      children.push(new Paragraph({ children: [] }));
    }

    // City and Year
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: `${tp.city || 'Bakı'} — ${tp.year}`,
            font: bodyFont.name,
            size: bodyFont.size * 2,
          }),
        ],
        pageBreakBefore: false,
      })
    );

    // Page break after title page
    children.push(
      new Paragraph({
        children: [],
        pageBreakBefore: true,
      })
    );
  }

  // Content sections
  for (const section of params.sections) {
    switch (section.type) {
      case 'heading': {
        const level = section.level === 1 ? HeadingLevel.HEADING_1 
          : section.level === 2 ? HeadingLevel.HEADING_2 
          : HeadingLevel.HEADING_3;
        
        children.push(
          new Paragraph({
            heading: level,
            spacing: { before: 240, after: 120, line: lineSpacingValue },
            children: [
              new TextRun({
                text: section.content || '',
                bold: true,
                font: headingFont.name,
                size: headingFont.size * 2,
              }),
            ],
          })
        );
        break;
      }

      case 'subheading':
        children.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100, line: lineSpacingValue },
            children: [
              new TextRun({
                text: section.content || '',
                bold: true,
                font: headingFont.name,
                size: (headingFont.size - 1) * 2,
              }),
            ],
          })
        );
        break;

      case 'paragraph': {
        const alignment = section.alignment === 'center' ? AlignmentType.CENTER
          : section.alignment === 'right' ? AlignmentType.RIGHT
          : section.alignment === 'justify' ? AlignmentType.JUSTIFIED
          : AlignmentType.JUSTIFIED; // Default to justified for academic

        children.push(
          new Paragraph({
            alignment,
            spacing: { 
              line: lineSpacingValue,
              before: (config.paragraphSpacing?.before || 0) * 20,
              after: (config.paragraphSpacing?.after || 0) * 20,
            },
            indent: { firstLine: convertMillimetersToTwip(12.5) }, // Standard indent
            children: [
              new TextRun({
                text: section.content || '',
                bold: section.bold,
                italics: section.italic,
                font: bodyFont.name,
                size: bodyFont.size * 2,
              }),
            ],
          })
        );
        break;
      }

      case 'list':
        if (section.items) {
          section.items.forEach((item, index) => {
            children.push(
              new Paragraph({
                spacing: { line: lineSpacingValue },
                indent: { left: convertMillimetersToTwip(12.5) },
                children: [
                  new TextRun({
                    text: `${index + 1}. ${item}`,
                    font: bodyFont.name,
                    size: bodyFont.size * 2,
                  }),
                ],
              })
            );
          });
        }
        break;

      case 'page-break':
        children.push(
          new Paragraph({
            children: [],
            pageBreakBefore: true,
          })
        );
        break;

      case 'references':
        children.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 240, after: 120 },
            pageBreakBefore: true,
            children: [
              new TextRun({
                text: 'ƏDƏBİYYAT SİYAHISI',
                bold: true,
                font: headingFont.name,
                size: headingFont.size * 2,
              }),
            ],
          })
        );
        if (section.items) {
          section.items.forEach((ref, index) => {
            children.push(
              new Paragraph({
                spacing: { line: lineSpacingValue, after: 60 },
                indent: { left: convertMillimetersToTwip(10), hanging: convertMillimetersToTwip(10) },
                children: [
                  new TextRun({
                    text: `${index + 1}. ${ref}`,
                    font: bodyFont.name,
                    size: bodyFont.size * 2,
                  }),
                ],
              })
            );
          });
        }
        break;
    }
  }

  // Build document
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              width: convertMillimetersToTwip(config.pageSize?.width || 210),
              height: convertMillimetersToTwip(config.pageSize?.height || 297),
            },
            margin: {
              top: convertMillimetersToTwip(margins.top),
              bottom: convertMillimetersToTwip(margins.bottom),
              left: convertMillimetersToTwip(margins.left),
              right: convertMillimetersToTwip(margins.right),
            },
          },
        },
        headers: {
          default: new Header({
            children: [],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    font: bodyFont.name,
                    size: bodyFont.size * 2,
                  }),
                ],
              }),
            ],
          }),
        },
        children,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return Buffer.from(buffer);
}

/**
 * Generate a PDF from a DOCX buffer using puppeteer for HTML-to-PDF conversion.
 * Note: For production, consider LibreOffice headless for DOCX-to-PDF.
 */
export async function generatePdf(htmlContent: string, config?: Partial<DocumentConfig>): Promise<Buffer> {
  const puppeteer = await import('puppeteer');
  const browser = await puppeteer.default.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    const margins = config?.margins || DEFAULT_CONFIG.margins!;
    
    await page.setContent(htmlContent, { waitUntil: 'load' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: {
        top: `${margins.top}mm`,
        bottom: `${margins.bottom}mm`,
        left: `${margins.left}mm`,
        right: `${margins.right}mm`,
      },
      printBackground: true,
      displayHeaderFooter: true,
      footerTemplate: `
        <div style="font-size: 10px; text-align: center; width: 100%;">
          <span class="pageNumber"></span>
        </div>
      `,
      headerTemplate: '<div></div>',
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}
