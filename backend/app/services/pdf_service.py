from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_JUSTIFY, TA_CENTER
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak
from reportlab.lib import colors
from datetime import datetime
from typing import List
from ..models.schemas import SectionContent
from ..core.config import settings
import os
import tempfile
import cloudinary
import cloudinary.uploader


class PDFReportService:
    """Service for generating professional research reports"""
    
    def __init__(self, output_dir: str = None):
        if output_dir is None:
            self.output_dir = tempfile.gettempdir()
        else:
            self.output_dir = output_dir
        os.makedirs(self.output_dir, exist_ok=True)
        print(f"[PDFService] Output directory: {self.output_dir}")
        
        # Configure Cloudinary
        self._configure_cloudinary()
    
    def _configure_cloudinary(self):
        """Configure Cloudinary from environment variables"""
        try:
            cloud_name = settings.cloudinary_cloud_name
            api_key = settings.cloudinary_api_key
            api_secret = settings.cloudinary_api_secret
            
            if cloud_name and api_key and api_secret:
                cloudinary.config(
                    cloud_name=cloud_name,
                    api_key=api_key,
                    api_secret=api_secret
                )
                self.cloudinary_configured = True
                print(f"[PDFService] Cloudinary configured successfully")
            else:
                self.cloudinary_configured = False
                print(f"[PDFService] Cloudinary not configured (missing env vars)")
        except Exception as e:
            self.cloudinary_configured = False
            print(f"[PDFService] Cloudinary configuration error: {e}")
    
    def _format_datetime(self, dt_value):
        """Safely format a datetime value to string"""
        if dt_value is None:
            return datetime.utcnow().strftime('%B %d, %Y')
        if isinstance(dt_value, str):
            try:
                return datetime.fromisoformat(dt_value.replace('Z', '+00:00')).strftime('%B %d, %Y')
            except:
                return dt_value
        elif hasattr(dt_value, 'strftime'):
            return dt_value.strftime('%B %d, %Y')
        else:
            return str(dt_value)
    
    def upload_to_cloudinary(self, filepath: str, session_id: str) -> str:
        """Upload PDF to Cloudinary and return the URL"""
        if not self.cloudinary_configured:
            print(f"[PDFService] Cloudinary not configured, skipping upload")
            return None
        
        try:
            print(f"[PDFService] Uploading PDF to Cloudinary...")
            result = cloudinary.uploader.upload(
                filepath,
                resource_type="raw",
                folder="insightengine/reports",
                public_id=f"research_report_{session_id}",
                format="pdf"
            )
            url = result.get('secure_url')
            print(f"[PDFService] PDF uploaded to Cloudinary: {url}")
            return url
        except Exception as e:
            print(f"[PDFService] Failed to upload to Cloudinary: {e}")
            return None
    
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
            if section.citations:
                all_citations.extend(section.citations)
        
        print(f"[PDFService] Generated PDF with {len(all_citations)} total citations")
        
        # References
        story.append(PageBreak())
        story.append(Paragraph("References", heading_style))
        
        # Deduplicate citations by URL
        unique_citations = {}
        
        # Handle both Citation objects and dicts
        for citation in all_citations:
            # Convert dict to object if needed
            if isinstance(citation, dict):
                url = citation.get('url', '')
                title = citation.get('title', 'Unknown')
            else:
                url = citation.url
                title = citation.title
            
            if url and url not in unique_citations:
                unique_citations[url] = {
                    'title': title,
                    'url': url,
                    'accessed_at': self._format_datetime(citation.get('accessed_at') if isinstance(citation, dict) else citation.accessed_at)
                }
        
        # Check if we have any citations
        if not unique_citations:
            story.append(Paragraph("No references available.", styles['Normal']))
        else:
            for i, data in enumerate(unique_citations.values(), 1):
                ref_text = f"[{i}] {data['title']}. <br/>"
                ref_text += f"<i>{data['url']}</i><br/>"
                ref_text += f"Accessed: {data['accessed_at']}"
                story.append(Paragraph(ref_text, styles['Normal']))
                story.append(Spacer(1, 0.15*inch))
        
        # Build PDF
        doc.build(story)
        
        return filepath
