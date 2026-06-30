import { getTimeColors } from '../../data/initialData';
import { getLogoUrl } from '../../utils/storage';
export function TimeLogo({ nome, size = 'mini' }: { nome: string; size?: 'mini' | 'normal' | 'large' }) {
  const cores = getTimeColors(nome);
  const logoUrl = getLogoUrl(nome);
  const px = { mini: 18, normal: 48, large: 64 }[size];
  if (logoUrl) return <img src={logoUrl} style={{width:px,height:px,borderRadius:'50%',objectFit:'cover',display:'inline-block',verticalAlign:'middle'}} alt={nome} />;
  const initials = size === 'mini' ? nome.substring(0,2).toUpperCase() : nome.split(' ').map(w=>w[0]).join('').substring(0,3).toUpperCase();
  return <span style={{background:cores[0],color:cores[1],width:px,height:px,display:'inline-flex',alignItems:'center',justifyContent:'center',borderRadius:'50%',fontWeight:700,fontSize:size==='mini'?'0.55rem':'0.7rem',verticalAlign:'middle',flexShrink:0}}>{initials}</span>;
}
