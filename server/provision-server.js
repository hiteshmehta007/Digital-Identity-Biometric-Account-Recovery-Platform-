const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 4000;
const DATA_DIR = path.join(__dirname, 'data');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
const MAILBOX_FILE = path.join(DATA_DIR, 'mailboxes.json');
const EMAILS_FILE = path.join(DATA_DIR, 'emails.json');

const readJson = (p) => {
  try { return JSON.parse(fs.readFileSync(p, 'utf8') || '{}'); } catch (e) { return {}; }
};
const writeJson = (p, obj) => fs.writeFileSync(p, JSON.stringify(obj, null, 2), 'utf8');

// initialize files if missing
if (!fs.existsSync(MAILBOX_FILE)) writeJson(MAILBOX_FILE, {});
if (!fs.existsSync(EMAILS_FILE)) writeJson(EMAILS_FILE, []);

app.use(express.json());
// Allow the landing page dev server origin to talk to this server
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));

app.post('/api/provision-mailbox', (req, res) => {
  const { email, fullName } = req.body || {};
  if (!email) return res.status(400).json({ error: 'email required' });

  const mailboxes = readJson(MAILBOX_FILE);
  const emails = readJson(EMAILS_FILE) || [];

  // simple id
  const id = crypto.randomBytes(6).toString('hex');
  const username = email.split('@')[0];

  // create mailbox entry
  const mailbox = {
    id,
    email,
    username,
    fullName,
    createdAt: new Date().toISOString(),
    folders: ['Inbox', 'Sent', 'Drafts', 'Trash', 'Archive']
  };
  mailboxes[id] = mailbox;
  writeJson(MAILBOX_FILE, mailboxes);

  // queue welcome email
  const welcome = {
    id: crypto.randomBytes(7).toString('hex'),
    mailboxId: id,
    from: 'welcome@digitalidentity.local',
    to: email,
    subject: 'Welcome to Digital Identity',
    body: `Hi ${fullName || username},\n\nWelcome to Digital Identity. Your secure account recovery mailbox ${email} is ready. Enjoy protected access and seamless recovery.\n\n— The Digital Identity Team`,
    timestamp: new Date().toISOString(),
    folder: 'Inbox',
    isRead: false
  };
  emails.push(welcome);
  writeJson(EMAILS_FILE, emails);

  console.info('[provision-server] Created mailbox', mailbox);
  console.info('[provision-server] Queued welcome email', welcome.id);

  // Simulate token issuance (in real systems this would be a signed JWT)
  const token = crypto.randomBytes(24).toString('hex');

  // respond with token and redirect target (point to the landing dev host inbox route)
  res.json({ ok: true, token, redirectUrl: 'http://localhost:3000/email/inbox', mailboxId: id });
});

app.get('/api/debug/mailboxes', (req, res) => {
  res.json(readJson(MAILBOX_FILE));
});
app.get('/api/debug/emails', (req, res) => {
  res.json(readJson(EMAILS_FILE));
});

app.listen(PORT, () => console.log(`Provision server listening on http://localhost:${PORT}`));
