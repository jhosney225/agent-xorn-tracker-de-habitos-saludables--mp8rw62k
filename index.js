```javascript
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Database file path
const DB_FILE = path.join(__dirname, 'habits.json');

// Initialize readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Habit class
class Habit {
  constructor(name, description, frequency = 'daily', category = 'general') {
    this.id = Date.now().toString();
    this.name = name;
    this.description = description;
    this.frequency = frequency; // daily, weekly
    this.category = category; // health, fitness, mental, nutrition
    this.createdAt = new Date().toISOString();
    this.logs = [];
  }

  logEntry(date = new Date()) {
    const dateStr = date.toISOString().split('T')[0];
    const existingLog = this.logs.find(log => log.date === dateStr);
    
    if (!existingLog) {
      this.logs.push({
        date: dateStr,
        completed: true,
        timestamp: new Date().toISOString()
      });
      return true;
    }
    return false;
  }

  getStreak() {
    if (this.logs.length === 0) return 0;
    
    let streak = 0;
    const sortedLogs = this.logs.sort((a, b) => new Date(b.date) - new Date(a.date));
    const today = new Date().toISOString().split('T')[0];
    
    for (let i = 0; i < sortedLogs.length; i++) {
      const logDate = new Date(sortedLogs[i].date);
      const expectedDate = new Date(today);
      expectedDate.setDate(expectedDate.getDate() - i);
      const expectedDateStr = expectedDate.toISOString().split('T')[0];
      
      if (sortedLogs[i].date === expectedDateStr) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  }

  getCompletionRate() {
    if (this.logs.length === 0) return 0;
    
    const createdDate = new Date(this.createdAt);
    const today = new Date();
    const daysDiff = Math.floor((today - createdDate) / (1000 * 60 * 60 * 24)) + 1;
    
    return Math.round((this.logs.length / daysDiff) * 100);
  }

  getStats() {
    return {
      name: this.name,
      totalCompletions: this.logs.length,
      currentStreak: this.getStreak(),
      completionRate: this.getCompletionRate() + '%',
      daysActive: Math.floor((new Date() - new Date(this.createdAt)) / (1000 * 60 * 60 * 24)) + 1,
      category: this.category
    };
  }
}

// HabitTracker class
class HabitTracker {
  constructor() {
    this.habits = [];
    this.loadHabits();
  }

  loadHabits() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const data = fs.readFileSync(DB_FILE, 'utf8');
        const parsed = JSON.parse(data);
        this.habits = parsed.map(h => Object.assign(new Habit('', ''), h));
      }
    } catch (error) {
      console.error('Error loading habits:', error.message);
    }
  }

  saveHabits() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.habits, null, 2));
    } catch (error) {
      console.error('Error saving habits:', error.message);
    }
  }

  addHabit(name, description, frequency = 'daily', category = 'general') {
    const habit = new Habit(name, description, frequency, category);
    this.habits.push(habit);
    this.saveHabits();
    return habit;
  }

  getHabit(id) {
    return this.habits.find(h => h.id === id);
  }

  getAllHabits() {
    return this.habits;
  }

  logHabit(habitId) {
    const habit = this.getHabit(habitId);
    if (habit) {
      const logged = habit.logEntry();
      this.saveHabits();
      return logged;
    }
    return false;
  }

  getHabitStats(habitId) {
    const habit = this.getHabit(habitId);
    return habit ? habit.getStats() : null;
  }

  getAllStats() {
    return this.habits.map(h => h.getStats());
  }

  deleteHabit(habitId) {
    this.habits = this.habits.filter(h => h.id !== habitId);
    this.saveHabits();
  }

  getHealthScore() {
    if (this.habits.length === 0) return 0;
    
    const totalCompletion = this.habits.reduce((sum, h) => sum + h.getCompletionRate(), 0);
    return Math.round(totalCompletion / this.habits.length);
  }

  getCategoryStats() {
    const categories = {};
    this.habits.forEach(habit => {
      if (!categories[habit.category]) {
        categories[habit.category] = {
          count: 0,
          avgCompletion: 0,
          totalCompletion: 0
        };
      }
      categories[habit.category].count++;
      categories[habit.category].totalCompletion += habit.getCompletionRate();
    });

    Object.keys(categories).forEach(cat => {
      categories