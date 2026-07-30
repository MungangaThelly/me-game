import { memo } from 'react';

export const ThemePreviewModal = memo(function ThemePreviewModal({
  difficulty,
  emojis,
  onClose,
  t
}) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="theme-preview-modal" onClick={(event) => event.stopPropagation()}>
        <h3>{t('themePreview')}</h3>
        <div className="theme-preview-grid">
          {emojis.slice(0, difficulty * 5).map((emoji, index) => (
            <div key={`${emoji}-${index}`} className="preview-emoji">{emoji}</div>
          ))}
        </div>
        <button onClick={onClose}>{t('close')}</button>
      </div>
    </div>
  );
});

export const MultiplayerScoreboard = memo(function MultiplayerScoreboard({
  currentPlayer,
  players
}) {
  return (
    <div className="scoreboard">
      {players.map((player, index) => (
        <div
          key={player.id}
          className={`player ${index === currentPlayer ? 'active' : ''}`}
        >
          <span>{player.name}</span>
          <span>{player.score}</span>
        </div>
      ))}
    </div>
  );
});
