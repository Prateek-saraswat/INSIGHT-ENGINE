from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum


class AgentType(str, Enum):
    MANAGER = "manager"
    RESEARCHER = "researcher"
    WRITER = "writer"
    CRITIQUE = "critique"


class ResearchStatus(str, Enum):
    PENDING = "pending"
    PLANNING = "planning"
    AWAITING_APPROVAL = "awaiting_approval"
    RESEARCHING = "researching"
    WRITING = "writing"
    REVIEWING = "reviewing"
    COMPLETED = "completed"
    FAILED = "failed"


class Citation(BaseModel):
    title: str
    url: str
    excerpt: str
    accessed_at: datetime = Field(default_factory=datetime.utcnow)


class ResearchNote(BaseModel):
    subtopic: str
    findings: List[str]
    citations: List[Citation]


class SectionContent(BaseModel):
    title: str
    content: str
    citations: List[Citation]
    revision_count: int = 0


class AgentUpdate(BaseModel):
    agent: AgentType
    action: str
    details: Dict[str, Any]
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class ResearchPlan(BaseModel):
    sections: List[str]
    research_questions: List[str]
    estimated_sources: int


class CritiqueResult(BaseModel):
    has_issues: bool
    feedback: str
    missing_citations: List[str] = []
    unsupported_claims: List[str] = []


class ResearchRequest(BaseModel):
    topic: str
    user_id: str
    constraints: Optional[str] = None
    scope: Optional[str] = None


class ResearchSession(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    user_id: str
    topic: str
    status: ResearchStatus
    plan: Optional[ResearchPlan] = None
    plan_approved: bool = False
    research_notes: List[ResearchNote] = []
    sections: List[SectionContent] = []
    final_report_path: Optional[str] = None
    agent_updates: List[AgentUpdate] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
    
    class Config:
        populate_by_name = True
        json_encoders = {datetime: lambda v: v.isoformat()}


class ResearchResponse(BaseModel):
    session_id: str
    status: ResearchStatus
    message: str


class ApprovalRequest(BaseModel):
    session_id: str
    approved: bool
    modifications: Optional[str] = None
