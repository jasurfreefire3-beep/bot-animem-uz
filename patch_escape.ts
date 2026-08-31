import fs from 'fs';
let content = fs.readFileSync('server/bot.ts', 'utf-8');
const escapeFunc = `
function escapeHtml(text: string) {
  if (!text) return '';
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
`;
content = content.replace('function formatViews', escapeFunc + '\nfunction formatViews');
fs.writeFileSync('server/bot.ts', content);
