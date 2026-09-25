import os
import tempfile
import uuid
from docx import Document
from docx.shared import Pt, Inches, Cm
from docx.enum.text import WD_ALIGN_PARAGRAPH
from typing import Dict, Any, List

class DocumentGenerator:
    def __init__(self, metadata: Dict[str, Any], template_config: Dict[str, Any]):
        self.metadata = metadata
        self.template_config = template_config
        self.formatting = template_config.get("formatting", {})
        self.structure = template_config.get("structure", {})
        
        # Create temp dir for generated files
        self.temp_dir = tempfile.gettempdir()

    def apply_formatting(self, doc: Document):
        style = doc.styles['Normal']
        font_name = self.formatting.get("font", "Times New Roman")
        font_size = self.formatting.get("fontSize", 14)
        
        style.font.name = font_name
        style.font.size = Pt(font_size)

        # Apply margins
        margins = self.formatting.get("margins", {})
        sections = doc.sections
        for section in sections:
            section.top_margin = Cm(margins.get("top", 2))
            section.bottom_margin = Cm(margins.get("bottom", 2))
            section.left_margin = Cm(margins.get("left", 3))
            section.right_margin = Cm(margins.get("right", 1.5))

    def generate_cover_page(self, doc: Document):
        if not self.structure.get("coverPage", True):
            return

        # University
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = p.add_run(self.metadata.get("universityName", "").upper())
        run.bold = True
        
        if self.metadata.get("facultyName"):
            p = doc.add_paragraph()
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p.add_run(self.metadata.get("facultyName"))
            
        if self.metadata.get("departmentName"):
            p = doc.add_paragraph()
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p.add_run(self.metadata.get("departmentName"))

        doc.add_paragraph("\n\n\n\n")

        # Title
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = p.add_run(self.metadata.get("serviceName", "SƏRBƏST İŞ").upper())
        run.bold = True
        
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.add_run("Mövzu: " + self.metadata.get("topic", ""))

        doc.add_paragraph("\n\n\n")

        # Student & Instructor info
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        p.add_run(f"Tələbə: {self.metadata.get('studentName', '')}")
        
        if self.metadata.get("instructorName"):
            p = doc.add_paragraph()
            p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
            p.add_run(f"Elmi rəhbər: {self.metadata.get('instructorName', '')}")

        doc.add_paragraph("\n\n\n\n\n")
        
        # Footer
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.add_run("Bakı - " + str(self._get_current_year()))
        
        doc.add_page_break()

    def generate_from_text(self, order_id: str, text: str) -> List[Dict[str, Any]]:
        doc = Document()
        self.apply_formatting(doc)
        self.generate_cover_page(doc)

        # Basic text processing (in MVP we just add the raw AI text)
        # In a full version, we would parse markdown to word styles
        paragraphs = text.split('\n')
        for para in paragraphs:
            if para.strip() == '':
                continue
            
            if para.startswith('# '):
                p = doc.add_heading(para[2:], level=1)
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            elif para.startswith('## '):
                doc.add_heading(para[3:], level=2)
            elif para.startswith('### '):
                doc.add_heading(para[4:], level=3)
            else:
                p = doc.add_paragraph(para)
                p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY

        # Save DOCX locally
        file_id = str(uuid.uuid4())
        filename = f"{self.metadata.get('topic', 'Document')}.docx".replace(" ", "_")
        local_path = os.path.join(self.temp_dir, f"{file_id}.docx")
        doc.save(local_path)
        
        file_size = os.path.getsize(local_path)
        
        # Here we would normally upload to S3/R2 and return the URL/Key
        # For MVP we'll just mock the key path
        key = f"generated/{order_id}/{file_id}.docx"
        
        return [{
            "key": key,
            "name": filename,
            "type": "docx",
            "mimeType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "size": file_size,
            "localPath": local_path # We pass this so the worker can upload it if needed
        }]

    def _get_current_year(self):
        import datetime
        return datetime.datetime.now().year
