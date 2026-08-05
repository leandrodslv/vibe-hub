import { useState, useEffect, useRef } from 'react';
import { ArrowRight, Bot, User, LayoutTemplate, Trash2, FolderPlus, Folder, ChevronLeft, X, Paperclip, Image as ImageIcon, Search, Settings, Pencil, Check, Zap } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { generateAIResponse } from '../../../services/ai';

const INITIAL_MESSAGE = {
  role: 'assistant',
  text: 'Bonjour ! Je suis votre assistant IA spécialisé en design UI/UX. Décrivez-moi le composant ou la page que vous souhaitez créer, et je vous rédigerai le "prompt" (la requête) parfait à utiliser dans le Générateur UI.',
};

const DEFAULT_SKILLS = [
  { id: 'ui', title: '/ui', name: 'Générateur UI', instruction: "Agis comme un développeur front-end expert en React et Tailwind CSS. Crée un composant UI moderne, minimaliste et responsive basé sur ma demande. Fournis uniquement le code final." },
  { id: 'review', title: '/review', name: 'Code Review', instruction: "Analyse ce code, repère les erreurs potentielles, les failles de sécurité ou les mauvaises pratiques, et propose une version optimisée." },
  { id: 'explain', title: '/explain', name: 'Explication simple', instruction: "Explique ce concept étape par étape de manière très simple, comme si tu l'expliquais à un développeur débutant, en donnant des exemples concrets." }
];

const PROJECT_COLORS = ['#6B7280', '#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];

export default function IATab() {
  const [sessions, setSessions] = useState([]);
  const [projects, setProjects] = useState([]);
  const [skills, setSkills] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [activeProjectId, setActiveProjectId] = useState(null);
  
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // States Image Upload
  const [selectedImage, setSelectedImage] = useState(null);
  const fileInputRef = useRef(null);

  // States Slash Commands / Skills
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashFilter, setSlashFilter] = useState('');
  const [activeSkill, setActiveSkill] = useState(null);

  // States Modale Skills
  const [isSkillModalOpen, setIsSkillModalOpen] = useState(false);
  const [editingSkillId, setEditingSkillId] = useState(null);
  const [newSkillTitle, setNewSkillTitle] = useState('');
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillInstruction, setNewSkillInstruction] = useState('');

  // States Recherche
  const [searchQuery, setSearchQuery] = useState('');

  // States Renommage Session
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editSessionTitle, setEditSessionTitle] = useState('');

  // States Modale Projet
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectInstruction, setNewProjectInstruction] = useState('');
  const [newProjectColor, setNewProjectColor] = useState(PROJECT_COLORS[0]);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    const savedProjects = localStorage.getItem('ai_projects');
    if (savedProjects) {
      try { setProjects(JSON.parse(savedProjects)); } catch (e) { console.error(e); }
    }

    const savedSkills = localStorage.getItem('ai_skills');
    if (savedSkills) {
      try { setSkills(JSON.parse(savedSkills)); } catch (e) { console.error(e); }
    } else {
      setSkills(DEFAULT_SKILLS);
    }

    const savedSessions = localStorage.getItem('ai_sessions');
    if (savedSessions) {
      try {
        const parsed = JSON.parse(savedSessions);
        const updatedParsed = parsed.map(s => ({ ...s, projectId: s.projectId || null }));
        setSessions(updatedParsed);
        
        const globalSessions = updatedParsed.filter(s => s.projectId === null);
        if (globalSessions.length > 0) {
          setCurrentSessionId(globalSessions[0].id);
        } else {
          handleNewChat(null);
        }
      } catch (e) {
        console.error("Erreur lecture localStorage", e);
        handleNewChat(null);
      }
    } else {
      handleNewChat(null);
    }
  }, []);

  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem('ai_sessions', JSON.stringify(sessions));
    } else {
      localStorage.removeItem('ai_sessions');
    }
  }, [sessions]);

  useEffect(() => {
    if (projects.length > 0) {
      localStorage.setItem('ai_projects', JSON.stringify(projects));
    } else {
      localStorage.removeItem('ai_projects');
    }
  }, [projects]);

  useEffect(() => {
    if (skills.length > 0) {
      localStorage.setItem('ai_skills', JSON.stringify(skills));
    } else {
      localStorage.removeItem('ai_skills');
    }
  }, [skills]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sessions, currentSessionId, isLoading]);

  const handleNewChat = (projId = activeProjectId) => {
    const newSessionId = Date.now().toString();
    const newSession = {
      id: newSessionId,
      projectId: projId,
      title: "Nouvelle discussion",
      updatedAt: Date.now(),
      messages: [INITIAL_MESSAGE],
      hasCustomTitle: false
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSessionId);
    setInput('');
    setSelectedImage(null);
    setShowSlashMenu(false);
    setActiveSkill(null);
  };

  // -- Projets --
  const openCreateModal = () => {
    setEditingProjectId(null);
    setNewProjectName('');
    setNewProjectInstruction('');
    setNewProjectColor(PROJECT_COLORS[0]);
    setIsModalOpen(true);
  };

  const openEditModal = () => {
    const proj = projects.find(p => p.id === activeProjectId);
    if (proj) {
      setEditingProjectId(proj.id);
      setNewProjectName(proj.name);
      setNewProjectInstruction(proj.instruction || '');
      setNewProjectColor(proj.color || PROJECT_COLORS[0]);
      setIsModalOpen(true);
    }
  };

  const handleSaveProject = () => {
    if (!newProjectName.trim()) return;

    if (editingProjectId) {
      setProjects(prev => prev.map(p => 
        p.id === editingProjectId 
          ? { ...p, name: newProjectName.trim(), instruction: newProjectInstruction.trim(), color: newProjectColor } 
          : p
      ));
      setIsModalOpen(false);
    } else {
      const newProject = {
        id: 'proj_' + Date.now().toString(),
        name: newProjectName.trim(),
        instruction: newProjectInstruction.trim(),
        color: newProjectColor,
        createdAt: Date.now()
      };
      setProjects(prev => [newProject, ...prev]);
      setIsModalOpen(false);
      enterProject(newProject.id);
    }
  };

  const handleDeleteProject = () => {
    const projId = editingProjectId;
    if (!projId) return;
    setProjects(prev => prev.filter(p => p.id !== projId));
    setSessions(prev => prev.filter(s => s.projectId !== projId));
    setIsModalOpen(false);
    if (activeProjectId === projId) leaveProject();
  };

  const enterProject = (projId) => {
    setActiveProjectId(projId);
    setSearchQuery('');
    const projSessions = sessions.filter(s => s.projectId === projId);
    if (projSessions.length > 0) {
      setCurrentSessionId(projSessions[0].id);
    } else {
      handleNewChat(projId);
    }
  };

  const leaveProject = () => {
    setActiveProjectId(null);
    setSearchQuery('');
    const globalSessions = sessions.filter(s => s.projectId === null);
    if (globalSessions.length > 0) {
      setCurrentSessionId(globalSessions[0].id);
    } else {
      handleNewChat(null);
    }
  };

  // -- Renommage Session --
  const startEditingSession = (e, session) => {
    e.stopPropagation();
    setEditingSessionId(session.id);
    setEditSessionTitle(session.title);
  };

  const saveSessionTitle = (e) => {
    if (e) e.stopPropagation();
    if (!editSessionTitle.trim() || !editingSessionId) {
      setEditingSessionId(null);
      return;
    }
    setSessions(prev => prev.map(s => 
      s.id === editingSessionId 
        ? { ...s, title: editSessionTitle.trim(), hasCustomTitle: true } 
        : s
    ));
    setEditingSessionId(null);
  };

  const handleRenameKeyDown = (e) => {
    if (e.key === 'Enter') saveSessionTitle();
    if (e.key === 'Escape') setEditingSessionId(null);
  };

  const currentSession = sessions.find(s => s.id === currentSessionId) || { messages: [INITIAL_MESSAGE] };
  const messages = currentSession.messages;

  // -- Image Handling --
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const removeImage = () => {
    setSelectedImage(null);
  };

  // -- Slash Commands Handling --
  const handleInputChange = (e) => {
    const val = e.target.value;
    setInput(val);

    if (val.startsWith('/')) {
      setShowSlashMenu(true);
      setSlashFilter(val.substring(1).toLowerCase());
    } else {
      setShowSlashMenu(false);
    }
  };

  const applySlashCommand = (skill) => {
    setActiveSkill(skill);
    setInput('');
    setShowSlashMenu(false);
  };

  const filteredSlashCommands = skills.filter(cmd => 
    cmd.title.toLowerCase().includes('/' + slashFilter)
  );

  // -- Skills Management --
  const openSkillModal = () => {
    setEditingSkillId(null);
    setNewSkillTitle('');
    setNewSkillName('');
    setNewSkillInstruction('');
    setIsSkillModalOpen(true);
  };

  const handleEditSkill = (skill) => {
    setEditingSkillId(skill.id);
    setNewSkillTitle(skill.title.replace('/', ''));
    setNewSkillName(skill.name);
    setNewSkillInstruction(skill.instruction);
  };

  const handleSaveSkill = () => {
    if (!newSkillTitle.trim() || !newSkillName.trim() || !newSkillInstruction.trim()) return;

    const formattedTitle = newSkillTitle.startsWith('/') ? newSkillTitle : '/' + newSkillTitle;

    if (editingSkillId) {
      setSkills(prev => prev.map(s => 
        s.id === editingSkillId 
          ? { ...s, title: formattedTitle, name: newSkillName.trim(), instruction: newSkillInstruction.trim() } 
          : s
      ));
      setEditingSkillId(null);
      setNewSkillTitle('');
      setNewSkillName('');
      setNewSkillInstruction('');
    } else {
      const newSkill = {
        id: 'skill_' + Date.now().toString(),
        title: formattedTitle,
        name: newSkillName.trim(),
        instruction: newSkillInstruction.trim()
      };
      setSkills(prev => [...prev, newSkill]);
      setNewSkillTitle('');
      setNewSkillName('');
      setNewSkillInstruction('');
    }
  };

  const handleDeleteSkill = (id) => {
    setSkills(prev => prev.filter(s => s.id !== id));
    if (editingSkillId === id) {
      setEditingSkillId(null);
      setNewSkillTitle('');
      setNewSkillName('');
      setNewSkillInstruction('');
    }
    if (activeSkill && activeSkill.id === id) {
      setActiveSkill(null);
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && !selectedImage && !activeSkill) || isLoading) return;
    
    const userMessageText = input.trim() || "Applique la compétence.";
    const imgData = selectedImage;
    
    setInput('');
    setSelectedImage(null);
    setShowSlashMenu(false);
    setIsLoading(true);

    const userMsg = { role: 'user', text: userMessageText };
    if (imgData) userMsg.image = imgData;
    
    // Si une compétence est active, on pourrait aussi l'afficher visuellement dans l'historique
    // mais on va la garder invisible pour l'historique de chat (injectée uniquement dans le system prompt)

    let newMessages = [...messages, userMsg];

    setSessions(prev => prev.map(session => {
      if (session.id === currentSessionId) {
        const newTitle = (!session.hasCustomTitle && session.messages.length === 1) 
          ? (activeSkill ? `[${activeSkill.name}] ${userMessageText}`.substring(0, 30) + '...' : userMessageText.substring(0, 30) + '...')
          : session.title;
          
        return {
          ...session,
          title: newTitle,
          updatedAt: Date.now(),
          messages: newMessages
        };
      }
      return session;
    }).sort((a, b) => b.updatedAt - a.updatedAt));

    // Construction du custom instruction complet
    let finalSystemInstruction = "";
    
    if (activeProjectId) {
      const proj = projects.find(p => p.id === activeProjectId);
      if (proj && proj.instruction) finalSystemInstruction += proj.instruction + "\n\n";
    }
    
    if (activeSkill) {
      finalSystemInstruction += `[COMPÉTENCE SPÉCIFIQUE REQUISE POUR CETTE RÉPONSE : ${activeSkill.name}]\n${activeSkill.instruction}\n\n`;
    }

    const aiResponseText = await generateAIResponse(newMessages, finalSystemInstruction.trim() || null);

    setSessions(prev => prev.map(session => {
      if (session.id === currentSessionId) {
        return {
          ...session,
          updatedAt: Date.now(),
          messages: [...session.messages, { role: 'assistant', text: aiResponseText }]
        };
      }
      return session;
    }));

    // On désactive la compétence après l'envoi
    setActiveSkill(null);
    setIsLoading(false);
  };

  const handleDeleteSession = (e, id) => {
    e.stopPropagation();
    const newSessions = sessions.filter(s => s.id !== id);
    setSessions(newSessions);
    
    const contextSessions = newSessions.filter(s => s.projectId === activeProjectId);
    if (contextSessions.length === 0) {
      handleNewChat(activeProjectId);
    } else if (currentSessionId === id) {
      setCurrentSessionId(contextSessions[0].id);
    }
  };

  // Filtrage pour l'affichage Sidebar
  const baseSessions = sessions.filter(s => s.projectId === activeProjectId);
  const searchedSessions = baseSessions.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const today = new Date();
  const recentSessions = searchedSessions.filter(s => {
    const d = new Date(s.updatedAt);
    return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  });
  const olderSessions = searchedSessions.filter(s => !recentSessions.includes(s));

  const renderSessionItem = (session) => {
    const isEditing = editingSessionId === session.id;
    const isActive = currentSessionId === session.id;

    if (isEditing) {
      return (
        <div key={session.id} className="w-full flex items-center px-2 py-1.5 bg-white border border-[#CCCCCC] rounded-md shadow-sm">
          <input
            autoFocus
            type="text"
            value={editSessionTitle}
            onChange={(e) => setEditSessionTitle(e.target.value)}
            onKeyDown={handleRenameKeyDown}
            onBlur={() => saveSessionTitle()}
            className="flex-1 bg-transparent text-[13px] font-medium outline-none text-black px-1"
          />
          <button onClick={saveSessionTitle} className="p-1 text-black hover:bg-[#F4F4F4] rounded-md shrink-0">
            <Check className="w-3.5 h-3.5" />
          </button>
        </div>
      );
    }

    return (
      <div key={session.id} className="relative group flex items-center">
        <button 
          onClick={() => setCurrentSessionId(session.id)} 
          className={`flex-1 text-left px-3 py-2 text-[13px] font-medium rounded-md truncate pr-14 transition-colors ${isActive ? 'text-black bg-[#F4F4F4]' : 'text-[#666666] hover:bg-[#FAFAFA]'}`}
        >
          {session.title}
        </button>
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center opacity-0 group-hover:opacity-100 bg-gradient-to-l from-white via-white to-transparent pl-4 transition-opacity">
          <button 
            onClick={(e) => startEditingSession(e, session)} 
            className="p-1 text-[#999] hover:text-black transition-colors rounded"
            title="Renommer"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={(e) => handleDeleteSession(e, session.id)} 
            className="p-1 text-[#999] hover:text-red-500 transition-colors rounded"
            title="Supprimer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="w-64 bg-white border border-[#EAEAEA] rounded-2xl flex flex-col shadow-sm flex-shrink-0 overflow-hidden">
        <div className="p-4">
          {activeProjectId === null ? (
            <button onClick={() => handleNewChat(null)} className="w-full bg-black text-white hover:bg-[#333] font-semibold text-[13px] py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2">
              + Nouvelle discussion
            </button>
          ) : (
            <button onClick={leaveProject} className="w-full bg-[#F4F4F4] text-black hover:bg-[#EAEAEA] font-semibold text-[13px] py-2 rounded-lg transition-colors flex items-center justify-center gap-1">
              <ChevronLeft className="w-4 h-4" /> Accueil IA
            </button>
          )}
        </div>

        <div className="px-4 pb-4 border-b border-[#EAEAEA]">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#999] absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Rechercher..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-[#F4F4F4] text-black text-xs rounded-lg pl-8 pr-3 py-2 outline-none border border-transparent focus:border-[#CCCCCC] transition-colors placeholder:text-[#999]"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1 flex-1 overflow-y-auto p-4">
          {activeProjectId === null && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2 px-2 mt-2">
                <span className="text-[10px] font-extrabold text-[#999999] uppercase tracking-widest">Mes Projets</span>
                <button onClick={openCreateModal} className="text-[#999] hover:text-black transition-colors" title="Nouveau projet"><FolderPlus className="w-3.5 h-3.5" /></button>
              </div>
              {projects.length === 0 ? (
                <div className="text-xs text-[#CCCCCC] px-2 py-1">Aucun projet</div>
              ) : (
                projects.map(proj => (
                  <div key={proj.id} className="relative group mb-1">
                    <button onClick={() => enterProject(proj.id)} className="w-full text-left px-3 py-2 text-[13px] font-semibold rounded-md truncate flex items-center gap-2 text-black hover:bg-[#F4F4F4] transition-colors border border-transparent group-hover:border-[#EAEAEA]">
                      <Folder className="w-3.5 h-3.5" style={{ color: proj.color || '#999' }} /> {proj.name}
                    </button>
                  </div>
                ))
              )}

              <div className="flex items-center justify-between mb-2 px-2 mt-6">
                <span className="text-[10px] font-extrabold text-[#999999] uppercase tracking-widest">Configuration</span>
              </div>
              <button onClick={openSkillModal} className="w-full text-left px-3 py-2 text-[13px] font-semibold rounded-md truncate flex items-center gap-2 text-black hover:bg-[#F4F4F4] transition-colors border border-transparent hover:border-[#EAEAEA]">
                <Zap className="w-3.5 h-3.5 text-[#F59E0B]" /> Mes Compétences (/)
              </button>

            </div>
          )}

          {activeProjectId !== null && (
            <div className="mb-4">
              <div className="bg-[#F9F9F9] border border-[#EAEAEA] rounded-lg p-3">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 text-black font-semibold text-sm truncate">
                    <Folder className="w-4 h-4" style={{ color: projects.find(p => p.id === activeProjectId)?.color || '#999' }} />
                    <span className="truncate">{projects.find(p => p.id === activeProjectId)?.name}</span>
                  </div>
                  <button onClick={openEditModal} className="text-[#999] hover:text-black transition-colors shrink-0" title="Paramètres du projet">
                    <Settings className="w-4 h-4" />
                  </button>
                </div>
                <button onClick={() => handleNewChat(activeProjectId)} className="w-full mt-2 bg-white border border-[#EAEAEA] text-black hover:bg-[#F4F4F4] text-[12px] py-1.5 rounded-md transition-colors">+ Nouveau chat</button>
              </div>
            </div>
          )}

          <span className="text-[10px] font-extrabold text-[#999999] uppercase tracking-widest mb-2 px-2 mt-2">Aujourd'hui</span>
          {recentSessions.length === 0 && <div className="text-xs text-[#CCCCCC] px-2 py-1">{searchQuery ? "Aucun résultat" : "Vide"}</div>}
          {recentSessions.map(renderSessionItem)}

          {olderSessions.length > 0 && (
            <>
              <span className="text-[10px] font-extrabold text-[#999999] uppercase tracking-widest mt-6 mb-2 px-2">Précédent</span>
              {olderSessions.map(renderSessionItem)}
            </>
          )}
        </div>
      </div>

      <div className="flex-1 bg-white border border-[#EAEAEA] rounded-2xl shadow-sm flex flex-col relative overflow-hidden">
        {activeProjectId !== null && (
          <div className="h-10 bg-[#FAFAFA] border-b border-[#EAEAEA] flex items-center px-4 gap-2 text-xs text-[#666]">
            <Folder className="w-3.5 h-3.5" style={{ color: projects.find(p => p.id === activeProjectId)?.color || '#999' }} />
            <span>Chat dans le projet : <strong className="text-black">{projects.find(p => p.id === activeProjectId)?.name}</strong></span>
          </div>
        )}

        <div className="flex-1 flex flex-col p-6 overflow-hidden relative">
          <div className="flex-1 overflow-y-auto pb-32 pr-4 flex flex-col gap-6">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-4 max-w-3xl ${msg.role === 'user' ? 'self-end flex-row-reverse' : 'self-start'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${msg.role === 'user' ? 'bg-[#F4F4F4]' : 'bg-black text-white'}`}>
                  {msg.role === 'user' ? <User className="w-5 h-5 text-black" /> : <Bot className="w-5 h-5" />}
                </div>
                <div className={`p-5 rounded-2xl text-[15px] leading-relaxed break-words ${msg.role === 'user' ? 'bg-[#F4F4F4] text-black rounded-tr-sm' : 'bg-white border border-[#EAEAEA] shadow-sm text-[#333333] rounded-tl-sm w-full max-w-full overflow-hidden'}`}>
                  {msg.image && (
                    <div className="mb-3">
                      <img src={msg.image} alt="Upload" className="max-w-xs rounded-lg border border-[#EAEAEA]" />
                    </div>
                  )}
                  {msg.role === 'user' ? (
                    <div className="whitespace-pre-wrap">{msg.text}</div>
                  ) : (
                    <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-[#F4F4F4] prose-pre:text-black">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-4 max-w-3xl self-start">
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm bg-black text-white"><Bot className="w-5 h-5" /></div>
                <div className="p-5 rounded-2xl text-[15px] leading-relaxed bg-white border border-[#EAEAEA] shadow-sm text-[#333333] rounded-tl-sm flex items-center gap-2">
                  <span className="w-2 h-2 bg-[#999] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 bg-[#999] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-[#999] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-3xl flex flex-col gap-2">
            
            {showSlashMenu && filteredSlashCommands.length > 0 && (
              <div className="absolute bottom-full mb-2 w-full bg-white border border-[#EAEAEA] rounded-xl shadow-lg p-2 flex flex-col gap-1 max-h-60 overflow-y-auto z-10">
                <div className="text-[10px] font-bold text-[#999] uppercase tracking-wider px-2 py-1">Compétences / Skills</div>
                {filteredSlashCommands.map((cmd) => (
                  <button 
                    key={cmd.id}
                    onClick={() => applySlashCommand(cmd)}
                    className="flex flex-col text-left px-3 py-2 hover:bg-[#F4F4F4] rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[13px] text-black">{cmd.title}</span>
                      <span className="text-[11px] text-[#666] font-medium bg-[#EAEAEA] px-1.5 py-0.5 rounded">{cmd.name}</span>
                    </div>
                    <span className="text-[11px] text-[#666] line-clamp-1 mt-0.5">{cmd.instruction}</span>
                  </button>
                ))}
              </div>
            )}

            {selectedImage && (
              <div className="w-fit bg-white border border-[#EAEAEA] p-2 rounded-xl shadow-sm relative group mb-1">
                <img src={selectedImage} alt="Preview" className="h-16 w-auto rounded-lg object-cover" />
                <button 
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 bg-black text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            <div className="w-full bg-white rounded-2xl border border-[#EAEAEA] shadow-[0_8px_30px_-10px_rgba(0,0,0,0.06)] flex flex-col p-2 focus-within:border-[#CCCCCC] transition-all duration-300">
              
              {activeSkill && (
                <div className="flex items-center gap-1.5 bg-[#F4F4F4] text-black px-2.5 py-1.5 rounded-lg text-[12px] font-semibold border border-[#EAEAEA] shadow-sm ml-2 mb-1 w-fit">
                  <Zap className="w-3.5 h-3.5 text-[#F59E0B]" />
                  <span>{activeSkill.title}</span>
                  <span className="font-normal text-[#666]">({activeSkill.name})</span>
                  <button onClick={() => setActiveSkill(null)} className="ml-1 text-[#999] hover:text-black transition-colors rounded-full p-0.5 hover:bg-[#EAEAEA]">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div className="flex items-end w-full">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-10 h-10 flex-shrink-0 text-[#999] hover:text-black flex items-center justify-center rounded-xl hover:bg-[#F4F4F4] transition-colors"
                  title="Joindre une image"
                >
                  <Paperclip className="w-5 h-5" />
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/*" 
                  className="hidden" 
                />

                <textarea
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (!showSlashMenu) handleSend();
                    }
                  }}
                  placeholder={isLoading ? "L'IA réfléchit..." : activeSkill ? "Votre demande (la compétence sera appliquée automatiquement)..." : "Taper / pour les compétences ou Envoyer un message..."}
                  disabled={isLoading}
                  rows={1}
                  className="flex-1 bg-transparent outline-none text-[15px] text-black placeholder:text-[#999999] font-medium disabled:opacity-50 resize-none py-2 px-2 max-h-32 overflow-y-auto"
                  style={{ minHeight: '40px' }}
                />

                <button
                  onClick={handleSend}
                  disabled={(!input.trim() && !selectedImage && !activeSkill) || isLoading}
                  className="w-10 h-10 flex-shrink-0 bg-[#999999] text-white rounded-xl flex items-center justify-center hover:bg-black transition-colors disabled:opacity-50 disabled:hover:bg-[#999999] cursor-pointer ml-2"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-[#EAEAEA]">
              <h2 className="text-lg font-bold text-black flex items-center gap-2">
                {editingProjectId ? <Settings className="w-5 h-5" /> : <FolderPlus className="w-5 h-5" />} 
                {editingProjectId ? "Paramètres du Projet" : "Nouveau Projet"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-[#999] hover:text-black transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 flex flex-col gap-5">
              <div>
                <label className="block text-sm font-semibold text-black mb-2">Nom du projet</label>
                <input type="text" value={newProjectName} onChange={e => setNewProjectName(e.target.value)} placeholder="Ex: Refonte Dashboard SaaS" className="w-full bg-[#F4F4F4] border border-transparent focus:border-black rounded-lg px-4 py-2.5 text-sm outline-none transition-colors" />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-black mb-2">Couleur</label>
                <div className="flex items-center gap-2">
                  {PROJECT_COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => setNewProjectColor(color)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${newProjectColor === color ? 'ring-2 ring-offset-2 ring-black scale-110' : 'hover:scale-110'}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-black mb-1">Instructions Personnalisées</label>
                <p className="text-xs text-[#666] mb-2">Définissez comment l'IA doit se comporter pour tous les chats de ce projet.</p>
                <textarea value={newProjectInstruction} onChange={e => setNewProjectInstruction(e.target.value)} placeholder="Ex: Tu es un expert en design minimaliste. Utilise toujours le tutoiement." className="w-full bg-[#F4F4F4] border border-transparent focus:border-black rounded-lg px-4 py-3 text-sm outline-none transition-colors resize-none h-32" />
              </div>
            </div>
            
            <div className="p-5 border-t border-[#EAEAEA] flex items-center justify-between bg-[#FAFAFA]">
              {editingProjectId ? (
                <button onClick={handleDeleteProject} className="flex items-center gap-2 text-sm font-semibold text-red-500 hover:text-red-700 transition-colors">
                  <Trash2 className="w-4 h-4" /> Supprimer le projet
                </button>
              ) : (
                <div />
              )}
              
              <div className="flex gap-3">
                <button onClick={() => setIsModalOpen(false)} className="px-5 py-2 rounded-lg text-sm font-semibold text-[#666] hover:bg-[#EAEAEA] transition-colors">Annuler</button>
                <button onClick={handleSaveProject} disabled={!newProjectName.trim()} className="px-5 py-2 rounded-lg text-sm font-semibold bg-black text-white hover:bg-[#333] transition-colors disabled:opacity-50">
                  {editingProjectId ? "Enregistrer" : "Créer"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isSkillModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden flex h-[80vh]">
            {/* Sidebar Skills */}
            <div className="w-1/3 border-r border-[#EAEAEA] flex flex-col bg-[#FAFAFA]">
              <div className="p-4 border-b border-[#EAEAEA]">
                <h2 className="text-base font-bold text-black flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#F59E0B]" /> Mes Compétences
                </h2>
              </div>
              <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
                <button 
                  onClick={() => { setEditingSkillId(null); setNewSkillTitle(''); setNewSkillName(''); setNewSkillInstruction(''); }}
                  className="w-full text-left px-3 py-2 bg-white border border-[#EAEAEA] rounded-lg text-[13px] font-semibold flex items-center gap-2 text-black hover:bg-[#F4F4F4] transition-colors shadow-sm"
                >
                  + Nouvelle Compétence
                </button>
                <div className="mt-2 flex flex-col gap-1">
                  {skills.map(skill => (
                    <div key={skill.id} className="relative group">
                      <button 
                        onClick={() => handleEditSkill(skill)}
                        className={`w-full text-left px-3 py-2.5 rounded-lg text-[13px] transition-colors border ${editingSkillId === skill.id ? 'bg-white border-[#CCCCCC] shadow-sm text-black font-semibold' : 'border-transparent text-[#666] hover:bg-white hover:border-[#EAEAEA]'}`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{skill.title}</span>
                          <span className="truncate">{skill.name}</span>
                        </div>
                      </button>
                      {editingSkillId !== skill.id && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDeleteSkill(skill.id); }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 opacity-0 group-hover:opacity-100 text-[#999] hover:text-red-500 bg-white rounded-md transition-all shadow-sm"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Formulaire Skill */}
            <div className="w-2/3 flex flex-col bg-white relative">
              <button onClick={() => setIsSkillModalOpen(false)} className="absolute top-4 right-4 p-2 text-[#999] hover:text-black transition-colors rounded-full hover:bg-[#F4F4F4] z-10"><X className="w-5 h-5" /></button>
              
              <div className="flex-1 p-8 flex flex-col gap-6 overflow-y-auto">
                <h3 className="text-xl font-bold text-black mb-2">
                  {editingSkillId ? "Modifier la compétence" : "Créer une compétence"}
                </h3>

                <div className="flex gap-4">
                  <div className="w-1/3">
                    <label className="block text-sm font-semibold text-black mb-2">Raccourci (slash)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999] font-bold">/</span>
                      <input type="text" value={newSkillTitle} onChange={e => setNewSkillTitle(e.target.value.replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase())} placeholder="seo" className="w-full bg-[#F4F4F4] border border-transparent focus:border-black rounded-lg pl-7 pr-4 py-2.5 text-sm outline-none transition-colors" />
                    </div>
                  </div>
                  <div className="w-2/3">
                    <label className="block text-sm font-semibold text-black mb-2">Nom de la compétence</label>
                    <input type="text" value={newSkillName} onChange={e => setNewSkillName(e.target.value)} placeholder="Ex: Expert SEO & Copywriting" className="w-full bg-[#F4F4F4] border border-transparent focus:border-black rounded-lg px-4 py-2.5 text-sm outline-none transition-colors" />
                  </div>
                </div>

                <div className="flex-1 flex flex-col">
                  <label className="block text-sm font-semibold text-black mb-1">Instructions Invisibles (System Prompt)</label>
                  <p className="text-xs text-[#666] mb-3">Ces instructions seront transmises à l'IA avec votre message de manière invisible lorsque vous utilisez ce raccourci.</p>
                  <textarea value={newSkillInstruction} onChange={e => setNewSkillInstruction(e.target.value)} placeholder="Ex: Agis comme un expert en référencement naturel. Ton but est d'optimiser le contenu suivant pour le mot-clé principal..." className="w-full flex-1 min-h-[200px] bg-[#F4F4F4] border border-transparent focus:border-black rounded-lg px-4 py-3 text-sm outline-none transition-colors resize-none leading-relaxed" />
                </div>
              </div>

              <div className="p-6 border-t border-[#EAEAEA] flex items-center justify-between bg-[#FAFAFA]">
                {editingSkillId ? (
                  <button onClick={() => handleDeleteSkill(editingSkillId)} className="flex items-center gap-2 text-sm font-semibold text-red-500 hover:text-red-700 transition-colors">
                    <Trash2 className="w-4 h-4" /> Supprimer
                  </button>
                ) : (
                  <div />
                )}
                
                <div className="flex gap-3">
                  <button onClick={() => setIsSkillModalOpen(false)} className="px-5 py-2.5 rounded-lg text-sm font-semibold text-[#666] hover:bg-[#EAEAEA] transition-colors">Fermer</button>
                  <button onClick={handleSaveSkill} disabled={!newSkillTitle.trim() || !newSkillName.trim() || !newSkillInstruction.trim()} className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-black text-white hover:bg-[#333] transition-colors disabled:opacity-50 flex items-center gap-2">
                    <Check className="w-4 h-4" /> {editingSkillId ? "Mettre à jour" : "Sauvegarder"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
