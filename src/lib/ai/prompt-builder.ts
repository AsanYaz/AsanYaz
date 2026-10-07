/**
 * AI Prompt Builder
 * Constructs structured prompts based on order context.
 */

import type { TemplateAnalysis } from '@prisma/client';

export interface PromptContext {
  service: {
    name: string;
    slug: string;
  };
  topic: string;
  customTitle?: string | null;
  student: {
    name: string;
    group?: string | null;
    id?: string | null;
  };
  university: {
    name: string;
    shortName?: string | null;
  };
  faculty?: {
    name: string;
  } | null;
  department?: {
    name: string;
  } | null;
  instructor?: {
    name: string;
    title?: string | null;
  } | null;
  language: string;
  requestedLength?: string | null;
  additionalRequirements?: string | null;
  templateAnalysis?: TemplateAnalysis | null;
  references?: string[];
  uploadedContent?: string[];
}

export class PromptBuilder {
  private context: PromptContext;

  constructor(context: PromptContext) {
    this.context = context;
  }

  /**
   * Build system prompt establishing the AI's role and constraints.
   */
  buildSystemPrompt(): string {
    const parts: string[] = [
      'Sən professional akademik yazıçısan.',
      'Sən yalnız Azərbaycan dilində yazırsan.',
      'Plagiat olmadan, orijinal akademik mətn yazmalısan.',
      'Heç vaxt uydurma mənbə, müəllif, jurnal, DOI, URL yaratma.',
      'Əgər real mənbə tapa bilmirsənsə, mənbəni daxil etmə.',
      'Akademik dil və üslubda yaz.',
      'Universitetin tələblərinə uyğun format saxla.',
    ];

    if (this.context.templateAnalysis) {
      parts.push('');
      parts.push('ŞABLON FORMATLAMA TƏLƏBLƏRİ:');
      parts.push(this.buildTemplateConstraints());
    }

    return parts.join('\n');
  }

  /**
   * Build the main content generation prompt.
   */
  buildContentPrompt(): string {
    const c = this.context;
    const parts: string[] = [];

    parts.push(`İŞ NÖVÜ: ${c.service.name}`);
    parts.push(`MÖVZU: ${c.topic}`);
    if (c.customTitle) {
      parts.push(`BAŞLIQ: ${c.customTitle}`);
    }
    parts.push('');

    parts.push('TƏLƏBƏ MƏLUMATLARI:');
    parts.push(`Ad: ${c.student.name}`);
    if (c.student.group) parts.push(`Qrup: ${c.student.group}`);
    parts.push('');

    parts.push('TƏHSİL MÜƏSSİSƏSİ:');
    parts.push(`Universitet: ${c.university.name}`);
    if (c.faculty) parts.push(`Fakültə: ${c.faculty.name}`);
    if (c.department) parts.push(`Kafedra: ${c.department.name}`);
    parts.push('');

    if (c.instructor) {
      parts.push('RƏHBƏR:');
      if (c.instructor.title) {
        parts.push(`${c.instructor.title} ${c.instructor.name}`);
      } else {
        parts.push(c.instructor.name);
      }
      parts.push('');
    }

    parts.push(`DİL: ${c.language === 'az' ? 'Azərbaycan dili' : c.language}`);

    if (c.requestedLength) {
      parts.push(`İSTƏNİLƏN UZUNLUQ: ${c.requestedLength}`);
    }

    if (c.additionalRequirements) {
      parts.push('');
      parts.push('ƏLAVƏ TƏLƏBLƏR:');
      parts.push(c.additionalRequirements);
    }

    if (c.references && c.references.length > 0) {
      parts.push('');
      parts.push('İSTİFADƏ EDILƏCƏK MƏNBƏLƏR:');
      c.references.forEach((ref, i) => {
        parts.push(`${i + 1}. ${ref}`);
      });
    }

    if (c.uploadedContent && c.uploadedContent.length > 0) {
      parts.push('');
      parts.push('ƏLAVƏ MATERİALLAR:');
      c.uploadedContent.forEach((content) => {
        parts.push(content);
      });
    }

    if (c.templateAnalysis?.sectionOrdering) {
      parts.push('');
      parts.push('İŞİN STRUKTUR SİRASI:');
      const sections = c.templateAnalysis.sectionOrdering as string[];
      sections.forEach((section, i) => {
        parts.push(`${i + 1}. ${section}`);
      });
    }

    return parts.join('\n');
  }

  /**
   * Build outline generation prompt.
   */
  buildOutlinePrompt(): string {
    const contentPrompt = this.buildContentPrompt();
    return `${contentPrompt}\n\nBu mövzu üçün ətraflı plan (outline) hazırla. Hər bölmə və alt-bölmənin adını və qısa təsvirini ver. Cavabı JSON formatında ver:\n{\n  "title": "İşin başlığı",\n  "sections": [\n    {\n      "title": "Bölmə adı",\n      "subsections": ["Alt-bölmə 1", "Alt-bölmə 2"],\n      "estimatedWords": 500\n    }\n  ]\n}`;
  }

  /**
   * Build citation/reference generation prompt.
   */
  buildCitationPrompt(content: string): string {
    return `Aşağıdakı akademik mətn üçün real, mövcud mənbələr tap. UYDURMA MƏNBƏ YARATMA.\n\nMətn:\n${content.substring(0, 3000)}\n\nHər mənbə üçün:\n- Müəllif(lər)\n- Başlıq\n- Jurnal/Kitab\n- İl\n- DOI (əgər varsa)\n\nCavabı JSON formatında ver:\n{\n  "citations": [\n    {\n      "authors": ["Ad Soyad"],\n      "title": "Məqalə başlığı",\n      "journal": "Jurnal adı",\n      "year": 2023,\n      "doi": "10.xxxx/xxxxx",\n      "inTextRef": "(Soyad, 2023)"\n    }\n  ]\n}`;
  }

  /**
   * Build quality check prompt.
   */
  buildQualityCheckPrompt(content: string): string {
    return `Aşağıdakı akademik mətni qiymətləndir:\n\n${content.substring(0, 5000)}\n\nYoxla:\n1. Akademik dil və üslub\n2. Məntiqi ardıcıllıq\n3. Plagiat əlamətləri\n4. Qrammatik səhvlər\n5. Strukturun düzgünlüyü\n\nCavabı JSON formatında ver:\n{\n  "score": 85,\n  "issues": ["Məsələ 1", "Məsələ 2"],\n  "suggestions": ["Təklif 1", "Təklif 2"],\n  "passesQualityCheck": true\n}`;
  }

  /**
   * Build template formatting constraints from analysis.
   */
  private buildTemplateConstraints(): string {
    const ta = this.context.templateAnalysis;
    if (!ta) return '';

    const parts: string[] = [];

    if (ta.pageSize) parts.push(`Səhifə ölçüsü: ${ta.pageSize}`);
    if (ta.margins) {
      const m = ta.margins as Record<string, number>;
      parts.push(`Kənarlar: yuxarı=${m.top}mm, aşağı=${m.bottom}mm, sol=${m.left}mm, sağ=${m.right}mm`);
    }
    if (ta.fonts) {
      const fonts = ta.fonts as Array<{ name: string; size: number; usage: string }>;
      fonts.forEach((f) => {
        parts.push(`Şrift (${f.usage}): ${f.name}, ${f.size}pt`);
      });
    }
    if (ta.lineSpacing) {
      parts.push(`Sətirlərarası məsafə: ${ta.lineSpacing}`);
    }
    if (ta.headingHierarchy) {
      const headings = ta.headingHierarchy as Array<{ level: number; format: string }>;
      headings.forEach((h) => {
        parts.push(`Başlıq ${h.level}: ${h.format}`);
      });
    }
    if (ta.requiredSections) {
      const sections = ta.requiredSections as string[];
      parts.push(`Tələb olunan bölmələr: ${sections.join(', ')}`);
    }

    return parts.join('\n');
  }
}
