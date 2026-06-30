import { EstadoTemporada } from '../../types';
import { simularPartida, aplicarResultado, distribuirGols } from '../../utils/gameLogic';
export function handleSimularJogo(state:EstadoTemporada,ri:number,ji:number){
  if(state.concluido)return;const jogo=state.jogos[ri]?.[ji];if(!jogo||jogo.resultado!==null)return;
  const tc=state.times[jogo.casa],tf=state.times[jogo.fora];
  const r=simularPartida(tc,tf,tc.jogadores,tf.jogadores);aplicarResultado(state,ri,ji,r.golsCasa,r.golsFora,r.golsInfo);
}
export function handleConfirmarJogo(state:EstadoTemporada,ri:number,ji:number,gc:number,gf:number){
  if(state.concluido)return;const jogo=state.jogos[ri]?.[ji];if(!jogo||jogo.resultado!==null)return;
  const gi=distribuirGols(state.times[jogo.casa].jogadores,state.times[jogo.fora].jogadores,gc,gf);
  aplicarResultado(state,ri,ji,gc,gf,gi);
}
