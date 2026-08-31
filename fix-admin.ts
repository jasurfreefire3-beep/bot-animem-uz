const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminPage.tsx', 'utf-8');
code = code.replace(
  `  const handleDelete = async (id: number) => {\n    if (!window.confirm("Rostdan ham bu animeni o'chirmoqchimisiz?")) return;`,
  `  const handleDelete = async (id: number) => {\n    // if (!window.confirm("Rostdan ham bu animeni o'chirmoqchimisiz?")) return;`
);
fs.writeFileSync('src/pages/AdminPage.tsx', code);
