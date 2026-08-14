const STORAGE_KEY = 'memoryGame_quests_v1';
const DAILY_POOL = [
  { id: 'matches', titleKey: 'questMatches', event: 'match', target: 8, reward: 25 },
  { id: 'streak', titleKey: 'questStreak', event: 'streak', target: 3, reward: 35 },
  { id: 'speed', titleKey: 'questSpeed', event: 'fastWin', target: 1, reward: 50 },
  { id: 'perfect', titleKey: 'questPerfect', event: 'perfectWin', target: 1, reward: 60 }
];
const WEEKLY_POOL = [
  { id: 'wins', titleKey: 'questWins', event: 'win', target: 5, reward: 100 },
  { id: 'weeklyMatches', titleKey: 'questWeeklyMatches', event: 'match', target: 30, reward: 120 }
];
const storage = () => (typeof localStorage === 'undefined' ? null : localStorage);
const dayKey = (date = new Date()) => date.toISOString().slice(0, 10);
const weekKey = (date = new Date()) => `${date.getUTCFullYear()}-W${Math.ceil((((date - new Date(Date.UTC(date.getUTCFullYear(), 0, 1))) / 86400000) + 1) / 7)}`;
const hash = value => [...value].reduce((total, char) => ((total * 31) + char.charCodeAt(0)) >>> 0, 7);

class QuestManager {
  load() {
    try { return JSON.parse(storage()?.getItem(STORAGE_KEY)) || { stars: 0, progress: {} }; }
    catch { return { stars: 0, progress: {} }; }
  }
  save(data) { storage()?.setItem(STORAGE_KEY, JSON.stringify(data)); }
  getActiveQuests(date = new Date()) {
    const day = dayKey(date); const week = weekKey(date); const start = hash(day) % DAILY_POOL.length;
    return [DAILY_POOL[start], DAILY_POOL[(start + 1) % DAILY_POOL.length]].map(q => ({ ...q, key: `daily:${day}:${q.id}`, cadence: 'daily' }))
      .concat({ ...WEEKLY_POOL[hash(week) % WEEKLY_POOL.length], key: `weekly:${week}:${WEEKLY_POOL[hash(week) % WEEKLY_POOL.length].id}`, cadence: 'weekly' });
  }
  getSnapshot(date = new Date()) {
    const data = this.load();
    return { stars: data.stars, quests: this.getActiveQuests(date).map(q => ({ ...q, progress: Math.min(q.target, data.progress[q.key]?.value || 0), completed: Boolean(data.progress[q.key]?.completed) })) };
  }
  record(event, amount = 1, date = new Date()) {
    const data = this.load(); const unlocked = [];
    this.getActiveQuests(date).filter(q => q.event === event).forEach(q => {
      const current = data.progress[q.key] || { value: 0, completed: false };
      current.value = Math.min(q.target, current.value + amount);
      if (!current.completed && current.value >= q.target) { current.completed = true; data.stars += q.reward; unlocked.push(q); }
      data.progress[q.key] = current;
    });
    this.save(data); return { ...this.getSnapshot(date), unlocked };
  }
}
export default new QuestManager();
