import React, { useState, useEffect, useRef } from "react";
import {
  Home,
  BookOpen,
  Users,
  Calendar,
  Video,
  Image as ImageIcon,
  Music,
  Sparkles,
  Plus,
  Trash2,
  Edit3,
  X,
  PanelRightClose,
  Send,
  Loader2,
  Link as LinkIcon,
  Star,
  Bold,
  Italic,
  Underline,
  AlignCenter,
  AlignLeft,
  AlignRight,
  AlignJustify,
  Briefcase,
  FileSignature,
  Layers,
  Wand2,
  Upload,
  List,
  ListOrdered,
  Palette,
  Highlighter,
  Printer,
  Maximize,
  Minimize,
  Clock,
  Mail,
  FileDown,
  Lock,
  Eye,
  EyeOff,
  UserPlus,
  CheckCircle2,
  LayoutDashboard,
  Settings,
  FileText,
  PlusCircle,
  ChevronLeft,
  ChevronRight,
  Database,
} from "lucide-react";
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signInAnonymously } from "firebase/auth";
import {
  getFirestore,
  collection,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";

// --- CONFIGURAÇÃO DO FIREBASE (EDUARDO - CIA VIVA) ---
const firebaseConfig = {
  apiKey: "AIzaSyDUytxZkB3rGNyUfXyT4T_iZGrZneSGnZs",
  authDomain: "cia-viva-painel-de-gestao.firebaseapp.com",
  projectId: "cia-viva-painel-de-gestao",
  storageBucket: "cia-viva-painel-de-gestao.firebasestorage.app",
  messagingSenderId: "744552179183",
  appId: "1:744552179183:web:41b59bd63b8d01bd03c21a",
};

// Chave da Inteligência Artificial Gemini
const aiApiKey = "AIzaSyDaXN9XgmeVqSLqY6cOi9xvGrQznz7dBYc";
const appId = "cia-artes-viva-final-v5";

// Inicialização segura para o CodeSandbox
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Injeção do Tailwind para garantir o design premium
if (typeof window !== "undefined" && !document.getElementById("tailwind-cdn")) {
  const script = document.createElement("script");
  script.id = "tailwind-cdn";
  script.src = "https://cdn.tailwindcss.com";
  document.head.appendChild(script);
}

// Auxiliar para a IA
const fetchWithBackoff = async (url, options, retries = 5) => {
  const delays = [1000, 2000, 4000, 8000, 16000];
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) throw new Error(`Erro API: ${response.status}`);
      return await response.json();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise((res) => setTimeout(res, delays[i]));
    }
  }
};

const LogoCiaViva = ({ className = "" }) => (
  <div className={`flex flex-col items-start ${className}`}>
    <span className="text-[10px] font-bold tracking-widest leading-none text-white font-sans uppercase">
      Companhia de Artes
    </span>
    <div className="flex items-end gap-1">
      <span className="text-3xl font-black tracking-tighter leading-none text-white">
        VIVA
      </span>
      <div className="w-10 h-6 bg-white rounded-lg rounded-bl-none relative overflow-hidden ml-1">
        <div className="absolute inset-0 bg-slate-900 rounded-t-full mt-2 ml-1"></div>
      </div>
    </div>
  </div>
);

export default function App() {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");

  const [activeTab, setActiveTab] = useState("dashboard");
  const [scripts, setScripts] = useState([]);
  const [cast, setCast] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [agenda, setAgenda] = useState([]);
  const [teamUsers, setTeamUsers] = useState([]);
  const [customTabs, setCustomTabs] = useState([]);

  const [editingScript, setEditingScript] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isAiFormatting, setIsAiFormatting] = useState(false);

  const [isCastModalOpen, setIsCastModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [currentCastMember, setCurrentCastMember] = useState({
    name: "",
    role: "",
    photoUrl: "",
    category: "elenco",
  });
  const [currentUserConfig, setCurrentUserConfig] = useState({
    name: "",
    email: "",
    role: "Diretor",
  });

  const editorRef = useRef(null);
  const chatEndRef = useRef(null);

  const [aiInput, setAiInput] = useState("");
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [aiMessages, setAiMessages] = useState([
    {
      role: "ai",
      text: "Olá, Diretor Edu! Sou a sua IA. Como posso ajudar a Cia Viva hoje?",
    },
  ]);

  // Sincronização com Firebase
  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (error) {
        console.error(error);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const getPath = (coll) =>
      collection(db, "artifacts", appId, "users", user.uid, coll);

    const unsubScripts = onSnapshot(getPath("scripts"), (s) =>
      setScripts(s.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    const unsubCast = onSnapshot(getPath("cast"), (s) =>
      setCast(s.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    const unsubTasks = onSnapshot(getPath("tasks"), (s) =>
      setTasks(s.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    const unsubAgenda = onSnapshot(getPath("agenda"), (s) =>
      setAgenda(s.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    const unsubUsers = onSnapshot(getPath("teamUsers"), (s) =>
      setTeamUsers(s.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    const unsubTabs = onSnapshot(getPath("customTabs"), (s) =>
      setCustomTabs(s.docs.map((d) => ({ id: d.id, ...d.data() })))
    );

    return () => {
      unsubScripts();
      unsubCast();
      unsubTasks();
      unsubAgenda();
      unsubUsers();
      unsubTabs();
    };
  }, [user]);

  useEffect(
    () => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }),
    [aiMessages, isAiTyping]
  );

  const handleLogin = (e) => {
    e.preventDefault();
    const MASTER_EMAIL = "diretor@ciaviva.com.br";
    const MASTER_PASS = "senha123";
    const extraUser = teamUsers.find((u) => u.email === loginEmail);
    if (
      (loginEmail === MASTER_EMAIL && loginPassword === MASTER_PASS) ||
      extraUser
    ) {
      setIsLoggedIn(true);
    } else {
      setLoginError("Acesso Negado! E-mail ou palavra-passe incorretos.");
    }
  };

  const handleSendAiMessage = async (e) => {
    e.preventDefault();
    if (!aiInput.trim()) return;
    const msg = aiInput;
    setAiInput("");
    setAiMessages((prev) => [...prev, { role: "user", text: msg }]);
    setIsAiTyping(true);
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${aiApiKey}`;
      const payload = {
        contents: [{ parts: [{ text: msg }] }],
        systemInstruction: {
          parts: [
            {
              text: "És a IA da Cia de Artes Viva. Ajuda o diretor Edu com roteiros, gestão de elenco e ideias criativas.",
            },
          ],
        },
      };
      const result = await fetchWithBackoff(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setAiMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text:
            result.candidates?.[0]?.content?.parts?.[0]?.text ||
            "Peço desculpa, tive um problema técnico.",
        },
      ]);
    } catch (e) {
      setAiMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: "Erro de ligação com a IA. Verifica a tua internet.",
        },
      ]);
    } finally {
      setIsAiTyping(false);
    }
  };

  const createScript = async () => {
    if (!user) return;
    const newId = Date.now().toString();
    const newScript = {
      title: "Novo Roteiro",
      content: "<h1>Título</h1><p>Cena 1...</p>",
      updatedAt: new Date().toISOString(),
    };
    await setDoc(
      doc(db, "artifacts", appId, "users", user.uid, "scripts", newId),
      newScript
    );
    setEditingScript({ id: newId, ...newScript });
    setActiveTab("editor");
  };

  const handleImageUpload = (e, callback) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const scale = 800 / img.width;
        canvas.width = 800;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        callback(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // --- RENDER MÓDULOS ---

  const renderDashboard = () => (
    <div className="p-8 space-y-8 animate-fadeIn h-full overflow-y-auto">
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 border border-slate-700 rounded-3xl p-10 text-white shadow-2xl relative overflow-hidden">
        <LogoCiaViva className="mb-4" />
        <h1 className="text-4xl font-black mb-2">Quartel-General</h1>
        <p className="text-slate-400">
          Eduardo, todos os sistemas da Cia de Artes Viva estão operacionais.
        </p>
        <Star
          size={200}
          className="absolute top-0 right-0 opacity-5 transform scale-[5] translate-x-12"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div
          onClick={() => setActiveTab("scripts")}
          className="bg-slate-800 border border-slate-700 p-6 rounded-2xl cursor-pointer hover:border-indigo-500 transition-all"
        >
          <BookOpen className="text-indigo-400 mb-4" />{" "}
          <h3 className="font-bold">Roteiros</h3>
          <p className="text-xs text-slate-400">{scripts.length} arquivos</p>
        </div>
        <div
          onClick={() => setActiveTab("agenda")}
          className="bg-slate-800 border border-slate-700 p-6 rounded-2xl cursor-pointer hover:border-yellow-500 transition-all"
        >
          <Calendar className="text-yellow-400 mb-4" />{" "}
          <h3 className="font-bold">Agenda</h3>
          <p className="text-xs text-slate-400">{agenda.length} eventos</p>
        </div>
        <div
          onClick={() => setActiveTab("elenco")}
          className="bg-slate-800 border border-slate-700 p-6 rounded-2xl cursor-pointer hover:border-cyan-500 transition-all"
        >
          <Users className="text-cyan-400 mb-4" />{" "}
          <h3 className="font-bold">Elenco</h3>
          <p className="text-xs text-slate-400">{cast.length} membros</p>
        </div>
        <div
          onClick={() => setActiveTab("tarefas")}
          className="bg-slate-800 border border-slate-700 p-6 rounded-2xl cursor-pointer hover:border-green-500 transition-all"
        >
          <CheckCircle2 className="text-green-400 mb-4" />{" "}
          <h3 className="font-bold">Metas</h3>
          <p className="text-xs text-slate-400">{tasks.length} ativas</p>
        </div>
      </div>
    </div>
  );

  const renderAgenda = () => {
    const monthNames = [
      "Janeiro",
      "Fevereiro",
      "Março",
      "Abril",
      "Maio",
      "Junho",
      "Julho",
      "Agosto",
      "Setembro",
      "Outubro",
      "Novembro",
      "Dezembro",
    ];
    return (
      <div className="p-8 h-full flex flex-col animate-fadeIn">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-black text-white flex items-center gap-3">
            <Calendar className="text-yellow-400" /> Agenda Viva
          </h2>
          <div className="flex items-center gap-4 bg-slate-800 rounded-xl p-2">
            <button
              onClick={() =>
                setCurrentDate(
                  new Date(
                    currentDate.getFullYear(),
                    currentDate.getMonth() - 1,
                    1
                  )
                )
              }
              className="p-2 text-slate-400 hover:text-white"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="text-white font-bold min-w-[140px] text-center text-xs uppercase">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </span>
            <button
              onClick={() =>
                setCurrentDate(
                  new Date(
                    currentDate.getFullYear(),
                    currentDate.getMonth() + 1,
                    1
                  )
                )
              }
              className="p-2 text-slate-400 hover:text-white"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-3 flex-1 overflow-y-auto content-start pb-10">
          {[...Array(31)].map((_, i) => (
            <div
              key={i}
              onClick={async () => {
                const t = prompt(`Compromisso para dia ${i + 1}:`);
                if (t && user)
                  await setDoc(
                    doc(
                      db,
                      "artifacts",
                      appId,
                      "users",
                      user.uid,
                      "agenda",
                      Date.now().toString()
                    ),
                    {
                      date: `${currentDate.getFullYear()}-${currentDate.getMonth()}-${
                        i + 1
                      }`,
                      title: t,
                      day: i + 1,
                    }
                  );
              }}
              className="bg-slate-800 border border-slate-700 h-32 rounded-xl p-3 hover:border-yellow-500 transition-colors cursor-pointer group"
            >
              <span className="text-slate-500 font-bold text-xs">{i + 1}</span>
              <div className="mt-2 space-y-1">
                {agenda
                  .filter((e) => e.day === i + 1)
                  .map((e) => (
                    <div
                      key={e.id}
                      className="bg-yellow-500/20 text-yellow-300 text-[10px] p-1 rounded truncate flex justify-between"
                    >
                      {e.title}
                      <button
                        onClick={(ev) => {
                          ev.stopPropagation();
                          deleteDoc(
                            doc(
                              db,
                              "artifacts",
                              appId,
                              "users",
                              user.uid,
                              "agenda",
                              e.id
                            )
                          );
                        }}
                        className="opacity-0 group-hover:opacity-100"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderCast = (category) => (
    <div className="p-8 h-full flex flex-col animate-fadeIn overflow-y-auto">
      <div className="flex justify-between items-center mb-8 shrink-0">
        <h2 className="text-3xl font-black text-white flex items-center gap-3">
          {category === "diretoria" ? (
            <Briefcase className="text-purple-400" />
          ) : (
            <Users className="text-cyan-400" />
          )}
          {category === "diretoria"
            ? "Diretoria Executiva"
            : "Elenco & Produção"}
        </h2>
        <button
          onClick={() => {
            setCurrentCastMember({
              name: "",
              role: "",
              photoUrl: "",
              category,
            });
            setIsCastModalOpen(true);
          }}
          className="bg-white text-slate-900 px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-200 transition-all"
        >
          <Plus size={20} /> Adicionar
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pb-20">
        {cast
          .filter((c) => c.category === category)
          .map((m) => (
            <div
              key={m.id}
              className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden group relative"
            >
              <div className="h-56 bg-slate-900 flex items-center justify-center">
                {m.photoUrl ? (
                  <img
                    src={m.photoUrl}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <Users size={40} className="text-slate-700" />
                )}
              </div>
              <div className="p-5">
                <h3 className="text-lg font-bold text-white">{m.name}</h3>
                <p className="text-cyan-400 text-sm font-bold uppercase tracking-wider">
                  {m.role}
                </p>
                <button
                  onClick={() =>
                    deleteDoc(
                      doc(
                        db,
                        "artifacts",
                        appId,
                        "users",
                        user.uid,
                        "cast",
                        m.id
                      )
                    )
                  }
                  className="absolute top-4 right-4 bg-red-500 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
      </div>
    </div>
  );

  const renderTasks = () => (
    <div className="p-8 h-full flex flex-col animate-fadeIn">
      <h2 className="text-3xl font-black text-white mb-8 flex items-center gap-3">
        <LayoutDashboard className="text-green-400" /> Quadro de Produção
      </h2>
      <div className="flex gap-6 overflow-x-auto pb-10 h-full">
        {["A Fazer", "Em Andamento", "Concluído"].map((col) => (
          <div
            key={col}
            className="bg-slate-800/40 border border-slate-800 rounded-2xl p-5 w-80 shrink-0 flex flex-col"
          >
            <h3 className="text-white font-bold uppercase text-xs mb-6 tracking-widest">
              {col}
            </h3>
            <div className="flex-1 space-y-4 overflow-y-auto">
              {tasks
                .filter((t) => t.status === col)
                .map((t) => (
                  <div
                    key={t.id}
                    className="bg-slate-800 border border-slate-700 p-4 rounded-xl shadow-lg group relative"
                  >
                    <p className="text-slate-200 text-sm">{t.text}</p>
                    <div className="mt-3 flex justify-between items-center">
                      <button
                        onClick={async () => {
                          const next =
                            col === "A Fazer"
                              ? "Em Andamento"
                              : col === "Em Andamento"
                              ? "Concluído"
                              : "A Fazer";
                          await updateDoc(
                            doc(
                              db,
                              "artifacts",
                              appId,
                              "users",
                              user.uid,
                              "tasks",
                              t.id
                            ),
                            { status: next }
                          );
                        }}
                        className="text-[10px] text-slate-500 hover:text-white font-bold uppercase"
                      >
                        Mover
                      </button>
                      <button
                        onClick={() =>
                          deleteDoc(
                            doc(
                              db,
                              "artifacts",
                              appId,
                              "users",
                              user.uid,
                              "tasks",
                              t.id
                            )
                          )
                        }
                        className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
            <button
              onClick={async () => {
                const text = prompt("Nome da meta/tarefa:");
                if (text && user)
                  await setDoc(
                    doc(
                      db,
                      "artifacts",
                      appId,
                      "users",
                      user.uid,
                      "tasks",
                      Date.now().toString()
                    ),
                    { text, status: col }
                  );
              }}
              className="mt-6 w-full border border-dashed border-slate-700 text-slate-500 py-3 rounded-xl hover:text-white transition-all font-bold"
            >
              + Nova Meta
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderUsersConfig = () => (
    <div className="p-8 h-full flex flex-col animate-fadeIn overflow-y-auto">
      <div className="flex justify-between items-center mb-8 shrink-0">
        <h2 className="text-3xl font-black text-white flex items-center gap-3">
          <Settings className="text-slate-400" /> Gestão de Acessos
        </h2>
        <button
          onClick={() => {
            setCurrentUserConfig({ name: "", email: "", role: "Diretor" });
            setIsUserModalOpen(true);
          }}
          className="bg-purple-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-purple-500"
        >
          <UserPlus size={20} /> Novo Login
        </button>
      </div>
      <div className="bg-slate-800/40 border border-slate-800 rounded-3xl overflow-hidden mb-12">
        <table className="w-full text-left">
          <thead className="bg-slate-900 border-b border-slate-800 text-slate-500 text-[10px] uppercase font-black">
            <tr>
              <th className="p-5">Membro</th>
              <th className="p-5">E-mail</th>
              <th className="p-5">Nível</th>
              <th className="p-5 text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            <tr className="bg-slate-800/20">
              <td className="p-5 text-white font-bold">Eduardo (Admin)</td>
              <td className="p-5 text-slate-400">diretor@ciaviva.com.br</td>
              <td className="p-5">
                <span className="bg-purple-900/50 text-purple-400 px-3 py-1 rounded-full text-[10px] font-bold">
                  Master
                </span>
              </td>
              <td className="p-5 text-right text-slate-600 font-bold italic">
                Privado
              </td>
            </tr>
            {teamUsers.map((u) => (
              <tr
                key={u.id}
                className="hover:bg-slate-800/40 transition-colors"
              >
                <td className="p-5 text-white font-bold">{u.name}</td>
                <td className="p-5 text-slate-400">{u.email}</td>
                <td className="p-5">
                  <span className="bg-cyan-900/50 text-cyan-400 px-3 py-1 rounded-full text-[10px] font-bold uppercase">
                    {u.role}
                  </span>
                </td>
                <td className="p-5 text-right">
                  <button
                    onClick={() =>
                      deleteDoc(
                        doc(
                          db,
                          "artifacts",
                          appId,
                          "users",
                          user.uid,
                          "teamUsers",
                          u.id
                        )
                      )
                    }
                    className="text-slate-600 hover:text-red-400 p-2 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  if (!isLoggedIn)
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-950 font-sans relative overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-40">
          <img
            src="https://images.unsplash.com/photo-1507676184212-d0330a15183e?q=80&w=2000"
            className="w-full h-full object-cover"
            alt="Background"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent"></div>

        <div className="bg-white rounded-[2.5rem] shadow-2xl flex flex-col max-w-md w-full p-12 items-center z-10 border border-white/20">
          <div className="mb-10 bg-slate-900 p-6 rounded-3xl shadow-xl">
            <LogoCiaViva />
          </div>
          <h1 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tighter text-center">
            Acesso Reservado
          </h1>
          <p className="text-slate-400 text-[10px] mb-8 font-black uppercase tracking-widest">
            Portal Administrativo Cia Viva
          </p>
          <form onSubmit={handleLogin} className="w-full space-y-6">
            <input
              type="email"
              required
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl p-4 outline-none focus:border-slate-900 font-medium transition-all"
              placeholder="E-mail"
            />
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl p-4 outline-none focus:border-slate-900 font-medium transition-all"
                placeholder="Palavra-passe"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-4 text-slate-400"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {loginError && (
              <p className="text-red-600 text-xs font-bold text-center animate-pulse">
                {loginError}
              </p>
            )}
            <button
              type="submit"
              className="w-full bg-slate-900 text-white rounded-2xl py-4 font-black text-lg transition-all shadow-xl hover:bg-black active:scale-95 uppercase tracking-widest"
            >
              Entrar no Sistema
            </button>
          </form>
        </div>
      </div>
    );

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-100 font-sans overflow-hidden">
      {/* Sidebar de Navegação */}
      <nav className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 z-40">
        <div className="p-8 border-b border-slate-800/50 flex justify-center">
          <LogoCiaViva />
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all ${
              activeTab === "dashboard"
                ? "bg-slate-800 text-white shadow-lg"
                : "text-slate-500 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            <Home size={20} /> Início
          </button>
          <button
            onClick={() => setActiveTab("agenda")}
            className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all ${
              activeTab === "agenda"
                ? "bg-slate-800 text-white shadow-lg"
                : "text-slate-500 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            <Calendar size={20} /> Agenda Viva
          </button>
          <button
            onClick={() => setActiveTab("scripts")}
            className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all ${
              activeTab === "scripts"
                ? "bg-slate-800 text-white shadow-lg"
                : "text-slate-500 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            <BookOpen size={20} /> Roteiros
          </button>
          <button
            onClick={() => setActiveTab("tarefas")}
            className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all ${
              activeTab === "tarefas"
                ? "bg-slate-800 text-white shadow-lg"
                : "text-slate-500 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            <LayoutDashboard size={20} /> Produção
          </button>
          <button
            onClick={() => setActiveTab("diretoria")}
            className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all ${
              activeTab === "diretoria"
                ? "bg-slate-800 text-white shadow-lg"
                : "text-slate-500 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            <Briefcase size={20} /> Diretoria
          </button>
          <button
            onClick={() => setActiveTab("elenco")}
            className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all ${
              activeTab === "elenco"
                ? "bg-slate-800 text-white shadow-lg"
                : "text-slate-500 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            <Users size={20} /> Elenco
          </button>
          <button
            onClick={() => setActiveTab("usuarios")}
            className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all ${
              activeTab === "usuarios"
                ? "bg-slate-800 text-white shadow-lg"
                : "text-slate-500 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            <Settings size={20} /> Acessos
          </button>

          <button
            onClick={() => setIsAiPanelOpen(!isAiPanelOpen)}
            className="w-full flex items-center gap-4 px-4 py-4 rounded-3xl bg-purple-950/20 text-purple-400 border border-purple-900/30 font-bold text-xs uppercase tracking-widest hover:bg-purple-900/30 transition-all"
          >
            <Sparkles size={20} /> IA Cia Viva
          </button>
        </div>
        <div className="p-6 border-t border-slate-800/50">
          <button
            onClick={() => setIsLoggedIn(false)}
            className="w-full text-[10px] text-slate-500 hover:text-red-400 font-black uppercase tracking-[0.2em] transition-colors py-2"
          >
            Encerrar Sessão
          </button>
        </div>
      </nav>

      {/* Área de Conteúdo Principal */}
      <main className="flex-1 relative bg-[#0a0f1c] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))] overflow-hidden">
        {activeTab === "dashboard" && renderDashboard()}
        {activeTab === "agenda" && renderAgenda()}
        {activeTab === "tarefas" && renderTasks()}
        {activeTab === "elenco" && renderCast("elenco")}
        {activeTab === "diretoria" && renderCast("diretoria")}
        {activeTab === "usuarios" && renderUsersConfig()}

        {activeTab === "scripts" && (
          <div className="p-8 h-full flex flex-col">
            <div className="flex justify-between items-center mb-8 shrink-0">
              <h2 className="text-3xl font-black text-white">
                Acervo de Roteiros
              </h2>
              <button
                onClick={createScript}
                className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-900/20"
              >
                <Plus size={20} /> Novo Roteiro
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 overflow-y-auto pb-10">
              {scripts.map((s) => (
                <div
                  key={s.id}
                  className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden hover:border-indigo-500 transition-all cursor-pointer group shadow-xl"
                  onClick={() => {
                    setEditingScript(s);
                    setActiveTab("editor");
                  }}
                >
                  <div className="h-32 bg-slate-900 relative flex items-center justify-center text-slate-700">
                    <BookOpen size={48} />
                  </div>
                  <div className="p-4 flex justify-between items-center bg-slate-800/80 backdrop-blur-sm">
                    <h3 className="font-bold text-white truncate pr-2">
                      {s.title}
                    </h3>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("Apagar roteiro permanentemente?"))
                          deleteDoc(
                            doc(
                              db,
                              "artifacts",
                              appId,
                              "users",
                              user.uid,
                              "scripts",
                              s.id
                            )
                          );
                      }}
                      className="text-slate-600 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "editor" && editingScript && (
          <div className="flex flex-col bg-slate-900 h-full animate-fadeIn">
            <div className="flex items-center justify-between px-6 py-3 bg-slate-950 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-6">
                <button
                  onClick={() => {
                    setActiveTab("scripts");
                  }}
                  className="text-slate-500 hover:text-white"
                >
                  <X size={24} />
                </button>
                <input
                  type="text"
                  value={editingScript.title}
                  onChange={(e) =>
                    setEditingScript({
                      ...editingScript,
                      title: e.target.value,
                    })
                  }
                  className="bg-transparent text-xl font-bold text-white outline-none w-80"
                />
              </div>
              <div className="flex items-center gap-3">
                <button className="bg-purple-600 hover:bg-purple-500 text-white px-5 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
                  <Sparkles size={18} /> IA Formatar
                </button>
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="text-slate-500 hover:text-white p-2"
                >
                  {isFullscreen ? (
                    <Minimize size={22} />
                  ) : (
                    <Maximize size={22} />
                  )}
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto bg-slate-700/50 flex justify-center py-10">
              <div
                ref={editorRef}
                contentEditable
                onBlur={(e) =>
                  updateDoc(
                    doc(
                      db,
                      "artifacts",
                      appId,
                      "users",
                      user.uid,
                      "scripts",
                      editingScript.id
                    ),
                    {
                      content: e.currentTarget.innerHTML,
                      title: editingScript.title,
                    }
                  )
                }
                dangerouslySetInnerHTML={{ __html: editingScript.content }}
                className="bg-white text-black w-full max-w-[21cm] min-h-[29.7cm] p-16 focus:outline-none shadow-2xl leading-relaxed text-lg"
                style={{ boxShadow: "0 30px 60px rgba(0,0,0,0.6)" }}
              />
            </div>
          </div>
        )}
      </main>

      {/* Painel da Inteligência Artificial */}
      <div
        className={`fixed top-0 right-0 h-full w-96 bg-slate-900 border-l border-slate-800 shadow-2xl transform transition-transform duration-300 z-[60] flex flex-col ${
          isAiPanelOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-6 border-b border-slate-800 flex justify-between bg-slate-950 items-center">
          <div className="flex items-center gap-3 text-purple-400 font-black uppercase tracking-widest text-sm">
            <Sparkles size={20} /> IA CIA VIVA
          </div>
          <button
            onClick={() => setIsAiPanelOpen(false)}
            className="text-slate-500 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {aiMessages.map((m, i) => (
            <div
              key={i}
              className={`flex ${
                m.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[90%] p-4 rounded-3xl text-sm shadow-xl leading-relaxed ${
                  m.role === "user"
                    ? "bg-purple-600 text-white rounded-tr-none"
                    : "bg-slate-800 text-slate-200 rounded-tl-none"
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
          {isAiTyping && (
            <div className="flex justify-start animate-pulse">
              <Loader2 size={20} className="animate-spin text-purple-500" />
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
        <form
          onSubmit={handleSendAiMessage}
          className="p-6 border-t border-slate-800 bg-slate-950"
        >
          <div className="relative">
            <input
              type="text"
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              placeholder="Fala com a IA..."
              className="w-full bg-slate-900 border border-slate-800 text-white rounded-2xl pl-5 pr-14 py-4 outline-none focus:border-purple-500 font-medium transition-all"
            />
            <button
              type="submit"
              className="absolute right-3 top-3 bg-purple-600 text-white p-2.5 rounded-xl shadow-lg hover:bg-purple-500"
            >
              <Send size={18} />
            </button>
          </div>
        </form>
      </div>

      {/* Modais de Gestão */}
      {isCastModalOpen && (
        <div className="fixed inset-0 bg-black/90 z-[70] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 w-full max-w-md shadow-2xl animate-fadeIn">
            <h3 className="text-2xl font-bold text-white mb-6">
              Registar na Equipa
            </h3>
            <div className="space-y-4">
              <input
                type="text"
                value={currentCastMember.name}
                onChange={(e) =>
                  setCurrentCastMember({
                    ...currentCastMember,
                    name: e.target.value,
                  })
                }
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 outline-none focus:border-cyan-500"
                placeholder="Nome Completo"
              />
              <input
                type="text"
                value={currentCastMember.role}
                onChange={(e) =>
                  setCurrentCastMember({
                    ...currentCastMember,
                    role: e.target.value,
                  })
                }
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 outline-none focus:border-cyan-500"
                placeholder="Cargo / Personagem"
              />
              <label className="flex items-center gap-3 bg-slate-800 border border-slate-700 p-4 rounded-xl cursor-pointer hover:bg-slate-700 transition-colors">
                <ImageIcon className="text-slate-500" />
                <span className="text-slate-400 text-sm">
                  Carregar Fotografia
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) =>
                    handleImageUpload(e, (b64) =>
                      setCurrentCastMember({
                        ...currentCastMember,
                        photoUrl: b64,
                      })
                    )
                  }
                />
              </label>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setIsCastModalOpen(false)}
                  className="flex-1 text-slate-500 font-bold hover:text-white transition-colors"
                >
                  Voltar
                </button>
                <button
                  onClick={async () => {
                    if (user && currentCastMember.name) {
                      await setDoc(
                        doc(
                          db,
                          "artifacts",
                          appId,
                          "users",
                          user.uid,
                          "cast",
                          Date.now().toString()
                        ),
                        currentCastMember
                      );
                      setIsCastModalOpen(false);
                    }
                  }}
                  className="flex-1 bg-white text-slate-950 rounded-xl py-3 font-bold hover:bg-slate-200 transition-colors"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isUserModalOpen && (
        <div className="fixed inset-0 bg-black/90 z-[70] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 w-full max-w-sm shadow-2xl animate-fadeIn">
            <h3 className="text-2xl font-bold text-white mb-6">
              Criar Novo Acesso
            </h3>
            <div className="space-y-4">
              <input
                type="text"
                value={currentUserConfig.name}
                onChange={(e) =>
                  setCurrentUserConfig({
                    ...currentUserConfig,
                    name: e.target.value,
                  })
                }
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 outline-none"
                placeholder="Nome"
              />
              <input
                type="email"
                value={currentUserConfig.email}
                onChange={(e) =>
                  setCurrentUserConfig({
                    ...currentUserConfig,
                    email: e.target.value,
                  })
                }
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 outline-none"
                placeholder="E-mail de Login"
              />
              <select
                value={currentUserConfig.role}
                onChange={(e) =>
                  setCurrentUserConfig({
                    ...currentUserConfig,
                    role: e.target.value,
                  })
                }
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 outline-none"
              >
                <option value="Diretor">Diretor (Ver/Editar)</option>
                <option value="Visualizador">Visualizador (Apenas Ver)</option>
              </select>
              <button
                onClick={async () => {
                  if (user && currentUserConfig.email) {
                    await setDoc(
                      doc(
                        db,
                        "artifacts",
                        appId,
                        "users",
                        user.uid,
                        "teamUsers",
                        Date.now().toString()
                      ),
                      currentUserConfig
                    );
                    setIsUserModalOpen(false);
                  }
                }}
                className="w-full bg-purple-600 text-white rounded-xl py-4 font-bold mt-4 shadow-lg active:scale-95 transition-all"
              >
                Ativar Acesso
              </button>
              <button
                onClick={() => setIsUserModalOpen(false)}
                className="w-full text-slate-500 font-bold text-xs uppercase pt-2"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
