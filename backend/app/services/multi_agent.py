from typing import List, Dict, Any, Callable, Optional
from openai import AsyncOpenAI
from ..models.schemas import (
    AgentType, AgentUpdate, ResearchPlan, ResearchNote,
    Citation, SectionContent, CritiqueResult
)
from ..core.config import settings
from .web_research import WebResearchService
import asyncio
from datetime import datetime
import json


class AgentState:
    """Shared state between agents"""
    def __init__(self, topic: str):
        self.topic = topic
        self.plan: Optional[ResearchPlan] = None
        self.research_notes: List[ResearchNote] = []
        self.sections: List[SectionContent] = []
        self.current_section_index: int = 0
        self.needs_revision: bool = False
        self.revision_feedback: str = ""
        self.max_revisions: int = 1
        self.agent_updates: List[AgentUpdate] = []


class MultiAgentResearchSystem:
    """
    LangGraph-inspired multi-agent system for autonomous research.
    Uses a state machine approach with specialized agents.
    """
    
    def __init__(self, update_callback: Optional[Callable] = None):
        self.client = AsyncOpenAI(api_key=settings.openai_api_key)
        self.web_research = WebResearchService()
        self.update_callback = update_callback
        self.model = "gpt-4o"
    
    async def emit_update(self, agent: AgentType, action: str, details: Dict[str, Any]):
        """Emit an update to the callback (for streaming to frontend)"""
        update = AgentUpdate(
            agent=agent,
            action=action,
            details=details,
            timestamp=datetime.utcnow()
        )
        
        if self.update_callback:
            await self.update_callback(update)
        
        return update
    
    async def manager_agent(self, state: AgentState) -> AgentState:
        """
        Manager Agent: Strategic planning and task decomposition
        """
        await self.emit_update(
            AgentType.MANAGER,
            "planning",
            {"message": "Analyzing research topic and creating plan..."}
        )
        
        prompt = f"""You are a research manager. Analyze this topic and create a structured research plan.

Topic: {state.topic}

Create a comprehensive research plan with:
1. 4-6 main thematic sections (each should be a distinct aspect of the topic)
2. A FLAT list of research questions (not nested, not grouped by section)
3. A single integer for total estimated sources needed

Respond in JSON format with EXACTLY this structure - no nesting, no extra keys:
{{
    "sections": ["Section 1", "Section 2", "Section 3", "Section 4"],
    "research_questions": ["Question 1?", "Question 2?", "Question 3?", "Question 4?", "Question 5?", "Question 6?"],
    "estimated_sources": 15
}}"""
        
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            response_format={"type": "json_object"}
        )
        
        plan_data = json.loads(response.choices[0].message.content)
        
        # Flatten nested structures if GPT returns them
        if isinstance(plan_data.get('research_questions'), dict):
            # Extract questions from dict values
            questions = []
            for v in plan_data['research_questions'].values():
                if isinstance(v, list):
                    questions.extend(v)
                else:
                    questions.append(v)
            plan_data['research_questions'] = questions
        
        if isinstance(plan_data.get('estimated_sources'), dict):
            # Get first integer value or sum
            values = [v for v in plan_data['estimated_sources'].values() if isinstance(v, int)]
            plan_data['estimated_sources'] = sum(values) if values else 15
        
        # Ensure types are correct
        plan_data['research_questions'] = [str(q) for q in plan_data.get('research_questions', [])]
        plan_data['estimated_sources'] = int(plan_data.get('estimated_sources', 15))
        
        state.plan = ResearchPlan(**plan_data)
        
        await self.emit_update(
            AgentType.MANAGER,
            "plan_created",
            {
                "plan": plan_data,
                "message": f"Created plan with {len(state.plan.sections)} sections"
            }
        )
        
        return state
    
    async def researcher_agent(self, state: AgentState, section_title: str) -> List[Citation]:
        """
        Researcher Agent: Collects data from the web
        """
        await self.emit_update(
            AgentType.RESEARCHER,
            "searching",
            {"section": section_title, "message": f"Researching: {section_title}"}
        )
        
        # Perform web research
        search_query = f"{state.topic} {section_title}"
        citations = await self.web_research.research_topic(search_query, num_sources=3)
        
        print(f"[ResearcherAgent] Found {len(citations)} citations for section '{section_title}'")
        
        await self.emit_update(
            AgentType.RESEARCHER,
            "sources_found",
            {
                "section": section_title,
                "num_sources": len(citations),
                "sources": [{"title": c.title, "url": c.url} for c in citations]
            }
        )
        
        return citations
    
    async def writer_agent(
        self,
        state: AgentState,
        section_title: str,
        citations: List[Citation]
    ) -> SectionContent:
        """
        Writer Agent: Synthesizes research into coherent content
        """
        await self.emit_update(
            AgentType.WRITER,
            "writing",
            {"section": section_title, "message": f"Writing section: {section_title}"}
        )
        
        # Prepare research context
        research_context = "\n\n".join([
            f"Source: {c.title}\nURL: {c.url}\nContent: {c.excerpt}"
            for c in citations
        ])
        
        prompt = f"""You are a professional research writer. Write a comprehensive, well-structured section for a research report.

Topic: {state.topic}
Section: {section_title}

Research Sources:
{research_context}

Write a 3-4 paragraph section that:
1. Synthesizes the key findings from the sources
2. Maintains an academic, professional tone
3. Presents information logically and coherently
4. Integrates evidence from the sources (reference them naturally)
5. Provides analytical insights, not just summary

Write clear, engaging prose. Do not use bullet points."""
        
        if state.needs_revision:
            prompt += f"\n\nREVISION FEEDBACK: {state.revision_feedback}\n\nPlease address this feedback in your revision."
        
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7
        )
        
        content = response.choices[0].message.content
        
        section = SectionContent(
            title=section_title,
            content=content,
            citations=citations,
            revision_count=0
        )
        
        await self.emit_update(
            AgentType.WRITER,
            "section_drafted",
            {
                "section": section_title,
                "word_count": len(content.split()),
                "preview": content[:200] + "..."
            }
        )
        
        return section
    
    async def critique_agent(
        self,
        state: AgentState,
        section: SectionContent
    ) -> CritiqueResult:
        """
        Critique Agent: Quality control and feedback
        """
        await self.emit_update(
            AgentType.CRITIQUE,
            "reviewing",
            {"section": section.title, "message": "Reviewing section quality..."}
        )
        
        prompt = f"""You are a research quality reviewer. Evaluate this section critically:

Section Title: {section.title}
Content:
{section.content}

Available Sources:
{', '.join([c.title for c in section.citations])}

Evaluate for:
1. Unsupported claims (statements without source backing)
2. Logical coherence
3. Completeness of analysis
4. Proper integration of sources

Respond in JSON format:
{{
    "has_issues": true/false,
    "feedback": "Specific feedback if issues found",
    "unsupported_claims": ["claim 1", "claim 2"],
    "quality_score": 0-10
}}

If quality_score >= 5 and no major issues, set has_issues to false."""
        
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            response_format={"type": "json_object"}
        )
        
        critique_data = json.loads(response.choices[0].message.content)
        
        result = CritiqueResult(
            has_issues=critique_data.get("has_issues", False),
            feedback=critique_data.get("feedback", ""),
            unsupported_claims=critique_data.get("unsupported_claims", [])
        )
        
        await self.emit_update(
            AgentType.CRITIQUE,
            "review_complete",
            {
                "section": section.title,
                "has_issues": result.has_issues,
                "feedback": result.feedback,
                "quality_score": critique_data.get("quality_score", 0)
            }
        )
        
        return result
    
    async def run_research(self, state: AgentState) -> AgentState:
        """
        Main orchestration loop - implements the multi-agent workflow
        """
        print(f"[MultiAgent] Starting research for topic: {state.topic}")
        
        # Step 1: Manager creates plan
        state = await self.manager_agent(state)
        
        print(f"[MultiAgent] Plan approved. Sections: {state.plan.sections}")
        
        # Step 2: Research and write each section
        for idx, section_title in enumerate(state.plan.sections):
            print(f"[MultiAgent] === Section {idx + 1}/{len(state.plan.sections)}: {section_title} ===")
            
            revision_count = 0
            section_approved = False
            
            while not section_approved and revision_count <= state.max_revisions:
                print(f"[MultiAgent] Starting revision {revision_count} for section '{section_title}'")
                
                # Researcher gathers data
                print(f"[MultiAgent] Researcher Agent: Searching for '{section_title}'...")
                citations = await self.researcher_agent(state, section_title)
                print(f"[MultiAgent] Researcher Agent: Found {len(citations)} sources")
                
                # Writer creates content
                print(f"[MultiAgent] Writer Agent: Drafting section '{section_title}'...")
                section = await self.writer_agent(state, section_title, citations)
                print(f"[MultiAgent] Writer Agent: Drafted {len(section.content.split())} words")
                section.revision_count = revision_count
                
                # Critique reviews quality
                print(f"[MultiAgent] Critique Agent: Reviewing section '{section_title}'...")
                critique = await self.critique_agent(state, section)
                print(f"[MultiAgent] Critique Agent: Quality score: {critique.feedback[:100] if critique.feedback else 'No feedback'}...")
                
                if critique.has_issues:
                    # Trigger revision
                    state.needs_revision = True
                    state.revision_feedback = critique.feedback
                    revision_count += 1
                    
                    await self.emit_update(
                        AgentType.MANAGER,
                        "revision_requested",
                        {
                            "section": section_title,
                            "revision_count": revision_count,
                            "feedback": critique.feedback
                        }
                    )
                    print(f"[MultiAgent] Revision {revision_count} requested: {critique.feedback[:100]}...")
                else:
                    # Section approved
                    section_approved = True
                    state.sections.append(section)
                    state.needs_revision = False
                    state.revision_feedback = ""
                    print(f"[MultiAgent] Section '{section_title}' APPROVED!")
            
            if not section_approved:
                # Max revisions reached, force approve with note
                state.sections.append(section)
                state.needs_revision = False
                state.revision_feedback = ""
                await self.emit_update(
                    AgentType.MANAGER,
                    "max_revisions_reached",
                    {
                        "section": section_title,
                        "final_feedback": critique.feedback
                    }
                )
                print(f"[MultiAgent] Section '{section_title}' approved after max revisions ({state.max_revisions})")
            
            # Small delay between sections
            await asyncio.sleep(1)
        
        print(f"[MultiAgent] Research complete! {len(state.sections)} sections created.")
        return state
