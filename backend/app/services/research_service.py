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
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.sessions = db.research_sessions
        self.pdf_service = PDFReportService()
    
    async def create_session(self, request: ResearchRequest) -> ResearchSession:
        session = ResearchSession(
            user_id=request.user_id,
            topic=request.topic,
            status=ResearchStatus.PENDING,
        )
        
        result = await self.sessions.insert_one(session.dict(by_alias=True, exclude={"id"}))
        session.id = str(result.inserted_id)
        
        return session
    
    async def get_session(self, session_id: str) -> Optional[ResearchSession]:
        try:
            data = await self.sessions.find_one({"_id": ObjectId(session_id)})
            if not data:
                print(f"[ResearchService] Session {session_id} not found in database")
                return None
            
            data["_id"] = str(data["_id"])
            
            if isinstance(data.get('status'), str):
                try:
                    data['status'] = ResearchStatus(data['status'])
                except ValueError:
                    data['status'] = ResearchStatus.PENDING
            
            for field in ['created_at', 'updated_at', 'completed_at']:
                if data.get(field) and isinstance(data[field], str):
                    try:
                        data[field] = datetime.fromisoformat(data[field].replace('Z', '+00:00'))
                    except (ValueError, TypeError):
                        data[field] = datetime.utcnow()
            
            if data.get('agent_updates'):
                for update in data['agent_updates']:
                    if isinstance(update.get('timestamp'), str):
                        try:
                            update['timestamp'] = datetime.fromisoformat(update['timestamp'].replace('Z', '+00:00'))
                        except (ValueError, TypeError):
                            update['timestamp'] = datetime.utcnow()
            
            if data.get('sections'):
                for section in data['sections']:
                    if section.get('citations'):
                        for cit in section['citations']:
                            if isinstance(cit.get('accessed_at'), str):
                                try:
                                    cit['accessed_at'] = datetime.fromisoformat(cit['accessed_at'].replace('Z', '+00:00'))
                                except (ValueError, TypeError):
                                    cit['accessed_at'] = datetime.utcnow()
            
            sections = data.get('sections', [])
            total_citations = sum(len(s.get('citations', [])) for s in sections)
            print(f"[ResearchService] Loaded session {session_id}: {len(sections)} sections, {total_citations} citations")
            
            return ResearchSession(**data)
        except Exception as e:
            print(f"Error retrieving session {session_id}: {e}")
            import traceback
            traceback.print_exc()
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
        update_dict = update.dict()
        update_dict['timestamp'] = update_dict['timestamp'].isoformat()
        
        await self.sessions.update_one(
            {"_id": ObjectId(session_id)},
            {
                "$push": {"agent_updates": update_dict},
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
        sections_data = []
        for s in sections:
            section_dict = s.dict()
            if section_dict.get('citations'):
                for cit in section_dict['citations']:
                    if isinstance(cit.get('accessed_at'), datetime):
                        cit['accessed_at'] = cit['accessed_at'].isoformat()
            sections_data.append(section_dict)
        
        await self.sessions.update_one(
            {"_id": ObjectId(session_id)},
            {
                "$set": {
                    "sections": sections_data,
                    "updated_at": datetime.utcnow()
                }
            }
        )
    
    async def complete_session(self, session_id: str, pdf_path: str, cloudinary_url: str = None):
        """Mark session as completed"""
        update_data = {
            "status": ResearchStatus.COMPLETED,
            "final_report_path": pdf_path,
            "completed_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        if cloudinary_url:
            update_data["cloudinary_url"] = cloudinary_url
        
        await self.sessions.update_one(
            {"_id": ObjectId(session_id)},
            {"$set": update_data}
        )
    
    async def execute_research(
        self,
        session_id: str,
        update_callback: Optional[Callable] = None
    ):
       
        try:
            session = await self.get_session(session_id)
            if not session:
                print(f"[ResearchService] Session {session_id} not found")
                return
            
            print(f"[ResearchService] Starting research for session {session_id}")
            print(f"[ResearchService] Topic: {session.topic}")
            
            await self.update_session_status(session_id, ResearchStatus.PLANNING)
            print(f"[ResearchService] Status: PLANNING")
            
            async def wrapped_callback(update: AgentUpdate):
                print(f"[AgentUpdate] {update.agent.value}: {update.action} - {update.details.get('message', '')}")
                await self.add_agent_update(session_id, update)
                if update_callback:
                    await update_callback(update)
            
            agent_system = MultiAgentResearchSystem(update_callback=wrapped_callback)
            state = AgentState(topic=session.topic)
            
            print(f"[ResearchService] Manager Agent: Creating plan...")
            state = await agent_system.manager_agent(state)
            print(f"[ResearchService] Plan created with {len(state.plan.sections)} sections")
            
            await self.save_plan(session_id, state.plan.dict())
            print(f"[ResearchService] Plan created! Waiting for user approval...")
            
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
            
            await self.update_session_status(session_id, ResearchStatus.RESEARCHING)
            print(f"[ResearchService] Starting research phase...")
            state = await agent_system.run_research(state)
            print(f"[ResearchService] Research phase complete. {len(state.sections)} sections created.")
            
            await self.save_sections(session_id, state.sections)
            
            print(f"[ResearchService] Generating PDF report...")
            try:
                pdf_path = self.pdf_service.generate_report(
                    topic=session.topic,
                    sections=state.sections,
                    session_id=session_id
                )
                
                cloudinary_url = self.pdf_service.upload_to_cloudinary(pdf_path, session_id)
                
                await self.complete_session(session_id, pdf_path, cloudinary_url)
                print(f"[ResearchService] Research complete! PDF: {pdf_path}")
                if cloudinary_url:
                    print(f"[ResearchService] Cloudinary URL: {cloudinary_url}")
            except Exception as pdf_error:
                print(f"[ResearchService] PDF generation failed: {pdf_error}")
                await self.update_session_status(session_id, ResearchStatus.COMPLETED)
                print(f"[ResearchService] Research completed (PDF generation failed)")
            
        except Exception as e:
            print(f"[ResearchService] ERROR: {e}")
            import traceback
            traceback.print_exc()
            await self.update_session_status(session_id, ResearchStatus.FAILED)
    
    async def get_user_sessions(self, user_id: str, limit: int = 20):
        """Get all sessions for a user"""
        sessions = []
        cursor = self.sessions.find({"user_id": user_id}).sort("created_at", -1).limit(limit)
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            
            if isinstance(doc.get('status'), str):
                try:
                    doc['status'] = ResearchStatus(doc['status'])
                except ValueError:
                    doc['status'] = ResearchStatus.PENDING
            
            for field in ['created_at', 'updated_at', 'completed_at']:
                if doc.get(field) and isinstance(doc[field], str):
                    doc[field] = datetime.fromisoformat(doc[field].replace('Z', '+00:00'))
            
            if doc.get('agent_updates'):
                for update in doc['agent_updates']:
                    if isinstance(update.get('timestamp'), str):
                        update['timestamp'] = datetime.fromisoformat(update['timestamp'].replace('Z', '+00:00'))
            
            sessions.append(ResearchSession(**doc))
        return sessions
    
    async def delete_session(self, session_id: str) -> bool:
        """Delete a research session"""
        try:
            result = await self.sessions.delete_one({"_id": ObjectId(session_id)})
            return result.deleted_count > 0
        except Exception as e:
            print(f"Error deleting session {session_id}: {e}")
            return False
