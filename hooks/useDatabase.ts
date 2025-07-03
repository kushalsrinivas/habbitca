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

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  type: 'bronze' | 'silver' | 'gold' | 'platinum';
  requirement: {
    type: 'streak' | 'habits_completed' | 'level' | 'consistency' | 'total_xp';
    value: number;
    timeframe?: 'day' | 'week' | 'month' | 'all_time';
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
          is_active BOOLEAN DEFAULT 1
        );
      `);

      // Add emoji and category columns if they don't exist (for existing databases)
      await db.execAsync(`
        ALTER TABLE habits ADD COLUMN emoji TEXT DEFAULT '⭐';
      `).catch(() => {}); // Ignore error if column already exists
      
      await db.execAsync(`
        ALTER TABLE habits ADD COLUMN category TEXT DEFAULT 'Other / Custom';
      `).catch(() => {}); // Ignore error if column already exists

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
  const addHabit = async (habit: Omit<Habit, 'id' | 'created_at' | 'is_active'>) => {
    try {
      const result = await db.runAsync(
        'INSERT INTO habits (title, description, emoji, category, frequency, time) VALUES (?, ?, ?, ?, ?, ?)',
        [habit.title, habit.description, habit.emoji, habit.category, habit.frequency, habit.time]
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

  const updateHabit = async (habitId: number, habit: Omit<Habit, 'id' | 'created_at' | 'is_active'>) => {
    try {
      await db.runAsync(
        'UPDATE habits SET title = ?, description = ?, emoji = ?, category = ?, frequency = ?, time = ? WHERE id = ?',
        [habit.title, habit.description, habit.emoji, habit.category, habit.frequency, habit.time, habitId]
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

      // Insert or update habit log
      await db.runAsync(
        'INSERT OR REPLACE INTO habit_logs (habit_id, date, completed, xp_earned) VALUES (?, ?, 1, ?)',
        [habitId, date, xpEarned]
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
        {
          id: 'habit_master',
          title: 'Habit Master',
          description: 'Complete 30 habits total',
          icon: '👑',
          type: 'silver',
          requirement_type: 'habits_completed',
          requirement_value: 30,
          requirement_timeframe: 'all_time',
          xp_reward: 200
        },
        {
          id: 'consistency_king',
          title: 'Consistency King',
          description: 'Achieve 90% consistency this month',
          icon: '⚡',
          type: 'gold',
          requirement_type: 'consistency',
          requirement_value: 90,
          requirement_timeframe: 'month',
          xp_reward: 300
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
        {
          id: 'xp_collector',
          title: 'XP Collector',
          description: 'Earn 1000 total XP',
          icon: '💎',
          type: 'platinum',
          requirement_type: 'total_xp',
          requirement_value: 1000,
          requirement_timeframe: null,
          xp_reward: 200
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
      const [userStats, habits, achievements] = await Promise.all([
        getUserStats(),
        getHabits(),
        getAllAchievements()
      ]);

      if (!userStats) return [];

      const unlockedAchievements: string[] = [];

      for (const achievement of achievements) {
        if (achievement.is_unlocked) continue;

        let shouldUnlock = false;

        switch (achievement.requirement.type) {
          case 'level':
            shouldUnlock = userStats.level >= achievement.requirement.value;
            break;

          case 'total_xp':
            shouldUnlock = userStats.xp >= achievement.requirement.value;
            break;

          case 'streak':
            // Check if any habit has the required streak
            for (const habit of habits) {
              const streak = await getHabitStreak(habit.id, new Date().toISOString().split('T')[0]);
              if (streak >= achievement.requirement.value) {
                shouldUnlock = true;
                break;
              }
            }
            break;

          case 'habits_completed':
            if (achievement.requirement.timeframe === 'all_time') {
              const totalCompleted = await db.getFirstAsync(
                'SELECT COUNT(*) as count FROM habit_logs WHERE completed = 1'
              ) as { count: number };
              shouldUnlock = totalCompleted.count >= achievement.requirement.value;
            } else {
              // Default to today
              const todayCompleted = await db.getFirstAsync(
                'SELECT COUNT(*) as count FROM habit_logs WHERE completed = 1 AND date = ?',
                [new Date().toISOString().split('T')[0]]
              ) as { count: number };
              shouldUnlock = todayCompleted.count >= achievement.requirement.value;
            }
            break;

          case 'consistency':
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
            }
            break;
        }

        if (shouldUnlock) {
          const unlocked = await unlockAchievement(achievement.id);
          if (unlocked) {
            unlockedAchievements.push(achievement.id);
          }
        }
      }

      return unlockedAchievements;
    } catch (error) {
      console.error('Error checking achievements:', error);
      return [];
    }
  };

  const initializeSampleHabits = async () => {
    try {
      // Check if habits already exist
      const existingHabits = await getHabits();
      if (existingHabits.length > 0) return;

      // Add sample habits for testing
      const sampleHabits = [
        {
          title: "Morning Meditation",
          description: "Start the day with 10 minutes of mindfulness",
          emoji: "🧘",
          category: "Mindfulness & Mental Health",
          frequency: "daily" as const,
          time: "07:00"
        },
        {
          title: "Read for 30 minutes",
          description: "Read books to expand knowledge and vocabulary",
          emoji: "📖",
          category: "Study & Learning",
          frequency: "daily" as const,
          time: "20:00"
        },
        {
          title: "Exercise",
          description: "Get moving with any form of physical activity",
          emoji: "🏃‍♂️",
          category: "Health & Fitness",
          frequency: "daily" as const,
          time: "18:00"
        },
        {
          title: "Drink 8 glasses of water",
          description: "Stay hydrated throughout the day",
          emoji: "💧",
          category: "Health & Fitness",
          frequency: "daily" as const,
          time: "09:00"
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
    initializeSampleHabits,
    // Event system for real-time updates
    onDataChange: (callback: () => void) => dbEventEmitter.on('habitDataChanged', callback),
    offDataChange: (callback: () => void) => dbEventEmitter.off('habitDataChanged', callback),
  };
}; 