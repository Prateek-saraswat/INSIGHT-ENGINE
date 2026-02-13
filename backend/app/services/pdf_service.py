from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_JUSTIFY, TA_CENTER
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle
from reportlab.lib import colors
from datetime import datetime
from typing import List
from ..models.schemas import SectionContent, Citation
import os


class PDFReportService:
    """Service for generating professional research reports"""
    
    def __init__(self, output_dir: str = "/tmp/reports"):
        self.output_dir = output_dir
        os.makedirs(output_dir, exist_ok=True)
    
    def generate_report(
        self,
        topic: str,
        sections: List[SectionContent],
        session_id: str
    ) -> str:
        """Generate a complete research report PDF"""
        
        filename = f"research_report_{session_id}.pdf"
        filepath = os.path.join(self.output_dir, filename)
        
        doc = SimpleDocTemplate(filepath, pagesize=letter,
                                topMargin=0.75*inch, bottomMargin=0.75*inch)
        
        story = []
        styles = getSampleStyleSheet()
        
        # Custom styles
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#1a1a1a'),
            spaceAfter=30,
            alignment=TA_CENTER
        )
        
        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            fontSize=16,
            textColor=colors.HexColor('#2c3e50'),
            spaceAfter=12,
            spaceBefore=12
        )
        
        body_style = ParagraphStyle(
            'CustomBody',
            parent=styles['Normal'],
            fontSize=11,
            alignment=TA_JUSTIFY,
            spaceAfter=12
        )
        
        # Title page
        story.append(Spacer(1, 1.5*inch))
        story.append(Paragraph(topic, title_style))
        story.append(Spacer(1, 0.3*inch))
        story.append(Paragraph(f"Research Report", styles['Heading3']))
        story.append(Spacer(1, 0.2*inch))
        story.append(Paragraph(
            f"Generated: {datetime.utcnow().strftime('%B %d, %Y')}",
            styles['Normal']
        ))
        story.append(Spacer(1, 0.2*inch))
        story.append(Paragraph(f"Session ID: {session_id}", styles['Normal']))
        story.append(PageBreak())
        
        # Executive Summary
        story.append(Paragraph("Executive Summary", heading_style))
        summary_text = f"This report presents comprehensive research on {topic}. "
        summary_text += f"The analysis is organized into {len(sections)} thematic sections, "
        summary_text += "each providing detailed insights, evidence, and citations from authoritative sources."
        story.append(Paragraph(summary_text, body_style))
        story.append(Spacer(1, 0.3*inch))
        
        # Table of Contents
        story.append(Paragraph("Table of Contents", heading_style))
        for i, section in enumerate(sections, 1):
            story.append(Paragraph(f"{i}. {section.title}", styles['Normal']))
        story.append(Spacer(1, 0.2*inch))
        story.append(PageBreak())
        
        # Sections
        all_citations = []
        for i, section in enumerate(sections, 1):
            story.append(Paragraph(f"{i}. {section.title}", heading_style))
            
            # Section content
            paragraphs = section.content.split('\n\n')
            for para in paragraphs:
                if para.strip():
                    story.append(Paragraph(para, body_style))
            
            story.append(Spacer(1, 0.2*inch))
            
            # Collect citations
            all_citations.extend(section.citations)
        
        # References
        story.append(PageBreak())
        story.append(Paragraph("References", heading_style))
        
        # Deduplicate citations by URL
        unique_citations = {}
        for citation in all_citations:
            if citation.url not in unique_citations:
                unique_citations[citation.url] = citation
        
        for i, citation in enumerate(unique_citations.values(), 1):
            ref_text = f"[{i}] {citation.title}. <br/>"
            ref_text += f"<i>{citation.url}</i><br/>"
            ref_text += f"Accessed: {citation.accessed_at.strftime('%B %d, %Y')}"
            story.append(Paragraph(ref_text, styles['Normal']))
            story.append(Spacer(1, 0.15*inch))
        
        # Build PDF
        doc.build(story)
        
        return filepath
