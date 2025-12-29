import { JournalEntry } from '../types';

const STORAGE_KEY = 'innerflow_entries';

export const saveEntry = (entry: JournalEntry): void => {
  const existing = getEntries();
  const filtered = existing.filter(e => e.id !== entry.id);
  const updated = [entry, ...filtered];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};

export const getEntries = (): JournalEntry[] => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    // Sort by date descending
    return parsed.sort((a: JournalEntry, b: JournalEntry) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  } catch (e) {
    console.error("Failed to parse entries", e);
    return [];
  }
};

/**
 * Checks if an entry is considered "valid" for display.
 * An entry is valid if it contains actual reflections (achievements, happiness, drainers)
 * OR if a task has been marked as completed.
 * An entry with ONLY an incomplete MIT (likely carried over) is considered invalid/hidden.
 */
export const isValidEntry = (entry: JournalEntry): boolean => {
    if (!entry) return false;
    
    const hasAchievements = entry.achievements && entry.achievements.some(a => a && a.trim().length > 0);
    const hasHappiness = entry.happiness && entry.happiness.some(h => h && h.trim().length > 0);
    const hasDrainer = entry.drainerLevel !== 'none';
    // If MIT is completed, it's a valid record. If incomplete, it doesn't count on its own.
    const isMitCompleted = entry.mitCompleted === true;

    return hasAchievements || hasHappiness || hasDrainer || isMitCompleted;
};

export const getTodayEntry = (): JournalEntry | undefined => {
  const entries = getEntries();
  const today = new Date().toISOString().split('T')[0];
  return entries.find(e => e.date.startsWith(today));
};

export const getYesterdayEntry = (): JournalEntry | undefined => {
  const entries = getEntries();
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const dateStr = yesterday.toISOString().split('T')[0];
  return entries.find(e => e.date.startsWith(dateStr));
};

export const getRecordedDaysCount = (): number => {
  const entries = getEntries();
  // Filter out invalid entries before counting
  const validEntries = entries.filter(isValidEntry);
  const uniqueDays = new Set(validEntries.map(e => e.date.split('T')[0]));
  return uniqueDays.size;
};

// --- Mock Data Generator ---
export const generateMockData = (): void => {
  if (getEntries().length > 0) return; // Only generate if empty

  const entries: JournalEntry[] = [];
  const today = new Date();
  
  // Create about 18 entries spread over the last 25 days
  for (let i = 0; i < 25; i++) {
    // Skip some days to make it realistic
    if (Math.random() > 0.7 && i !== 0) continue; 

    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString();

    const isDone = Math.random() > 0.3;
    const hasDrainer = Math.random() > 0.6;
    const drainerLevel = hasDrainer ? (Math.random() > 0.5 ? 'high' : 'low') : 'none';

    // Make some entries have long text to test UI truncation
    const longTextAchievement = `完成了第 ${i+1} 个小目标，虽然过程很曲折，中间还因为技术问题卡了很久，但最终还是坚持下来搞定了，这种突破自我的感觉真好。`;
    const longTextHappiness = '喝了一杯好喝的咖啡，这不仅仅是咖啡，更是在忙碌一下午后难得的喘息时间，看着窗外的落日觉得生活其实充满了这些微小而美好的瞬间。';
    const longTextMit = i === 0 
      ? '完成悦己手账的开发，包括前端UI的细节打磨、交互体验的优化以及后端数据存储的逻辑完善，确保每一个像素都完美呈现。' 
      : `完成第 ${i} 天的核心任务，并对整个项目进度进行了复盘和调整`;

    const entry: JournalEntry = {
      id: crypto.randomUUID(),
      date: dateStr,
      timestamp: date.getTime(),
      achievements: [
        longTextAchievement,
        Math.random() > 0.5 ? '读了30分钟书，特别是关于认知心理学的那一章，让我对情绪管理有了全新的理解，感觉受益匪浅。' : '',
        Math.random() > 0.5 ? '早睡早起，保持了良好的作息习惯' : ''
      ].filter(Boolean),
      happiness: [
        longTextHappiness,
        Math.random() > 0.5 ? '看见了晚霞，粉紫色的天空超级治愈' : '',
        '和朋友聊得很开心'
      ].filter(Boolean),
      drainerLevel: drainerLevel as any,
      drainerNote: hasDrainer && Math.random() > 0.5 ? '开了一个很长的会，感觉被掏空。会议内容虽然重要，但持续的高强度讨论确实让人感到精力耗尽。' : '',
      todayMitDescription: longTextMit,
      mitCompleted: isDone,
      mitReason: !isDone ? '突发事情太多，时间不够用，导致计划被打乱' : '',
      tomorrowMit: '继续优化产品体验，关注用户反馈',
      aiMood: isDone ? 'positive' : 'neutral',
      aiInsight: '生活就是起起伏伏，保持节奏最重要。'
    };
    entries.push(entry);
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
};