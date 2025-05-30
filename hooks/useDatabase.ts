import { useSQLiteContext } from 'expo-sqlite';

export interface Habit {
  id: number;
  title: string;
  description: string;
  frequency: 'daily';
  time: string; // HH:MM format
  created_at: string;
  is_active: boolean;
}

export interface HabitLog {
  id: number;
  habit_id: number;
  date: string; // YYYY-MM-DD format
  completed: boolean;
  xp_earned: number;
}

export interface UserStats {
  id: number;
  level: number;
  xp: number;
  total_streaks: number;
  longest_streak: number;
  achievements: string; // JSON string for future use
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
          frequency TEXT DEFAULT 'daily',
          time TEXT NOT NULL,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          is_active BOOLEAN DEFAULT 1
        );
      `);

      // Create habit_logs table
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS habit_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          habit_id INTEGER NOT NULL,
          date TEXT NOT NULL,
          completed BOOLEAN DEFAULT 0,
          xp_earned INTEGER DEFAULT 0,
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

      // Initialize user stats if not exists
      await db.execAsync(`
        INSERT OR IGNORE INTO user_stats (id, level, xp, total_streaks, longest_streak, achievements)
        VALUES (1, 1, 0, 0, 0, '{}');
      `);

      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Database initialization error:', error);
    }
  };

  // Habit operations
  const addHabit = async (habit: Omit<Habit, 'id' | 'created_at' | 'is_active'>) => {
    try {
      const result = await db.runAsync(
        'INSERT INTO habits (title, description, frequency, time) VALUES (?, ?, ?, ?)',
        [habit.title, habit.description, habit.frequency, habit.time]
      );
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

  const deleteHabit = async (habitId: number) => {
    try {
      await db.runAsync('UPDATE habits SET is_active = 0 WHERE id = ?', [habitId]);
    } catch (error) {
      console.error('Error deleting habit:', error);
      throw error;
    }
  };

  // Habit log operations
  const completeHabit = async (habitId: number, date: string) => {
    try {
      // Calculate XP based on streak
      const streak = await getHabitStreak(habitId, date);
      const baseXP = 10;
      const streakBonus = Math.floor(streak / 7) * 5; // 5 bonus XP for every 7-day streak
      const xpEarned = baseXP + streakBonus;

      // Insert or update habit log
      await db.runAsync(
        'INSERT OR REPLACE INTO habit_logs (habit_id, date, completed, xp_earned) VALUES (?, ?, 1, ?)',
        [habitId, date, xpEarned]
      );

      // Update user stats
      await updateUserXP(xpEarned);
      
      return xpEarned;
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
      const logs = await db.getAllAsync(
        'SELECT date, completed FROM habit_logs WHERE habit_id = ? AND completed = 1 ORDER BY date DESC',
        [habitId]
      ) as { date: string; completed: number }[];

      let streak = 0;
      const today = new Date(currentDate);
      
      for (let i = 0; i < logs.length; i++) {
        const logDate = new Date(logs[i].date);
        const daysDiff = Math.floor((today.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === streak) {
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

  const updateUserXP = async (xpChange: number) => {
    try {
      const currentStats = await getUserStats();
      if (!currentStats) return;

      const newXP = Math.max(0, currentStats.xp + xpChange);
      const newLevel = calculateLevel(newXP);

      await db.runAsync(
        'UPDATE user_stats SET xp = ?, level = ? WHERE id = 1',
        [newXP, newLevel]
      );
    } catch (error) {
      console.error('Error updating user XP:', error);
      throw error;
    }
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

  return {
    initializeDatabase,
    addHabit,
    getHabits,
    deleteHabit,
    completeHabit,
    uncompleteHabit,
    getHabitCompletion,
    getHabitStreak,
    getHabitLogs,
    getUserStats,
    updateUserXP,
    calculateLevel,
    getXPForNextLevel,
    getXPProgress,
  };
}; 