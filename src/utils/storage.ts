import { GameState, SaveInfo, EstatisticasTemporada } from '../types';

const SAVE_PREFIX = 'brsim_';
const DB_NAME = 'BrasileiraoSimulator';
const DB_VERSION = 2;
let dbInstance: IDBDatabase | null = null;

function openDB(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (dbInstance) { resolve(dbInstance); return; }
    if (!window.indexedDB) { resolve(null); return; }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('saves')) db.createObjectStore('saves', { keyPath: 'key' });
      if (!db.objectStoreNames.contains('logos')) db.createObjectStore('logos', { keyPath: 'timeNome' });
      if (!db.objectStoreNames.contains('championship_years')) {
        db.createObjectStore('championship_years', { keyPath: 'chave' });
      }
    };
    request.onsuccess = (e) => { dbInstance = (e.target as IDBOpenDBRequest).result; resolve(dbInstance); };
    request.onerror = () => { console.warn('IndexedDB indisponível'); resolve(null); };
  });
}

async function saveToDB(key: string, value: unknown): Promise<boolean> {
  const db = await openDB();
  if (!db) return false;
  try {
    const tx = db.transaction('saves', 'readwrite');
    tx.objectStore('saves').put({ key, value, updatedAt: new Date().toISOString() });
    return new Promise((resolve) => { tx.oncomplete = () => resolve(true); tx.onerror = () => resolve(false); });
  } catch { return false; }
}

async function loadFromDB(key: string): Promise<unknown | null> {
  const db = await openDB();
  if (!db) return null;
  try {
    const tx = db.transaction('saves', 'readonly');
    const req = tx.objectStore('saves').get(key);
    return new Promise((resolve) => { req.onsuccess = () => resolve(req.result?.value ?? null); req.onerror = () => resolve(null); });
  } catch { return null; }
}

async function deleteFromDB(key: string): Promise<boolean> {
  const db = await openDB();
  if (!db) return false;
  try {
    const tx = db.transaction('saves', 'readwrite');
    tx.objectStore('saves').delete(key);
    return new Promise((resolve) => { tx.oncomplete = () => resolve(true); tx.onerror = () => resolve(false); });
  } catch { return false; }
}

export async function salvarLogoDB(timeNome: string, dataUrl: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = async () => {
      const canvas = document.createElement('canvas');
      const MAX_SIZE = 120;
      let w = img.width, h = img.height;
      if (w > MAX_SIZE || h > MAX_SIZE) { const s = Math.min(MAX_SIZE/w, MAX_SIZE/h); w = Math.round(w*s); h = Math.round(h*s); }
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, w, h);
      const compressed = canvas.toDataURL('image/jpeg', 0.7);
      const db = await openDB();
      if (db) {
        try {
          const tx = db.transaction('logos', 'readwrite');
          tx.objectStore('logos').put({ timeNome, dataUrl: compressed });
          tx.oncomplete = () => { try { localStorage.setItem('brsim_logo_'+timeNome, compressed); } catch{} resolve(true); };
          tx.onerror = () => { try { localStorage.setItem('brsim_logo_'+timeNome, compressed); resolve(true); } catch { resolve(false); } };
        } catch { try { localStorage.setItem('brsim_logo_'+timeNome, compressed); resolve(true); } catch { resolve(false); } }
      } else { try { localStorage.setItem('brsim_logo_'+timeNome, compressed); resolve(true); } catch { resolve(false); } }
    };
    img.onerror = () => { try { localStorage.setItem('brsim_logo_'+timeNome, dataUrl); resolve(true); } catch { resolve(false); } };
    img.src = dataUrl;
  });
}

export function getLogoUrl(timeNome: string): string | null {
  try { return localStorage.getItem('brsim_logo_' + timeNome); } catch { return null; }
}

export async function listarSavesDB(): Promise<SaveInfo[]> {
  const db = await openDB();
  if (!db) return [];
  return new Promise((resolve) => {
    const tx = db.transaction('saves', 'readonly');
    const req = tx.objectStore('saves').getAll();
    req.onsuccess = () => {
      const results = req.result || [];
      const saves: SaveInfo[] = results
        .filter((item: any) => item.key.startsWith(SAVE_PREFIX))
        .map((item: any) => {
          const val = item.value as GameState;
          return {
            key: item.key,
            nome: item.key.replace(SAVE_PREFIX, ''),
            data: val._savedAt || 'desconhecido',
            ano: val.year || '?',
            times: val.state ? Object.keys(val.state.times).length : 0,
            concluido: val.state ? !!val.state.concluido : false,
            origemDB: true,
          };
        });
      resolve(saves);
    };
    req.onerror = () => resolve([]);
  });
}

export async function listarSavesCombinado(): Promise<SaveInfo[]> {
  // Junta saves do localStorage com os do IndexedDB
  const savesMap = new Map<string, SaveInfo>();

  // LocalStorage
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(SAVE_PREFIX)) {
        const dataStr = localStorage.getItem(key);
        if (!dataStr) continue;
        try {
          const data = JSON.parse(dataStr);
          savesMap.set(key, { key, nome: key.replace(SAVE_PREFIX, ''), data: data._savedAt || 'desconhecido', ano: data.year || '?', times: data.state ? Object.keys(data.state.times).length : 0, concluido: data.state ? !!data.state.concluido : false });
        } catch {
          savesMap.set(key, { key, nome: key.replace(SAVE_PREFIX, ''), data: 'desconhecido', ano: '?', times: 0, concluido: false, erro: true });
        }
      }
    }
  } catch(e) { console.warn('Erro listar localStorage:', e); }

  // IndexedDB
  try {
    const dbSaves = await listarSavesDB();
    for (const s of dbSaves) {
      // Só adiciona se não tiver no localStorage (prioriza localStorage)
      if (!savesMap.has(s.key)) {
        savesMap.set(s.key, s);
      }
    }
  } catch(e) { console.warn('Erro listar DB:', e); }

  const saves = Array.from(savesMap.values());
  saves.sort((a,b) => a.nome.localeCompare(b.nome));
  return saves;
}

/**
 * Tenta salvar em localStorage. Se falhar por cota, tenta IndexedDB.
 * Retorna { local: boolean, db: Promise<boolean> } pra UI saber o estado.
 */
export function salvarSave(nome: string, gameData: GameState): { ok: boolean; fallback: boolean; dbPromise: Promise<boolean> } {
  gameData._savedAt = new Date().toISOString();
  const key = SAVE_PREFIX + nome;
  const dataStr = JSON.stringify(gameData);
  // Try localStorage first
  try {
    localStorage.setItem(key, dataStr);
    return { ok: true, fallback: false, dbPromise: Promise.resolve(true) };
  } catch(e) {
    // localStorage quota exceeded - try IndexedDB (much larger)
    console.warn('localStorage cheio, salvando no IndexedDB...');
    const dbPromise = saveToDB(key, gameData).then(success => {
      if (success) {
        try { sessionStorage.setItem('use_db_' + key, '1'); } catch {}
      } else {
        console.error('Falha ao salvar no IndexedDB também');
      }
      return success;
    });
    return { ok: true, fallback: true, dbPromise };
  }
}

/**
 * Carrega save: primeiro tenta localStorage, depois IndexedDB (se tiver marcador).
 * Como IndexedDB é async, retorna o resultado e também um fallback async.
 */
export function carregarSave(nome: string): GameState | null {
  const key = SAVE_PREFIX + nome;
  // Try localStorage first
  const saved = localStorage.getItem(key);
  if (saved) {
    try {
      const data = JSON.parse(saved) as GameState;
      if (data.state && data.state.concluido === undefined) data.state.concluido = false;
      return data;
    } catch { console.warn('Erro carregar save:', nome); return null; }
  }
  return null;
}

/**
 * Tenta carregar do IndexedDB (usado quando localStorage falha).
 */
export async function carregarSaveDB(nome: string): Promise<GameState | null> {
  const key = SAVE_PREFIX + nome;
  try {
    const data = await loadFromDB(key) as GameState | null;
    if (data) {
      if (data.state && data.state.concluido === undefined) data.state.concluido = false;
      return data;
    }
  } catch { /* ignora */ }
  return null;
}

export function deletarSave(nome: string): void {
  localStorage.removeItem(SAVE_PREFIX + nome);
  // Also try to delete from DB
  deleteFromDB(SAVE_PREFIX + nome);
  sessionStorage.removeItem('use_db_' + SAVE_PREFIX + nome);
}

export function autosaveKey(): string { return SAVE_PREFIX + 'autosave'; }

export function salvarAutosave(gameData: GameState): { ok: boolean; fallback: boolean } {
  gameData._savedAt = new Date().toISOString();
  const key = autosaveKey();
  const dataStr = JSON.stringify(gameData);
  try {
    localStorage.setItem(key, dataStr);
    return { ok: true, fallback: false };
  }
  catch(e) {
    // localStorage full, try DB
    console.warn('localStorage cheio para autosave, tentando IndexedDB...');
    saveToDB(key, gameData);
    try { sessionStorage.setItem('use_db_' + key, '1'); } catch {}
    return { ok: true, fallback: true };
  }
}

export function carregarAutosave(): GameState | null {
  const key = autosaveKey();
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      const data = JSON.parse(saved) as GameState;
      if (data.state && data.state.concluido === undefined) data.state.concluido = false;
      return data;
    }
  } catch { return null; }
  return null;
}

export async function carregarAutosaveDB(): Promise<GameState | null> {
  const key = autosaveKey();
  try {
    const data = await loadFromDB(key) as GameState | null;
    if (data) {
      if (data.state && data.state.concluido === undefined) data.state.concluido = false;
      return data;
    }
  } catch {}
  return null;
}

export function exportarSaveParaArquivo(nome: string, gameData: GameState): void {
  const blob = new Blob([JSON.stringify(gameData)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'brsim_save_' + nome.replace(/[^a-zA-Z0-9]/g, '_') + '.json';
  document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
}

export function importarSaveDoArquivo(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file) { reject('Nenhum arquivo'); return; }
    if (file.size > 10*1024*1024) { reject('Arquivo muito grande! Max 10MB.'); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result as string;
        const parsed = JSON.parse(data);
        if (!parsed.year || !parsed.state || !parsed.championships) { reject('Arquivo inválido'); return; }
        resolve(data);
      } catch(err) { reject('JSON inválido: ' + (err as Error).message); }
    };
    reader.onerror = () => reject('Erro ler arquivo');
    reader.readAsText(file);
  });
}

export function importarSave(data: string, nomeSave: string): boolean {
  try { localStorage.setItem(SAVE_PREFIX + nomeSave, data); return true; } catch { return false; }
}

export async function resetarJogoDB(): Promise<void> {
  const db = await openDB();
  if (!db) return;
  try {
    // Clear logos store
    if (db.objectStoreNames.contains('logos')) {
      const tx = db.transaction('logos', 'readwrite');
      tx.objectStore('logos').clear();
    }
    // Clear saves store (only our prefix)
    if (db.objectStoreNames.contains('saves')) {
      const tx = db.transaction('saves', 'readwrite');
      const req = tx.objectStore('saves').openCursor();
      req.onsuccess = (e) => {
        const cursor = (e.target as IDBRequest).result;
        if (cursor) {
          if (typeof cursor.key === 'string' && cursor.key.startsWith(SAVE_PREFIX)) {
            cursor.delete();
          }
          cursor.continue();
        }
      };
    }
  } catch(e) { console.warn('Erro resetar DB:', e); }
}

export function resetarJogo(): void {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(SAVE_PREFIX)) keys.push(k);
    }
    keys.forEach(k => localStorage.removeItem(k));
    // Also clear sessionStorage markers
    const sessKeys: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      if (k && k.startsWith('use_db_' + SAVE_PREFIX)) sessKeys.push(k);
    }
    sessKeys.forEach(k => sessionStorage.removeItem(k));
    // Also try async DB cleanup
    resetarJogoDB();
  } catch {}
}

// ============================================================================
// Funções para armazenar temporadas completas (championship_years) no IndexedDB
// Separando cada ano em uma chave individual, evitando acumular tudo em memória.
// ============================================================================

const CHAMP_PREFIX = 'brsim_champ_';

/**
 * Salva um EstadoTemporada de um ano específico no IndexedDB.
 * @param ano - O ano da temporada
 * @param serie - 'A', 'B', ou 'C'
 * @param estado - O EstadoTemporada completo
 */
export async function salvarAnoSimuladoDB(ano: number, serie: string, estado: unknown): Promise<boolean> {
  const chave = `${CHAMP_PREFIX}${serie}_${ano}`;
  const db = await openDB();
  if (!db) return false;
  try {
    const tx = db.transaction('championship_years', 'readwrite');
    tx.objectStore('championship_years').put({
      chave,
      ano,
      serie,
      estado,
      updatedAt: new Date().toISOString(),
    });
    return new Promise((resolve) => {
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

/**
 * Carrega um EstadoTemporada de um ano específico do IndexedDB.
 */
export async function carregarAnoSimuladoDB(ano: number, serie: string): Promise<unknown | null> {
  const chave = `${CHAMP_PREFIX}${serie}_${ano}`;
  const db = await openDB();
  if (!db) return null;
  try {
    const tx = db.transaction('championship_years', 'readonly');
    const req = tx.objectStore('championship_years').get(chave);
    return new Promise((resolve) => {
      req.onsuccess = () => resolve(req.result?.estado ?? null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

/**
 * Retorna a lista de todos os anos disponíveis no IndexedDB para uma série.
 */
export async function listarAnosSimuladosDB(serie: string): Promise<number[]> {
  const db = await openDB();
  if (!db) return [];
  const prefix = `${CHAMP_PREFIX}${serie}_`;
  try {
    const tx = db.transaction('championship_years', 'readonly');
    const req = tx.objectStore('championship_years').getAllKeys();
    return new Promise((resolve) => {
      req.onsuccess = () => {
        const keys = (req.result as string[]) || [];
        const anos = keys
          .filter(k => k.startsWith(prefix))
          .map(k => parseInt(k.replace(prefix, '')))
          .filter(a => !isNaN(a))
          .sort((a, b) => a - b);
        resolve(anos);
      };
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

/**
 * Remove todos os anos simulados de uma série (útil para reset).
 */
export async function removerAnosSimuladosDB(): Promise<void> {
  const db = await openDB();
  if (!db) return;
  try {
    const tx = db.transaction('championship_years', 'readwrite');
    const req = tx.objectStore('championship_years').clear();
    return new Promise((resolve) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    // ignora
  }
}

/**
 * Remove um ano específico do IndexedDB.
 */
export async function removerAnoSimuladoDB(ano: number, serie: string): Promise<boolean> {
  const chave = `${CHAMP_PREFIX}${serie}_${ano}`;
  const db = await openDB();
  if (!db) return false;
  try {
    const tx = db.transaction('championship_years', 'readwrite');
    tx.objectStore('championship_years').delete(chave);
    return new Promise((resolve) => {
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}


/**
 * Carrega todos os anos do IndexedDB e combina com os que estão em memória
 * para computar estatísticas globais (artilharia e assistências).
 * Isso evita precisar ter todos os anos carregados em memória ao mesmo tempo.
 */
export async function carregarEstatisticasGlobais(game: GameState): Promise<EstatisticasTemporada> {
  const artilheiros: Record<string, { nome: string; time: string; gols: number; golsHistorico: number; id?: number }> = {};
  const assistencias: Record<string, { nome: string; time: string; assists: number; assistsHistorico: number; id?: number }> = {};

  // 1) Processar anos em memória
  for (const anoStr of Object.keys(game.championships)) {
    const s = game.championships[anoStr];
    if (!s?.times) continue;
    for (const nome in s.times) {
      const t = s.times[nome];
      for (const j of t.jogadores) {
        if (j.gols > 0) {
          if (!artilheiros[j.nome]) artilheiros[j.nome] = { nome: j.nome, time: nome, gols: 0, golsHistorico: 0, id: j.id };
          artilheiros[j.nome].gols += j.gols;
          artilheiros[j.nome].golsHistorico += j.gols;
        }
        if (j.assistencias > 0) {
          if (!assistencias[j.nome]) assistencias[j.nome] = { nome: j.nome, time: nome, assists: 0, assistsHistorico: 0, id: j.id };
          assistencias[j.nome].assists += j.assistencias;
          assistencias[j.nome].assistsHistorico += j.assistencias;
        }
      }
    }
  }

  // 2) Processar anos do IndexedDB (série A)
  try {
    const anos = await listarAnosSimuladosDB('A');
    for (const ano of anos) {
      const anoStr = String(ano);
      // Pular anos já em memória
      if (game.championships[anoStr]) continue;
      const estado = await carregarAnoSimuladoDB(ano, 'A') as any;
      if (!estado?.times) continue;
      for (const nome in estado.times) {
        const t = estado.times[nome];
        for (const j of t.jogadores) {
          if (j.gols > 0) {
            if (!artilheiros[j.nome]) artilheiros[j.nome] = { nome: j.nome, time: nome, gols: 0, golsHistorico: 0, id: j.id };
            artilheiros[j.nome].gols += j.gols;
            artilheiros[j.nome].golsHistorico += j.gols;
          }
          if (j.assistencias > 0) {
            if (!assistencias[j.nome]) assistencias[j.nome] = { nome: j.nome, time: nome, assists: 0, assistsHistorico: 0, id: j.id };
            assistencias[j.nome].assists += j.assistencias;
            assistencias[j.nome].assistsHistorico += j.assistencias;
          }
        }
      }
    }
  } catch(e) {
    console.warn('Erro ao carregar estatísticas do DB:', e);
  }

  return {
    artilheiros: Object.values(artilheiros).sort((a, b) => b.gols - a.gols),
    assistencias: Object.values(assistencias).sort((a, b) => b.assists - a.assists),
  };
}
