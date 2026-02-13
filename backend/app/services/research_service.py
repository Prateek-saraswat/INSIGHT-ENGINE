from typing import Optional, Callable
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from datetime import datetime
from ..models.schemas import (
    ResearchSession, ResearchStatus, ResearchRequest,
    AgentUpdate, ApprovalRequest
)
from .multi_agent import MultiAgentResearchSystem, AgentState
from .pdf_service import PDFReportService
import asyncio


class ResearchService:
    """Service for managing research sessions and orchestrating the multi-agent system"""
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.sessions = db.research_sessions
        self.pdf_service = PDFReportService()
    
    async def create_session(self, request: ResearchRequest) -> ResearchSession:
        """Create a new research session"""
        session = ResearchSession(
            user_id=request.user_id,
            topic=request.topic,
            status=ResearchStatus.PENDING,
        )
        
        result = await self.sessions.insert_one(session.dict(by_alias=True, exclude={"id"}))
        session.id = str(result.inserted_id)
        
        return session
    
    async def get_session(self, session_id: str) -> Optional[ResearchSession]:
        """Retrieve a research session"""
        try:
            data = await self.sessions.find_one({"_id": ObjectId(session_id)})
            if data:
                data["_id"] = str(data["_id"])
                return ResearchSession(**data)
        except Exception as e:
            print(f"Error retrieving session: {e}")
        return None
    
    async def update_session_status(self, session_id: str, status: ResearchStatus):
        """Update session status"""
        await self.sessions.update_one(
            {"_id": ObjectId(session_id)},
            {
                "$set": {
                    "status": status,
                    "updated_at": datetime.utcnow()
                }
            }
        )
    
    async def add_agent_update(self, session_id: str, update: AgentUpdate):
        """Add an agent update to the session"""
        await self.sessions.update_one(
            {"_id": ObjectId(session_id)},
            {
                "$push": {"agent_updates": update.dict()},
                "$set": {"updated_at": datetime.utcnow()}
            }
        )
    
    async def save_plan(self, session_id: str, plan: dict):
        """Save research plan to session"""
        await self.sessions.update_one(
            {"_id": ObjectId(session_id)},
            {
                "$set": {
                    "plan": plan,
                    "status": ResearchStatus.AWAITING_APPROVAL,
                    "updated_at": datetime.utcnow()
                }
            }
        )
    
    async def approve_plan(self, approval: ApprovalRequest):
        """Process plan approval"""
        await self.sessions.update_one(
            {"_id": ObjectId(approval.session_id)},
            {
                "$set": {
                    "plan_approved": approval.approved,
                    "status": ResearchStatus.RESEARCHING if approval.approved else ResearchStatus.PLANNING,
                    "updated_at": datetime.utcnow()
                }
            }
        )
    
    async def save_sections(self, session_id: str, sections: list):
        """Save completed sections"""
        await self.sessions.update_one(
            {"_id": ObjectId(session_id)},
            {
                "$set": {
                    "sections": [s.dict() for s in sections],
                    "updated_at": datetime.utcnow()
                }
            }
        )
    
    async def complete_session(self, session_id: str, pdf_path: str):
        """Mark session as completed"""
        await self.sessions.update_one(
            {"_id": ObjectId(session_id)},
            {
                "$set": {
                    "status": ResearchStatus.COMPLETED,
                    "final_report_path": pdf_path,
                    "completed_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }
            }
        )
    
    async def execute_research(
        self,
        session_id: str,
        update_callback: Optional[Callable] = None
    ):
        """
        Execute the full research workflow with multi-agent system.
        This runs asynchronously in the background.
        """
        try:
            session = await self.get_session(session_id)
            if not session:
                print(f"[ResearchService] Session {session_id} not found")
                return
            
            print(f"[ResearchService] Starting research for session {session_id}")
            print(f"[ResearchService] Topic: {session.topic}")
            
            # Update status
            await self.update_session_status(session_id, ResearchStatus.PLANNING)
            print(f"[ResearchService] Status: PLANNING")
            
            # Create callback wrapper that saves updates to DB
            async def wrapped_callback(update: AgentUpdate):
                print(f"[AgentUpdate] {update.agent.value}: {update.action} - {update.details.get('message', '')}")
                await self.add_agent_update(session_id, update)
                if update_callback:
                    await update_callback(update)
            
            # Initialize multi-agent system
            agent_system = MultiAgentResearchSystem(update_callback=wrapped_callback)
            state = AgentState(topic=session.topic)
            
            # Step 1: Create plan
            print(f"[ResearchService] Manager Agent: Creating plan...")
            state = await agent_system.manager_agent(state)
            print(f"[ResearchService] Plan created with {len(state.plan.sections)} sections")
            
            # Save plan and wait for approval
            await self.save_plan(session_id, state.plan.dict())
            print(f"[ResearchService] Waiting for plan approval...")
            
            # Wait for approval (polling approach)
            max_wait = 3600  # 1 hour timeout
            waited = 0
            while waited < max_wait:
                session = await self.get_session(session_id)
                if session.plan_approved:
                    print(f"[ResearchService] Plan approved! Starting research phase.")
                    break
                await asyncio.sleep(5)
                waited += 5
                if waited % 30 == 0:
                    print(f"[ResearchService] Still waiting for approval... ({waited}s)")
            
            if not session.plan_approved:
                print(f"[ResearchService] Plan not approved, failing session")
                await self.update_session_status(session_id, ResearchStatus.FAILED)
                return
            
            # Step 2: Execute research with all agents
            await self.update_session_status(session_id, ResearchStatus.RESEARCHING)
            print(f"[ResearchService] Starting research phase...")
            state = await agent_system.run_research(state)
            print(f"[ResearchService] Research phase complete. {len(state.sections)} sections created.")
            
            # Save sections
            await self.save_sections(session_id, state.sections)
            
            # Step 3: Generate PDF
            await self.update_session_status(session_id, ResearchStatus.COMPLETED)
            print(f"[ResearchService] Generating PDF report...")
            pdf_path = self.pdf_service.generate_report(
                topic=session.topic,
                sections=state.sections,
                session_id=session_id
            )
            
            # Complete session
            await self.complete_session(session_id, pdf_path)
            print(f"[ResearchService] Research complete! PDF: {pdf_path}")
            
        except Exception as e:
            print(f"[ResearchService] ERROR: {e}")
            import traceback
            traceback.print_exc()
            await self.update_session_status(session_id, ResearchStatus.FAILED)
    
    async def get_user_sessions(self, user_id: str, limit: int = 20):
        """Get all sessions for a user"""
        cursor = self.sessions.find({"user_id": user_id}).sort("created_at", -1).limit(limit)
        sessions = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            sessions.append(ResearchSession(**doc))
        return sessions
