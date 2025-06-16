// server.js  ────────────────────────────────────────────────────
const express = require('express');
const fs       = require('fs');
const path     = require('path');
const { randomUUID } = require('crypto');


const app  = express();
const PORT = 3000;

// server front-end
app.use(express.static('public'));
app.use(express.json());
const cors = require('cors');
app.use(cors());

// this is for using ods assets locally
app.use('/ods/css', express.static(
  path.join(__dirname, 'node_modules/@ongov/ontario-design-system-global-styles/dist/styles/css/compiled')
));
app.use('/ods/js', express.static(
  path.join(__dirname, 'node_modules/@ongov/ontario-design-system-component-library/dist/ontario-design-system-components')
));
app.use('/fonts', express.static(
  path.join(__dirname, 'node_modules/@ongov/ontario-design-system-global-styles/dist/fonts')
));
app.use('/ods/components', express.static(
  path.join(__dirname, 'node_modules/@ongov/ontario-design-system-component-library/dist/collection/components')
));

app.use('/ods/scripts', express.static(path.join(__dirname,'node_modules/@ongov/ontario-design-system-component-library/dist/scripts')));

// app.get('/mock-data', (_, res) =>
//   res.sendFile(path.join(__dirname, 'mock-data.json'))
// );

//  helper to geenerate next serial 
function nextId() {
  const file = 'counter.json';
  let num = 0;
  if (fs.existsSync(file)) num = JSON.parse(fs.readFileSync(file, 'utf8')).seq || 0;
  num += 1;
  fs.writeFileSync(file, JSON.stringify({ seq: num }));
  return `INS-${String(num).padStart(5, '0')}`;  
}

// submitting inspection
app.post('/submit', (req, res) => {
  const row = {
    id: req.body.id || nextId(),
    ...req.body,
    submittedAt: new Date().toISOString()
  };

  const file = 'submissions.json';
  let all = [];

  if (fs.existsSync(file)) {
    try {
      all = JSON.parse(fs.readFileSync(file, 'utf8'));
      if (!Array.isArray(all)) all = [];
    } catch {
      all = [];
    }
  }

  all.push(row);
  fs.writeFileSync(file, JSON.stringify(all, null, 2), 'utf8');

  console.log('Inspection saved', row.id);
  res.status(200).json({ ok: true, id: row.id });
});

//  GET /submissions call

app.get('/submissions', (_, res) => {
  const file = 'submissions.json';

  if (!fs.existsSync(file)) {
    return res.json([]);                       
  }

  try {
    const data = fs.readFileSync(file, 'utf8').trim();
    if (!data) return res.json([]);          

    if (data.startsWith('[')) {
      return res.json(JSON.parse(data));
    }
    const rows = data
      .split('\n')
      .filter(Boolean)
      .map(line => JSON.parse(line));
    return res.json(rows);

  } catch (err) {
    console.error('⚠️  Could not parse submissions.json:', err.message);
    return res.status(500).json({ error: 'Corrupt submissions file' });
  }
});


app.listen(PORT, () =>
  console.log(`✅  http://localhost:${PORT}  (Ctrl-C to stop)`)
);
