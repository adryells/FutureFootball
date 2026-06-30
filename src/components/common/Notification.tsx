import { useGame } from '../../store/GameContext';
export function Notification() {
  const { state } = useGame();
  if (!state.notification) return null;
  return <div className={'notification notification-'+state.notification.type}>{state.notification.message}</div>;
}
