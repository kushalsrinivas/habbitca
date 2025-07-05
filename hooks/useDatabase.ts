import { useSQLiteContext } from 'expo-sqlite';

// Simple event emitter for database changes
class DatabaseEventEmitter {
  private listeners: { [key: string]: (() => void)[] } = {};

  on(event: string, callback: () => void) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  off(event: string, callback: () => void) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  }

  emit(event: string) {
    if (!this.listeners[event]) return;
    for (const callback of this.listeners[event]) {
      callback();
    }
  }
}

// Global event emitter instance
const dbEventEmitter = new DatabaseEventEmitter();

export interface Habit {
  id: number;
  title: string;
  description: string;
  emoji: string;
  category: string;
  frequency: 'daily';
  time: string; // HH:MM format
  created_at: string;
  is_active: boolean;
  track_time: boolean; // NEW: whether time tracking is enabled for this habit
}

export interface HabitLog {
  id: number;
  habit_id: number;
  date: string; // YYYY-MM-DD format
  completed: boolean;
  xp_earned: number;
  time_spent: number; // NEW: total seconds spent on this habit for the given date
}

// NEW: individual timer session records (multiple per day)
export interface HabitSession {
  id: number;
  habit_id: number;
  date: string; // YYYY-MM-DD
  start_time: string; // ISO timestamp
  end_time: string | null;
  duration: number; // seconds
  intensity: number; // 1-5 scale
  notes: string; // session notes
}

export interface UserStats {
  id: number;
  level: number;
  xp: number;
  total_streaks: number;
  longest_streak: number;
  achievements: string; // JSON string for future use
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  type: 'bronze' | 'silver' | 'gold' | 'platinum';
  requirement: {
    type: 'streak' | 'habits_completed' | 'level' | 'consistency' | 'total_xp' | 'habits_per_day' | 'streak_start' | 'total_habits_created' | 'habit_notes' | 'streak_recovery' | 'weekend_complete' | 'night_habits' | 'consistency_period' | 'active_habits_duration' | 'no_zero_days' | 'time_based_habits' | 'gold_achievements' | 'monthly_perfect' | 'streak_comeback' | 'mega_streak' | 'zen_mode' | 'habit_edits' | 'habit_revival' | 'social_share' | 'special_date' | 'weather_based';
    value: number;
    timeframe?: 'day' | 'week' | 'month' | 'all_time' | 'weekend' | 'period';
  };
  xp_reward: number;
  unlocked_at?: string;
  is_unlocked: boolean;
}

export interface UserAchievement {
  id: number;
  achievement_id: string;
  unlocked_at: string;
  xp_earned: number;
}

export interface LevelUpData {
  newLevel: number;
  previousLevel: number;
  xpGained: number;
  totalXP: number;
  levelTitle: string;
  levelRewards: string[];
}

export interface ActivityDataPoint {
  date: string;
  value: number;
  label: string;
}

export const useDatabase = () => {
  const db = useSQLiteContext();

  const initializeDatabase = async () => {
    try {
      // Create habits table
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS habits (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          description TEXT,
          emoji TEXT DEFAULT '⭐',
          category TEXT DEFAULT 'Other / Custom',
          frequency TEXT DEFAULT 'daily',
          time TEXT NOT NULL,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          is_active BOOLEAN DEFAULT 1,
          track_time BOOLEAN DEFAULT 0
        );
      `);

      // Add emoji and category columns if they don't exist (for existing databases)
      await db.execAsync(`
        ALTER TABLE habits ADD COLUMN emoji TEXT DEFAULT '⭐';
      `).catch(() => {}); // Ignore error if column already exists
      
      await db.execAsync(`
        ALTER TABLE habits ADD COLUMN category TEXT DEFAULT 'Other / Custom';
      `).catch(() => {}); // Ignore error if column already exists

      await db.execAsync(`
        ALTER TABLE habits ADD COLUMN track_time BOOLEAN DEFAULT 0;
      `).catch(() => {}); // Ignore error if column already exists

      await db.execAsync(`
        ALTER TABLE habit_logs ADD COLUMN time_spent INTEGER DEFAULT 0;
      `).catch(() => {}); // Ignore error if column already exists

      // Create habit_sessions table for multiple sessions per day
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS habit_sessions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          habit_id INTEGER NOT NULL,
          date TEXT NOT NULL,
          start_time TEXT NOT NULL,
          end_time TEXT,
          duration INTEGER DEFAULT 0,
          intensity INTEGER DEFAULT 3,
          notes TEXT DEFAULT '',
          FOREIGN KEY (habit_id) REFERENCES habits (id)
        );
      `);

      // Add new columns to existing habit_sessions table if they don't exist
      await db.execAsync(`
        ALTER TABLE habit_sessions ADD COLUMN intensity INTEGER DEFAULT 3;
      `).catch(() => {}); // Ignore error if column already exists
      
      await db.execAsync(`
        ALTER TABLE habit_sessions ADD COLUMN notes TEXT DEFAULT '';
      `).catch(() => {}); // Ignore error if column already exists

      // Create habit_logs table
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS habit_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          habit_id INTEGER NOT NULL,
          date TEXT NOT NULL,
          completed BOOLEAN DEFAULT 0,
          xp_earned INTEGER DEFAULT 0,
          time_spent INTEGER DEFAULT 0,
          FOREIGN KEY (habit_id) REFERENCES habits (id),
          UNIQUE(habit_id, date)
        );
      `);

      // Create user_stats table
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS user_stats (
          id INTEGER PRIMARY KEY,
          level INTEGER DEFAULT 1,
          xp INTEGER DEFAULT 0,
          total_streaks INTEGER DEFAULT 0,
          longest_streak INTEGER DEFAULT 0,
          achievements TEXT DEFAULT '{}'
        );
      `);

      // Create achievements table
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS achievements (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          icon TEXT NOT NULL,
          type TEXT NOT NULL,
          requirement_type TEXT NOT NULL,
          requirement_value INTEGER NOT NULL,
          requirement_timeframe TEXT,
          xp_reward INTEGER NOT NULL,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Create user_achievements table
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS user_achievements (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          achievement_id TEXT NOT NULL,
          unlocked_at TEXT DEFAULT CURRENT_TIMESTAMP,
          xp_earned INTEGER NOT NULL,
          FOREIGN KEY (achievement_id) REFERENCES achievements (id),
          UNIQUE(achievement_id)
        );
      `);

      // Initialize user stats if not exists
      await db.execAsync(`
        INSERT OR IGNORE INTO user_stats (id, level, xp, total_streaks, longest_streak, achievements)
        VALUES (1, 1, 0, 0, 0, '{}');
      `);

      // Initialize default achievements
      await initializeDefaultAchievements();

      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Database initialization error:', error);
    }
  };

  // Habit operations
  type HabitInput = Omit<Habit, 'id' | 'created_at' | 'is_active'> & { track_time?: boolean };

  const addHabit = async (habit: HabitInput) => {
    try {
      const result = await db.runAsync(
        'INSERT INTO habits (title, description, emoji, category, frequency, time, track_time) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [habit.title, habit.description, habit.emoji, habit.category, habit.frequency, habit.time, habit.track_time ? 1 : 0]
      );
      
      // Emit event to notify all screens of data change
      dbEventEmitter.emit('habitDataChanged');
      
      return result.lastInsertRowId;
    } catch (error) {
      console.error('Error adding habit:', error);
      throw error;
    }
  };

  const getHabits = async (): Promise<Habit[]> => {
    try {
      const result = await db.getAllAsync('SELECT * FROM habits WHERE is_active = 1 ORDER BY created_at DESC');
      return result as Habit[];
    } catch (error) {
      console.error('Error fetching habits:', error);
      return [];
    }
  };

  const updateHabit = async (habitId: number, habit: HabitInput) => {
    try {
      await db.runAsync(
        'UPDATE habits SET title = ?, description = ?, emoji = ?, category = ?, frequency = ?, time = ?, track_time = ? WHERE id = ?',
        [habit.title, habit.description, habit.emoji, habit.category, habit.frequency, habit.time, habit.track_time ? 1 : 0, habitId]
      );
      
      // Emit event to notify all screens of data change
      dbEventEmitter.emit('habitDataChanged');
    } catch (error) {
      console.error('Error updating habit:', error);
      throw error;
    }
  };

  const deleteHabit = async (habitId: number) => {
    try {
      await db.runAsync('UPDATE habits SET is_active = 0 WHERE id = ?', [habitId]);
      
      // Emit event to notify all screens of data change
      dbEventEmitter.emit('habitDataChanged');
    } catch (error) {
      console.error('Error deleting habit:', error);
      throw error;
    }
  };

  // Habit log operations
  const completeHabit = async (habitId: number, date: string): Promise<{ xpEarned: number; levelUpData?: LevelUpData }> => {
    try {
      // Calculate XP based on streak
      const streak = await getHabitStreak(habitId, date);
      const baseXP = 10;
      const streakBonus = Math.floor(streak / 7) * 5; // 5 bonus XP for every 7-day streak
      const xpEarned = baseXP + streakBonus;

      // Preserve any existing time_spent value
      const existing = await db.getFirstAsync(
        'SELECT time_spent FROM habit_logs WHERE habit_id = ? AND date = ?',
        [habitId, date]
      ) as { time_spent: number } | null;

      const currentTimeSpent = existing?.time_spent ?? 0;

      await db.runAsync(
        'INSERT OR REPLACE INTO habit_logs (habit_id, date, completed, xp_earned, time_spent) VALUES (?, ?, 1, ?, ?)',
        [habitId, date, xpEarned, currentTimeSpent]
      );

      // Update user stats and check for level up
      const levelUpResult = await updateUserXP(xpEarned);
      
      // Check for new achievements
      await checkAndUnlockAchievements();
      
      // Emit event to notify all screens of data change
      dbEventEmitter.emit('habitDataChanged');
      
      return {
        xpEarned,
        levelUpData: levelUpResult.leveledUp ? levelUpResult.levelUpData : undefined
      };
    } catch (error) {
      console.error('Error completing habit:', error);
      throw error;
    }
  };

  const uncompleteHabit = async (habitId: number, date: string) => {
    try {
      const log = await db.getFirstAsync(
        'SELECT xp_earned FROM habit_logs WHERE habit_id = ? AND date = ?',
        [habitId, date]
      ) as { xp_earned: number } | null;

      if (log) {
        await db.runAsync(
          'UPDATE habit_logs SET completed = 0, xp_earned = 0 WHERE habit_id = ? AND date = ?',
          [habitId, date]
        );
        
        // Subtract XP
        await updateUserXP(-log.xp_earned);
        
        // Emit event to notify all screens of data change
        dbEventEmitter.emit('habitDataChanged');
      }
    } catch (error) {
      console.error('Error uncompleting habit:', error);
      throw error;
    }
  };

  const getHabitCompletion = async (habitId: number, date: string): Promise<boolean> => {
    try {
      const result = await db.getFirstAsync(
        'SELECT completed FROM habit_logs WHERE habit_id = ? AND date = ?',
        [habitId, date]
      ) as { completed: number } | null;
      
      return result?.completed === 1;
    } catch (error) {
      console.error('Error checking habit completion:', error);
      return false;
    }
  };

  const getHabitStreak = async (habitId: number, currentDate: string): Promise<number> => {
    try {
      // Check if database is available
      if (!db) {
        console.warn('Database not available for habit streak calculation');
        return 0;
      }

      const logs = await db.getAllAsync(
        'SELECT date, completed FROM habit_logs WHERE habit_id = ? AND completed = 1 ORDER BY date DESC',
        [habitId]
      ) as { date: string; completed: number }[];

      if (logs.length === 0) return 0;

      let streak = 0;
      const today = new Date(currentDate);
      
      // Start from the most recent log and work backwards
      for (let i = 0; i < logs.length; i++) {
        const logDate = new Date(logs[i].date);
        const daysDiff = Math.floor((today.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // For the first log, it should be either today or yesterday (if we're checking for ongoing streak)
        if (i === 0 && daysDiff > 1) {
          // If the most recent completion is more than 1 day ago, streak is broken
          break;
        }
        
        // Check if this log is consecutive with the previous one
        if (daysDiff === streak) {
          streak++;
        } else if (daysDiff === streak + 1 && i === 0) {
          // Special case: if it's the first log and it's from yesterday, count it
          streak++;
        } else {
          break;
        }
      }
      
      return streak;
    } catch (error) {
      console.error('Error calculating streak:', error);
      return 0;
    }
  };

  const getHabitLogs = async (habitId: number, startDate: string, endDate: string): Promise<HabitLog[]> => {
    try {
      const result = await db.getAllAsync(
        'SELECT * FROM habit_logs WHERE habit_id = ? AND date BETWEEN ? AND ? ORDER BY date',
        [habitId, startDate, endDate]
      );
      return result as HabitLog[];
    } catch (error) {
      console.error('Error fetching habit logs:', error);
      return [];
    }
  };

  // User stats operations
  const getUserStats = async (): Promise<UserStats | null> => {
    try {
      const result = await db.getFirstAsync('SELECT * FROM user_stats WHERE id = 1');
      return result as UserStats | null;
    } catch (error) {
      console.error('Error fetching user stats:', error);
      return null;
    }
  };

  const updateUserXP = async (xpChange: number): Promise<{ leveledUp: boolean; levelUpData?: LevelUpData }> => {
    try {
      const currentStats = await getUserStats();
      if (!currentStats) return { leveledUp: false };

      const previousLevel = currentStats.level;
      const newXP = Math.max(0, currentStats.xp + xpChange);
      const newLevel = calculateLevel(newXP);

      await db.runAsync(
        'UPDATE user_stats SET xp = ?, level = ? WHERE id = 1',
        [newXP, newLevel]
      );

      // Check if user leveled up
      if (newLevel > previousLevel) {
        const levelTitle = getLevelTitle(newLevel);
        const levelRewards = getLevelRewards(newLevel);
        
        return {
          leveledUp: true,
          levelUpData: {
            newLevel,
            previousLevel,
            xpGained: xpChange,
            totalXP: newXP,
            levelTitle,
            levelRewards
          }
        };
      }

      return { leveledUp: false };
    } catch (error) {
      console.error('Error updating user XP:', error);
      throw error;
    }
  };

  const getLevelTitle = (level: number): string => {
    if (level >= 50) return "Habit Legend 🌟";
    if (level >= 30) return "Habit Guru 🧘";
    if (level >= 20) return "Habit Master 🏆";
    if (level >= 15) return "Habit Expert 🎯";
    if (level >= 10) return "Habit Pro 💪";
    if (level >= 5) return "Habit Builder 🔨";
    return "Habit Beginner 🌱";
  };

  const getLevelRewards = (level: number): string[] => {
    const rewards: string[] = [];
    
    if (level % 5 === 0) {
      rewards.push(`🎁 ${50 * level} Bonus XP`);
    }
    
    if (level === 5) {
      rewards.push("🎨 Focus Mode Badge");
    } else if (level === 10) {
      rewards.push("⚡ Streak Multiplier");
    } else if (level === 15) {
      rewards.push("🏅 Expert Badge");
    } else if (level === 20) {
      rewards.push("👑 Master Crown");
    } else if (level >= 25 && level % 10 === 0) {
      rewards.push("💎 Legendary Badge");
    }
    
    if (level % 3 === 0 && level > 3) {
      rewards.push("🌟 New Achievement Category");
    }
    
    return rewards;
  };

  // XP and Level calculation formula
  const calculateLevel = (xp: number): number => {
    // Distinct formula: Level = floor(sqrt(XP / 50)) + 1
    // This creates exponential growth: L1=0-49, L2=50-199, L3=200-449, L4=450-799, etc.
    return Math.floor(Math.sqrt(xp / 50)) + 1;
  };

  const getXPForNextLevel = (currentLevel: number): number => {
    // XP needed for next level = (level^2) * 50
    return (currentLevel * currentLevel) * 50;
  };

  const getXPProgress = (currentXP: number, currentLevel: number): { current: number; needed: number; percentage: number } => {
    const currentLevelXP = ((currentLevel - 1) * (currentLevel - 1)) * 50;
    const nextLevelXP = getXPForNextLevel(currentLevel);
    const progressXP = currentXP - currentLevelXP;
    const neededXP = nextLevelXP - currentLevelXP;
    
    return {
      current: progressXP,
      needed: neededXP,
      percentage: Math.min((progressXP / neededXP) * 100, 100)
    };
  };

  // Achievement operations
  const initializeDefaultAchievements = async () => {
    try {
      const defaultAchievements = [
        // 🥉 Bronze Tier – Early Engagement (50–100 XP)
        {
          id: 'first_habit',
          title: 'First Steps',
          description: 'Complete your first habit',
          icon: '🎯',
          type: 'bronze',
          requirement_type: 'habits_completed',
          requirement_value: 1,
          requirement_timeframe: null,
          xp_reward: 50
        },
        {
          id: 'double_up',
          title: 'Double Up',
          description: 'Complete 2 habits in a single day',
          icon: '⚡',
          type: 'bronze',
          requirement_type: 'habits_per_day',
          requirement_value: 2,
          requirement_timeframe: 'day',
          xp_reward: 50
        },
        {
          id: 'streak_starter',
          title: 'Streak Starter',
          description: 'Start a streak of 3 days',
          icon: '🔥',
          type: 'bronze',
          requirement_type: 'streak_start',
          requirement_value: 3,
          requirement_timeframe: null,
          xp_reward: 50
        },
        {
          id: 'the_explorer',
          title: 'The Explorer',
          description: 'Add 5 different habits',
          icon: '🗺️',
          type: 'bronze',
          requirement_type: 'total_habits_created',
          requirement_value: 5,
          requirement_timeframe: null,
          xp_reward: 75
        },
        {
          id: 'reflection_rookie',
          title: 'Reflection Rookie',
          description: 'Log a habit note/journal entry 5 times',
          icon: '📝',
          type: 'bronze',
          requirement_type: 'habit_notes',
          requirement_value: 5,
          requirement_timeframe: null,
          xp_reward: 75
        },
        {
          id: 'quick_recovery',
          title: 'Quick Recovery',
          description: 'Resume a streak within 2 days of breaking it',
          icon: '🏃‍♂️',
          type: 'bronze',
          requirement_type: 'streak_recovery',
          requirement_value: 2,
          requirement_timeframe: null,
          xp_reward: 100
        },
        {
          id: 'week_warrior',
          title: 'Week Warrior',
          description: 'Maintain a 7-day streak',
          icon: '🔥',
          type: 'bronze',
          requirement_type: 'streak',
          requirement_value: 7,
          requirement_timeframe: null,
          xp_reward: 100
        },

        // 🥈 Silver Tier – Building Momentum (150–200 XP)
        {
          id: 'habit_architect',
          title: 'Habit Architect',
          description: 'Create 10 total habits',
          icon: '🏗️',
          type: 'silver',
          requirement_type: 'total_habits_created',
          requirement_value: 10,
          requirement_timeframe: null,
          xp_reward: 150
        },
        {
          id: 'weekend_warrior',
          title: 'Weekend Warrior',
          description: 'Complete all habits for a weekend (Saturday + Sunday)',
          icon: '🏖️',
          type: 'silver',
          requirement_type: 'weekend_complete',
          requirement_value: 1,
          requirement_timeframe: 'weekend',
          xp_reward: 150
        },
        {
          id: 'night_owl',
          title: 'Night Owl',
          description: 'Log a habit after 10 PM 7 times',
          icon: '🦉',
          type: 'silver',
          requirement_type: 'night_habits',
          requirement_value: 7,
          requirement_timeframe: null,
          xp_reward: 150
        },
        {
          id: 'consistency_climber',
          title: 'Consistency Climber',
          description: 'Achieve 75% consistency over any 2 weeks',
          icon: '🧗‍♂️',
          type: 'silver',
          requirement_type: 'consistency_period',
          requirement_value: 75,
          requirement_timeframe: 'period',
          xp_reward: 175
        },
        {
          id: 'routine_builder',
          title: 'Routine Builder',
          description: 'Maintain 3 active habits for 21 straight days',
          icon: '🏗️',
          type: 'silver',
          requirement_type: 'active_habits_duration',
          requirement_value: 21,
          requirement_timeframe: null,
          xp_reward: 200
        },
        {
          id: 'level_five',
          title: 'Rising Star',
          description: 'Reach level 5',
          icon: '⭐',
          type: 'silver',
          requirement_type: 'level',
          requirement_value: 5,
          requirement_timeframe: null,
          xp_reward: 150
        },

        // 🥇 Gold Tier – Advanced Consistency (250–500 XP)
        {
          id: 'no_zero_days',
          title: 'No Zero Days',
          description: 'Do something every day for a full month',
          icon: '📅',
          type: 'gold',
          requirement_type: 'no_zero_days',
          requirement_value: 30,
          requirement_timeframe: 'month',
          xp_reward: 300
        },
        {
          id: 'all_rounder',
          title: 'All Rounder',
          description: 'Log morning, afternoon, and night habits on the same day',
          icon: '🌅',
          type: 'gold',
          requirement_type: 'time_based_habits',
          requirement_value: 3,
          requirement_timeframe: 'day',
          xp_reward: 250
        },
        {
          id: 'wall_of_fame',
          title: 'Wall of Fame',
          description: 'Achieve 3 Gold-tier achievements',
          icon: '🏆',
          type: 'gold',
          requirement_type: 'gold_achievements',
          requirement_value: 3,
          requirement_timeframe: null,
          xp_reward: 300
        },
        {
          id: 'monthly_mastery',
          title: 'Monthly Mastery',
          description: '100% consistency for one full month',
          icon: '💯',
          type: 'gold',
          requirement_type: 'monthly_perfect',
          requirement_value: 100,
          requirement_timeframe: 'month',
          xp_reward: 500
        },
        {
          id: 'bounced_back',
          title: 'Bounced Back',
          description: 'Recover from a streak break and go on to build a longer one',
          icon: '🔄',
          type: 'gold',
          requirement_type: 'streak_comeback',
          requirement_value: 1,
          requirement_timeframe: null,
          xp_reward: 300
        },
        {
          id: 'level_ten',
          title: 'Habit Pro',
          description: 'Reach level 10',
          icon: '💪',
          type: 'gold',
          requirement_type: 'level',
          requirement_value: 10,
          requirement_timeframe: null,
          xp_reward: 250
        },
        {
          id: 'streak_master',
          title: 'Streak Master',
          description: 'Maintain a 30-day streak',
          icon: '🏆',
          type: 'gold',
          requirement_type: 'streak',
          requirement_value: 30,
          requirement_timeframe: null,
          xp_reward: 500
        },

        // 💎 Platinum Tier – Elite Users (500+ XP)
        {
          id: 'the_relentless',
          title: 'The Relentless',
          description: 'Maintain a 100-day streak',
          icon: '🔥',
          type: 'platinum',
          requirement_type: 'mega_streak',
          requirement_value: 100,
          requirement_timeframe: null,
          xp_reward: 750
        },
        {
          id: 'xp_beast',
          title: 'XP Beast',
          description: 'Cross 5000 XP total',
          icon: '💎',
          type: 'platinum',
          requirement_type: 'total_xp',
          requirement_value: 5000,
          requirement_timeframe: null,
          xp_reward: 500
        },
        {
          id: 'zen_mode',
          title: 'Zen Mode',
          description: 'Complete all habits for 14 days without missing a single one',
          icon: '🧘',
          type: 'platinum',
          requirement_type: 'zen_mode',
          requirement_value: 14,
          requirement_timeframe: null,
          xp_reward: 600
        },
        {
          id: 'lifetime_loyalist',
          title: 'Lifetime Loyalist',
          description: 'Complete 1000 habits total',
          icon: '👑',
          type: 'platinum',
          requirement_type: 'habits_completed',
          requirement_value: 1000,
          requirement_timeframe: 'all_time',
          xp_reward: 1000
        },

        // 🌟 Bonus Achievements (Hidden/Fun)
        {
          id: 'new_year_new_me',
          title: 'New Year, New Me',
          description: 'Log a habit on Jan 1st',
          icon: '🎊',
          type: 'bronze',
          requirement_type: 'special_date',
          requirement_value: 1,
          requirement_timeframe: null,
          xp_reward: 50
        },
        {
          id: 'habit_hacker',
          title: 'Habit Hacker',
          description: 'Edit and optimize 10 different habits over time',
          icon: '🔧',
          type: 'silver',
          requirement_type: 'habit_edits',
          requirement_value: 10,
          requirement_timeframe: null,
          xp_reward: 150
        },
        {
          id: 'ghostbuster',
          title: 'Ghostbuster',
          description: 'Revive an old habit you abandoned over 30 days ago',
          icon: '👻',
          type: 'silver',
          requirement_type: 'habit_revival',
          requirement_value: 30,
          requirement_timeframe: null,
          xp_reward: 200
        },
        {
          id: 'social_spark',
          title: 'Social Spark',
          description: 'Share a milestone with a friend or on social media',
          icon: '📱',
          type: 'bronze',
          requirement_type: 'social_share',
          requirement_value: 1,
          requirement_timeframe: null,
          xp_reward: 75
        }
      ];

      for (const achievement of defaultAchievements) {
        await db.runAsync(
          `INSERT OR IGNORE INTO achievements 
           (id, title, description, icon, type, requirement_type, requirement_value, requirement_timeframe, xp_reward) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            achievement.id,
            achievement.title,
            achievement.description,
            achievement.icon,
            achievement.type,
            achievement.requirement_type,
            achievement.requirement_value,
            achievement.requirement_timeframe,
            achievement.xp_reward
          ]
        );
      }
    } catch (error) {
      console.error('Error initializing achievements:', error);
    }
  };

  const getAllAchievements = async (): Promise<Achievement[]> => {
    try {
      const achievements = await db.getAllAsync(`
        SELECT a.*, ua.unlocked_at, ua.xp_earned as earned_xp,
               CASE WHEN ua.achievement_id IS NOT NULL THEN 1 ELSE 0 END as is_unlocked
        FROM achievements a
        LEFT JOIN user_achievements ua ON a.id = ua.achievement_id
        ORDER BY 
          CASE a.type 
            WHEN 'bronze' THEN 1 
            WHEN 'silver' THEN 2 
            WHEN 'gold' THEN 3 
            WHEN 'platinum' THEN 4 
          END,
          a.requirement_value
      `) as Array<{
        id: string;
        title: string;
        description: string;
        icon: string;
        type: string;
        requirement_type: string;
        requirement_value: number;
        requirement_timeframe: string | null;
        xp_reward: number;
        unlocked_at: string | null;
        earned_xp: number | null;
        is_unlocked: number;
      }>;

      return achievements.map(a => ({
        id: a.id,
        title: a.title,
        description: a.description,
        icon: a.icon,
        type: a.type as 'bronze' | 'silver' | 'gold' | 'platinum',
        requirement: {
          type: a.requirement_type as 'streak' | 'habits_completed' | 'level' | 'consistency' | 'total_xp',
          value: a.requirement_value,
          timeframe: a.requirement_timeframe as 'day' | 'week' | 'month' | 'all_time' | undefined
        },
        xp_reward: a.xp_reward,
        unlocked_at: a.unlocked_at || undefined,
        is_unlocked: Boolean(a.is_unlocked)
      }));
    } catch (error) {
      console.error('Error fetching achievements:', error);
      return [];
    }
  };

  const unlockAchievement = async (achievementId: string) => {
    try {
      const achievement = await db.getFirstAsync(
        'SELECT * FROM achievements WHERE id = ?',
        [achievementId]
      ) as {
        id: string;
        xp_reward: number;
      } | null;

      if (!achievement) return false;

      // Check if already unlocked
      const existing = await db.getFirstAsync(
        'SELECT * FROM user_achievements WHERE achievement_id = ?',
        [achievementId]
      );

      if (existing) return false;

      // Unlock achievement
      await db.runAsync(
        'INSERT INTO user_achievements (achievement_id, xp_earned) VALUES (?, ?)',
        [achievementId, achievement.xp_reward]
      );

      // Award XP
      await updateUserXP(achievement.xp_reward);

      return true;
    } catch (error) {
      console.error('Error unlocking achievement:', error);
      return false;
    }
  };

  const checkAndUnlockAchievements = async () => {
    try {
      console.log('🏆 Checking achievements...');
      const [userStats, habits, achievements] = await Promise.all([
        getUserStats(),
        getHabits(),
        getAllAchievements()
      ]);

      if (!userStats) {
        console.log('❌ No user stats found');
        return [];
      }

      console.log('📊 User stats:', { level: userStats.level, xp: userStats.xp });
      console.log('🎯 Total achievements:', achievements.length);
      console.log('✅ Unlocked achievements:', achievements.filter(a => a.is_unlocked).length);

      const unlockedAchievements: string[] = [];

      for (const achievement of achievements) {
        if (achievement.is_unlocked) continue;

        let shouldUnlock = false;
        let debugInfo = '';

        switch (achievement.requirement.type) {
          case 'level':
            shouldUnlock = userStats.level >= achievement.requirement.value;
            debugInfo = `Level ${userStats.level} >= ${achievement.requirement.value}`;
            break;

          case 'total_xp':
            shouldUnlock = userStats.xp >= achievement.requirement.value;
            debugInfo = `XP ${userStats.xp} >= ${achievement.requirement.value}`;
            break;

          case 'streak':
          case 'streak_start':
          case 'mega_streak':
            // Check if any habit has the required streak
            let maxStreak = 0;
            for (const habit of habits) {
              const streak = await getHabitStreak(habit.id, new Date().toISOString().split('T')[0]);
              maxStreak = Math.max(maxStreak, streak);
              if (streak >= achievement.requirement.value) {
                shouldUnlock = true;
                break;
              }
            }
            debugInfo = `Max streak ${maxStreak} >= ${achievement.requirement.value}`;
            break;

          case 'habits_completed':
            if (achievement.requirement.timeframe === 'all_time') {
              const totalCompleted = await db.getFirstAsync(
                'SELECT COUNT(*) as count FROM habit_logs WHERE completed = 1'
              ) as { count: number };
              shouldUnlock = totalCompleted.count >= achievement.requirement.value;
              debugInfo = `Total completed ${totalCompleted.count} >= ${achievement.requirement.value}`;
            } else {
              // Default to today
              const todayCompleted = await db.getFirstAsync(
                'SELECT COUNT(*) as count FROM habit_logs WHERE completed = 1 AND date = ?',
                [new Date().toISOString().split('T')[0]]
              ) as { count: number };
              shouldUnlock = todayCompleted.count >= achievement.requirement.value;
              debugInfo = `Today completed ${todayCompleted.count} >= ${achievement.requirement.value}`;
            }
            break;

          case 'habits_per_day':
            const today = new Date().toISOString().split('T')[0];
            const todayCompleted = await db.getFirstAsync(
              'SELECT COUNT(*) as count FROM habit_logs WHERE completed = 1 AND date = ?',
              [today]
            ) as { count: number };
            shouldUnlock = todayCompleted.count >= achievement.requirement.value;
            debugInfo = `Today completed ${todayCompleted.count} >= ${achievement.requirement.value}`;
            break;

          case 'total_habits_created':
            const totalHabits = await db.getFirstAsync(
              'SELECT COUNT(*) as count FROM habits WHERE is_active = 1'
            ) as { count: number };
            const deletedHabits = await db.getFirstAsync(
              'SELECT COUNT(*) as count FROM habits WHERE is_active = 0'
            ) as { count: number };
            const totalCreated = totalHabits.count + deletedHabits.count;
            shouldUnlock = totalCreated >= achievement.requirement.value;
            debugInfo = `Total habits created ${totalCreated} >= ${achievement.requirement.value}`;
            break;

          case 'consistency':
          case 'monthly_perfect':
            if (achievement.requirement.timeframe === 'month') {
              // Calculate this month's consistency
              const now = new Date();
              const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
              const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
              
              const totalDays = endOfMonth.getDate();
              const completedDays = await db.getFirstAsync(
                `SELECT COUNT(DISTINCT date) as count 
                 FROM habit_logs 
                 WHERE completed = 1 
                 AND date BETWEEN ? AND ?`,
                [startOfMonth.toISOString().split('T')[0], endOfMonth.toISOString().split('T')[0]]
              ) as { count: number };
              
              const consistency = (completedDays.count / totalDays) * 100;
              shouldUnlock = consistency >= achievement.requirement.value;
              debugInfo = `Consistency ${consistency.toFixed(1)}% >= ${achievement.requirement.value}%`;
            }
            break;

          case 'gold_achievements':
            const goldAchievements = achievements.filter(a => a.type === 'gold' && a.is_unlocked);
            shouldUnlock = goldAchievements.length >= achievement.requirement.value;
            debugInfo = `Gold achievements ${goldAchievements.length} >= ${achievement.requirement.value}`;
            break;

          case 'special_date':
            // Check if today is January 1st
            const currentDate = new Date();
            const isNewYear = currentDate.getMonth() === 0 && currentDate.getDate() === 1;
            shouldUnlock = isNewYear;
            debugInfo = `Is New Year's Day: ${isNewYear}`;
            break;

          case 'social_share':
            // This would typically be triggered manually when user shares
            // For now, we'll leave it as false and implement sharing trigger later
            shouldUnlock = false;
            debugInfo = `Social share not implemented yet`;
            break;

          // Placeholder implementations for complex achievements
          case 'habit_notes':
          case 'streak_recovery':
          case 'weekend_complete':
          case 'night_habits':
          case 'consistency_period':
          case 'active_habits_duration':
          case 'no_zero_days':
          case 'time_based_habits':
          case 'streak_comeback':
          case 'zen_mode':
          case 'habit_edits':
          case 'habit_revival':
          case 'weather_based':
            // These require more complex tracking that we'll implement later
            shouldUnlock = false;
            debugInfo = `Complex achievement - not yet implemented`;
            break;

          default:
            shouldUnlock = false;
            debugInfo = `Unknown achievement type: ${achievement.requirement.type}`;
            break;
        }

        console.log(`🎯 ${achievement.title}: ${debugInfo} = ${shouldUnlock ? '✅' : '❌'}`);

        if (shouldUnlock) {
          console.log(`🎉 Unlocking achievement: ${achievement.title}`);
          const unlocked = await unlockAchievement(achievement.id);
          if (unlocked) {
            unlockedAchievements.push(achievement.id);
            console.log(`✅ Successfully unlocked: ${achievement.title}`);
          } else {
            console.log(`❌ Failed to unlock: ${achievement.title}`);
          }
        }
      }

      console.log('🏆 Achievement check complete. Newly unlocked:', unlockedAchievements);
      return unlockedAchievements;
    } catch (error) {
      console.error('Error checking achievements:', error);
      return [];
    }
  };

  const initializeSampleHabits = async () => {
    try {
      // Check if habits already exist (including deleted ones to prevent duplication)
      const existingHabits = await db.getAllAsync('SELECT * FROM habits');
      if (existingHabits.length > 0) return;

      // Add sample habits for testing
      const sampleHabits = [
        {
          title: "Morning Meditation",
          description: "Start the day with 10 minutes of mindfulness",
          emoji: "🧘",
          category: "Mindfulness & Mental Health",
          frequency: "daily" as const,
          time: "07:00",
          track_time: true
        },
        {
          title: "Read for 30 minutes",
          description: "Read books to expand knowledge and vocabulary",
          emoji: "📖",
          category: "Study & Learning",
          frequency: "daily" as const,
          time: "20:00",
          track_time: true
        },
        {
          title: "Exercise",
          description: "Get moving with any form of physical activity",
          emoji: "🏃‍♂️",
          category: "Health & Fitness",
          frequency: "daily" as const,
          time: "18:00",
          track_time: true
        },
        {
          title: "Drink 8 glasses of water",
          description: "Stay hydrated throughout the day",
          emoji: "💧",
          category: "Health & Fitness",
          frequency: "daily" as const,
          time: "09:00",
          track_time: false
        }
      ];

      for (const habit of sampleHabits) {
        await addHabit(habit);
      }

      console.log('Sample habits initialized');
    } catch (error) {
      console.error('Error initializing sample habits:', error);
    }
  };



  // Get all habit logs for heatmap (optimized for performance)
  const getHabitLogsForHeatmap = async (habitId: number): Promise<HabitLog[]> => {
    try {
      // Check if database is available
      if (!db) {
        console.warn('Database not available for habit logs heatmap');
        return [];
      }

      const result = await db.getAllAsync(
        'SELECT * FROM habit_logs WHERE habit_id = ? ORDER BY date',
        [habitId]
      );
      return result as HabitLog[];
    } catch (error) {
      console.error('Error fetching habit logs for heatmap:', error);
      return [];
    }
  };

  // Trigger social share achievement
  const triggerSocialShare = async () => {
    try {
      // Check if social share achievement exists and is not unlocked
      const achievements = await getAllAchievements();
      const socialShareAchievement = achievements.find(a => a.id === 'social_spark' && !a.is_unlocked);
      
      if (socialShareAchievement) {
        const unlocked = await unlockAchievement('social_spark');
        if (unlocked) {
          console.log('🎉 Social Spark achievement unlocked!');
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error triggering social share achievement:', error);
      return false;
    }
  };

  // Activity trend data aggregation functions

  const getWeeklyActivityData = async (weeksCount: number = 12): Promise<ActivityDataPoint[]> => {
    try {
      // Check if database is available
      if (!db) {
        console.warn('Database not available for weekly activity data');
        return [];
      }

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - (weeksCount * 7));

      const result = await db.getAllAsync(`
        SELECT 
          strftime('%Y-%W', date) as week,
          MIN(date) as date,
          COUNT(*) as completed_count
        FROM habit_logs 
        WHERE completed = 1 
        AND date BETWEEN ? AND ?
        GROUP BY strftime('%Y-%W', date)
        ORDER BY week
      `, [startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]]);

      return result.map((row: any, index: number) => ({
        date: row.date,
        value: row.completed_count,
        label: `Week ${index + 1}`
      }));
    } catch (error) {
      console.error('Error fetching weekly activity data:', error);
      return [];
    }
  };

  const getMonthlyActivityData = async (monthsCount: number = 12): Promise<ActivityDataPoint[]> => {
    try {
      // Check if database is available
      if (!db) {
        console.warn('Database not available for monthly activity data');
        return [];
      }

      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - monthsCount);

      const result = await db.getAllAsync(`
        SELECT 
          strftime('%Y-%m', date) as month,
          MIN(date) as date,
          COUNT(*) as completed_count
        FROM habit_logs 
        WHERE completed = 1 
        AND date BETWEEN ? AND ?
        GROUP BY strftime('%Y-%m', date)
        ORDER BY month
      `, [startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]]);

      return result.map((row: any) => {
        const date = new Date(row.date);
        return {
          date: row.date,
          value: row.completed_count,
          label: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        };
      });
    } catch (error) {
      console.error('Error fetching monthly activity data:', error);
      return [];
    }
  };

  const getYearlyActivityData = async (yearsCount: number = 3): Promise<ActivityDataPoint[]> => {
    try {
      // Check if database is available
      if (!db) {
        console.warn('Database not available for yearly activity data');
        return [];
      }

      const endDate = new Date();
      const startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - yearsCount);

      const result = await db.getAllAsync(`
        SELECT 
          strftime('%Y', date) as year,
          MIN(date) as date,
          COUNT(*) as completed_count
        FROM habit_logs 
        WHERE completed = 1 
        AND date BETWEEN ? AND ?
        GROUP BY strftime('%Y', date)
        ORDER BY year
      `, [startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]]);

      return result.map((row: any) => ({
        date: row.date,
        value: row.completed_count,
        label: row.year
      }));
    } catch (error) {
      console.error('Error fetching yearly activity data:', error);
      return [];
    }
  };

  const getDailyActivityData = async (daysCount: number = 30): Promise<ActivityDataPoint[]> => {
    try {
      // Check if database is available
      if (!db) {
        console.warn('Database not available for daily activity data');
        return [];
      }

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysCount);

      const result = await db.getAllAsync(`
        SELECT 
          date,
          COUNT(*) as completed_count
        FROM habit_logs 
        WHERE completed = 1 
        AND date BETWEEN ? AND ?
        GROUP BY date
        ORDER BY date
      `, [startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]]);

      return result.map((row: any) => {
        const date = new Date(row.date);
        return {
          date: row.date,
          value: row.completed_count,
          label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        };
      });
    } catch (error) {
      console.error('Error fetching daily activity data:', error);
      return [];
    }
  };

  // Time tracking session operations
  const startHabitSession = async (habitId: number): Promise<number> => {
    try {
      const startTime = new Date().toISOString();
      const date = startTime.split('T')[0];
      const result = await db.runAsync(
        'INSERT INTO habit_sessions (habit_id, date, start_time) VALUES (?, ?, ?)',
        [habitId, date, startTime]
      );
      return result.lastInsertRowId;
    } catch (error) {
      console.error('Error starting habit session:', error);
      throw error;
    }
  };

  const stopHabitSession = async (sessionId: number, intensity: number = 3, notes: string = ''): Promise<void> => {
    try {
      const session = await db.getFirstAsync(
        'SELECT * FROM habit_sessions WHERE id = ?',
        [sessionId]
      ) as { id: number; habit_id: number; start_time: string; end_time: string | null; duration: number } | null;

      if (!session || session.end_time) return;

      const endTime = new Date().toISOString();
      const duration = Math.floor((new Date(endTime).getTime() - new Date(session.start_time).getTime()) / 1000);

      // Update session record with intensity and notes
      await db.runAsync(
        'UPDATE habit_sessions SET end_time = ?, duration = ?, intensity = ?, notes = ? WHERE id = ?',
        [endTime, duration, intensity, notes, sessionId]
      );

      const date = session.start_time.split('T')[0];

      const existingLog = await db.getFirstAsync(
        'SELECT time_spent FROM habit_logs WHERE habit_id = ? AND date = ?',
        [session.habit_id, date]
      ) as { time_spent: number } | null;

      const previousTime = existingLog?.time_spent ?? 0;
      const newTime = previousTime + duration;

      // Upsert habit log with accumulated time
      await db.runAsync(
        'INSERT OR REPLACE INTO habit_logs (habit_id, date, completed, xp_earned, time_spent) VALUES (?, ?, 1, ?, ?)',
        [session.habit_id, date, 0, newTime]
      );

      // Award XP only once per day (when first session created)
      if (!existingLog) {
        await completeHabit(session.habit_id, date);
      }

      dbEventEmitter.emit('habitDataChanged');
    } catch (error) {
      console.error('Error stopping habit session:', error);
      throw error;
    }
  };

  const getActiveSession = async (habitId: number): Promise<HabitSession | null> => {
    try {
      const session = await db.getFirstAsync(
        'SELECT * FROM habit_sessions WHERE habit_id = ? AND end_time IS NULL ORDER BY start_time DESC LIMIT 1',
        [habitId]
      ) as HabitSession | null;
      return session;
    } catch (error) {
      console.error('Error getting active session:', error);
      return null;
    }
  };

  const getAllActiveSessions = async (): Promise<HabitSession[]> => {
    try {
      const sessions = await db.getAllAsync(
        'SELECT * FROM habit_sessions WHERE end_time IS NULL ORDER BY start_time DESC'
      ) as HabitSession[];
      return sessions;
    } catch (error) {
      console.error('Error getting all active sessions:', error);
      return [];
    }
  };

  const pauseHabitSession = async (sessionId: number): Promise<void> => {
    try {
      // For now, we'll handle pause/resume in the UI state
      // This function is here for future implementation if needed
      console.log('Pause session:', sessionId);
    } catch (error) {
      console.error('Error pausing habit session:', error);
      throw error;
    }
  };

  const getHabitSessions = async (habitId: number, startDate: string, endDate: string): Promise<HabitSession[]> => {
    try {
      const sessions = await db.getAllAsync(
        'SELECT * FROM habit_sessions WHERE habit_id = ? AND date BETWEEN ? AND ? ORDER BY start_time DESC',
        [habitId, startDate, endDate]
      ) as HabitSession[];
      return sessions;
    } catch (error) {
      console.error('Error getting habit sessions:', error);
      return [];
    }
  };

  const deleteHabitSession = async (sessionId: number): Promise<void> => {
    try {
      await db.runAsync('DELETE FROM habit_sessions WHERE id = ?', [sessionId]);
      dbEventEmitter.emit('habitDataChanged');
    } catch (error) {
      console.error('Error deleting habit session:', error);
      throw error;
    }
  };

  // Time tracking analytics functions
  const getHabitTimeData = async (habitId: number, daysCount: number = 14): Promise<{ date: string; timeSpent: number }[]> => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysCount);

      const result = await db.getAllAsync(`
        SELECT 
          date,
          time_spent as timeSpent
        FROM habit_logs 
        WHERE habit_id = ? 
        AND date BETWEEN ? AND ?
        AND time_spent > 0
        ORDER BY date
      `, [habitId, startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]]);

      return result as { date: string; timeSpent: number }[];
    } catch (error) {
      console.error('Error fetching habit time data:', error);
      return [];
    }
  };

  const getTimeDistributionData = async (daysCount: number = 7): Promise<{ habitId: number; habitTitle: string; habitEmoji: string; totalTime: number; percentage: number }[]> => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysCount);

      const result = await db.getAllAsync(`
        SELECT 
          h.id as habitId,
          h.title as habitTitle,
          h.emoji as habitEmoji,
          SUM(hl.time_spent) as totalTime
        FROM habit_logs hl
        JOIN habits h ON hl.habit_id = h.id
        WHERE hl.date BETWEEN ? AND ?
        AND hl.time_spent > 0
        AND h.is_active = 1
        GROUP BY h.id, h.title, h.emoji
        ORDER BY totalTime DESC
      `, [startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]]);

      const data = result as { habitId: number; habitTitle: string; habitEmoji: string; totalTime: number }[];
      const totalTimeAll = data.reduce((sum, item) => sum + item.totalTime, 0);

      return data.map(item => ({
        ...item,
        percentage: totalTimeAll > 0 ? (item.totalTime / totalTimeAll) * 100 : 0
      }));
    } catch (error) {
      console.error('Error fetching time distribution data:', error);
      return [];
    }
  };

  const getTopTimeHabits = async (daysCount: number = 7, limit: number = 3): Promise<{ habitId: number; habitTitle: string; habitEmoji: string; totalTime: number; previousTime: number; change: number }[]> => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysCount);

      const previousEndDate = new Date(startDate);
      const previousStartDate = new Date(startDate);
      previousStartDate.setDate(previousStartDate.getDate() - daysCount);

      // Get current period data
      const currentResult = await db.getAllAsync(`
        SELECT 
          h.id as habitId,
          h.title as habitTitle,
          h.emoji as habitEmoji,
          SUM(hl.time_spent) as totalTime
        FROM habit_logs hl
        JOIN habits h ON hl.habit_id = h.id
        WHERE hl.date BETWEEN ? AND ?
        AND hl.time_spent > 0
        AND h.is_active = 1
        GROUP BY h.id, h.title, h.emoji
        ORDER BY totalTime DESC
        LIMIT ?
      `, [startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0], limit]);

      // Get previous period data for comparison
      const previousResult = await db.getAllAsync(`
        SELECT 
          h.id as habitId,
          SUM(hl.time_spent) as totalTime
        FROM habit_logs hl
        JOIN habits h ON hl.habit_id = h.id
        WHERE hl.date BETWEEN ? AND ?
        AND hl.time_spent > 0
        AND h.is_active = 1
        GROUP BY h.id
      `, [previousStartDate.toISOString().split('T')[0], previousEndDate.toISOString().split('T')[0]]);

      const previousMap = new Map(previousResult.map((item: any) => [item.habitId, item.totalTime]));

      return currentResult.map((item: any) => {
        const previousTime = previousMap.get(item.habitId) || 0;
        const change = previousTime > 0 ? ((item.totalTime - previousTime) / previousTime) * 100 : 0;
        return {
          ...item,
          previousTime,
          change
        };
      });
    } catch (error) {
      console.error('Error fetching top time habits:', error);
      return [];
    }
  };

  const getDailyTotalTimeData = async (daysCount: number = 30): Promise<{ date: string; totalTime: number }[]> => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysCount);

      const result = await db.getAllAsync(`
        SELECT 
          date,
          SUM(time_spent) as totalTime
        FROM habit_logs 
        WHERE date BETWEEN ? AND ?
        AND time_spent > 0
        GROUP BY date
        ORDER BY date
      `, [startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]]);

      return result as { date: string; totalTime: number }[];
    } catch (error) {
      console.error('Error fetching daily total time data:', error);
      return [];
    }
  };

  const getTimeConsistencyStats = async (daysCount: number = 30): Promise<{ daysWithTime: number; totalDays: number; consistencyPercentage: number; currentStreak: number }> => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysCount);

      const result = await db.getAllAsync(`
        SELECT 
          date,
          SUM(time_spent) as totalTime
        FROM habit_logs 
        WHERE date BETWEEN ? AND ?
        AND time_spent > 0
        GROUP BY date
        HAVING totalTime > 0
        ORDER BY date DESC
      `, [startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]]);

      const daysWithTime = result.length;
      const totalDays = daysCount;
      const consistencyPercentage = totalDays > 0 ? (daysWithTime / totalDays) * 100 : 0;

      // Calculate current streak
      let currentStreak = 0;
      const today = new Date().toISOString().split('T')[0];
      const resultDates = result.map((r: any) => r.date);
      
      for (let i = 0; i < daysCount; i++) {
        const checkDate = new Date();
        checkDate.setDate(checkDate.getDate() - i);
        const dateStr = checkDate.toISOString().split('T')[0];
        
        if (resultDates.includes(dateStr)) {
          currentStreak++;
        } else {
          break;
        }
      }

      return {
        daysWithTime,
        totalDays,
        consistencyPercentage,
        currentStreak
      };
    } catch (error) {
      console.error('Error fetching time consistency stats:', error);
      return {
        daysWithTime: 0,
        totalDays: daysCount,
        consistencyPercentage: 0,
        currentStreak: 0
      };
    }
  };

  return {
    initializeDatabase,
    addHabit,
    updateHabit,
    getHabits,
    deleteHabit,
    completeHabit,
    uncompleteHabit,
    getHabitCompletion,
    getHabitStreak,
    getHabitLogs,
    getHabitLogsForHeatmap,
    getUserStats,
    updateUserXP,
    calculateLevel,
    getXPForNextLevel,
    getXPProgress,
    getLevelTitle,
    getLevelRewards,
    getAllAchievements,
    unlockAchievement,
    checkAndUnlockAchievements,
    triggerSocialShare,
    initializeSampleHabits,
    // Activity trend data functions
    getWeeklyActivityData,
    getMonthlyActivityData,
    getYearlyActivityData,
    getDailyActivityData,
    // Time tracking helpers
    startHabitSession,
    stopHabitSession,
    getActiveSession,
    getAllActiveSessions,
    pauseHabitSession,
    getHabitSessions,
    deleteHabitSession,
    // Event system for real-time updates
    onDataChange: (callback: () => void) => dbEventEmitter.on('habitDataChanged', callback),
    offDataChange: (callback: () => void) => dbEventEmitter.off('habitDataChanged', callback),
    // Time tracking analytics
    getHabitTimeData,
    getTimeDistributionData,
    getTopTimeHabits,
    getDailyTotalTimeData,
    getTimeConsistencyStats,
  };
}; 