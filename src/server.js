const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { createServer } = require("http");
const { WebSocketServer } = require("ws");
const { v4: uuid } = require("uuid");

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(morgan("dev"));
app.use(express.static("public"));

const db = {
  users: new Map(),
  profiles: new Map(),
  points: new Map(),
  groups: new Map(),
  classes: new Map(),
  posts: new Map(),
  reviews: new Map(),
  dms: [],
  referrals: new Map(),
  stores: new Map(),
  transactions: [],
  ads: new Map(),
  instructorApplications: new Map(),
  admins: new Set(["admin"]),
  leaderPosts: new Map(),
  translations: [],
  gifs: [],
  siteContent: { hero: "Welcome to SoMoim" },
};

const seedUser = {
  id: "u1",
  name: "Demo User",
  role: "user",
  agreedTerms: false,
  createdAt: new Date().toISOString(),
};
db.users.set(seedUser.id, seedUser);
db.profiles.set(seedUser.id, {
  userId: seedUser.id,
  bio: "Hello",
  avatarUrl: "",
  languages: ["ko", "en"],
  interests: [],
});
db.points.set(seedUser.id, { balance: 1000, history: [] });

const wsRooms = new Map();
const wsMeta = new Map();

function getUser(req) {
  const userId = req.header("x-user-id") || "u1";
  if (!db.users.has(userId)) {
    db.users.set(userId, { id: userId, name: `User ${userId}`, role: "user", agreedTerms: false, createdAt: new Date().toISOString() });
    db.profiles.set(userId, { userId, bio: "", avatarUrl: "", languages: ["ko"], interests: [] });
    db.points.set(userId, { balance: 0, history: [] });
  }
  return db.users.get(userId);
}

function ok(res, data = {}) {
  return res.json({ ok: true, ...data });
}

function notFound(res, message = "Not found") {
  return res.status(404).json({ ok: false, message });
}

function requireAdmin(req, res, next) {
  const user = getUser(req);
  if (!db.admins.has(user.id)) return res.status(403).json({ ok: false, message: "Admin required" });
  return next();
}

function roomNameDM(a, b) {
  return [a, b].sort().join(":");
}

function broadcast(room, payload) {
  const clients = wsRooms.get(room);
  if (!clients) return;
  const json = JSON.stringify(payload);
  for (const ws of clients) {
    if (ws.readyState === 1) ws.send(json);
  }
}

function listFromMap(map) {
  return Array.from(map.values());
}

function createEntity(container, payload, extra = {}) {
  const entity = { id: uuid(), createdAt: new Date().toISOString(), ...payload, ...extra };
  container.set(entity.id, entity);
  return entity;
}

app.get("/health", (_, res) => ok(res, { message: "ok" }));

// Auth API
app.get("/api/auth/user", (req, res) => ok(res, { user: getUser(req) }));
app.post("/api/auth/signup-bonus", (req, res) => {
  const user = getUser(req);
  const wallet = db.points.get(user.id);
  wallet.balance += 500;
  wallet.history.push({ id: uuid(), type: "signup_bonus", amount: 500, at: new Date().toISOString() });
  ok(res, { balance: wallet.balance });
});
app.post("/api/agree-terms", (req, res) => {
  const user = getUser(req);
  user.agreedTerms = true;
  ok(res, { agreedTerms: true });
});

// Profile API
app.get("/api/profile", (req, res) => ok(res, { profile: db.profiles.get(getUser(req).id) }));
app.patch("/api/profile", (req, res) => {
  const user = getUser(req);
  const profile = { ...db.profiles.get(user.id), ...req.body, userId: user.id };
  db.profiles.set(user.id, profile);
  ok(res, { profile });
});
app.get("/api/profile/stats", (req, res) => {
  const user = getUser(req);
  const myGroups = listFromMap(db.groups).filter((g) => g.members?.includes(user.id));
  const myClasses = listFromMap(db.classes).filter((c) => c.students?.includes(user.id));
  ok(res, { stats: { groups: myGroups.length, classes: myClasses.length, points: db.points.get(user.id)?.balance || 0 } });
});

app.post("/api/upload", (req, res) => {
  const fileName = req.body.fileName || `upload-${Date.now()}.jpg`;
  ok(res, { secure_url: `https://res.cloudinary.com/demo/image/upload/${fileName}`, public_id: uuid() });
});

// Groups API
app.get("/api/groups", (req, res) => {
  const { category, q } = req.query;
  let groups = listFromMap(db.groups);
  if (category) groups = groups.filter((g) => g.category === category);
  if (q) groups = groups.filter((g) => g.name?.toLowerCase().includes(String(q).toLowerCase()));
  ok(res, { groups });
});
app.get("/api/groups/my", (req, res) => {
  const user = getUser(req);
  ok(res, { groups: listFromMap(db.groups).filter((g) => g.members?.includes(user.id)) });
});
app.get("/api/groups/:id", (req, res) => {
  const g = db.groups.get(req.params.id);
  if (!g) return notFound(res, "Group not found");
  ok(res, { group: g });
});
app.post("/api/groups", (req, res) => {
  const user = getUser(req);
  const group = createEntity(db.groups, req.body, { leaderId: user.id, members: [user.id], roles: { [user.id]: "leader" }, announcements: [], events: [], messages: [], board: [], photos: [] });
  ok(res, { group });
});
app.patch("/api/groups/:id", (req, res) => {
  const group = db.groups.get(req.params.id);
  if (!group) return notFound(res, "Group not found");
  const next = { ...group, ...req.body, id: group.id };
  db.groups.set(group.id, next);
  ok(res, { group: next });
});
app.delete("/api/groups/:id", (req, res) => ok(res, { deleted: db.groups.delete(req.params.id) }));
app.post("/api/groups/:id/join", (req, res) => {
  const user = getUser(req);
  const group = db.groups.get(req.params.id);
  if (!group) return notFound(res, "Group not found");
  if (!group.members.includes(user.id)) group.members.push(user.id);
  group.roles[user.id] = group.roles[user.id] || "member";
  ok(res, { group });
});
app.post("/api/groups/:id/leave", (req, res) => {
  const user = getUser(req);
  const group = db.groups.get(req.params.id);
  if (!group) return notFound(res, "Group not found");
  group.members = group.members.filter((id) => id !== user.id);
  delete group.roles[user.id];
  ok(res, { group });
});
app.post("/api/groups/:id/kick/:userId", (req, res) => {
  const group = db.groups.get(req.params.id);
  if (!group) return notFound(res, "Group not found");
  group.members = group.members.filter((id) => id !== req.params.userId);
  delete group.roles[req.params.userId];
  ok(res, { group });
});
app.post("/api/groups/:id/role/:userId", (req, res) => {
  const group = db.groups.get(req.params.id);
  if (!group) return notFound(res, "Group not found");
  group.roles[req.params.userId] = req.body.role || "manager";
  ok(res, { roles: group.roles });
});
app.post("/api/groups/:groupId/transfer-leader/:userId", (req, res) => {
  const group = db.groups.get(req.params.groupId);
  if (!group) return notFound(res, "Group not found");
  group.leaderId = req.params.userId;
  group.roles[req.params.userId] = "leader";
  ok(res, { group });
});

// Group announcements / events / messages / board / photos
app.get("/api/groups/:id/announcements", (req, res) => {
  const g = db.groups.get(req.params.id);
  if (!g) return notFound(res, "Group not found");
  ok(res, { announcements: g.announcements || [] });
});
app.post("/api/groups/:id/announcements", (req, res) => {
  const g = db.groups.get(req.params.id);
  if (!g) return notFound(res, "Group not found");
  const item = { id: uuid(), ...req.body, createdAt: new Date().toISOString() };
  g.announcements.push(item);
  ok(res, { announcement: item });
});
app.delete("/api/groups/:id/announcements/:announcementId", (req, res) => {
  const g = db.groups.get(req.params.id);
  if (!g) return notFound(res, "Group not found");
  g.announcements = g.announcements.filter((x) => x.id !== req.params.announcementId);
  ok(res);
});

app.get("/api/groups/:groupId/events", (req, res) => {
  const g = db.groups.get(req.params.groupId);
  if (!g) return notFound(res, "Group not found");
  ok(res, { events: g.events || [] });
});
app.get("/api/groups/:groupId/events/:eventId", (req, res) => {
  const g = db.groups.get(req.params.groupId);
  const ev = g?.events.find((e) => e.id === req.params.eventId);
  if (!ev) return notFound(res, "Event not found");
  ok(res, { event: ev });
});
app.post("/api/groups/:groupId/events", (req, res) => {
  const g = db.groups.get(req.params.groupId);
  if (!g) return notFound(res, "Group not found");
  const ev = { id: uuid(), attendees: [], ...req.body };
  g.events.push(ev);
  ok(res, { event: ev });
});
app.patch("/api/groups/:groupId/events/:eventId", (req, res) => {
  const g = db.groups.get(req.params.groupId);
  if (!g) return notFound(res, "Group not found");
  g.events = g.events.map((e) => (e.id === req.params.eventId ? { ...e, ...req.body } : e));
  ok(res, { events: g.events });
});
app.delete("/api/groups/:groupId/events/:eventId", (req, res) => {
  const g = db.groups.get(req.params.groupId);
  if (!g) return notFound(res, "Group not found");
  g.events = g.events.filter((e) => e.id !== req.params.eventId);
  ok(res);
});
app.post("/api/groups/:groupId/events/:eventId/attend", (req, res) => {
  const user = getUser(req);
  const g = db.groups.get(req.params.groupId);
  const ev = g?.events.find((e) => e.id === req.params.eventId);
  if (!ev) return notFound(res, "Event not found");
  if (!ev.attendees.includes(user.id)) ev.attendees.push(user.id);
  ok(res, { attendees: ev.attendees });
});

app.get("/api/groups/:id/messages", (req, res) => {
  const g = db.groups.get(req.params.id);
  if (!g) return notFound(res, "Group not found");
  ok(res, { messages: g.messages || [] });
});
app.post("/api/groups/:id/messages", (req, res) => {
  const user = getUser(req);
  const g = db.groups.get(req.params.id);
  if (!g) return notFound(res, "Group not found");
  const msg = { id: uuid(), userId: user.id, text: req.body.text || "", createdAt: new Date().toISOString() };
  g.messages.push(msg);
  const room = `group:${req.params.id}`;
  broadcast(room, { type: "new_message", room, message: msg });
  ok(res, { message: msg });
});
app.delete("/api/groups/:id/messages/:messageId", (req, res) => {
  const g = db.groups.get(req.params.id);
  if (!g) return notFound(res, "Group not found");
  g.messages = g.messages.filter((m) => m.id !== req.params.messageId);
  const room = `group:${req.params.id}`;
  broadcast(room, { type: "delete_message", room, id: req.params.messageId });
  ok(res);
});

app.get("/api/groups/:groupId/board", (req, res) => {
  const g = db.groups.get(req.params.groupId);
  if (!g) return notFound(res, "Group not found");
  ok(res, { posts: g.board || [] });
});
app.get("/api/groups/:groupId/board/:postId", (req, res) => {
  const g = db.groups.get(req.params.groupId);
  const post = g?.board.find((p) => p.id === req.params.postId);
  if (!post) return notFound(res, "Post not found");
  ok(res, { post });
});
app.post("/api/groups/:groupId/board", (req, res) => {
  const user = getUser(req);
  const g = db.groups.get(req.params.groupId);
  if (!g) return notFound(res, "Group not found");
  const post = { id: uuid(), userId: user.id, likes: [], comments: [], pinned: false, ...req.body };
  g.board.push(post);
  ok(res, { post });
});
app.patch("/api/groups/:groupId/board/:postId", (req, res) => {
  const g = db.groups.get(req.params.groupId);
  if (!g) return notFound(res, "Group not found");
  g.board = g.board.map((p) => (p.id === req.params.postId ? { ...p, ...req.body } : p));
  ok(res);
});
app.delete("/api/groups/:groupId/board/:postId", (req, res) => {
  const g = db.groups.get(req.params.groupId);
  if (!g) return notFound(res, "Group not found");
  g.board = g.board.filter((p) => p.id !== req.params.postId);
  ok(res);
});
app.patch("/api/groups/:groupId/board/:postId/pin", (req, res) => {
  const g = db.groups.get(req.params.groupId);
  const p = g?.board.find((x) => x.id === req.params.postId);
  if (!p) return notFound(res, "Post not found");
  p.pinned = !p.pinned;
  ok(res, { pinned: p.pinned });
});
app.post("/api/board/:postId/comments", (req, res) => {
  const user = getUser(req);
  for (const g of db.groups.values()) {
    const p = g.board.find((x) => x.id === req.params.postId);
    if (p) {
      const c = { id: uuid(), userId: user.id, text: req.body.text || "" };
      p.comments.push(c);
      return ok(res, { comment: c });
    }
  }
  return notFound(res, "Post not found");
});
app.delete("/api/board/comments/:commentId", (req, res) => {
  for (const g of db.groups.values()) {
    for (const p of g.board) {
      const before = p.comments.length;
      p.comments = p.comments.filter((c) => c.id !== req.params.commentId);
      if (before !== p.comments.length) return ok(res);
    }
  }
  return notFound(res, "Comment not found");
});
app.post("/api/board/:postId/like", (req, res) => {
  const user = getUser(req);
  for (const g of db.groups.values()) {
    const p = g.board.find((x) => x.id === req.params.postId);
    if (p) {
      p.likes = p.likes || [];
      p.likes = p.likes.includes(user.id) ? p.likes.filter((id) => id !== user.id) : [...p.likes, user.id];
      return ok(res, { likes: p.likes.length });
    }
  }
  return notFound(res, "Post not found");
});

app.get("/api/groups/:groupId/photos", (req, res) => {
  const g = db.groups.get(req.params.groupId);
  if (!g) return notFound(res, "Group not found");
  ok(res, { photos: g.photos || [] });
});
app.post("/api/groups/:groupId/photos", (req, res) => {
  const g = db.groups.get(req.params.groupId);
  if (!g) return notFound(res, "Group not found");
  const photo = { id: uuid(), url: req.body.url, caption: req.body.caption || "" };
  g.photos.push(photo);
  ok(res, { photo });
});
app.delete("/api/groups/:groupId/photos/:photoId", (req, res) => {
  const g = db.groups.get(req.params.groupId);
  if (!g) return notFound(res, "Group not found");
  g.photos = g.photos.filter((p) => p.id !== req.params.photoId);
  ok(res);
});

// Classes API
app.get("/api/classes", (_, res) => ok(res, { classes: listFromMap(db.classes) }));
app.get("/api/classes/mine", (req, res) => {
  const user = getUser(req);
  ok(res, { classes: listFromMap(db.classes).filter((c) => c.ownerId === user.id || c.students?.includes(user.id)) });
});
app.get("/api/classes/:id", (req, res) => {
  const c = db.classes.get(req.params.id);
  if (!c) return notFound(res, "Class not found");
  ok(res, { class: c });
});
app.post("/api/classes", (req, res) => {
  const user = getUser(req);
  const c = createEntity(db.classes, req.body, { ownerId: user.id, students: [], messages: [], board: [], reviews: [] });
  ok(res, { class: c });
});
app.patch("/api/classes/:id", (req, res) => {
  const c = db.classes.get(req.params.id);
  if (!c) return notFound(res, "Class not found");
  const next = { ...c, ...req.body };
  db.classes.set(c.id, next);
  ok(res, { class: next });
});
app.delete("/api/classes/:id", (req, res) => ok(res, { deleted: db.classes.delete(req.params.id) }));
app.post("/api/classes/:id/enroll", (req, res) => {
  const user = getUser(req);
  const c = db.classes.get(req.params.id);
  if (!c) return notFound(res, "Class not found");
  if (!c.students.includes(user.id)) c.students.push(user.id);
  ok(res, { students: c.students });
});
app.post("/api/classes/:id/unenroll", (req, res) => {
  const user = getUser(req);
  const c = db.classes.get(req.params.id);
  if (!c) return notFound(res, "Class not found");
  c.students = c.students.filter((x) => x !== user.id);
  ok(res, { students: c.students });
});
app.delete("/api/classes/:id/enrollments/:userId", (req, res) => {
  const c = db.classes.get(req.params.id);
  if (!c) return notFound(res, "Class not found");
  c.students = c.students.filter((x) => x !== req.params.userId);
  ok(res, { students: c.students });
});

app.get("/api/classes/:id/messages", (req, res) => {
  const c = db.classes.get(req.params.id);
  if (!c) return notFound(res, "Class not found");
  ok(res, { messages: c.messages });
});
app.post("/api/classes/:id/messages", (req, res) => {
  const user = getUser(req);
  const c = db.classes.get(req.params.id);
  if (!c) return notFound(res, "Class not found");
  const msg = { id: uuid(), userId: user.id, text: req.body.text || "", createdAt: new Date().toISOString() };
  c.messages.push(msg);
  const room = `class:${req.params.id}`;
  broadcast(room, { type: "new_message", room, message: msg });
  ok(res, { message: msg });
});
app.delete("/api/classes/:id/messages/:msgId", (req, res) => {
  const c = db.classes.get(req.params.id);
  if (!c) return notFound(res, "Class not found");
  c.messages = c.messages.filter((m) => m.id !== req.params.msgId);
  const room = `class:${req.params.id}`;
  broadcast(room, { type: "delete_message", room, id: req.params.msgId });
  ok(res);
});

app.get("/api/classes/:id/board", (req, res) => {
  const c = db.classes.get(req.params.id);
  if (!c) return notFound(res, "Class not found");
  ok(res, { posts: c.board });
});
app.get("/api/classes/:id/board/:postId", (req, res) => {
  const c = db.classes.get(req.params.id);
  const p = c?.board.find((x) => x.id === req.params.postId);
  if (!p) return notFound(res, "Post not found");
  ok(res, { post: p });
});
app.post("/api/classes/:id/board", (req, res) => {
  const user = getUser(req);
  const c = db.classes.get(req.params.id);
  if (!c) return notFound(res, "Class not found");
  const p = { id: uuid(), userId: user.id, likes: [], comments: [], ...req.body };
  c.board.push(p);
  ok(res, { post: p });
});
app.delete("/api/classes/:id/board/:postId", (req, res) => {
  const c = db.classes.get(req.params.id);
  if (!c) return notFound(res, "Class not found");
  c.board = c.board.filter((p) => p.id !== req.params.postId);
  ok(res);
});
app.post("/api/classes/:id/board/:postId/like", (req, res) => {
  const user = getUser(req);
  const c = db.classes.get(req.params.id);
  const p = c?.board.find((x) => x.id === req.params.postId);
  if (!p) return notFound(res, "Post not found");
  p.likes = p.likes.includes(user.id) ? p.likes.filter((x) => x !== user.id) : [...p.likes, user.id];
  ok(res, { likes: p.likes.length });
});
app.post("/api/classes/:id/board/:postId/comments", (req, res) => {
  const user = getUser(req);
  const c = db.classes.get(req.params.id);
  const p = c?.board.find((x) => x.id === req.params.postId);
  if (!p) return notFound(res, "Post not found");
  const comment = { id: uuid(), userId: user.id, text: req.body.text || "" };
  p.comments.push(comment);
  ok(res, { comment });
});
app.delete("/api/classes/board/comments/:commentId", (req, res) => {
  for (const c of db.classes.values()) {
    for (const p of c.board) {
      p.comments = p.comments.filter((x) => x.id !== req.params.commentId);
    }
  }
  ok(res);
});

app.get("/api/classes/:id/reviews", (req, res) => {
  const c = db.classes.get(req.params.id);
  if (!c) return notFound(res, "Class not found");
  ok(res, { reviews: c.reviews || [] });
});
app.post("/api/classes/:id/reviews", (req, res) => {
  const user = getUser(req);
  const c = db.classes.get(req.params.id);
  if (!c) return notFound(res, "Class not found");
  const review = { id: uuid(), userId: user.id, likes: [], comments: [], ...req.body };
  c.reviews.push(review);
  ok(res, { review });
});
app.delete("/api/classes/:id/reviews/:reviewId", (req, res) => {
  const c = db.classes.get(req.params.id);
  if (!c) return notFound(res, "Class not found");
  c.reviews = c.reviews.filter((r) => r.id !== req.params.reviewId);
  ok(res);
});
app.post("/api/classes/reviews/:reviewId/like", (req, res) => {
  const user = getUser(req);
  for (const c of db.classes.values()) {
    const r = c.reviews.find((x) => x.id === req.params.reviewId);
    if (r) {
      r.likes = r.likes.includes(user.id) ? r.likes.filter((x) => x !== user.id) : [...r.likes, user.id];
      return ok(res, { likes: r.likes.length });
    }
  }
  return notFound(res, "Review not found");
});
app.post("/api/classes/reviews/:reviewId/comments", (req, res) => {
  const user = getUser(req);
  for (const c of db.classes.values()) {
    const r = c.reviews.find((x) => x.id === req.params.reviewId);
    if (r) {
      const comment = { id: uuid(), userId: user.id, text: req.body.text || "" };
      r.comments.push(comment);
      return ok(res, { comment });
    }
  }
  return notFound(res, "Review not found");
});
app.delete("/api/classes/reviews/comments/:commentId", (req, res) => {
  for (const c of db.classes.values()) {
    for (const r of c.reviews) {
      r.comments = r.comments.filter((x) => x.id !== req.params.commentId);
    }
  }
  ok(res);
});

// DM API
app.get("/api/dm/conversations", (req, res) => {
  const user = getUser(req);
  const conversations = db.dms.filter((d) => d.from === user.id || d.to === user.id);
  ok(res, { conversations });
});
app.get("/api/dm/unread", (req, res) => {
  const user = getUser(req);
  const unread = db.dms.filter((d) => d.to === user.id && !d.read).length;
  ok(res, { unread });
});
app.get("/api/dm/:userId", (req, res) => {
  const me = getUser(req).id;
  const peer = req.params.userId;
  const messages = db.dms.filter((d) => (d.from === me && d.to === peer) || (d.from === peer && d.to === me));
  ok(res, { messages });
});
app.post("/api/dm/:userId", (req, res) => {
  const me = getUser(req).id;
  const peer = req.params.userId;
  const message = { id: uuid(), from: me, to: peer, text: req.body.text || "", read: false, createdAt: new Date().toISOString() };
  db.dms.push(message);
  const room = `dm:${roomNameDM(me, peer)}`;
  broadcast(room, { type: "new_dm", room, message });
  ok(res, { message });
});
app.delete("/api/dm/messages/:id", (req, res) => {
  db.dms = db.dms.filter((m) => m.id !== req.params.id);
  ok(res);
});

// Points/Referrals/Store
app.get("/api/points", (req, res) => ok(res, { balance: db.points.get(getUser(req).id)?.balance || 0 }));
app.get("/api/points/history", (req, res) => ok(res, { history: db.points.get(getUser(req).id)?.history || [] }));
app.get("/api/points/ledger", (req, res) => ok(res, { ledger: db.points.get(getUser(req).id) || { balance: 0, history: [] } }));
app.post("/api/points/donate", (req, res) => {
  const user = getUser(req);
  const wallet = db.points.get(user.id);
  const amount = Number(req.body.amount || 0);
  if (amount <= 0 || wallet.balance < amount) return res.status(400).json({ ok: false, message: "Invalid amount" });
  wallet.balance -= amount;
  wallet.history.push({ id: uuid(), type: "donate", amount: -amount, at: new Date().toISOString(), to: req.body.to || "charity" });
  ok(res, { balance: wallet.balance });
});

app.get("/api/referrals/code", (req, res) => {
  const user = getUser(req);
  const code = `REF-${user.id.toUpperCase()}`;
  if (!db.referrals.has(user.id)) db.referrals.set(user.id, { code, referred: [] });
  ok(res, { code });
});
app.get("/api/referrals", (req, res) => {
  const user = getUser(req);
  ok(res, { referrals: db.referrals.get(user.id)?.referred || [] });
});
app.post("/api/referrals/apply", (req, res) => {
  const user = getUser(req);
  ok(res, { appliedBy: user.id, code: req.body.code, success: true });
});

app.post("/api/barcode/generate", (req, res) => ok(res, { token: `pay_${uuid()}`, expiresInSec: 300, amount: req.body.amount || 0 }));
app.post("/api/store/validate-token", (req, res) => ok(res, { valid: String(req.body.token || "").startsWith("pay_") }));
app.post("/api/store/process", (req, res) => {
  const user = getUser(req);
  const wallet = db.points.get(user.id);
  const amount = Number(req.body.amount || 0);
  if (amount <= 0 || wallet.balance < amount) return res.status(400).json({ ok: false, message: "Insufficient points" });
  wallet.balance -= amount;
  const tx = { id: uuid(), userId: user.id, amount, storeId: req.body.storeId || "store-1", createdAt: new Date().toISOString() };
  db.transactions.push(tx);
  wallet.history.push({ id: uuid(), type: "store_payment", amount: -amount, at: tx.createdAt });
  ok(res, { transaction: tx, balance: wallet.balance });
});
app.get("/api/store/my-transactions", (req, res) => ok(res, { transactions: db.transactions.filter((t) => t.userId === getUser(req).id) }));
app.get("/api/stores", (_, res) => ok(res, { stores: listFromMap(db.stores) }));
app.get("/api/my-stores", (req, res) => {
  const user = getUser(req);
  ok(res, { stores: listFromMap(db.stores).filter((s) => s.ownerId === user.id) });
});

// Leaderboard / Instructor / Translate/GIF / Ads
app.get("/api/leaders/check", (req, res) => ok(res, { isLeader: ["leader", "admin"].includes(getUser(req).role) }));
app.get("/api/leaders/posts", (_, res) => ok(res, { posts: listFromMap(db.leaderPosts) }));
app.get("/api/leaders/posts/:id", (req, res) => {
  const p = db.leaderPosts.get(req.params.id);
  if (!p) return notFound(res, "Post not found");
  ok(res, { post: p });
});
app.post("/api/leaders/posts", (req, res) => ok(res, { post: createEntity(db.leaderPosts, { ...req.body, comments: [] }) }));
app.post("/api/leaders/posts/:id/comments", (req, res) => {
  const p = db.leaderPosts.get(req.params.id);
  if (!p) return notFound(res, "Post not found");
  const comment = { id: uuid(), text: req.body.text || "" };
  p.comments.push(comment);
  ok(res, { comment });
});
app.delete("/api/leaders/posts/:id", (req, res) => ok(res, { deleted: db.leaderPosts.delete(req.params.id) }));

app.get("/api/instructor-application/mine", (req, res) => {
  const user = getUser(req);
  ok(res, { application: db.instructorApplications.get(user.id) || null });
});
app.post("/api/instructor-application", (req, res) => {
  const user = getUser(req);
  const appData = { id: uuid(), userId: user.id, status: "pending", ...req.body };
  db.instructorApplications.set(user.id, appData);
  ok(res, { application: appData });
});

app.post("/api/translate", (req, res) => {
  const translated = `[${req.body.target || "en"}] ${req.body.text || ""}`;
  ok(res, { translatedText: translated, provider: "deepl-compatible-mock", rateLimited: false });
});
app.get("/api/gifs/search", (req, res) => {
  const q = req.query.q || "fun";
  const gifs = [1, 2, 3].map((n) => ({ id: `${q}-${n}`, url: `https://media.giphy.com/media/${q}${n}/giphy.gif` }));
  ok(res, { gifs });
});

app.get("/api/ad-requests/mine", (req, res) => {
  const user = getUser(req);
  ok(res, { adRequests: listFromMap(db.ads).filter((a) => a.userId === user.id) });
});
app.get("/api/ad-requests/mine/stats", (req, res) => {
  const user = getUser(req);
  const mine = listFromMap(db.ads).filter((a) => a.userId === user.id);
  ok(res, { stats: { total: mine.length, approved: mine.filter((x) => x.status === "approved").length } });
});

// Admin API
app.get("/api/admin/check", requireAdmin, (_, res) => ok(res, { isAdmin: true }));
app.get("/api/admin/admins", requireAdmin, (_, res) => ok(res, { admins: Array.from(db.admins) }));
app.post("/api/admin/admins", requireAdmin, (req, res) => {
  db.admins.add(req.body.userId);
  ok(res, { admins: Array.from(db.admins) });
});
app.delete("/api/admin/admins/:id", requireAdmin, (req, res) => ok(res, { deleted: db.admins.delete(req.params.id) }));
app.get("/api/admin/stats", requireAdmin, (_, res) => ok(res, { stats: { users: db.users.size, groups: db.groups.size, classes: db.classes.size, stores: db.stores.size } }));
app.get("/api/admin/users", requireAdmin, (_, res) => ok(res, { users: listFromMap(db.users) }));
app.post("/api/admin/users/:id/role", requireAdmin, (req, res) => {
  const u = db.users.get(req.params.id);
  if (!u) return notFound(res, "User not found");
  u.role = req.body.role;
  ok(res, { user: u });
});
app.get("/api/admin/groups", requireAdmin, (_, res) => ok(res, { groups: listFromMap(db.groups) }));
app.delete("/api/admin/groups/:id", requireAdmin, (req, res) => ok(res, { deleted: db.groups.delete(req.params.id) }));
app.get("/api/admin/classes", requireAdmin, (_, res) => ok(res, { classes: listFromMap(db.classes) }));
app.post("/api/admin/classes", requireAdmin, (req, res) => ok(res, { class: createEntity(db.classes, req.body, { students: [], board: [], messages: [], reviews: [] }) }));
app.post("/api/admin/classes/:id/review", requireAdmin, (req, res) => {
  const c = db.classes.get(req.params.id);
  if (!c) return notFound(res, "Class not found");
  c.reviewStatus = req.body.status || "approved";
  ok(res, { class: c });
});
app.post("/api/admin/classes/:id/confirm-payment", requireAdmin, (req, res) => {
  const c = db.classes.get(req.params.id);
  if (!c) return notFound(res, "Class not found");
  c.paymentConfirmed = true;
  ok(res, { class: c });
});
app.delete("/api/admin/classes/:id", requireAdmin, (req, res) => ok(res, { deleted: db.classes.delete(req.params.id) }));
app.get("/api/admin/banner-stats", requireAdmin, (_, res) => ok(res, { stats: { impressions: 0, clicks: 0 } }));

const banners = new Map();
app.post("/api/admin/banners", requireAdmin, (req, res) => ok(res, { banner: createEntity(banners, req.body) }));
app.put("/api/admin/banners/:id", requireAdmin, (req, res) => {
  const b = banners.get(req.params.id);
  if (!b) return notFound(res, "Banner not found");
  const next = { ...b, ...req.body };
  banners.set(req.params.id, next);
  ok(res, { banner: next });
});
app.delete("/api/admin/banners/:id", requireAdmin, (req, res) => ok(res, { deleted: banners.delete(req.params.id) }));

app.get("/api/admin/referrals", requireAdmin, (_, res) => ok(res, { referrals: listFromMap(db.referrals) }));
app.get("/api/admin/ad-requests", requireAdmin, (_, res) => ok(res, { adRequests: listFromMap(db.ads) }));
app.post("/api/admin/ad-requests/:id/review", requireAdmin, (req, res) => {
  const ad = db.ads.get(req.params.id);
  if (!ad) return notFound(res, "Ad request not found");
  ad.status = req.body.status || "approved";
  ok(res, { ad });
});
app.post("/api/admin/points/grant", requireAdmin, (req, res) => {
  const wallet = db.points.get(req.body.userId) || { balance: 0, history: [] };
  wallet.balance += Number(req.body.amount || 0);
  wallet.history.push({ id: uuid(), type: "grant", amount: Number(req.body.amount || 0), by: getUser(req).id, at: new Date().toISOString() });
  db.points.set(req.body.userId, wallet);
  ok(res, { wallet });
});
app.get("/api/admin/instructor-applications", requireAdmin, (_, res) => ok(res, { applications: listFromMap(db.instructorApplications) }));
app.post("/api/admin/instructor-applications/:id/review", requireAdmin, (req, res) => {
  const appData = db.instructorApplications.get(req.params.id);
  if (!appData) return notFound(res, "Application not found");
  appData.status = req.body.status || "approved";
  ok(res, { application: appData });
});
app.get("/api/admin/stores", requireAdmin, (_, res) => ok(res, { stores: listFromMap(db.stores) }));
app.post("/api/admin/stores", requireAdmin, (req, res) => ok(res, { store: createEntity(db.stores, req.body) }));
app.put("/api/admin/stores/:id", requireAdmin, (req, res) => {
  const s = db.stores.get(req.params.id);
  if (!s) return notFound(res, "Store not found");
  const next = { ...s, ...req.body };
  db.stores.set(s.id, next);
  ok(res, { store: next });
});
app.delete("/api/admin/stores/:id", requireAdmin, (req, res) => ok(res, { deleted: db.stores.delete(req.params.id) }));
app.get("/api/admin/store-transactions", requireAdmin, (_, res) => ok(res, { transactions: db.transactions }));
app.get("/api/admin/settlements", requireAdmin, (_, res) => ok(res, { settlements: [] }));
app.post("/api/admin/settlements/generate", requireAdmin, (_, res) => ok(res, { settlementId: uuid(), status: "generated" }));
app.get("/api/site-content", (_, res) => ok(res, { content: db.siteContent }));
app.put("/api/admin/site-content", requireAdmin, (req, res) => {
  db.siteContent = { ...db.siteContent, ...req.body };
  ok(res, { content: db.siteContent });
});
app.delete("/api/admin/reset-class-data", requireAdmin, (_, res) => {
  db.classes.clear();
  ok(res, { reset: true });
});

const server = createServer(app);
const wss = new WebSocketServer({ server, path: "/ws" });

wss.on("connection", (ws) => {
  wsMeta.set(ws, new Set());

  ws.on("message", (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      if (msg.type === "join" && msg.room) {
        if (!wsRooms.has(msg.room)) wsRooms.set(msg.room, new Set());
        wsRooms.get(msg.room).add(ws);
        wsMeta.get(ws).add(msg.room);
      }
      if (msg.type === "leave" && msg.room) {
        wsRooms.get(msg.room)?.delete(ws);
        wsMeta.get(ws)?.delete(msg.room);
      }
    } catch (e) {
      ws.send(JSON.stringify({ ok: false, message: "Invalid JSON" }));
    }
  });

  ws.on("close", () => {
    const rooms = wsMeta.get(ws) || [];
    for (const room of rooms) wsRooms.get(room)?.delete(ws);
    wsMeta.delete(ws);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Grow SoMoim API listening on http://localhost:${PORT}`);
});
