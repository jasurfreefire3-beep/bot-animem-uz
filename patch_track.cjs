const fs = require('fs');
let content = fs.readFileSync('server/bot.ts', 'utf8');

// Add tracker structure at the top after imports
const trackerCode = `
// --- Real-time Stats Tracking ---
interface UserSession {
  lastActive: number;
  firstName: string;
  watchingAnimeId?: number;
}
const userSessions = new Map<number, UserSession>();
const activePasses = new Map<number, boolean>(); // true if pass is currently active

function trackUser(telegramId: number, firstName: string, animeId?: number) {
  const current = userSessions.get(telegramId) || { lastActive: 0, firstName };
  current.lastActive = Date.now();
  if (firstName) current.firstName = firstName;
  if (animeId !== undefined) current.watchingAnimeId = animeId;
  userSessions.set(telegramId, current);
}

function getRealWatchers(animeId: number): { count: number; text: string } {
  const fiveMinsAgo = Date.now() - 5 * 60 * 1000;
  const watchers = Array.from(userSessions.values())
    .filter(u => u.lastActive > fiveMinsAgo && u.watchingAnimeId == animeId);
  
  const count = watchers.length;
  if (count === 0) return { count: 0, text: 'Hozircha hech kim' };
  
  const names = watchers.slice(0, 6).map(w => w.firstName || 'Foydalanuvchi');
  const remaining = count - names.length;
  const text = remaining > 0 ? \`\${names.join(', ')} va yana \${remaining}\` : names.join(', ');
  
  return { count, text };
}

function getOnlineCount(): number {
  const fiveMinsAgo = Date.now() - 5 * 60 * 1000;
  return Array.from(userSessions.values()).filter(u => u.lastActive > fiveMinsAgo).length;
}

function getPassCount(): number {
  // Return count of people who have active pass
  // As a real metric, we should check active passes.
  return activePasses.size; // We'll update this when checking pass
}
// --------------------------------
`;

if (!content.includes('interface UserSession')) {
  content = content.replace(
    "const adminSessions = new Map<number, AdminWizardState>();",
    "const adminSessions = new Map<number, AdminWizardState>();\n" + trackerCode
  );
}

// Replace generateWatcherNames with getRealWatchers
content = content.replace(
  /function generateWatcherNames\(\)[\s\S]*?return \{ count, text \};\n\}/,
  "// generateWatcherNames replaced by real tracking"
);

content = content.replace(
  "const { count: watchersCount, text: watchersText } = generateWatcherNames();",
  "const { count: watchersCount, text: watchersText } = getRealWatchers(anime.id);"
);

fs.writeFileSync('server/bot.ts', content);
