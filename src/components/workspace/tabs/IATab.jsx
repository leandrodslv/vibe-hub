import { useState, useEffect, useRef } from 'react';
import {
  ArrowUp,
  Bot,
  User,
  Trash2,
  FolderPlus,
  Folder,
  ChevronLeft,
  X,
  Paperclip,
  Search,
  Settings,
  Pencil,
  Check,
  Zap,
  Code2,
  Copy,
  Send,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { generateAIResponse } from '../../../services/ai';

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface';

function PromptHandoff({ text, onSend, onEdit }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-on-surface text-surface rounded-3xl p-6 chunky-shadow relative z-0 overflow-hidden group border border-outline-variant/10">
      <div
        className="absolute -right-10 -top-10 w-32 h-32 bg-primary rounded-full opacity-20 blur-2xl group-hover:opacity-30 transition-opacity"
        aria-hidden="true"
      />
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="flex items-center gap-2 text-primary-fixed-dim">
          <Code2 className="w-4 h-4" aria-hidden="true" />
          <span className="font-label-caps text-label-caps">PROMPT PRÊT</span>
        </div>
        <button
          onClick={handleCopy}
          aria-label="Copier le prompt"
          className={`bg-primary hover:bg-primary-container text-on-primary hover:text-on-primary-container w-10 h-10 rounded-full flex items-center justify-center transition-colors shadow-md active:scale-95 ${FOCUS_RING}`}
        >
          {copied ? (
            <Check className="w-4 h-4" aria-hidden="true" />
          ) : (
            <Copy className="w-4 h-4" aria-hidden="true" />
          )}
        </button>
      </div>
      <div className="font-body-lg text-body-lg text-surface leading-relaxed relative z-10 whitespace-pre-wrap">
        {text}
      </div>
      <div className="mt-6 flex flex-wrap gap-3 relative z-10">
        <button
          onClick={onSend}
          className={`bg-primary-container text-on-primary-container px-6 py-3 rounded-full font-cta-pill text-cta-pill flex items-center gap-2 hover:bg-primary hover:text-on-primary transition-colors active:scale-95 shadow-sm ${FOCUS_RING}`}
        >
          <Send className="w-4 h-4" aria-hidden="true" /> Envoyer au Générateur
        </button>
        <button
          onClick={onEdit}
          className={`bg-surface-container-highest text-on-surface px-6 py-3 rounded-full font-cta-pill text-cta-pill hover:bg-surface-dim transition-colors active:scale-95 ${FOCUS_RING}`}
        >
          Modifier
        </button>
      </div>
    </div>
  );
}

const INITIAL_MESSAGE = {
  role: 'assistant',
  text: 'Bonjour ! Je suis votre assistant IA spécialisé en design UI/UX. Décrivez-moi le composant ou la page que vous souhaitez créer, et je vous rédigerai le "prompt" (la requête) parfait à utiliser dans le Générateur UI.',
};

const DEFAULT_SKILLS = [
  {
    id: 'ui',
    title: '/ui',
    name: 'Générateur UI',
    instruction:
      'Agis comme un développeur front-end expert en React et Tailwind CSS. Crée un composant UI moderne, minimaliste et responsive basé sur ma demande. Fournis uniquement le code final.',
  },
  {
    id: 'review',
    title: '/review',
    name: 'Code Review',
    instruction:
      'Analyse ce code, repère les erreurs potentielles, les failles de sécurité ou les mauvaises pratiques, et propose une version optimisée.',
  },
  {
    id: 'explain',
    title: '/explain',
    name: 'Explication simple',
    instruction:
      "Explique ce concept étape par étape de manière très simple, comme si tu l'expliquais à un développeur débutant, en donnant des exemples concrets.",
  },
];

const PROJECT_COLORS = [
  '#6B7280',
  '#3B82F6',
  '#8B5CF6',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#EC4899',
];

export default function IATab({ onSendToGenerator }) {
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
  const didInit = useRef(false);

  useEffect(() => {
    // Verrou anti-double-exécution : en dev, StrictMode invoque cet effet deux fois
    // avant que l'état mis à jour par la 1ère passe ne soit reflété dans un nouveau
    // rendu — la 2e passe voit donc encore sessions=[] et créait une session en trop.
    if (didInit.current) return;
    didInit.current = true;

    const savedProjects = localStorage.getItem('ai_projects');
    if (savedProjects) {
      try {
        setProjects(JSON.parse(savedProjects));
      } catch (e) {
        console.error(e);
      }
    }

    const savedSkills = localStorage.getItem('ai_skills');
    if (savedSkills) {
      try {
        setSkills(JSON.parse(savedSkills));
      } catch (e) {
        console.error(e);
      }
    } else {
      setSkills(DEFAULT_SKILLS);
    }

    const savedSessions = localStorage.getItem('ai_sessions');
    if (savedSessions) {
      try {
        const parsed = JSON.parse(savedSessions);
        const updatedParsed = parsed.map((s) => ({ ...s, projectId: s.projectId || null }));

        // Nettoyage : ne garder qu'une seule discussion vide par contexte (projet ou
        // global). Évite l'accumulation de "Nouvelle discussion" en double au fil
        // des rechargements de page.
        const seenEmptyContexts = new Set();
        const deduped = [...updatedParsed]
          .sort((a, b) => b.updatedAt - a.updatedAt)
          .filter((s) => {
            const isEmpty = s.messages.length === 1 && !s.hasCustomTitle;
            if (!isEmpty) return true;
            if (seenEmptyContexts.has(s.projectId)) return false;
            seenEmptyContexts.add(s.projectId);
            return true;
          });

        setSessions(deduped);

        const globalSessions = deduped.filter((s) => s.projectId === null);
        if (globalSessions.length > 0) {
          setCurrentSessionId(globalSessions[0].id);
        } else {
          handleNewChat(null);
        }
      } catch (e) {
        console.error('Erreur lecture localStorage', e);
        handleNewChat(null);
      }
    } else {
      handleNewChat(null);
    }
    // Initialisation au montage uniquement : ajouter handleNewChat aux
    // dépendances relancerait l'effet à chaque nouvelle identité de la
    // fonction et recréerait des sessions en boucle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sessions, currentSessionId, isLoading]);

  const handleNewChat = (projId = activeProjectId) => {
    // Réutilise une discussion déjà vide de ce contexte plutôt que d'en empiler
    // une nouvelle (ex: clics répétés sur "+ Nouvelle discussion").
    const existingEmpty = sessions.find(
      (s) => s.projectId === projId && s.messages.length === 1 && !s.hasCustomTitle
    );
    if (existingEmpty) {
      setCurrentSessionId(existingEmpty.id);
      setInput('');
      setSelectedImage(null);
      setShowSlashMenu(false);
      setActiveSkill(null);
      return;
    }

    const newSessionId = Date.now().toString();
    const newSession = {
      id: newSessionId,
      projectId: projId,
      title: 'Nouvelle discussion',
      updatedAt: Date.now(),
      messages: [INITIAL_MESSAGE],
      hasCustomTitle: false,
    };
    setSessions((prev) => [newSession, ...prev]);
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
    const proj = projects.find((p) => p.id === activeProjectId);
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
      setProjects((prev) =>
        prev.map((p) =>
          p.id === editingProjectId
            ? {
                ...p,
                name: newProjectName.trim(),
                instruction: newProjectInstruction.trim(),
                color: newProjectColor,
              }
            : p
        )
      );
      setIsModalOpen(false);
    } else {
      const newProject = {
        id: 'proj_' + Date.now().toString(),
        name: newProjectName.trim(),
        instruction: newProjectInstruction.trim(),
        color: newProjectColor,
        createdAt: Date.now(),
      };
      setProjects((prev) => [newProject, ...prev]);
      setIsModalOpen(false);
      enterProject(newProject.id);
    }
  };

  const handleDeleteProject = () => {
    const projId = editingProjectId;
    if (!projId) return;
    setProjects((prev) => prev.filter((p) => p.id !== projId));
    setSessions((prev) => prev.filter((s) => s.projectId !== projId));
    setIsModalOpen(false);
    if (activeProjectId === projId) leaveProject();
  };

  const enterProject = (projId) => {
    setActiveProjectId(projId);
    setSearchQuery('');
    const projSessions = sessions.filter((s) => s.projectId === projId);
    if (projSessions.length > 0) {
      setCurrentSessionId(projSessions[0].id);
    } else {
      handleNewChat(projId);
    }
  };

  const leaveProject = () => {
    setActiveProjectId(null);
    setSearchQuery('');
    const globalSessions = sessions.filter((s) => s.projectId === null);
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
    setSessions((prev) =>
      prev.map((s) =>
        s.id === editingSessionId
          ? { ...s, title: editSessionTitle.trim(), hasCustomTitle: true }
          : s
      )
    );
    setEditingSessionId(null);
  };

  const handleRenameKeyDown = (e) => {
    if (e.key === 'Enter') saveSessionTitle();
    if (e.key === 'Escape') setEditingSessionId(null);
  };

  const currentSession = sessions.find((s) => s.id === currentSessionId) || {
    messages: [INITIAL_MESSAGE],
  };
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

  const filteredSlashCommands = skills.filter((cmd) =>
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
      setSkills((prev) =>
        prev.map((s) =>
          s.id === editingSkillId
            ? {
                ...s,
                title: formattedTitle,
                name: newSkillName.trim(),
                instruction: newSkillInstruction.trim(),
              }
            : s
        )
      );
      setEditingSkillId(null);
      setNewSkillTitle('');
      setNewSkillName('');
      setNewSkillInstruction('');
    } else {
      const newSkill = {
        id: 'skill_' + Date.now().toString(),
        title: formattedTitle,
        name: newSkillName.trim(),
        instruction: newSkillInstruction.trim(),
      };
      setSkills((prev) => [...prev, newSkill]);
      setNewSkillTitle('');
      setNewSkillName('');
      setNewSkillInstruction('');
    }
  };

  const handleDeleteSkill = (id) => {
    setSkills((prev) => prev.filter((s) => s.id !== id));
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

    const userMessageText = input.trim() || 'Applique la compétence.';
    const imgData = selectedImage;

    setInput('');
    setSelectedImage(null);
    setShowSlashMenu(false);
    setIsLoading(true);

    const userMsg = { role: 'user', text: userMessageText };
    if (imgData) userMsg.image = imgData;

    // Si une compétence est active, on pourrait aussi l'afficher visuellement dans l'historique
    // mais on va la garder invisible pour l'historique de chat (injectée uniquement dans le system prompt)

    const newMessages = [...messages, userMsg];

    setSessions((prev) =>
      prev
        .map((session) => {
          if (session.id === currentSessionId) {
            const newTitle =
              !session.hasCustomTitle && session.messages.length === 1
                ? activeSkill
                  ? `[${activeSkill.name}] ${userMessageText}`.substring(0, 30) + '...'
                  : userMessageText.substring(0, 30) + '...'
                : session.title;

            return {
              ...session,
              title: newTitle,
              updatedAt: Date.now(),
              messages: newMessages,
            };
          }
          return session;
        })
        .sort((a, b) => b.updatedAt - a.updatedAt)
    );

    // Construction du custom instruction complet
    let finalSystemInstruction = '';

    if (activeProjectId) {
      const proj = projects.find((p) => p.id === activeProjectId);
      if (proj && proj.instruction) finalSystemInstruction += proj.instruction + '\n\n';
    }

    if (activeSkill) {
      finalSystemInstruction += `[COMPÉTENCE SPÉCIFIQUE REQUISE POUR CETTE RÉPONSE : ${activeSkill.name}]\n${activeSkill.instruction}\n\n`;
    }

    const aiResponseText = await generateAIResponse(
      newMessages,
      finalSystemInstruction.trim() || null
    );

    setSessions((prev) =>
      prev.map((session) => {
        if (session.id === currentSessionId) {
          return {
            ...session,
            updatedAt: Date.now(),
            messages: [...session.messages, { role: 'assistant', text: aiResponseText }],
          };
        }
        return session;
      })
    );

    // On désactive la compétence après l'envoi
    setActiveSkill(null);
    setIsLoading(false);
  };

  const handleDeleteSession = (e, id) => {
    e.stopPropagation();
    const newSessions = sessions.filter((s) => s.id !== id);
    setSessions(newSessions);

    const contextSessions = newSessions.filter((s) => s.projectId === activeProjectId);
    if (contextSessions.length === 0) {
      handleNewChat(activeProjectId);
    } else if (currentSessionId === id) {
      setCurrentSessionId(contextSessions[0].id);
    }
  };

  // Filtrage pour l'affichage Sidebar
  const baseSessions = sessions.filter((s) => s.projectId === activeProjectId);
  const searchedSessions = baseSessions.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const today = new Date();
  const recentSessions = searchedSessions.filter((s) => {
    const d = new Date(s.updatedAt);
    return (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    );
  });
  const olderSessions = searchedSessions.filter((s) => !recentSessions.includes(s));

  const renderSessionItem = (session) => {
    const isEditing = editingSessionId === session.id;
    const isActive = currentSessionId === session.id;

    if (isEditing) {
      return (
        <div
          key={session.id}
          className="w-full flex items-center px-2 py-1.5 bg-surface-container-lowest border border-outline-variant rounded-md shadow-sm"
        >
          <input
            autoFocus
            type="text"
            value={editSessionTitle}
            onChange={(e) => setEditSessionTitle(e.target.value)}
            onKeyDown={handleRenameKeyDown}
            onBlur={() => saveSessionTitle()}
            className="flex-1 bg-transparent text-[13px] font-medium outline-none text-on-surface px-1"
          />
          <button
            onClick={saveSessionTitle}
            className={`p-1 text-on-surface hover:bg-surface-container rounded-md shrink-0 ${FOCUS_RING}`}
          >
            <Check className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      );
    }

    return (
      <div key={session.id} className="relative group flex items-center">
        <button
          onClick={() => setCurrentSessionId(session.id)}
          className={`flex-1 text-left px-3 py-2 text-[13px] font-medium rounded-md truncate pr-14 transition-colors ${FOCUS_RING} ${isActive ? 'text-on-surface bg-surface-container' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
        >
          {session.title}
        </button>
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center opacity-0 group-hover:opacity-100 bg-gradient-to-l from-surface-container-lowest via-surface-container-lowest to-transparent pl-4 transition-opacity">
          <button
            onClick={(e) => startEditingSession(e, session)}
            className={`p-1 text-on-surface-variant hover:text-on-surface transition-colors rounded ${FOCUS_RING}`}
            title="Renommer"
            aria-label="Renommer la discussion"
          >
            <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
          <button
            onClick={(e) => handleDeleteSession(e, session.id)}
            className={`p-1 text-on-surface-variant hover:text-error transition-colors rounded ${FOCUS_RING}`}
            title="Supprimer"
            aria-label="Supprimer la discussion"
          >
            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="w-full h-full min-h-0 flex gap-6">
        <div className="w-64 bg-surface-container-lowest border border-surface-variant rounded-3xl flex flex-col shadow-sm flex-shrink-0 overflow-hidden">
          <div className="p-4">
            {activeProjectId === null ? (
              <button
                onClick={() => handleNewChat(null)}
                className={`w-full bg-primary text-on-primary hover:opacity-90 font-semibold text-[13px] py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 ${FOCUS_RING}`}
              >
                + Nouvelle discussion
              </button>
            ) : (
              <button
                onClick={leaveProject}
                className={`w-full bg-surface-container text-on-surface hover:bg-surface-variant font-semibold text-[13px] py-2 rounded-lg transition-colors flex items-center justify-center gap-1 ${FOCUS_RING}`}
              >
                <ChevronLeft className="w-4 h-4" aria-hidden="true" /> Accueil IA
              </button>
            )}
          </div>

          <div className="px-4 pb-4 border-b border-surface-variant">
            <div className="relative">
              <Search
                className="w-3.5 h-3.5 text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2"
                aria-hidden="true"
              />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Rechercher une discussion"
                className={`w-full bg-surface-container text-on-surface text-xs rounded-lg pl-8 pr-3 py-2 outline-none border border-transparent focus:border-primary transition-colors placeholder:text-on-surface-variant ${FOCUS_RING}`}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1 flex-1 overflow-y-auto p-4">
            {activeProjectId === null && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2 px-2 mt-2">
                  <span className="font-label-caps text-label-caps text-on-surface-variant">
                    Mes Projets
                  </span>
                  <button
                    onClick={openCreateModal}
                    className={`text-on-surface-variant hover:text-primary transition-colors rounded ${FOCUS_RING}`}
                    title="Nouveau projet"
                    aria-label="Nouveau projet"
                  >
                    <FolderPlus className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
                {projects.length === 0 ? (
                  <div className="text-xs text-on-surface-variant px-2 py-1">Aucun projet</div>
                ) : (
                  projects.map((proj) => (
                    <div key={proj.id} className="relative group mb-1">
                      <button
                        onClick={() => enterProject(proj.id)}
                        className={`w-full text-left px-3 py-2 text-[13px] font-semibold rounded-md truncate flex items-center gap-2 text-on-surface hover:bg-surface-container transition-colors border border-transparent group-hover:border-surface-variant ${FOCUS_RING}`}
                      >
                        <Folder
                          className="w-3.5 h-3.5"
                          aria-hidden="true"
                          style={{ color: proj.color || '#999' }}
                        />{' '}
                        {proj.name}
                      </button>
                    </div>
                  ))
                )}

                <div className="flex items-center justify-between mb-2 px-2 mt-6">
                  <span className="font-label-caps text-label-caps text-on-surface-variant">
                    Configuration
                  </span>
                </div>
                <button
                  onClick={openSkillModal}
                  className={`w-full text-left px-3 py-2 text-[13px] font-semibold rounded-md truncate flex items-center gap-2 text-on-surface hover:bg-surface-container transition-colors border border-transparent hover:border-surface-variant ${FOCUS_RING}`}
                >
                  <Zap className="w-3.5 h-3.5 text-secondary" aria-hidden="true" /> Mes Compétences
                  (/)
                </button>
              </div>
            )}

            {activeProjectId !== null && (
              <div className="mb-4">
                <div className="bg-surface-container border border-surface-variant rounded-lg p-3">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 text-on-surface font-semibold text-sm truncate">
                      <Folder
                        className="w-4 h-4"
                        aria-hidden="true"
                        style={{
                          color: projects.find((p) => p.id === activeProjectId)?.color || '#999',
                        }}
                      />
                      <span className="truncate">
                        {projects.find((p) => p.id === activeProjectId)?.name}
                      </span>
                    </div>
                    <button
                      onClick={openEditModal}
                      className={`text-on-surface-variant hover:text-primary transition-colors shrink-0 rounded ${FOCUS_RING}`}
                      title="Paramètres du projet"
                      aria-label="Paramètres du projet"
                    >
                      <Settings className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                  <button
                    onClick={() => handleNewChat(activeProjectId)}
                    className={`w-full mt-2 bg-surface-container-lowest border border-surface-variant text-on-surface hover:bg-surface-container text-[12px] py-1.5 rounded-md transition-colors ${FOCUS_RING}`}
                  >
                    + Nouveau chat
                  </button>
                </div>
              </div>
            )}

            <span className="font-label-caps text-label-caps text-on-surface-variant mb-2 px-2 mt-2">
              Aujourd'hui
            </span>
            {recentSessions.length === 0 && (
              <div className="text-xs text-on-surface-variant px-2 py-1">
                {searchQuery ? 'Aucun résultat' : 'Vide'}
              </div>
            )}
            {recentSessions.map(renderSessionItem)}

            {olderSessions.length > 0 && (
              <>
                <span className="font-label-caps text-label-caps text-on-surface-variant mt-6 mb-2 px-2">
                  Précédent
                </span>
                {olderSessions.map(renderSessionItem)}
              </>
            )}
          </div>
        </div>

        <div className="flex-1 bg-surface-container-lowest border border-surface-variant rounded-3xl shadow-sm flex flex-col relative overflow-hidden">
          {activeProjectId !== null ? (
            <div className="h-10 bg-surface-container border-b border-surface-variant flex items-center px-4 gap-2 text-xs text-on-surface-variant flex-shrink-0">
              <Folder
                className="w-3.5 h-3.5"
                aria-hidden="true"
                style={{ color: projects.find((p) => p.id === activeProjectId)?.color || '#999' }}
              />
              <span>
                Chat dans le projet :{' '}
                <strong className="text-on-surface">
                  {projects.find((p) => p.id === activeProjectId)?.name}
                </strong>
              </span>
            </div>
          ) : (
            <div className="px-6 pt-6 flex-shrink-0">
              <div className="inline-flex items-center gap-2 bg-primary-container/20 text-primary px-3 py-1 rounded-full mb-3">
                <Bot className="w-3.5 h-3.5" aria-hidden="true" />
                <span className="font-label-caps text-label-caps tracking-wider">Assistant IA</span>
              </div>
              <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
                Bonjour ! Comment puis-je vous aider aujourd&apos;hui ?
              </h1>
            </div>
          )}

          <div className="flex-1 flex flex-col p-6 overflow-hidden relative">
            <div className="flex-1 overflow-y-auto pb-32 pr-4 flex flex-col gap-6">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-4 max-w-3xl min-w-0 ${msg.role === 'user' ? 'self-end flex-row-reverse' : 'self-start'}`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${msg.role === 'user' ? 'bg-surface-container-high' : 'bg-primary text-on-primary'}`}
                  >
                    {msg.role === 'user' ? (
                      <User className="w-5 h-5 text-on-surface" aria-hidden="true" />
                    ) : (
                      <Bot className="w-5 h-5" aria-hidden="true" />
                    )}
                  </div>
                  <div
                    className={`p-5 rounded-2xl text-[15px] leading-relaxed break-words min-w-0 ${msg.role === 'user' ? 'bg-surface-container-high text-on-surface rounded-tr-sm' : 'bg-surface-container-lowest border border-surface-variant shadow-sm text-on-surface rounded-tl-sm w-full max-w-full overflow-hidden'}`}
                  >
                    {msg.image && (
                      <div className="mb-3">
                        <img
                          src={msg.image}
                          alt="Upload"
                          className="max-w-xs rounded-lg border border-surface-variant"
                        />
                      </div>
                    )}
                    {msg.role === 'user' ? (
                      <div className="whitespace-pre-wrap">{msg.text}</div>
                    ) : (
                      <div className="prose prose-sm max-w-none prose-p:leading-relaxed">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            pre({ children }) {
                              const codeText = String(children?.props?.children ?? '').replace(
                                /\n$/,
                                ''
                              );
                              return (
                                <PromptHandoff
                                  text={codeText}
                                  onSend={() => onSendToGenerator?.(codeText)}
                                  onEdit={() => setInput(codeText)}
                                />
                              );
                            },
                          }}
                        >
                          {msg.text}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-4 max-w-3xl self-start">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm bg-primary text-on-primary">
                    <Bot className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <div className="p-5 rounded-2xl text-[15px] leading-relaxed bg-surface-container-lowest border border-surface-variant shadow-sm text-on-surface rounded-tl-sm flex items-center gap-2">
                    <span
                      className="w-2 h-2 bg-primary rounded-full animate-bounce"
                      style={{ animationDelay: '0ms' }}
                    ></span>
                    <span
                      className="w-2 h-2 bg-primary rounded-full animate-bounce"
                      style={{ animationDelay: '150ms' }}
                    ></span>
                    <span
                      className="w-2 h-2 bg-primary rounded-full animate-bounce"
                      style={{ animationDelay: '300ms' }}
                    ></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div
              className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-surface-container-lowest via-surface-container-lowest to-transparent pointer-events-none z-10"
              aria-hidden="true"
            />

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-3xl flex flex-col gap-2 z-20">
              {showSlashMenu && filteredSlashCommands.length > 0 && (
                <div className="absolute bottom-full mb-2 w-full bg-surface-container-lowest border border-surface-variant rounded-xl shadow-lg p-2 flex flex-col gap-1 max-h-60 overflow-y-auto z-10">
                  <div className="font-label-caps text-label-caps text-on-surface-variant px-2 py-1">
                    Compétences / Skills
                  </div>
                  {filteredSlashCommands.map((cmd) => (
                    <button
                      key={cmd.id}
                      onClick={() => applySlashCommand(cmd)}
                      className={`flex flex-col text-left px-3 py-2 hover:bg-surface-container rounded-lg transition-colors ${FOCUS_RING}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[13px] text-on-surface">
                          {cmd.title}
                        </span>
                        <span className="text-[11px] text-on-surface-variant font-medium bg-surface-container px-1.5 py-0.5 rounded">
                          {cmd.name}
                        </span>
                      </div>
                      <span className="text-[11px] text-on-surface-variant line-clamp-1 mt-0.5">
                        {cmd.instruction}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {selectedImage && (
                <div className="w-fit bg-surface-container-lowest border border-surface-variant p-2 rounded-xl shadow-sm relative group mb-1">
                  <img
                    src={selectedImage}
                    alt="Preview"
                    className="h-16 w-auto rounded-lg object-cover"
                  />
                  <button
                    onClick={removeImage}
                    aria-label="Retirer l'image"
                    className={`absolute -top-2 -right-2 bg-on-surface text-surface p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm ${FOCUS_RING}`}
                  >
                    <X className="w-3 h-3" aria-hidden="true" />
                  </button>
                </div>
              )}

              <div className="w-full bg-surface-container-lowest rounded-2xl border-2 border-outline-variant focus-within:border-primary shadow-[0_8px_30px_-10px_rgba(0,0,0,0.06)] flex flex-col p-2 transition-all duration-300">
                {activeSkill && (
                  <div className="flex items-center gap-1.5 bg-surface-container text-on-surface px-2.5 py-1.5 rounded-lg text-[12px] font-semibold border border-surface-variant shadow-sm ml-2 mb-1 w-fit">
                    <Zap className="w-3.5 h-3.5 text-secondary" aria-hidden="true" />
                    <span>{activeSkill.title}</span>
                    <span className="font-normal text-on-surface-variant">
                      ({activeSkill.name})
                    </span>
                    <button
                      onClick={() => setActiveSkill(null)}
                      className={`ml-1 text-on-surface-variant hover:text-on-surface transition-colors rounded-full p-0.5 hover:bg-surface-variant ${FOCUS_RING}`}
                    >
                      <X className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>
                )}

                <div className="flex items-end w-full">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className={`w-10 h-10 flex-shrink-0 text-on-surface-variant hover:text-on-surface flex items-center justify-center rounded-xl hover:bg-surface-container transition-colors ${FOCUS_RING}`}
                    title="Joindre une image"
                    aria-label="Joindre une image"
                  >
                    <Paperclip className="w-5 h-5" aria-hidden="true" />
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
                    placeholder={
                      isLoading
                        ? "L'IA réfléchit..."
                        : activeSkill
                          ? 'Votre demande (la compétence sera appliquée automatiquement)...'
                          : 'Posez une question ou demandez un prompt...'
                    }
                    disabled={isLoading}
                    rows={1}
                    className="flex-1 bg-transparent outline-none text-[15px] text-on-surface placeholder:text-on-surface-variant font-medium disabled:opacity-50 resize-none py-2 px-2 max-h-32 overflow-y-auto"
                    style={{ minHeight: '40px' }}
                  />

                  <button
                    onClick={handleSend}
                    disabled={(!input.trim() && !selectedImage && !activeSkill) || isLoading}
                    aria-label="Envoyer"
                    className={`w-10 h-10 flex-shrink-0 bg-on-surface text-surface rounded-full flex items-center justify-center hover:bg-primary transition-colors disabled:opacity-50 disabled:hover:bg-on-surface active:scale-90 shadow-md ml-2 ${FOCUS_RING}`}
                  >
                    <ArrowUp className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
              <div className="text-center">
                <span className="font-label-caps text-label-caps text-outline">
                  L&apos;IA peut faire des erreurs. Vérifiez les prompts générés.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-3xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-surface-variant">
              <h2 className="text-lg font-bold text-on-surface flex items-center gap-2">
                {editingProjectId ? (
                  <Settings className="w-5 h-5" aria-hidden="true" />
                ) : (
                  <FolderPlus className="w-5 h-5" aria-hidden="true" />
                )}
                {editingProjectId ? 'Paramètres du Projet' : 'Nouveau Projet'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                aria-label="Fermer"
                className={`text-on-surface-variant hover:text-on-surface transition-colors rounded ${FOCUS_RING}`}
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
            <div className="p-6 flex flex-col gap-5">
              <div>
                <label className="block text-sm font-semibold text-on-surface mb-2">
                  Nom du projet
                </label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Ex: Refonte Dashboard SaaS"
                  className={`w-full bg-surface-container border border-transparent focus:border-primary rounded-lg px-4 py-2.5 text-sm outline-none transition-colors ${FOCUS_RING}`}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-on-surface mb-2">Couleur</label>
                <div className="flex items-center gap-2">
                  {PROJECT_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewProjectColor(color)}
                      aria-label={`Couleur ${color}`}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${FOCUS_RING} ${newProjectColor === color ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'hover:scale-110'}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-on-surface mb-1">
                  Instructions Personnalisées
                </label>
                <p className="text-xs text-on-surface-variant mb-2">
                  Définissez comment l'IA doit se comporter pour tous les chats de ce projet.
                </p>
                <textarea
                  value={newProjectInstruction}
                  onChange={(e) => setNewProjectInstruction(e.target.value)}
                  placeholder="Ex: Tu es un expert en design minimaliste. Utilise toujours le tutoiement."
                  className={`w-full bg-surface-container border border-transparent focus:border-primary rounded-lg px-4 py-3 text-sm outline-none transition-colors resize-none h-32 ${FOCUS_RING}`}
                />
              </div>
            </div>

            <div className="p-5 border-t border-surface-variant flex items-center justify-between bg-surface-container">
              {editingProjectId ? (
                <button
                  onClick={handleDeleteProject}
                  className={`flex items-center gap-2 text-sm font-semibold text-error hover:opacity-80 transition-opacity rounded ${FOCUS_RING}`}
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" /> Supprimer le projet
                </button>
              ) : (
                <div />
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className={`px-5 py-2 rounded-lg text-sm font-semibold text-on-surface-variant hover:bg-surface-variant transition-colors ${FOCUS_RING}`}
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveProject}
                  disabled={!newProjectName.trim()}
                  className={`px-5 py-2 rounded-lg text-sm font-semibold bg-primary text-on-primary hover:opacity-90 transition-colors disabled:opacity-50 ${FOCUS_RING}`}
                >
                  {editingProjectId ? 'Enregistrer' : 'Créer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isSkillModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-3xl shadow-xl w-full max-w-4xl overflow-hidden flex h-[80vh]">
            {/* Sidebar Skills */}
            <div className="w-1/3 border-r border-surface-variant flex flex-col bg-surface-container">
              <div className="p-4 border-b border-surface-variant">
                <h2 className="text-base font-bold text-on-surface flex items-center gap-2">
                  <Zap className="w-4 h-4 text-secondary" aria-hidden="true" /> Mes Compétences
                </h2>
              </div>
              <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
                <button
                  onClick={() => {
                    setEditingSkillId(null);
                    setNewSkillTitle('');
                    setNewSkillName('');
                    setNewSkillInstruction('');
                  }}
                  className={`w-full text-left px-3 py-2 bg-surface-container-lowest border border-surface-variant rounded-lg text-[13px] font-semibold flex items-center gap-2 text-on-surface hover:bg-surface-container-low transition-colors shadow-sm ${FOCUS_RING}`}
                >
                  + Nouvelle Compétence
                </button>
                <div className="mt-2 flex flex-col gap-1">
                  {skills.map((skill) => (
                    <div key={skill.id} className="relative group">
                      <button
                        onClick={() => handleEditSkill(skill)}
                        className={`w-full text-left px-3 py-2.5 rounded-lg text-[13px] transition-colors border ${FOCUS_RING} ${editingSkillId === skill.id ? 'bg-surface-container-lowest border-outline-variant shadow-sm text-on-surface font-semibold' : 'border-transparent text-on-surface-variant hover:bg-surface-container-lowest hover:border-surface-variant'}`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{skill.title}</span>
                          <span className="truncate">{skill.name}</span>
                        </div>
                      </button>
                      {editingSkillId !== skill.id && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSkill(skill.id);
                          }}
                          aria-label={`Supprimer ${skill.name}`}
                          className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 opacity-0 group-hover:opacity-100 text-on-surface-variant hover:text-error bg-surface-container-lowest rounded-md transition-all shadow-sm ${FOCUS_RING}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Formulaire Skill */}
            <div className="w-2/3 flex flex-col bg-surface-container-lowest relative">
              <button
                onClick={() => setIsSkillModalOpen(false)}
                aria-label="Fermer"
                className={`absolute top-4 right-4 p-2 text-on-surface-variant hover:text-on-surface transition-colors rounded-full hover:bg-surface-container z-10 ${FOCUS_RING}`}
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>

              <div className="flex-1 p-8 flex flex-col gap-6 overflow-y-auto">
                <h3 className="text-xl font-bold text-on-surface mb-2">
                  {editingSkillId ? 'Modifier la compétence' : 'Créer une compétence'}
                </h3>

                <div className="flex gap-4">
                  <div className="w-1/3">
                    <label className="block text-sm font-semibold text-on-surface mb-2">
                      Raccourci (slash)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant font-bold">
                        /
                      </span>
                      <input
                        type="text"
                        value={newSkillTitle}
                        onChange={(e) =>
                          setNewSkillTitle(
                            e.target.value.replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase()
                          )
                        }
                        placeholder="seo"
                        className={`w-full bg-surface-container border border-transparent focus:border-primary rounded-lg pl-7 pr-4 py-2.5 text-sm outline-none transition-colors ${FOCUS_RING}`}
                      />
                    </div>
                  </div>
                  <div className="w-2/3">
                    <label className="block text-sm font-semibold text-on-surface mb-2">
                      Nom de la compétence
                    </label>
                    <input
                      type="text"
                      value={newSkillName}
                      onChange={(e) => setNewSkillName(e.target.value)}
                      placeholder="Ex: Expert SEO & Copywriting"
                      className={`w-full bg-surface-container border border-transparent focus:border-primary rounded-lg px-4 py-2.5 text-sm outline-none transition-colors ${FOCUS_RING}`}
                    />
                  </div>
                </div>

                <div className="flex-1 flex flex-col">
                  <label className="block text-sm font-semibold text-on-surface mb-1">
                    Instructions Invisibles (System Prompt)
                  </label>
                  <p className="text-xs text-on-surface-variant mb-3">
                    Ces instructions seront transmises à l'IA avec votre message de manière
                    invisible lorsque vous utilisez ce raccourci.
                  </p>
                  <textarea
                    value={newSkillInstruction}
                    onChange={(e) => setNewSkillInstruction(e.target.value)}
                    placeholder="Ex: Agis comme un expert en référencement naturel. Ton but est d'optimiser le contenu suivant pour le mot-clé principal..."
                    className={`w-full flex-1 min-h-[200px] bg-surface-container border border-transparent focus:border-primary rounded-lg px-4 py-3 text-sm outline-none transition-colors resize-none leading-relaxed ${FOCUS_RING}`}
                  />
                </div>
              </div>

              <div className="p-6 border-t border-surface-variant flex items-center justify-between bg-surface-container">
                {editingSkillId ? (
                  <button
                    onClick={() => handleDeleteSkill(editingSkillId)}
                    className={`flex items-center gap-2 text-sm font-semibold text-error hover:opacity-80 transition-opacity rounded ${FOCUS_RING}`}
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" /> Supprimer
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setIsSkillModalOpen(false)}
                    className={`px-5 py-2.5 rounded-lg text-sm font-semibold text-on-surface-variant hover:bg-surface-variant transition-colors ${FOCUS_RING}`}
                  >
                    Fermer
                  </button>
                  <button
                    onClick={handleSaveSkill}
                    disabled={
                      !newSkillTitle.trim() || !newSkillName.trim() || !newSkillInstruction.trim()
                    }
                    className={`px-5 py-2.5 rounded-lg text-sm font-semibold bg-primary text-on-primary hover:opacity-90 transition-colors disabled:opacity-50 flex items-center gap-2 ${FOCUS_RING}`}
                  >
                    <Check className="w-4 h-4" aria-hidden="true" />{' '}
                    {editingSkillId ? 'Mettre à jour' : 'Sauvegarder'}
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
