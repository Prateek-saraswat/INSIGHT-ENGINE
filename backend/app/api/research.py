from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, BackgroundTasks
from fastapi.responses import FileResponse
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List
from ..core.database import get_database
from ..models.schemas import (
    ResearchRequest, ResearchResponse, ResearchSession,
    ApprovalRequest, AgentUpdate
)
from ..services.research_service import ResearchService
from .websocket import manager
import asyncio
import os
import json
from datetime import datetime


def serialize_datetime(obj):
    """Custom serializer for datetime objects"""
    if isinstance(obj, datetime):
        return obj.isoformat()
    raise TypeError(f"Object of type {type(obj)} is not JSON serializable")

router = APIRouter(prefix="/api/research", tags=["research"])


def get_research_service(db: AsyncIOMotorDatabase = Depends(get_database)) -> ResearchService:
    """Dependency to get research service"""
    return ResearchService(db)


@router.post("/start", response_model=ResearchResponse)
async def start_research(
    request: ResearchRequest,
    background_tasks: BackgroundTasks,
    service: ResearchService = Depends(get_research_service)
):
    """
    Start a new research session.
    Creates the session and kicks off the multi-agent workflow in the background.
    """
    # Create session
    session = await service.create_session(request)
    
    # Start research in background
    background_tasks.add_task(service.execute_research, session.id)
    
    return ResearchResponse(
        session_id=session.id,
        status=session.status,
        message="Research session started. Connect to WebSocket for live updates."
    )


@router.get("/session/{session_id}", response_model=ResearchSession)
async def get_session(
    session_id: str,
    service: ResearchService = Depends(get_research_service)
):
    """Get details of a research session"""
    session = await service.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@router.post("/approve")
async def approve_plan(
    approval: ApprovalRequest,
    service: ResearchService = Depends(get_research_service)
):
    """Approve or reject a research plan"""
    session = await service.get_session(approval.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    await service.approve_plan(approval)
    
    return {"message": "Plan approval processed", "approved": approval.approved}


@router.get("/sessions/{user_id}", response_model=List[ResearchSession])
async def get_user_sessions(
    user_id: str,
    service: ResearchService = Depends(get_research_service)
):
    """Get all research sessions for a user"""
    sessions = await service.get_user_sessions(user_id)
    return sessions


@router.delete("/session/{session_id}")
async def delete_session(
    session_id: str,
    service: ResearchService = Depends(get_research_service)
):
    """Delete a research session"""
    deleted = await service.delete_session(session_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"message": "Session deleted successfully"}


@router.get("/download/{session_id}")
async def download_report(
    session_id: str,
    service: ResearchService = Depends(get_research_service)
):
    """Download the PDF report for a research session"""
    session = await service.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if session.status != "completed" or not session.final_report_path:
        raise HTTPException(status_code=404, detail="Report not available")
    
    if not os.path.exists(session.final_report_path):
        raise HTTPException(status_code=404, detail="Report file not found")
    
    return FileResponse(
        path=session.final_report_path,
        filename=f"research_report_{session_id}.pdf",
        media_type="application/pdf"
    )


@router.websocket("/stream/{session_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    session_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    WebSocket endpoint for streaming real-time research updates.
    Clients connect here to watch the multi-agent system work.
    """
    await manager.connect(websocket, session_id)
    
    try:
        # Send existing updates first
        service = ResearchService(db)
        session = await service.get_session(session_id)
        
        if session and session.agent_updates:
            # Convert to dict with datetime serialization
            updates_data = []
            for u in session.agent_updates:
                update_dict = u.dict()
                update_dict['timestamp'] = update_dict['timestamp'].isoformat()
                updates_data.append(update_dict)
            
            await websocket.send_json({
                "type": "history",
                "updates": updates_data
            })
        
        # Keep connection alive and listen for messages
        while True:
            try:
                data = await websocket.receive_text()
                # Echo back for connection health check
                await websocket.send_json({"type": "pong"})
            except WebSocketDisconnect:
                break
            except Exception as e:
                print(f"WebSocket error: {e}")
                break
    
    finally:
        manager.disconnect(websocket, session_id)


# Helper function for services to broadcast updates
async def broadcast_update(session_id: str, update: AgentUpdate):
    """Broadcast an agent update to all connected clients"""
    update_dict = update.dict()
    update_dict['timestamp'] = update_dict['timestamp'].isoformat()
    await manager.broadcast_to_session(
        session_id,
        {
            "type": "agent_update",
            "update": update_dict
        }
    )
