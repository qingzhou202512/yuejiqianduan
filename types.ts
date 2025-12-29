export interface JournalEntry {
  id: string;
  date: string; // ISO String
  timestamp: number;
  
  // The 3 Achievements (成就感)
  achievements: string[];
  
  // The 3 Happy/Grateful things (幸福感)
  happiness: string[];
  
  // Energy drainers (消耗感)
  drainerLevel: 'none' | 'low' | 'high';
  drainerNote?: string;
  
  // Today's MIT (今天最重要的一件事)
  todayMitDescription: string;
  mitCompleted: boolean;
  mitReason?: string; // If not completed
  
  // Tomorrow's MIT (明天最重要的一件事)
  tomorrowMit: string;
  
  // AI Generated insight
  aiInsight?: string;
  aiMood?: 'positive' | 'neutral' | 'needs-care';
}

export enum ViewState {
  HOME = 'HOME',
  JOURNAL = 'JOURNAL',
  MEDITATION = 'MEDITATION',
  HISTORY = 'HISTORY',
}

export interface MeditationConfig {
  duration: number; // in seconds
  soundType: 'rain' | 'wind' | 'white';
}