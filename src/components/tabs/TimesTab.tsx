import { useState, useCallback } from 'react';
import { useGame } from '../../store/GameContext';
import { Jogador } from '../../types';
import { FORMACOES, POSICAO_CORES, LINHA_CAMPOS, getTimeColors } from '../../data/initialData';
import { getLogoUrl } from '../../utils/storage';
import { calcularForcaTime, getMediaJogador } from '../../utils/gameLogic';
import { EditJogadorModal } from '../modals/EditJogadorModal';
import './TimesTab.css';

export function TimesTab() {
  const { state, dispatch } = useGame();
  const s = state.game.state;
  if (!s) return null;
  const timesList = Object.keys(s.times).sort();
  const [selectedTime, setSelectedTime] = useState(timesList[0] || '');
  const time = selectedTime ? s.times[selectedTime] : null;

  return (
    <section className="tab-content active">
      <div className="tab-header"><h2>Times</h2>
        <select id="time-select" value={selectedTime} onChange={e => setSelectedTime(e.target.value)}>
          {timesList.map(n => (
            <option key={n} value={n}>
              {(getLogoUrl(n) ? '🖼 ' : '') + n}
            </option>
          ))}
        </select>
      </div>
      {time && (
        <div id="time-detail">
          <TimeInfo time={time} />
          <Campo time={time} />
          <JogadoresTable time={time} />
        </div>
      )}
    </section>
  );
}

function TimeInfo({time}:{time:any}){
  const cores = getTimeColors(time.nome);
  const logoUrl = getLogoUrl(time.nome);
  return (
    <div id="time-info">
      <div className="time-logo" style={{border:'2px solid var(--border)',borderRadius:'50%',overflow:'hidden'}}>
        {logoUrl ? <img src={logoUrl} style={{width:'100%',height:'100%',borderRadius:'50%',objectFit:'cover'}} alt={time.nome} />
        : <span style={{background:`linear-gradient(135deg,${cores[0]},${cores[1]})`,color:'#fff',width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',borderRadius:'50%',fontWeight:700,fontSize:'0.55rem',textAlign:'center',padding:2}}>{time.nome.split(' ').map((w:any)=>w[0]).join('').substring(0,3).toUpperCase()}</span>}
      </div>
      <div id="time-text-info">
        <h3 id="time-nome">{time.nome}</h3>
        {logoUrl && <span style={{fontSize:'0.6rem',background:'var(--accent)',color:'#000',padding:'1px 6px',borderRadius:4,display:'inline-block',marginBottom:2}}>Logo personalizada</span>}
        <p id="time-forca">Força: <span>{time.forca}</span></p>
        <p id="time-formacao">Formação: <span>{time.formacao||'N/A'}</span></p>
      </div>
    </div>
  );
}

function Campo({time}:{time:any}){
  const f = FORMACOES[time.formacao] || FORMACOES['4-3-3'];
  const pos = f.posicoes;
  const ordem: ('gol'|'def'|'mei'|'atk')[] = ['gol','def','mei','atk'];

  // Consome jogadores da lista conforme as posicoes da formacao,
  // para que cada jogador ocupe exatamente um slot (evita repetidos/ausentes).
  const disponiveis = [...time.jogadores];

  function consumirJogador(posicao: string): { jogador: any; idx: number } | null {
    const idx = disponiveis.findIndex((x: any) => x.posicao === posicao);
    if (idx === -1) return null;
    const jogador = disponiveis.splice(idx, 1)[0];
    const idxOriginal = time.jogadores.indexOf(jogador);
    return { jogador, idx: idxOriginal >= 0 ? idxOriginal : 0 };
  }

  return (
    <div id="time-campo-container">
      <div id="time-campo">
        <div id="campo-titular">
          {ordem.map(key => {
            const l = LINHA_CAMPOS[key];
            const ps = pos.filter((p) => l.pos.includes(p));
            if (ps.length === 0) return null;
            return (
              <div key={key} className="campo-linha">
                {ps.map(p => {
                  const result = consumirJogador(p);
                  if (!result) return null;
                  const j = result.jogador;
                  const idx = result.idx;
                  return (
                    <div key={p + '-' + idx} className="campo-jogador" title={j.nome + ' (' + j.posicao + ', OVR:' + j.overall + ')'}>
                      <div className="campo-jogador-num" style={{ background: l.cor }}>{idx + 1}</div>
                      <div className="campo-jogador-pos">{j.nome.split(' ')[0].substring(0, 6)}</div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function JogadoresTable({time}:{time:any}){
  const {state,dispatch}=useGame();
  const sort=state.jogadoresSort;
  const s=state.game.state;
  const [editJogador, setEditJogador] = useState<{ jogador: Jogador; idx: number } | null>(null);

  let jogs=[...time.jogadores];
  jogs.sort((a:any,b:any)=>{
    let va:any,vb:any;
    switch(sort.col){
      case'num':return (sort.asc?1:-1)*(time.jogadores.indexOf(a)-time.jogadores.indexOf(b));
      case'nome':return sort.asc?a.nome.localeCompare(b.nome):b.nome.localeCompare(a.nome);
      case'posicao':return sort.asc?a.posicao.localeCompare(b.posicao):b.posicao.localeCompare(a.posicao);
      case'idade':va=a.idade;vb=b.idade;break;
      case'overall':va=a.overall;vb=b.overall;break;
      case'altura':va=parseInt(a.altura);vb=parseInt(b.altura);break;
      case'peso':va=parseInt(a.peso);vb=parseInt(b.peso);break;
      case'gols':va=a.gols||0;vb=b.gols||0;break;
      case'assistencias':va=a.assistencias||0;vb=b.assistencias||0;break;
      case'golsHist':va=a.golsHistorico||0;vb=b.golsHistorico||0;break;
      case'media':va=getMediaJogador(a).temporada;vb=getMediaJogador(b).temporada;break;
      case'mediaCarreira':va=getMediaJogador(a).carreira;vb=getMediaJogador(b).carreira;break;
      case'assistsHist':va=a.assistenciasHistorico||0;vb=b.assistenciasHistorico||0;break;
      default:va=0;vb=0;
    }
    return sort.asc?va-vb:vb-va;
  });

  function handleSort(col:string){
    if(sort.col===col) dispatch({type:'SET_JOGADORES_SORT',payload:{col:col as any,asc:!sort.asc}});
    else dispatch({type:'SET_JOGADORES_SORT',payload:{col:col as any,asc:true}});
  }

  function handleOpenEdit(jogador: Jogador, idx: number) {
    setEditJogador({ jogador: { ...jogador }, idx });
  }

  function handleEditSave(jogadorAtualizado: Jogador) {
    if (!editJogador || !s) return;
    const idxH = time.jogadores.indexOf(time.jogadores[editJogador.idx]);
    if (idxH === -1) return;
    time.jogadores[idxH] = jogadorAtualizado;
    time.forca = calcularForcaTime(time.jogadores);
    dispatch({ type: 'UPDATE_STATE', payload: JSON.parse(JSON.stringify(s)) });
    setEditJogador(null);
  }

  return (
    <>
      <div className="table-wrapper" style={{marginTop:10}}>
        <table><thead><tr>
          <th onClick={()=>handleSort('num')} className="sortable">#</th>
          <th onClick={()=>handleSort('nome')} className="sortable">Nome ↕</th>
          <th onClick={()=>handleSort('posicao')} className="sortable">Pos ↕</th>
          <th onClick={()=>handleSort('idade')} className="sortable">Id ↕</th>
          <th onClick={()=>handleSort('overall')} className="sortable">OVR ↕</th>
          <th onClick={()=>handleSort('altura')} className="sortable">Alt ↕</th>
          <th onClick={()=>handleSort('peso')} className="sortable">Peso ↕</th>
          <th onClick={()=>handleSort('media')} className="sortable">Média ↕</th>
          <th onClick={()=>handleSort('mediaCarreira')} className="sortable">Média Car. ↕</th>
          <th onClick={()=>handleSort('gols')} className="sortable">G ↕</th>
          <th onClick={()=>handleSort('assistencias')} className="sortable">A ↕</th>
          <th onClick={()=>handleSort('golsHist')} className="sortable">G(total) ↕</th>
          <th onClick={()=>handleSort('assistsHist')} className="sortable">A(total) ↕</th>
        </tr></thead>
        <tbody>{jogs.map((j:any,idx:number)=>{const jogIdx=time.jogadores.indexOf(j);const med=getMediaJogador(j);return(
          <tr key={j.nome+idx}>
            <td>{jogIdx+1}</td>
            <td><span className="editable-cell" onClick={()=>handleOpenEdit(j, jogIdx)}>{j.nome}</span></td>
            <td><span className="pos-badge" style={{background:POSICAO_CORES[j.posicao]||'#888'}}>{j.posicao}</span></td>
            <td><span className="editable-cell" onClick={()=>handleOpenEdit(j, jogIdx)}>{j.idade}</span></td>
            <td><span className="editable-cell" onClick={()=>handleOpenEdit(j, jogIdx)}><strong>{j.overall}</strong></span></td>
            <td><span className="editable-cell" onClick={()=>handleOpenEdit(j, jogIdx)}>{j.altura||'-'}</span></td>
            <td><span className="editable-cell" onClick={()=>handleOpenEdit(j, jogIdx)}>{j.peso||'-'}</span></td>
            <td>{med.temporada > 0 ? med.temporada.toFixed(1) : '-'}</td>
            <td>{med.carreira > 0 ? med.carreira.toFixed(1) : '-'}</td>
            <td>{j.gols}</td>
            <td>{j.assistencias}</td>
            <td>{j.golsHistorico||0}</td>
            <td>{j.assistenciasHistorico||0}</td>
          </tr>
        );})}</tbody></table>
      </div>
      {editJogador && (
        <EditJogadorModal
          jogador={editJogador.jogador}
          isOpen={true}
          onClose={() => setEditJogador(null)}
          onSave={handleEditSave}
        />
      )}
    </>
  );
}
