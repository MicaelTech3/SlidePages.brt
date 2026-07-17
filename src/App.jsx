import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  RefreshCw, 
  Trash2, 
  Edit3, 
  Plus, 
  Save, 
  ArrowUp, 
  ArrowDown, 
  Wifi, 
  WifiOff, 
  Smartphone, 
  Link as LinkIcon, 
  Terminal, 
  Settings, 
  Key, 
  Compass, 
  Zap, 
  Check, 
  X, 
  HelpCircle,
  LayoutDashboard,
  Layers,
  Eye,
  EyeOff,
  Menu,
  Lock
} from 'lucide-react';
import { 
  subscribeToLinks, 
  addLink, 
  updateLink, 
  deleteLink, 
  reorderLinks, 
  subscribeToMacros, 
  addMacro, 
  updateMacro, 
  deleteMacro, 
  subscribeToDeviceState, 
  sendDeviceCommand 
} from './firebaseService';
import logoImg from './logo.png';

export default function App() {
  // Controle de Abas (SPA)
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'links' | 'macros' | 'configs'
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Configuração do Dispositivo
  const [deviceId, setDeviceId] = useState(() => {
    return localStorage.getItem('slidepages_device_id') || 'tv-sala-espera';
  });
  const [tempDeviceId, setTempDeviceId] = useState(deviceId);
  const [deviceState, setDeviceState] = useState(null);
  
  // Dados do Firestore
  const [links, setLinks] = useState([]);
  const [macros, setMacros] = useState([]);
  const [loading, setLoading] = useState({ links: true, macros: true });
  const [connectionStatus, setConnectionStatus] = useState('connecting');

  // Fallback do Logo
  const [logoFailed, setLogoFailed] = useState(false);

  // Controle de Formulários de Links
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [editingLink, setEditingLink] = useState(null);
  const [showCredentials, setShowCredentials] = useState(false);
  
  // Estado do Formulário de Link
  const [linkForm, setLinkForm] = useState({
    url: '',
    intervalSeconds: 15,
    active: true,
    fixed: false,
    username: '',
    password: '',
    usernameSelector: '',
    passwordSelector: '',
    submitSelector: ''
  });

  // Controle do Construtor de Macros
  const [selectedLinkForMacro, setSelectedLinkForMacro] = useState('');
  const [macroName, setMacroName] = useState('');
  const [macroSteps, setMacroSteps] = useState([]);
  const [editingMacro, setEditingMacro] = useState(null);
  const [inspectingField, setInspectingField] = useState(null); // 'username' | 'password' | 'submit' | null
  const [inspectWriteVal, setInspectWriteVal] = useState('');

  // Salvar Device ID
  const handleSaveDeviceId = (e) => {
    e.preventDefault();
    if (tempDeviceId.trim()) {
      setDeviceId(tempDeviceId.trim());
      localStorage.setItem('slidepages_device_id', tempDeviceId.trim());
    }
  };

  // Real-time Firestore Listeners
  useEffect(() => {
    setConnectionStatus('connecting');
    
    const unsubscribeLinks = subscribeToLinks(
      (data) => {
        setLinks(data);
        setLoading(prev => ({ ...prev, links: false }));
        setConnectionStatus('connected');
      },
      (error) => {
        console.error("Erro na escuta de links:", error);
        setConnectionStatus('error');
      }
    );

    const unsubscribeMacros = subscribeToMacros(
      (data) => {
        setMacros(data);
        setLoading(prev => ({ ...prev, macros: false }));
      },
      (error) => {
        console.error("Erro na escuta de macros:", error);
      }
    );

    return () => {
      unsubscribeLinks();
      unsubscribeMacros();
    };
  }, []);

  // Monitoramento do dispositivo
  useEffect(() => {
    if (!deviceId) return;
    
    const unsubscribeDevice = subscribeToDeviceState(
      deviceId,
      (state) => {
        setDeviceState(state);
      },
      (error) => {
        console.error("Erro na escuta do dispositivo:", error);
      }
    );

    return () => unsubscribeDevice();
  }, [deviceId]);

  useEffect(() => {
    if (deviceState && inspectingField && deviceState.selectedField === inspectingField) {
      if (deviceState.selectedSelector) {
        if (inspectingField === 'username') {
          setLinkForm(prev => ({ ...prev, usernameSelector: deviceState.selectedSelector }));
        } else if (inspectingField === 'password') {
          setLinkForm(prev => ({ ...prev, passwordSelector: deviceState.selectedSelector }));
        } else if (inspectingField === 'submit') {
          setLinkForm(prev => ({ ...prev, submitSelector: deviceState.selectedSelector }));
        }
      }
    }
  }, [deviceState, inspectingField]);

  // ==========================================
  // FUNÇÕES DE LINKS (CRUD)
  // ==========================================
  
  const handleOpenAddForm = () => {
    setEditingLink(null);
    setLinkForm({
      url: '',
      intervalSeconds: 15,
      active: true,
      fixed: false,
      username: '',
      password: '',
      usernameSelector: '',
      passwordSelector: '',
      submitSelector: '',
      zoomLevel: 100,
      scrollY: 0
    });
    setShowCredentials(false);
    setShowLinkForm(true);
  };

  const handleOpenEditForm = (link) => {
    setEditingLink(link);
    setLinkForm({
      url: link.url,
      intervalSeconds: link.intervalSeconds,
      active: link.active,
      fixed: link.fixed || false,
      username: link.credentials?.username || '',
      password: link.credentials?.password || '',
      usernameSelector: link.usernameSelector || '',
      passwordSelector: link.passwordSelector || '',
      submitSelector: link.submitSelector || '',
      zoomLevel: link.zoomLevel ?? 100,
      scrollY: link.scrollY ?? 0
    });
    setShowCredentials(!!(link.credentials?.username || link.credentials?.password || link.usernameSelector || link.passwordSelector));
    setShowLinkForm(true);
  };

  const handleSaveLink = async (e) => {
    e.preventDefault();
    if (!linkForm.url) return;

    const payload = {
      url: linkForm.url,
      intervalSeconds: Number(linkForm.intervalSeconds),
      active: linkForm.active,
      fixed: linkForm.fixed,
      credentials: {
        username: linkForm.username,
        password: linkForm.password
      },
      usernameSelector: linkForm.usernameSelector,
      passwordSelector: linkForm.passwordSelector,
      submitSelector: linkForm.submitSelector,
      zoomLevel: Number(linkForm.zoomLevel) || 100,
      scrollY: Number(linkForm.scrollY) || 0
    };

    try {
      if (editingLink) {
        await updateLink(editingLink.id, payload);
      } else {
        const maxOrder = links.reduce((max, item) => item.order > max ? item.order : max, -1);
        await addLink({ ...payload, order: maxOrder + 1 });
      }
      setShowLinkForm(false);
      setEditingLink(null);
    } catch (err) {
      alert("Erro ao salvar o link: " + err.message);
    }
  };

  const handleDeleteLink = async (id) => {
    if (confirm("Deseja remover este link e suas automações?")) {
      try {
        await deleteLink(id);
        const associatedMacros = macros.filter(m => m.linkId === id);
        for (const macro of associatedMacros) {
          await deleteMacro(macro.id);
        }
      } catch (err) {
        alert("Erro ao remover link: " + err.message);
      }
    }
  };

  const handleToggleActive = async (link) => {
    try {
      await updateLink(link.id, { active: !link.active });
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleFixed = async (link) => {
    const nextFixed = !link.fixed;
    try {
      await updateLink(link.id, { fixed: nextFixed });
      if (nextFixed) {
        await sendDeviceCommand(deviceId, "fixPage", { targetLinkId: link.id });
      } else {
        await sendDeviceCommand(deviceId, "play");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMoveLink = async (index, direction) => {
    const newLinks = [...links];
    if (direction === 'up' && index > 0) {
      const temp = newLinks[index];
      newLinks[index] = newLinks[index - 1];
      newLinks[index - 1] = temp;
    } else if (direction === 'down' && index < newLinks.length - 1) {
      const temp = newLinks[index];
      newLinks[index] = newLinks[index + 1];
      newLinks[index + 1] = temp;
    } else {
      return;
    }
    try {
      await reorderLinks(newLinks);
    } catch (err) {
      console.error("Erro ao reordenar:", err);
    }
  };

  const handleStartInspect = async (field) => {
    setInspectingField(field);
    try {
      await sendDeviceCommand(deviceId, "inspect_field", {
        targetField: field,
        targetLinkId: editingLink?.id || ""
      });
    } catch (err) {
      console.error("Erro ao iniciar inspeção:", err);
    }
  };

  const handleCycleInspect = async (direction) => {
    if (!inspectingField) return;
    try {
      await sendDeviceCommand(deviceId, "cycle_field", {
        targetField: inspectingField,
        direction
      });
    } catch (err) {
      console.error("Erro ao ciclar campos:", err);
    }
  };

  const handleConfirmInspect = async () => {
    if (!inspectingField) return;
    try {
      await sendDeviceCommand(deviceId, "confirm_field", {
        targetField: inspectingField
      });
      setInspectingField(null);
    } catch (err) {
      console.error("Erro ao confirmar campo:", err);
    }
  };

  const handleSendInspectValue = async () => {
    if (!inspectWriteVal) return;
    try {
      await sendDeviceCommand(deviceId, "write_inspect_value", {
        value: inspectWriteVal,
        targetField: inspectingField
      });
    } catch (err) {
      console.error("Erro ao enviar valor para o campo:", err);
    }
  };

  // ==========================================
  // COMANDOS DO DISPOSITIVO
  // ==========================================
  
  const triggerCommand = async (action, extra = {}) => {
    try {
      await sendDeviceCommand(deviceId, action, extra);
    } catch (err) {
      alert("Erro ao enviar comando: " + err.message);
    }
  };

  const handleGotoLink = async (linkId) => {
    await triggerCommand("goto", { targetLinkId: linkId });
  };

  // ==========================================
  // GRAVADOR/EDITOR DE MACROS
  // ==========================================

  const handleStartMacroBuilder = (linkId, macro = null) => {
    setSelectedLinkForMacro(linkId);
    setActiveTab('macros');
    if (macro) {
      setEditingMacro(macro);
      setMacroName(macro.name);
      setMacroSteps(macro.steps || []);
    } else {
      setEditingMacro(null);
      setMacroName('Interação Automática');
      setMacroSteps([
        { type: 'click', selector: '', xPercent: 0, yPercent: 0, delayMs: 1000 }
      ]);
    }
  };

  const handleAddStep = () => {
    setMacroSteps([
      ...macroSteps,
      { type: 'click', selector: '', xPercent: 0, yPercent: 0, delayMs: 1000 }
    ]);
  };

  const handleRemoveStep = (index) => {
    const steps = [...macroSteps];
    steps.splice(index, 1);
    setMacroSteps(steps);
  };

  const handleStepChange = (index, field, value) => {
    const steps = [...macroSteps];
    steps[index] = { ...steps[index], [field]: value };
    if (field === 'type') {
      if (value === 'wait') {
        delete steps[index].selector;
        delete steps[index].xPercent;
        delete steps[index].yPercent;
      } else if (value === 'scroll') {
        delete steps[index].selector;
        delete steps[index].xPercent;
        steps[index].yPercent = steps[index].yPercent || 50;
      } else if (value === 'click') {
        steps[index].selector = '';
        steps[index].xPercent = 0;
        steps[index].yPercent = 0;
      }
    }
    setMacroSteps(steps);
  };

  const handleSaveMacro = async () => {
    if (!macroName.trim() || !selectedLinkForMacro) {
      alert("Insira um nome e selecione um link.");
      return;
    }

    const payload = {
      linkId: selectedLinkForMacro,
      name: macroName,
      steps: macroSteps.map(step => {
        const cleanStep = { type: step.type, delayMs: Number(step.delayMs) || 500 };
        if (step.type === 'click') {
          if (step.selector) {
            cleanStep.selector = step.selector;
          } else {
            cleanStep.xPercent = Number(step.xPercent) || 0;
            cleanStep.yPercent = Number(step.yPercent) || 0;
          }
        } else if (step.type === 'scroll') {
          cleanStep.yPercent = Number(step.yPercent) || 50;
        }
        return cleanStep;
      })
    };

    try {
      if (editingMacro) {
        await updateMacro(editingMacro.id, payload);
      } else {
        await addMacro(payload);
      }
      setSelectedLinkForMacro('');
      setMacroName('');
      setMacroSteps([]);
      setEditingMacro(null);
    } catch (err) {
      alert("Erro ao salvar macro: " + err.message);
    }
  };

  const handleDeleteMacro = async (macroId) => {
    if (confirm("Tem certeza que deseja deletar esta macro?")) {
      try {
        await deleteMacro(macroId);
      } catch (err) {
        alert("Erro ao deletar macro: " + err.message);
      }
    }
  };

  const handleRunMacro = async (macro) => {
    await triggerCommand("runMacro", { 
      targetLinkId: macro.linkId, 
      targetMacroId: macro.id 
    });
  };

  const getLinkUrlById = (linkId) => {
    const link = links.find(l => l.id === linkId);
    return link ? link.url : 'Fila Livre';
  };

  const activeLinkData = links.find(l => l.id === selectedLinkForMacro);

  return (
    <div className="app-layout">
      
      {/* HEADER MOBILE */}
      <header className="mobile-header">
        <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <span className="mobile-header-title">SlidePages Admin</span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
          <span className={`status-dot ${deviceState ? 'active' : 'inactive'}`} />
        </div>
      </header>

      {/* BACKDROP MOBILE */}
      {isMobileMenuOpen && (
        <div className="sidebar-backdrop" onClick={() => setIsMobileMenuOpen(false)} />
      )}
      
      {/* SIDEBAR NAVEGAÇÃO SPA */}
      <aside className={`sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
        
        {/* LOGO CORPORATIVO RBT */}
        <div className="logo-container">
          {logoFailed ? (
            <div className="logo-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent-red)', color: '#fff', fontWeight: '900', fontSize: '1rem', border: '1px solid rgba(255,255,255,0.1)' }}>
              RBT
            </div>
          ) : (
            <img 
              src={logoImg} 
              alt="RBT Internet Logo" 
              className="logo-img" 
              onError={() => setLogoFailed(true)} 
            />
          )}
          <div>
            <h1 className="logo-text">RBT Internet</h1>
            <span className="logo-subtext">SlidePages Admin</span>
          </div>
        </div>

        {/* MENU */}
        <nav className="nav-menu">
          <div 
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </div>
          <div 
            className={`nav-item ${activeTab === 'links' ? 'active' : ''}`}
            onClick={() => { setActiveTab('links'); setIsMobileMenuOpen(false); }}
          >
            <LinkIcon size={18} />
            <span>Fila de Rotação</span>
          </div>
          <div 
            className={`nav-item ${activeTab === 'macros' ? 'active' : ''}`}
            onClick={() => { setActiveTab('macros'); setIsMobileMenuOpen(false); }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <Zap size={18} />
              <span>Automações (Macros)</span>
            </div>
            <Lock size={12} style={{ color: 'var(--text-muted)' }} />
          </div>
          <div 
            className={`nav-item ${activeTab === 'configs' ? 'active' : ''}`}
            onClick={() => { setActiveTab('configs'); setIsMobileMenuOpen(false); }}
          >
            <Settings size={18} />
            <span>Configurações</span>
          </div>
        </nav>

        {/* SUMMARY DEVICE CARD NO FOOTER DA SIDEBAR */}
        <div className="sidebar-footer">
          <div className="sidebar-device-card">
            <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>Terminal Ativo</p>
            <p style={{ fontSize: '0.8rem', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-primary)', marginTop: '0.15rem' }}>
              {deviceId}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.7rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Status:</span>
              <span className={`badge ${deviceState ? 'badge-green' : 'badge-red'}`} style={{ fontSize: '0.6rem', padding: '0.1rem 0.3rem' }}>
                {deviceState ? deviceState.action : 'OFFLINE'}
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* CONTEÚDO PRINCIPAL (SPA VIEWS) */}
      <main className="main-content">
        
        {/* TABS DE CONTEÚDO */}

        {/* 1. VISÃO DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="animate-fade-in">
            <div className="flex-between" style={{ marginBottom: '2rem' }}>
              <div>
                <h2 style={{ fontSize: '1.6rem', fontWeight: '800' }}>Painel Geral</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Resumo em tempo real do sistema e controle do terminal</p>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
                {connectionStatus === 'connected' ? (
                  <span className="badge badge-green" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Wifi size={13} /> Firestore Sincronizado
                  </span>
                ) : (
                  <span className="badge badge-red" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <WifiOff size={13} /> Sem Conexão
                  </span>
                )}
              </div>
            </div>

            <div className="main-grid">
              
              {/* LADO ESQUERDO: FILA E MONITOR */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                
                {/* STATUS DOS DISPOSITIVOS */}
                <div className="glass-panel glowing-red" style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: '700' }}>
                      Dispositivo Conectado
                    </h3>
                    {/* Inline device ID changer */}
                    <form
                      onSubmit={(e) => { e.preventDefault(); const val = e.target.elements.inlineDevId.value.trim(); if (val) { setDeviceId(val); localStorage.setItem('slidepages_device_id', val); } }}
                      style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}
                    >
                      <input
                        name="inlineDevId"
                        type="text"
                        defaultValue={deviceId}
                        placeholder="ID do dispositivo (ex: stp-abc12345)"
                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', width: '220px', fontFamily: 'monospace', letterSpacing: '0.05em' }}
                      />
                      <button type="submit" className="btn btn-primary" style={{ padding: '0.3rem 0.7rem', fontSize: '0.72rem', height: 'auto' }}>
                        Conectar
                      </button>
                    </form>
                  </div>

                  {!deviceState && (
                    <div style={{
                      background: 'rgba(251,146,60,0.12)',
                      border: '1.5px solid #f97316',
                      borderRadius: '8px',
                      padding: '0.85rem 1rem',
                      marginBottom: '1rem',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.6rem'
                    }}>
                      <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>⚠️</span>
                      <div>
                        <p style={{ fontSize: '0.8rem', fontWeight: '700', color: '#f97316', marginBottom: '0.2rem' }}>
                          Nenhum sinal do dispositivo com ID <code style={{ background: 'rgba(0,0,0,0.3)', padding: '0 4px', borderRadius: 3 }}>{deviceId}</code>
                        </p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                          Verifique o ID exibido na tela de <strong>Configurações</strong> do App Android e cole acima. O botão <strong>"Exibir Agora"</strong> e a inspeção de campos só funcionam quando o ID é o mesmo que o App gerou.
                        </p>
                      </div>
                    </div>
                  )}

                  {deviceState ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                      <div className="glass-panel" style={{ padding: '1rem', background: 'rgba(0,0,0,0.15)' }}>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>AÇÃO ATIVA</p>
                        <p style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--accent-red)', textTransform: 'uppercase', marginTop: '0.2rem' }}>{deviceState.action}</p>
                      </div>
                      <div className="glass-panel" style={{ padding: '1rem', background: 'rgba(0,0,0,0.15)' }}>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>TELA CARREGADA</p>
                        <p 
                          style={{ fontSize: '0.85rem', fontWeight: '700', marginTop: '0.4rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                          title={deviceState.targetLinkId ? getLinkUrlById(deviceState.targetLinkId) : 'Rotação Livre'}
                        >
                          {deviceState.targetLinkId ? getLinkUrlById(deviceState.targetLinkId) : 'Rotação Livre'}
                        </p>
                      </div>
                      <div className="glass-panel" style={{ padding: '1rem', background: 'rgba(0,0,0,0.15)' }}>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>ÚLTIMO SINAL</p>
                        <p style={{ fontSize: '0.85rem', fontWeight: '700', marginTop: '0.4rem' }}>
                          {deviceState.updatedAt ? new Date(deviceState.updatedAt.seconds * 1000).toLocaleTimeString('pt-BR') : 'Sem sinal'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      Aguardando sinal...
                    </div>
                  )}

                  {/* CONTROLES DO DISPOSITIVO */}
                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                    <button className="btn btn-primary" onClick={() => triggerCommand("play")} style={{ flex: '1', minWidth: '130px' }}>
                      <Play size={14} /> Play
                    </button>
                    <button className="btn btn-secondary" onClick={() => triggerCommand("pause")} style={{ flex: '1', minWidth: '130px', borderColor: 'rgba(229,62,62,0.3)', color: 'var(--accent-red)' }}>
                      <Pause size={14} /> Pause
                    </button>
                    <button className="btn btn-secondary" onClick={() => triggerCommand("reload")} style={{ flex: '1', minWidth: '130px' }}>
                      <RefreshCw size={14} /> Recarregar
                    </button>
                    <button className="btn btn-danger" onClick={() => triggerCommand("newPath")} style={{ flex: '1', minWidth: '130px' }} title="Resetar cookies/cache do WebView">
                      <Compass size={14} /> Resetar Cache
                    </button>
                  </div>
                </div>

                {/* TABELA DE FILA DE ROTAÇÃO RAPIDA */}
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1rem' }}>Sequência Ativa de Rotação</h3>
                  
                  {links.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Fila vazia. Adicione links na aba correspondente.</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {links.map((link, index) => (
                        <div key={link.id} className="flex-between" style={{ padding: '0.65rem 1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '6px', opacity: link.active ? 1 : 0.5 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', overflow: 'hidden' }}>
                            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: 'var(--accent-red)' }}>#{index + 1}</span>
                            <span style={{ fontSize: '0.85rem', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '300px' }}>{link.url}</span>
                            {link.fixed && <span className="badge badge-red" style={{ fontSize: '0.6rem' }}>FIXO</span>}
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{link.intervalSeconds}s</span>
                            <button className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }} onClick={() => handleGotoLink(link.id)}>
                              Forçar Carregamento
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

              {/* LADO DIREITO: SUMMARY METRICS */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="glass-panel" style={{ padding: '1.25rem' }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 'bold' }}>TOTAL DE MONITORES</p>
                  <p style={{ fontSize: '1.6rem', fontWeight: '800', marginTop: '0.2rem' }}>{links.length}</p>
                </div>
                <div className="glass-panel" style={{ padding: '1.25rem' }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 'bold' }}>TELA FIXADA</p>
                  <p style={{ fontSize: '0.9rem', fontWeight: '700', marginTop: '0.4rem', color: links.some(l => l.fixed) ? 'var(--accent-red)' : 'var(--text-muted)' }}>
                    {links.some(l => l.fixed) ? 'Sim (Página única)' : 'Não (Fila rodando)'}
                  </p>
                </div>
                <div className="glass-panel" style={{ padding: '1.25rem' }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 'bold' }}>AUTOMAÇÕES CADASTRADAS</p>
                  <p style={{ fontSize: '1.6rem', fontWeight: '800', marginTop: '0.2rem' }}>{macros.length}</p>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* 2. FILA DE ROTAÇÃO (LINKS CRUD) */}
        {activeTab === 'links' && (
          <div className="animate-fade-in" style={{ maxWidth: '1000px' }}>
            <div className="flex-between" style={{ marginBottom: '2rem' }}>
              <div>
                <h2 style={{ fontSize: '1.6rem', fontWeight: '800' }}>Fila de Rotação</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Gerencie e configure os links a serem exibidos nos WebView</p>
              </div>
              <button className="btn btn-primary" onClick={handleOpenAddForm}>
                <Plus size={16} /> Adicionar Link
              </button>
            </div>

            {/* FORMULÁRIO DE LINKS */}
            {showLinkForm && (
              <form onSubmit={handleSaveLink} className="glass-panel glowing-red" style={{ padding: '1.5rem', marginBottom: '2rem', background: 'rgba(0,0,0,0.2)' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--accent-red)', marginBottom: '1.25rem' }}>
                  {editingLink ? 'Editar Configurações do Link' : 'Cadastrar Novo Link'}
                </h3>

                <div className="form-group">
                  <label>URL da Página Web</label>
                  <input 
                    type="text" 
                    value={linkForm.url}
                    onChange={(e) => setLinkForm({ ...linkForm, url: e.target.value })}
                    placeholder="https://suapagina.com.br"
                    required
                  />
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label>Tempo de Rotação (Segundos)</label>
                    <input 
                      type="number" 
                      min="5"
                      value={linkForm.intervalSeconds}
                      onChange={(e) => setLinkForm({ ...linkForm, intervalSeconds: Number(e.target.value) })}
                      required
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', marginTop: '1.2rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', textTransform: 'none' }}>
                      <input 
                        type="checkbox" 
                        checked={linkForm.active}
                        onChange={(e) => setLinkForm({ ...linkForm, active: e.target.checked })}
                      />
                      Exibição Ativa
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', textTransform: 'none' }}>
                      <input 
                        type="checkbox" 
                        checked={linkForm.fixed}
                        onChange={(e) => setLinkForm({ ...linkForm, fixed: e.target.checked })}
                      />
                      Página Fixada
                    </label>
                  </div>
                </div>

                {/* ZOOM + SCROLL */}
                <div className="glass-panel" style={{ padding: '1rem 1.25rem', marginBottom: '0.5rem', background: 'rgba(0,0,0,0.1)' }}>
                  <p style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Zoom e Posição da Página
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {/* ZOOM */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                        <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'none', letterSpacing: 0 }}>
                          🔍 Zoom da Página
                        </label>
                        <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--accent-red)', minWidth: '42px', textAlign: 'right' }}>
                          {linkForm.zoomLevel ?? 100}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="30" max="200" step="5"
                        value={linkForm.zoomLevel ?? 100}
                        onChange={(e) => setLinkForm({ ...linkForm, zoomLevel: Number(e.target.value) })}
                        style={{ width: '100%', accentColor: 'var(--accent-red)', cursor: 'pointer' }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        <span>30%</span><span>100%</span><span>200%</span>
                      </div>
                    </div>

                    {/* SCROLL Y */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                        <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'none', letterSpacing: 0 }}>
                          ↕ Scroll Vertical (pixels do topo)
                        </label>
                        <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--accent-red)', minWidth: '52px', textAlign: 'right' }}>
                          {linkForm.scrollY ?? 0}px
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0" max="5000" step="50"
                        value={linkForm.scrollY ?? 0}
                        onChange={(e) => setLinkForm({ ...linkForm, scrollY: Number(e.target.value) })}
                        style={{ width: '100%', accentColor: '#6366f1', cursor: 'pointer' }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        <span>0px</span><span>2500px</span><span>5000px</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* CREDENCIAIS OPCIONAIS */}
                <div style={{ margin: '1.5rem 0' }}>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => setShowCredentials(!showCredentials)}
                    style={{ width: '100%', justifyContent: 'space-between', fontSize: '0.8rem' }}
                  >
                    <span>Autenticação / Login Automático (Opcional)</span>
                    <span>{showCredentials ? '▲' : '▼'}</span>
                  </button>

                  {showCredentials && (
                    <div className="glass-panel" style={{ padding: '1.25rem', marginTop: '0.5rem', background: 'rgba(0,0,0,0.1)' }}>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1.25rem', lineHeight: '1.5' }}>
                        Clique em <Eye size={11} style={{ display:'inline', verticalAlign:'middle' }} /> para inspecionar o campo no App. Use <strong>◀ ▶</strong> para navegar entre campos, depois <strong>digite o valor e clique em Enviar</strong>. O app escreverá no campo selecionado. Ao finalizar, clique em <Check size={11} style={{ display:'inline', verticalAlign:'middle' }} /> para confirmar e salvar o seletor.
                      </p>

                      {/* Write Panel — shown globally when any field is being inspected */}
                      {inspectingField && (
                        <div style={{ 
                          background: 'rgba(124, 58, 237, 0.12)', 
                          border: '1px solid rgba(124, 58, 237, 0.4)', 
                          borderRadius: '8px', 
                          padding: '0.85rem 1rem', 
                          marginBottom: '1.25rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.5rem'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.7rem', fontWeight: '700', color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              ● Inspecionando: {inspectingField === 'username' ? 'Usuário' : inspectingField === 'password' ? 'Senha' : 'Submit'}
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                            <button type="button" className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', height: '36px', minWidth: '36px' }} onClick={() => handleCycleInspect('prev')} title="Campo anterior">◀</button>
                            <button type="button" className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', height: '36px', minWidth: '36px' }} onClick={() => handleCycleInspect('next')} title="Próximo campo">▶</button>
                            <input
                              type={inspectingField === 'password' ? 'password' : 'text'}
                              value={inspectWriteVal}
                              onChange={e => setInspectWriteVal(e.target.value)}
                              onKeyDown={e => { if (e.key === 'Enter') handleSendInspectValue(); }}
                              placeholder={inspectingField === 'password' ? 'Digite a senha...' : inspectingField === 'username' ? 'Digite o usuário...' : 'Clique em Enviar para clicar no botão'}
                              style={{ flex: 1, height: '36px', fontSize: '0.85rem' }}
                              autoFocus
                            />
                            <button
                              type="button"
                              className="btn btn-primary"
                              style={{ height: '36px', padding: '0 0.85rem', display: 'flex', alignItems: 'center', gap: '0.3rem', whiteSpace: 'nowrap' }}
                              onClick={handleSendInspectValue}
                              title="Enviar para o App"
                            >
                              <Zap size={13} /> Enviar
                            </button>
                            <button
                              type="button"
                              className="btn btn-success"
                              style={{ height: '36px', padding: '0 0.7rem', display: 'flex', alignItems: 'center' }}
                              onClick={async () => { await handleConfirmInspect(); setInspectWriteVal(''); }}
                              title="Confirmar campo e salvar seletor"
                            >
                              <Check size={14} />
                            </button>
                          </div>
                          {deviceState?.selectedText && (
                            <p style={{ fontSize: '0.7rem', color: '#a78bfa', margin: 0 }}>
                              Campo ativo no App: <strong>"{deviceState.selectedText}"</strong>
                            </p>
                          )}
                        </div>
                      )}

                      {/* USERNAME ROW */}
                      <div className="responsive-row">
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Usuário / Email</label>
                          <input 
                            type="text" 
                            value={linkForm.username}
                            onChange={(e) => setLinkForm({ ...linkForm, username: e.target.value })}
                            placeholder="operador@empresa.com"
                            style={{ height: '34px' }}
                          />
                        </div>
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>CSS Selector (Usuário)</label>
                          <input 
                            type="text" 
                            value={linkForm.usernameSelector}
                            onChange={(e) => setLinkForm({ ...linkForm, usernameSelector: e.target.value })}
                            placeholder="Ex: #email ou input[name='user']"
                            style={{ height: '34px', fontSize: '0.75rem' }}
                          />
                        </div>
                        <button
                          type="button"
                          className={`btn ${inspectingField === 'username' ? 'btn-primary' : 'btn-secondary'}`}
                          style={{ height: '34px', width: '34px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: inspectingField === 'username' ? '1px solid #7c3aed' : undefined }}
                          onClick={() => inspectingField === 'username' ? null : handleStartInspect('username')}
                          title="Inspecionar campo Usuário no App"
                        >
                          {inspectingField === 'username' ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>

                      {/* PASSWORD ROW */}
                      <div className="responsive-row">
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Senha de Acesso</label>
                          <input 
                            type="password" 
                            value={linkForm.password}
                            onChange={(e) => setLinkForm({ ...linkForm, password: e.target.value })}
                            placeholder="••••••••"
                            style={{ height: '34px' }}
                          />
                        </div>
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>CSS Selector (Senha)</label>
                          <input 
                            type="text" 
                            value={linkForm.passwordSelector}
                            onChange={(e) => setLinkForm({ ...linkForm, passwordSelector: e.target.value })}
                            placeholder="Ex: input[type='password']"
                            style={{ height: '34px', fontSize: '0.75rem' }}
                          />
                        </div>
                        <button
                          type="button"
                          className={`btn ${inspectingField === 'password' ? 'btn-primary' : 'btn-secondary'}`}
                          style={{ height: '34px', width: '34px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: inspectingField === 'password' ? '1px solid #7c3aed' : undefined }}
                          onClick={() => inspectingField === 'password' ? null : handleStartInspect('password')}
                          title="Inspecionar campo Senha no App"
                        >
                          {inspectingField === 'password' ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>

                      {/* SUBMIT ROW */}
                      <div className="responsive-row">
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>CSS Selector (Botão Entrar)</label>
                          <input 
                            type="text" 
                            value={linkForm.submitSelector}
                            onChange={(e) => setLinkForm({ ...linkForm, submitSelector: e.target.value })}
                            placeholder="Ex: button[type='submit'] (Vazio = Auto)"
                            style={{ height: '34px', fontSize: '0.75rem' }}
                          />
                        </div>
                        <button
                          type="button"
                          className={`btn ${inspectingField === 'submit' ? 'btn-primary' : 'btn-secondary'}`}
                          style={{ height: '34px', width: '34px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: inspectingField === 'submit' ? '1px solid #7c3aed' : undefined }}
                          onClick={() => inspectingField === 'submit' ? null : handleStartInspect('submit')}
                          title="Inspecionar botão Entrar no App"
                        >
                          {inspectingField === 'submit' ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>

                      {/* DETECT ALL BUTTONS */}
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.85rem' }}>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.78rem' }}
                          onClick={() => sendDeviceCommand(deviceId, 'detect_page_elements')}
                          title="Escanear todos os elementos clicáveis da tela atual no App"
                        >
                          <Terminal size={13} style={{ color: 'var(--accent-red)' }} />
                          Ver todos os botões / campos da tela atual
                        </button>
                        {deviceState?.detectedElements && deviceState.detectedElements.length > 0 && (
                          <div style={{ marginTop: '0.6rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                              <label style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Elementos detectados:</label>
                              <span style={{ fontSize: '0.6rem', color: '#64748b' }}>1 clique = seleciona no App · 2 cliques = clica no App (login/submit salva o seletor)</span>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                              {deviceState.detectedElements.map((el, i) => {
                                const isSubmit = el.isSubmit === true || el.isSubmit === 'true';
                                return (
                                  <button
                                    key={i}
                                    type="button"
                                    className="btn btn-secondary"
                                    style={{
                                      fontSize: '0.65rem',
                                      padding: '0.25rem 0.6rem',
                                      height: 'auto',
                                      maxWidth: '220px',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                      ...(isSubmit ? {
                                        border: '1.5px solid #3B82F6',
                                        color: '#60a5fa',
                                        background: 'rgba(59,130,246,0.1)',
                                        fontWeight: '700'
                                      } : {})
                                    }}
                                    title={`${isSubmit ? '🔵 Botão de Login/Submit — ' : ''}${el.selector}\nClique duplo para clicar no App`}
                                    onClick={() => sendDeviceCommand(deviceId, 'select_detected_element', { selector: el.selector })}
                                    onDoubleClick={async () => {
                                      await sendDeviceCommand(deviceId, 'click_detected_element', { selector: el.selector });
                                      // Auto-save as submitSelector if it looks like a login button
                                      if (isSubmit) {
                                        setLinkForm(prev => ({ ...prev, submitSelector: el.selector }));
                                      }
                                    }}
                                  >
                                    {isSubmit && <span style={{ marginRight: '0.25rem' }}>⬤</span>}
                                    {el.text || el.selector}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowLinkForm(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Salvar Registro
                  </button>
                </div>
              </form>
            )}

            {/* TABELA DE LINKS */}
            {loading.links ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Carregando fila...</div>
            ) : links.length === 0 ? (
              <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', borderStyle: 'dashed' }}>
                Nenhum link cadastrado. Clique em Adicionar Link acima.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {links.map((link, index) => {
                  const linkMacros = macros.filter(m => m.linkId === link.id);
                  return (
                    <div 
                      key={link.id} 
                      className={`glass-panel link-item-row ${link.fixed ? 'active glowing-red' : ''}`}
                      style={{ 
                        padding: '1rem 1.25rem', 
                        background: link.active ? 'var(--bg-card)' : 'rgba(255,255,255,0.01)',
                        opacity: link.active ? 1 : 0.55
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: '1', overflow: 'hidden' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <button className="btn-icon" onClick={() => handleMoveLink(index, 'up')} disabled={index === 0}>
                            <ArrowUp size={12} />
                          </button>
                          <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', fontWeight: 'bold', textAlign: 'center', color: 'var(--text-muted)' }}>{index + 1}</span>
                          <button className="btn-icon" onClick={() => handleMoveLink(index, 'down')} disabled={index === links.length - 1}>
                            <ArrowDown size={12} />
                          </button>
                        </div>

                        <div style={{ overflow: 'hidden' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <span style={{ fontWeight: '700', fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '400px' }}>{link.url}</span>
                            {link.fixed && <span className="badge badge-red">FIXADO</span>}
                            {!link.active && <span className="badge">INATIVO</span>}
                          </div>
                          <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                            <span>Intervalo: <strong>{link.intervalSeconds}s</strong></span>
                            {link.credentials?.username && <span style={{ color: 'var(--accent-red)' }}><Key size={10} style={{ marginRight: '1px', verticalAlign: 'middle' }} /> Credenciais Salvas</span>}
                          </div>
                        </div>
                      </div>

                      <div className="link-actions">
                        <button className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }} onClick={() => handleGotoLink(link.id)}>
                          Exibir Agora
                        </button>
                        <button className={`btn ${link.fixed ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }} onClick={() => handleToggleFixed(link)}>
                          {link.fixed ? 'Desafixar' : 'Fixar Tela'}
                        </button>
                        
                        <div style={{ width: '1px', height: '20px', background: 'var(--border-color)', margin: '0 0.25rem' }} />

                        <button className="btn-icon" style={{ color: 'var(--accent-red)' }} onClick={() => handleStartMacroBuilder(link.id)} title="Automação/Macro">
                          <Zap size={15} />
                        </button>
                        <button className="btn-icon" onClick={() => handleOpenEditForm(link)}>
                          <Edit3 size={15} />
                        </button>
                        <button className="btn-icon" style={{ color: '#ef4444' }} onClick={() => handleDeleteLink(link.id)}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 3. AUTOMAÇÕES (MACROS) */}
        {activeTab === 'macros' && (
          <div className="animate-fade-in" style={{ maxWidth: '600px', margin: '2rem auto', padding: '2rem 1rem', textAlign: 'center' }}>
            <div className="glass-panel glowing-red" style={{ padding: '3.5rem 2.5rem', background: 'rgba(229, 62, 62, 0.02)', borderColor: 'rgba(229, 62, 62, 0.15)' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(229, 62, 62, 0.08)', color: 'var(--accent-red)', marginBottom: '1.5rem', boxShadow: '0 0 20px rgba(229, 62, 62, 0.15)' }}>
                <Lock size={30} />
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '0.75rem', color: '#fff' }}>Recurso Sob Bloqueio</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '2rem' }}>
                As macros de automação interativa estão desativadas temporariamente nesta versão do painel. A configuração de cliques, scrolls e temporizadores foi desabilitada para envio ao servidor de homologação.
              </p>
              <button className="btn btn-secondary" onClick={() => setActiveTab('dashboard')} style={{ fontSize: '0.85rem' }}>
                Voltar ao Dashboard
              </button>
            </div>
          </div>
        )}

        {/* 4. CONFIGURAÇÕES DO SISTEMA */}
        {activeTab === 'configs' && (
          <div className="animate-fade-in" style={{ maxWidth: '800px' }}>
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.6rem', fontWeight: '800' }}>Configurações do Sistema</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Gerencie as preferências globais do painel administrativo</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* ID DO DISPOSITIVO */}
              <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '0.5rem' }}>Pareamento de Dispositivo</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>Insira o ID do monitor Android que deseja controlar remotamente em tempo real.</p>
                
                <form onSubmit={handleSaveDeviceId} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <div style={{ flex: '1' }}>
                    <input 
                      type="text" 
                      value={tempDeviceId}
                      onChange={(e) => setTempDeviceId(e.target.value)}
                      placeholder="Ex: tv-recepcao-01"
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ height: '42px' }}>
                    Salvar ID
                  </button>
                </form>
              </div>

              {/* FIRESTORE RULES GUIDE */}
              <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <HelpCircle size={16} style={{ color: 'var(--accent-red)' }} /> Diagnóstico & Firestore Rules
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  Para o correto funcionamento do SlidePages no Firebase Spark, certifique-se de publicar as seguintes regras de segurança no console do Cloud Firestore:
                </p>
                <pre style={{ 
                  background: 'rgba(0,0,0,0.5)', 
                  border: '1px solid var(--border-color)', 
                  padding: '1rem', 
                  borderRadius: '6px', 
                  fontSize: '0.75rem', 
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-secondary)',
                  overflowX: 'auto'
                }}>
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /links/{linkId} { allow read, write: if true; }
    match /macros/{macroId} { allow read, write: if true; }
    match /devices/{deviceId}/state/current { allow read, write: if true; }
  }
}`}
                </pre>
              </div>

            </div>
          </div>
        )}

      </main>

    </div>
  );
}
