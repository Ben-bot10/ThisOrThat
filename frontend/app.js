import { api } from "./api.js";

const { createApp, reactive, computed, onMounted, onUnmounted } = Vue;
const { createRouter, createWebHashHistory } = VueRouter;

const store = reactive({
  user: JSON.parse(localStorage.getItem("user") || "null"),
  polls: [],
  quizzes: [],
  loading: false,
  error: null,
  mode: "polls",
  toasts: [],
  searchQuery: "",
  categoryFilter: "all"
});

const CATEGORIES = ["General", "Tech", "Food", "Travel", "Sports", "Entertainment", "Science", "Other"];
const MAX_IMAGE_BYTES = 1_000_000;
const AVATAR_COLORS = ["#ef4444","#f59e0b","#10b981","#3b82f6","#8b5cf6","#ec4899","#14b8a6","#f97316"];

function freshPoll() {
  return { question: "", type: "text-text", category: "General", optionAText: "", optionBText: "", optionAImageUrl: "", optionBImageUrl: "", endsAt: "" };
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Failed to read image file."));
    reader.readAsDataURL(file);
  });
}

function handleImageFile(event, target, key) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  if (file.size > MAX_IMAGE_BYTES) {
    toast("Image must be under 1 MB.", "error");
    event.target.value = "";
    return;
  }
  readFileAsDataUrl(file).then(url => { target[key] = url; }).catch(e => toast(e.message, "error"));
}

function avatarColor(name) {
  let h = 0;
  for (let i = 0; i < (name || "").length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function avatarInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return parts.length > 1 ? (parts[0][0] + parts[1][0]).toUpperCase() : name.slice(0, 2).toUpperCase();
}

function setSession(data) {
  localStorage.setItem("token", data.token);
  localStorage.setItem("user", JSON.stringify(data.user));
  store.user = data.user;
}

function clearSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  store.user = null;
}

let toastId = 0;
function toast(message, type = "info") {
  const id = ++toastId;
  store.toasts.push({ id, message, type });
  setTimeout(() => {
    const t = store.toasts.find(t => t.id === id);
    if (t) t.leaving = true;
    setTimeout(() => { store.toasts = store.toasts.filter(t => t.id !== id); }, 350);
  }, 3000);
}

async function loadInto(key, fetcher) {
  store.loading = true;
  store.error = null;
  try {
    const data = await fetcher();
    if (key === "polls") {
      const seen = new Set();
      store.polls = data.filter(p => { if (seen.has(p.id)) return false; seen.add(p.id); return true; });
    } else {
      store[key] = data;
    }
  } catch (e) { store.error = e.message; }
  finally { store.loading = false; }
}

const refreshPolls = () => loadInto("polls", api.getPolls);
const refreshQuizzes = () => loadInto("quizzes", api.getQuizzes);

function countdownText(endsAt) {
  if (!endsAt) return null;
  const diff = new Date(endsAt) - Date.now();
  if (diff <= 0) return null;
  const h = Math.floor(diff / 3600000), m = Math.floor((diff % 3600000) / 60000);
  if (h > 24) return Math.floor(h / 24) + "d left";
  if (h > 0) return h + "h " + m + "m left";
  return m + "m left";
}

function sharePoll(pollId, question) {
  const url = window.location.origin + window.location.pathname + "#/poll/" + pollId;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(url).then(() => toast("Link copied!", "success"));
  }
}

function shareTwitter(pollId, question) {
  const url = window.location.origin + window.location.pathname + "#/poll/" + pollId;
  window.open("https://twitter.com/intent/tweet?text=" + encodeURIComponent(question + " — vote now!") + "&url=" + encodeURIComponent(url), "_blank");
}

function shareWhatsApp(pollId, question) {
  const url = window.location.origin + window.location.pathname + "#/poll/" + pollId;
  window.open("https://wa.me/?text=" + encodeURIComponent(question + " " + url), "_blank");
}

const AppLayout = {
  template: `
    <div>
      <header>
        <div class="container nav">
          <div class="nav-links">
            <a href="#/">This or That</a>
            <a href="#/feed">Feed</a>
            <a href="#/leaderboard">Leaderboard</a>
            <a href="#/profile">Profile</a>
            <a v-if="store.user?.role === 'admin'" href="#/admin">Admin</a>
          </div>
          <div class="nav-links">
            <button class="theme-switch" :aria-pressed="theme === 'dark'" @click="toggleTheme">
              <span class="icon sun" aria-hidden="true"></span>
              <span class="icon moon" aria-hidden="true"></span>
              <span class="switch-thumb" aria-hidden="true"></span>
            </button>
            <template v-if="store.user">
              <span class="avatar" :style="{ background: avatarColor(store.user.name || store.user.email) }">{{ avatarInitials(store.user.name || store.user.email) }}</span>
              <span>{{ store.user.name || store.user.username || store.user.email }}</span>
              <button class="btn secondary" @click="logout">Logout</button>
            </template>
            <a v-else href="#/login" class="btn">Login</a>
          </div>
        </div>
      </header>
      <router-view></router-view>
      <div class="toast-container">
        <div v-for="t in store.toasts" :key="t.id" class="toast" :class="[t.type, t.leaving ? 'leaving' : '']">{{ t.message }}</div>
      </div>
    </div>
  `,
  setup() {
    const theme = Vue.ref(localStorage.getItem("theme") || "light");
    function applyTheme(t) { theme.value = t; localStorage.setItem("theme", t); document.body.classList.toggle("theme-dark", t === "dark"); }
    function toggleTheme() { applyTheme(theme.value === "dark" ? "light" : "dark"); }
    onMounted(() => applyTheme(theme.value));
    return { store, theme, toggleTheme, avatarColor, avatarInitials, logout() { clearSession(); } };
  }
};

const LandingPage = {
  template: `
    <section class="hero">
      <div class="container grid two">
        <div>
          <span class="pill">Live polls + realtime results</span>
          <h1>Pick your favorite in seconds.</h1>
          <p class="muted">Vote on text, images, or mixed polls and watch results update live.</p>
          <div style="display:flex; gap:12px; margin-top:20px;">
            <a href="#/feed" class="btn">Explore feed</a>
            <a href="#/login" class="btn secondary">Login / Signup</a>
          </div>
        </div>
        <div class="card">
          <h3>What you can do</h3>
          <div class="list">
            <div>Vote once per poll with instant results</div>
            <div>Publish new polls instantly</div>
            <div>Comment on polls you care about</div>
            <div>Track your voting history</div>
          </div>
        </div>
      </div>
    </section>
  `
};

const LoginPage = {
  template: `
    <section class="section container">
      <div class="card auth-card">
        <div>
          <h2>{{ isSignup ? "Create account" : "Welcome back" }}</h2>
          <p class="muted">{{ isSignup ? "Fill in your details to get started." : "Login with your username or email." }}</p>
        </div>
        <div class="auth-tabs" role="tablist">
          <button class="auth-tab" :class="{ active: !isSignup }" @click="setAuth(false)">Login</button>
          <button class="auth-tab" :class="{ active: isSignup }" @click="setAuth(true)">Sign up</button>
        </div>
        <div v-if="!isSignup">
          <form @submit.prevent="login">
            <input v-model="loginForm.identifier" type="text" placeholder="Username or Email" required autocomplete="username" />
            <input v-model="loginForm.password" type="password" placeholder="Password" required />
            <button class="btn" :disabled="authLoading"><span class="spinner" v-if="authLoading"></span> Login</button>
          </form>
        </div>
        <div v-else>
          <form @submit.prevent="signup">
            <input v-model="signupForm.name" type="text" placeholder="Full Name" required />
            <input v-model="signupForm.username" type="text" placeholder="Username" required />
            <input v-model="signupForm.email" type="email" placeholder="Email" required autocomplete="email" />
            <input v-model="signupForm.age" type="number" placeholder="Age (optional)" min="1" max="150" />
            <input v-model="signupForm.password" type="password" placeholder="Password" required />
            <button class="btn" :disabled="authLoading"><span class="spinner" v-if="authLoading"></span> Create account</button>
          </form>
        </div>
      </div>
    </section>
  `,
  setup() {
    const loginForm = reactive({ identifier: "", password: "" });
    const signupForm = reactive({ name: "", username: "", email: "", age: "", password: "" });
    const isSignup = Vue.ref(false);
    const authLoading = Vue.ref(false);
    async function login() {
      store.error = null; authLoading.value = true;
      try { const d = await api.login(loginForm); setSession(d); fireConfetti(); toast("Welcome back!", "success"); window.location.hash = "#/feed"; }
      catch (e) { toast(e.message, "error"); } finally { authLoading.value = false; }
    }
    async function signup() {
      store.error = null; authLoading.value = true;
      try {
        const p = { name: signupForm.name, username: signupForm.username, email: signupForm.email, password: signupForm.password };
        if (signupForm.age) p.age = parseInt(signupForm.age, 10);
        const d = await api.register(p); setSession(d); fireConfetti(); toast("Account created!", "success"); window.location.hash = "#/feed";
      } catch (e) { toast(e.message, "error"); } finally { authLoading.value = false; }
    }
    function setAuth(v) { isSignup.value = v; store.error = null; }
    return { loginForm, signupForm, login, signup, isSignup, setAuth, authLoading };
  }
};

const FeedPage = {
  template: `
    <section class="section container">
      <div class="mode-tabs">
        <button class="mode-tab" :class="{ active: store.mode === 'polls' }" @click="setMode('polls')">Polls</button>
        <button class="mode-tab" :class="{ active: store.mode === 'quizzes' }" @click="setMode('quizzes')">Quizzes</button>
      </div>

      <div class="card" v-if="store.mode === 'polls'">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
          <div><h2>Voting feed</h2><p class="muted">Vote once per poll. Results update live.</p></div>
          <button class="btn" @click="showPublish = true">Publish poll</button>
        </div>
        <div class="search-bar" style="margin-top:16px;"><input v-model="store.searchQuery" placeholder="Search polls..." /></div>
        <div class="category-filters">
          <button class="category-pill" :class="{ active: store.categoryFilter === 'all' }" @click="store.categoryFilter = 'all'">All</button>
          <button v-for="cat in categories" :key="cat" class="category-pill" :class="{ active: store.categoryFilter === cat }" @click="store.categoryFilter = cat">{{ cat }}</button>
        </div>
        <div v-if="store.loading" class="list">
          <div v-for="n in 3" :key="n" class="card skeleton-card"><div class="skeleton-line"></div><div class="poll-options"><div class="poll-option skeleton-block"></div><div class="poll-option skeleton-block"></div></div></div>
        </div>
        <div class="list" v-if="filteredPolls.length && !store.loading">
          <div v-for="poll in filteredPolls" :key="poll.id" class="card fade-in">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
              <h3>{{ poll.question }}</h3>
              <div style="display:flex; gap:6px; align-items:center;">
                <span class="tag">{{ poll.type }}</span>
                <span class="tag" v-if="poll.category">{{ poll.category }}</span>
                <span class="countdown" :class="{ urgent: isUrgent(poll.endsAt) }" v-if="countdownText(poll.endsAt)">{{ countdownText(poll.endsAt) }}</span>
              </div>
            </div>
            <div class="poll-options">
              <div v-for="opt in ['A','B']" :key="opt" class="poll-option">
                <div><strong>{{ opt }}:</strong> {{ poll['option' + opt].text || 'Image option' }}</div>
                <div v-if="poll['option' + opt].imageUrl" class="image-frame"><img :src="poll['option' + opt].imageUrl" loading="lazy" @load="$event.target.parentElement.classList.add('is-loaded')" @error="$event.target.parentElement.classList.add('is-loaded')" /></div>
                <button class="btn secondary" @click="castVote(poll.id, opt)" :disabled="votingId === poll.id"><span class="spinner" v-if="votingId === poll.id"></span> Vote {{ opt }}</button>
                <div class="bar"><div class="bar-fill" :style="{ width: poll.percents[opt.toLowerCase()] + '%' }"></div></div>
                <div class="muted">{{ poll.percents[opt.toLowerCase()] }}% ({{ poll.votes[opt.toLowerCase()] }})</div>
              </div>
            </div>
            <div class="vote-status" v-if="poll.userVote">You voted {{ poll.userVote }}</div>
            <div style="display:flex; gap:8px; margin-top:10px; align-items:center; flex-wrap:wrap;">
              <a class="btn secondary" :href="'#/poll/' + poll.id">View details</a>
              <div class="share-row">
                <button class="share-btn" @click="sharePoll(poll.id, poll.question)">📋 Copy</button>
                <button class="share-btn" @click="shareTwitter(poll.id, poll.question)">𝕏 Tweet</button>
                <button class="share-btn" @click="shareWhatsApp(poll.id, poll.question)">💬 WhatsApp</button>
              </div>
            </div>
          </div>
        </div>
        <div v-else-if="!store.loading" class="muted">No polls match your filter.</div>
      </div>

      <div class="card" v-if="store.mode === 'quizzes'">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
          <div><h2>Quiz Mode</h2><p class="muted">Test your knowledge with two-option quizzes.</p></div>
          <button class="btn" @click="showQuizCreate = true">Create Quiz</button>
        </div>
        <div v-if="store.loading" class="list" style="margin-top:16px;"><div v-for="n in 3" :key="n" class="card skeleton-card"><div class="skeleton-line"></div><div class="skeleton-line short"></div></div></div>
        <div class="list" v-if="store.quizzes.length && !store.loading" style="margin-top:16px;">
          <div v-for="quiz in store.quizzes" :key="quiz.id" class="card quiz-card fade-in">
            <div style="display:flex; justify-content:space-between; align-items:center;"><h3>{{ quiz.title }}</h3><span class="pill">{{ quiz.question_count }} questions</span></div>
            <p class="muted" v-if="quiz.description">{{ quiz.description }}</p>
            <div style="display:flex; gap:8px; align-items:center; margin-top:8px;">
              <span class="tag" v-if="quiz.is_timed">Timed: {{ Math.floor(quiz.time_limit_seconds / 60) }}min</span>
              <span class="tag" v-else>Untimed</span>
              <span class="avatar small" :style="{ background: avatarColor(quiz.creator_name || quiz.creator_username) }">{{ avatarInitials(quiz.creator_name || quiz.creator_username) }}</span>
              <span class="muted">{{ quiz.creator_name || quiz.creator_username || 'Anonymous' }}</span>
            </div>
            <div style="margin-top:12px;"><a class="btn" :href="'#/quiz/' + quiz.id">Take Quiz</a></div>
          </div>
        </div>
        <div v-else-if="!store.loading" class="muted" style="margin-top:16px;">No quizzes yet.</div>
      </div>

      <div v-if="showPublish" class="modal-backdrop" @click.self="showPublish = false">
        <div class="modal-card card modal-animate">
          <div style="display:flex; justify-content:space-between; align-items:center;"><h3>Publish a poll</h3><button class="btn secondary" @click="showPublish = false">Close</button></div>
          <form @submit.prevent="submitPoll">
            <input v-model="newPoll.question" placeholder="Question" required />
            <select v-model="newPoll.type"><option value="text-text">Text vs Text</option><option value="image-image">Image vs Image</option><option value="text-image">Text vs Image</option></select>
            <select v-model="newPoll.category"><option v-for="c in categories" :key="c" :value="c">{{ c }}</option></select>
            <input v-model="newPoll.optionAText" placeholder="Option A text" />
            <input v-model="newPoll.optionBText" placeholder="Option B text" />
            <input v-model="newPoll.optionAImageUrl" placeholder="Option A image url" />
            <input v-model="newPoll.optionBImageUrl" placeholder="Option B image url" />
            <input type="file" accept="image/*" @change="(e) => handleImageFile(e, newPoll, 'optionAImageUrl')" />
            <input type="file" accept="image/*" @change="(e) => handleImageFile(e, newPoll, 'optionBImageUrl')" />
            <input v-model="newPoll.endsAt" type="datetime-local" />
            <button class="btn" :disabled="isPublishing"><span class="spinner" v-if="isPublishing"></span> Publish poll</button>
          </form>
          <p class="muted" v-if="!store.user">Login to submit polls.</p>
        </div>
      </div>

      <div v-if="showQuizCreate" class="modal-backdrop" @click.self="showQuizCreate = false">
        <div class="modal-card card modal-animate">
          <div style="display:flex; justify-content:space-between; align-items:center;"><h3>Create a Quiz</h3><button class="btn secondary" @click="showQuizCreate = false">Close</button></div>
          <form @submit.prevent="submitQuiz">
            <input v-model="newQuiz.title" placeholder="Quiz Title" required />
            <textarea v-model="newQuiz.description" placeholder="Description (optional)" rows="2"></textarea>
            <div style="display:flex; gap:12px; align-items:center;">
              <label style="display:flex; align-items:center; gap:6px;"><input type="checkbox" v-model="newQuiz.isTimed" /> Timed Quiz</label>
              <input v-if="newQuiz.isTimed" v-model.number="newQuiz.timeLimitSeconds" type="number" placeholder="Time (seconds)" min="30" style="width:140px;" />
            </div>
            <div style="border-top:1px solid var(--glass-border-subtle); padding-top:12px; margin-top:8px;">
              <h4>Questions ({{ newQuiz.questions.length }})</h4>
              <div v-for="(q, idx) in newQuiz.questions" :key="idx" class="card" style="margin-bottom:12px;">
                <div style="display:flex; justify-content:space-between; align-items:center;"><strong>Question {{ idx + 1 }}</strong><button type="button" class="btn secondary" @click="newQuiz.questions.splice(idx, 1)" v-if="newQuiz.questions.length > 1">Remove</button></div>
                <input v-model="q.question" placeholder="Question text" required style="margin-top:8px;" />
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:8px;"><input v-model="q.optionA" placeholder="Option A" required /><input v-model="q.optionB" placeholder="Option B" required /></div>
                <div style="margin-top:8px;"><label style="margin-right:16px;"><input type="radio" :name="'correct-' + idx" value="A" v-model="q.correctOption" required /> A is correct</label><label><input type="radio" :name="'correct-' + idx" value="B" v-model="q.correctOption" required /> B is correct</label></div>
              </div>
              <button type="button" class="btn secondary" @click="newQuiz.questions.push({ question: '', optionA: '', optionB: '', correctOption: 'A' })">+ Add Question</button>
            </div>
            <button class="btn" :disabled="isCreatingQuiz" style="margin-top:12px;"><span class="spinner" v-if="isCreatingQuiz"></span> Create Quiz</button>
          </form>
          <p class="muted" v-if="!store.user">Login to create quizzes.</p>
        </div>
      </div>
    </section>
  `,
  setup() {
    const newPoll = reactive(freshPoll());
    const newQuiz = reactive({ title: "", description: "", isTimed: false, timeLimitSeconds: 300, questions: [{ question: "", optionA: "", optionB: "", correctOption: "A" }] });
    const showPublish = Vue.ref(false);
    const showQuizCreate = Vue.ref(false);
    const isPublishing = Vue.ref(false);
    const isCreatingQuiz = Vue.ref(false);
    const votingId = Vue.ref(null);
    const filteredPolls = computed(() => {
      let list = store.polls;
      if (store.categoryFilter !== "all") list = list.filter(p => p.category === store.categoryFilter);
      if (store.searchQuery.trim()) { const q = store.searchQuery.toLowerCase(); list = list.filter(p => p.question.toLowerCase().includes(q)); }
      return list;
    });
    function setMode(mode) { store.mode = mode; if (mode === "quizzes" && !store.quizzes.length) refreshQuizzes(); }
    function isUrgent(endsAt) { return endsAt && (new Date(endsAt) - Date.now()) < 3600000; }
    async function castVote(pollId, option) {
      if (!store.user) { toast("Login to vote.", "error"); return; }
      try { votingId.value = pollId; const updated = await api.vote(pollId, option); store.polls = store.polls.map(p => p.id === updated.id ? updated : p); fireConfetti(); toast("Vote cast!", "success"); }
      catch (e) { toast(e.message, "error"); } finally { votingId.value = null; }
    }
    async function submitPoll() {
      if (!store.user) { toast("Login to submit a poll.", "error"); return; }
      try { isPublishing.value = true; await api.createPoll({ ...newPoll, endsAt: newPoll.endsAt || null }); Object.assign(newPoll, freshPoll()); showPublish.value = false; await refreshPolls(); fireConfetti(); toast("Poll published!", "success"); }
      catch (e) { toast(e.message, "error"); } finally { isPublishing.value = false; }
    }
    async function submitQuiz() {
      if (!store.user) { toast("Login to create a quiz.", "error"); return; }
      try { isCreatingQuiz.value = true; await api.createQuiz(newQuiz); Object.assign(newQuiz, { title: "", description: "", isTimed: false, timeLimitSeconds: 300, questions: [{ question: "", optionA: "", optionB: "", correctOption: "A" }] }); showQuizCreate.value = false; await refreshQuizzes(); fireConfetti(); toast("Quiz created!", "success"); }
      catch (e) { toast(e.message, "error"); } finally { isCreatingQuiz.value = false; }
    }
    onMounted(refreshPolls);
    return { store, newPoll, newQuiz, castVote, submitPoll, submitQuiz, showPublish, showQuizCreate, isPublishing, isCreatingQuiz, votingId, handleImageFile, setMode, filteredPolls, categories: CATEGORIES, countdownText, isUrgent, sharePoll, shareTwitter, shareWhatsApp, avatarColor, avatarInitials };
  }
};

const PollPage = {
  template: `
    <section class="section container">
      <div v-if="isLoading" class="card skeleton-card">
        <div class="skeleton-line"></div>
        <div class="poll-options"><div class="poll-option skeleton-block"></div><div class="poll-option skeleton-block"></div></div>
      </div>
      <div class="card" v-if="poll">
        <div style="display:flex; justify-content:space-between; flex-wrap:wrap; gap:8px;">
          <h2>{{ poll.question }}</h2>
          <div style="display:flex; gap:6px; align-items:center;">
            <span class="tag">{{ poll.type }}</span>
            <span class="tag" v-if="poll.category">{{ poll.category }}</span>
            <span class="countdown" :class="{ urgent: isUrgent(poll.endsAt) }" v-if="countdownText(poll.endsAt)">{{ countdownText(poll.endsAt) }}</span>
          </div>
        </div>
        <div class="poll-options">
          <div v-for="opt in ['A','B']" :key="opt" class="poll-option">
            <div><strong>{{ opt }}:</strong> {{ poll['option' + opt].text || "Image option" }}</div>
            <div v-if="poll['option' + opt].imageUrl" class="image-frame">
              <img :src="poll['option' + opt].imageUrl" loading="lazy" @load="$event.target.parentElement.classList.add('is-loaded')" @error="$event.target.parentElement.classList.add('is-loaded')" />
            </div>
            <button class="btn secondary" @click="castVote(opt)" :disabled="voting">
              <span class="spinner" v-if="voting"></span> Vote {{ opt }}
            </button>
            <div class="bar"><div class="bar-fill" :style="{ width: poll.percents[opt.toLowerCase()] + '%' }"></div></div>
            <div class="muted">{{ poll.percents[opt.toLowerCase()] }}% ({{ poll.votes[opt.toLowerCase()] }})</div>
          </div>
        </div>
        <div class="vote-status" v-if="poll.userVote">You voted {{ poll.userVote }}</div>
        <div class="share-row" style="margin-top:12px;">
          <button class="share-btn" @click="sharePoll(poll.id, poll.question)">📋 Copy link</button>
          <button class="share-btn" @click="shareTwitter(poll.id, poll.question)">𝕏 Tweet</button>
          <button class="share-btn" @click="shareWhatsApp(poll.id, poll.question)">💬 WhatsApp</button>
        </div>
      </div>
      <div class="card" style="margin-top:20px;">
        <h3>Comments</h3>
        <form @submit.prevent="submitComment">
          <textarea v-model="commentDraft" rows="3" placeholder="Share your take..."></textarea>
          <button class="btn secondary">Post comment</button>
        </form>
        <div class="list" style="margin-top:16px;">
          <div v-for="item in comments" :key="item.id" class="card">
            <div style="display:flex; gap:8px; align-items:center;">
              <span class="avatar small" :style="{ background: avatarColor(item.email) }">{{ avatarInitials(item.email) }}</span>
              <strong>{{ item.email }}</strong>
            </div>
            <div class="muted">{{ item.body }}</div>
          </div>
        </div>
      </div>
    </section>
  `,
  setup() {
    const poll = Vue.ref(null);
    const comments = Vue.ref([]);
    const commentDraft = Vue.ref("");
    const isLoading = Vue.ref(true);
    const voting = Vue.ref(false);
    async function load() {
      isLoading.value = true;
      const data = await api.getPoll(router.currentRoute.value.params.id);
      poll.value = data.poll;
      comments.value = data.comments;
      isLoading.value = false;
    }
    async function castVote(option) {
      if (!store.user) { toast("Login to vote.", "error"); return; }
      try { voting.value = true; const u = await api.vote(poll.value.id, option); poll.value = u; fireConfetti(); toast("Vote cast!", "success"); }
      finally { voting.value = false; }
    }
    async function submitComment() {
      if (!store.user) { toast("Login to comment.", "error"); return; }
      if (!commentDraft.value.trim()) return;
      const saved = await api.addComment(poll.value.id, commentDraft.value.trim());
      comments.value.unshift({ ...saved, email: store.user.email });
      commentDraft.value = "";
      toast("Comment posted!", "success");
    }
    function isUrgent(endsAt) { return endsAt && (new Date(endsAt) - Date.now()) < 3600000; }
    onMounted(load);
    return { poll, comments, commentDraft, castVote, submitComment, isLoading, voting, countdownText, isUrgent, sharePoll, shareTwitter, shareWhatsApp, avatarColor, avatarInitials };
  }
};

const ProfilePage = {
  template: `
    <section class="section container grid two">
      <div class="card">
        <h2>Your profile</h2>
        <div v-if="isLoading" class="list"><div class="skeleton-line"></div><div class="skeleton-line short"></div><div class="skeleton-line"></div></div>
        <div v-else-if="profile.id">
          <div style="display:flex; gap:12px; align-items:center; margin-bottom:16px;">
            <span class="avatar large" :style="{ background: avatarColor(profile.name || profile.email) }">{{ avatarInitials(profile.name || profile.email) }}</span>
            <div>
              <div><strong>{{ profile.name || "Not set" }}</strong></div>
              <div class="muted">@{{ profile.username || "Not set" }}</div>
            </div>
          </div>
          <div><strong>Email:</strong> {{ profile.email }}</div>
          <div v-if="profile.age"><strong>Age:</strong> {{ profile.age }}</div>
          <div><strong>Role:</strong> {{ profile.role }}</div>
          <div><strong>Member since:</strong> {{ new Date(profile.created_at).toLocaleDateString() }}</div>
        </div>
        <div v-else class="muted">Login to view your profile.</div>
      </div>
      <div class="card">
        <h3>Voting history</h3>
        <div v-if="isLoading" class="list"><div v-for="n in 3" :key="n" class="card skeleton-card"><div class="skeleton-line"></div><div class="skeleton-line short"></div></div></div>
        <div v-else-if="history.length" class="list">
          <div v-for="item in history" :key="item.id" class="card">
            <div><strong>{{ item.question }}</strong></div>
            <div class="muted">Voted {{ item.option }} on {{ new Date(item.created_at).toLocaleString() }}</div>
          </div>
        </div>
        <div v-else class="muted">No voting history yet.</div>
      </div>
      <div class="card">
        <h3>Quiz history</h3>
        <div v-if="isLoading" class="list"><div v-for="n in 3" :key="n" class="card skeleton-card"><div class="skeleton-line"></div><div class="skeleton-line short"></div></div></div>
        <div v-else-if="quizHistory.length" class="list">
          <div v-for="item in quizHistory" :key="item.id" class="card">
            <div><strong>{{ item.quiz_title }}</strong></div>
            <div class="muted">
              Score: {{ item.score }}/{{ item.total_questions }}
              ({{ Math.round((item.score / item.total_questions) * 100) }}%)
              <span v-if="item.time_taken_seconds"> • {{ Math.floor(item.time_taken_seconds / 60) }}:{{ (item.time_taken_seconds % 60).toString().padStart(2, '0') }}</span>
            </div>
            <div class="muted">{{ new Date(item.completed_at).toLocaleString() }}</div>
          </div>
        </div>
        <div v-else class="muted">No quiz attempts yet.</div>
      </div>
    </section>
  `,
  setup() {
    const profile = reactive({});
    const history = reactive([]);
    const quizHistory = reactive([]);
    const isLoading = Vue.ref(true);
    async function load() {
      if (!store.user) { isLoading.value = false; return; }
      isLoading.value = true;
      try {
        const [me, votes, qh] = await Promise.all([api.getMe(), api.getHistory(), api.getQuizHistory()]);
        Object.assign(profile, me);
        history.splice(0, history.length, ...votes);
        quizHistory.splice(0, quizHistory.length, ...qh);
      } catch (e) { store.error = e.message; }
      finally { isLoading.value = false; }
    }
    onMounted(load);
    return { profile, history, quizHistory, isLoading, avatarColor, avatarInitials };
  }
};

const LeaderboardPage = {
  template: `
    <section class="section container">
      <div class="card">
        <h2>Leaderboard</h2>
        <p class="muted">Top voters and quiz champions.</p>
      </div>
      <div class="grid two" style="margin-top:20px;">
        <div class="card">
          <h3>🗳️ Top Voters</h3>
          <div v-if="loading" class="list"><div v-for="n in 3" :key="n" class="skeleton-line"></div></div>
          <div v-else-if="topVoters.length" class="list">
            <div v-for="(u, i) in topVoters" :key="u.user_id" class="leaderboard-row">
              <span class="leaderboard-rank" :class="{ gold: i===0, silver: i===1, bronze: i===2 }">{{ i + 1 }}</span>
              <span class="avatar" :style="{ background: avatarColor(u.name || u.username) }">{{ avatarInitials(u.name || u.username) }}</span>
              <div>
                <div><strong>{{ u.name || u.username }}</strong></div>
                <div class="muted">@{{ u.username }}</div>
              </div>
              <span class="leaderboard-stat">{{ u.vote_count }} votes</span>
            </div>
          </div>
          <div v-else class="muted">No votes yet.</div>
        </div>
        <div class="card">
          <h3>🧠 Quiz Champions</h3>
          <div v-if="loading" class="list"><div v-for="n in 3" :key="n" class="skeleton-line"></div></div>
          <div v-else-if="topQuizzers.length" class="list">
            <div v-for="(u, i) in topQuizzers" :key="u.user_id" class="leaderboard-row">
              <span class="leaderboard-rank" :class="{ gold: i===0, silver: i===1, bronze: i===2 }">{{ i + 1 }}</span>
              <span class="avatar" :style="{ background: avatarColor(u.name || u.username) }">{{ avatarInitials(u.name || u.username) }}</span>
              <div>
                <div><strong>{{ u.name || u.username }}</strong></div>
                <div class="muted">@{{ u.username }}</div>
              </div>
              <span class="leaderboard-stat">{{ u.avg_score }}% avg</span>
            </div>
          </div>
          <div v-else class="muted">No quiz attempts yet.</div>
        </div>
      </div>
    </section>
  `,
  setup() {
    const topVoters = Vue.ref([]);
    const topQuizzers = Vue.ref([]);
    const loading = Vue.ref(true);
    async function load() {
      loading.value = true;
      try {
        const data = await api.getLeaderboard();
        topVoters.value = data.topVoters || [];
        topQuizzers.value = data.topQuizzers || [];
      } catch (e) { toast(e.message, "error"); }
      finally { loading.value = false; }
    }
    onMounted(load);
    return { topVoters, topQuizzers, loading, avatarColor, avatarInitials };
  }
};

const AdminPage = {
  template: `
    <section class="section container grid two">
      <div class="card">
        <h2>Admin analytics</h2>
        <div v-if="analytics.users !== undefined">
          <div>Users: {{ analytics.users }}</div>
          <div>Polls: {{ analytics.polls }}</div>
          <div>Votes: {{ analytics.votes }}</div>
          <div>Active polls: {{ analytics.activePolls }}</div>
        </div>
        <button class="btn secondary" @click="loadAnalytics">Refresh</button>
      </div>
      <div class="card">
        <h3>Users</h3>
        <div v-if="usersLoading" class="list"><div v-for="n in 3" :key="n" class="card skeleton-card"><div class="skeleton-line"></div><div class="skeleton-line short"></div></div></div>
        <div v-else-if="!users.length" class="muted">No users yet.</div>
        <div v-else class="list">
          <div v-for="user in users" :key="user.id" class="card">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <div style="display:flex; gap:10px; align-items:center;">
                <span class="avatar" :style="{ background: avatarColor(user.name || user.email) }">{{ avatarInitials(user.name || user.email) }}</span>
                <div>
                  <strong>{{ user.name || user.username || user.email || "Unknown" }}</strong>
                  <div class="muted">@{{ user.username || "no-username" }} • {{ user.email }}</div>
                  <div class="muted">
                    {{ user.role }} • Joined {{ new Date(user.created_at).toLocaleDateString() }}
                    • <span :class="user.banned ? 'error' : 'vote-status'">{{ user.banned ? "Banned" : "Active" }}</span>
                  </div>
                </div>
              </div>
              <button class="btn secondary" :disabled="banningId === user.id" @click="toggleBan(user)">
                <span class="spinner" v-if="banningId === user.id"></span> {{ user.banned ? "Unban" : "Ban" }}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div class="card">
        <h3>Latest polls</h3>
        <div v-if="pollsLoading" class="list"><div v-for="n in 3" :key="n" class="card skeleton-card"><div class="skeleton-line"></div><div class="skeleton-line short"></div></div></div>
        <div v-else class="list">
          <div v-for="poll in recentPolls" :key="poll.id" class="card">
            <div><strong>{{ poll.question }}</strong></div>
            <div class="muted">{{ poll.type }} • {{ poll.totalVotes }} votes</div>
          </div>
        </div>
      </div>
      <div class="card">
        <h3>Pending polls</h3>
        <div class="list">
          <div v-for="poll in pending" :key="poll.id" class="card">
            <div><strong>{{ poll.question }}</strong></div>
            <div class="muted">Submitted by {{ poll.submitter_email || "Unknown" }}</div>
            <div style="display:flex; gap:8px; margin-top:8px;">
              <button class="btn secondary" @click="approve(poll.id)">Approve</button>
              <button class="btn secondary" @click="reject(poll.id)">Reject</button>
              <button class="btn secondary" @click="remove(poll.id)">Delete</button>
            </div>
          </div>
        </div>
      </div>
      <div class="card">
        <h3>Create poll (admin)</h3>
        <form @submit.prevent="createPoll">
          <input v-model="newPoll.question" placeholder="Question" required />
          <select v-model="newPoll.type">
            <option value="text-text">Text vs Text</option>
            <option value="image-image">Image vs Image</option>
            <option value="text-image">Text vs Image</option>
          </select>
          <select v-model="newPoll.category">
            <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
          </select>
          <input v-model="newPoll.optionAText" placeholder="Option A text" />
          <input v-model="newPoll.optionBText" placeholder="Option B text" />
          <input v-model="newPoll.optionAImageUrl" placeholder="Option A image url" />
          <input v-model="newPoll.optionBImageUrl" placeholder="Option B image url" />
          <input type="file" accept="image/*" @change="(e) => handleImageFile(e, newPoll, 'optionAImageUrl')" />
          <input type="file" accept="image/*" @change="(e) => handleImageFile(e, newPoll, 'optionBImageUrl')" />
          <input v-model="newPoll.endsAt" type="datetime-local" />
          <button class="btn">Create approved poll</button>
        </form>
      </div>
    </section>
  `,
  setup() {
    const pending = reactive([]);
    const analytics = reactive({});
    const recentPolls = reactive([]);
    const pollsLoading = Vue.ref(false);
    const users = reactive([]);
    const usersLoading = Vue.ref(false);
    const newPoll = reactive(freshPoll());
    const banningId = Vue.ref(null);

    async function loadPending() { pending.splice(0, pending.length, ...(await api.getPendingPolls())); }
    async function loadAnalytics() { Object.assign(analytics, await api.getAnalytics()); }
    async function loadUsers() {
      usersLoading.value = true;
      try { users.splice(0, users.length, ...(await api.getUsers())); }
      catch (e) { toast(e.message, "error"); } finally { usersLoading.value = false; }
    }
    async function loadRecentPolls() {
      pollsLoading.value = true;
      try { const p = await api.getPolls(); recentPolls.splice(0, recentPolls.length, ...p.slice(0, 6)); }
      finally { pollsLoading.value = false; }
    }
    async function approve(id) { await api.approvePoll(id, "approved"); await loadPending(); await refreshPolls(); toast("Poll approved!", "success"); }
    async function reject(id) { await api.approvePoll(id, "rejected"); await loadPending(); toast("Poll rejected.", "info"); }
    async function remove(id) { await api.deletePoll(id); await loadPending(); await refreshPolls(); toast("Poll deleted.", "info"); }
    async function toggleBan(user) {
      const next = !user.banned, prev = user.banned;
      banningId.value = user.id; user.banned = next;
      try { await api.banUser(user.id, next); toast(next ? "User banned." : "User unbanned.", "info"); }
      catch (e) { user.banned = prev; toast(e.message, "error"); } finally { banningId.value = null; }
    }
    async function createPoll() {
      await api.createPoll({ ...newPoll, endsAt: newPoll.endsAt || null });
      Object.assign(newPoll, freshPoll());
      await refreshPolls(); await loadRecentPolls();
      toast("Poll created!", "success");
    }

    onMounted(() => { loadPending(); loadAnalytics(); loadRecentPolls(); loadUsers(); });
    return {
      pending, analytics, newPoll, recentPolls, pollsLoading, users, usersLoading, banningId,
      approve, reject, remove, toggleBan, loadAnalytics, createPoll, handleImageFile,
      categories: CATEGORIES, avatarColor, avatarInitials
    };
  }
};

const QuizPage = {
  template: `
    <section class="section container">
      <div v-if="isLoading" class="card skeleton-card"><div class="skeleton-line"></div><div class="skeleton-line short"></div><div class="skeleton-block" style="margin-top:16px;"></div></div>
      <div v-else-if="!quiz" class="card"><p class="error">Quiz not found.</p><a href="#/feed" class="btn">Back to Feed</a></div>
      <div v-else-if="showResults" class="card fade-in">
        <div class="score-display">
          <div class="score-number">{{ results.score }}/{{ results.totalQuestions }}</div>
          <div class="score-label">Questions Correct</div>
          <div class="score-percentage" :class="scoreClass">{{ results.percentage }}%</div>
        </div>
        <div v-if="quiz.is_timed && timeTaken" class="muted" style="text-align:center; margin-top:12px;">Completed in {{ formatTime(timeTaken) }}</div>
        <div class="list" style="margin-top:24px;">
          <h3>Review Answers</h3>
          <div v-for="(r, idx) in results.results" :key="r.questionId" class="card" :class="r.isCorrect ? 'quiz-option correct' : 'quiz-option incorrect'" style="cursor:default;">
            <div><strong>Q{{ idx + 1 }}:</strong> {{ questions[idx]?.question }}</div>
            <div class="muted">Your answer: {{ r.userAnswer || "No answer" }} | Correct: {{ r.correctAnswer }}</div>
          </div>
        </div>
        <div style="display:flex; gap:12px; margin-top:20px;">
          <a href="#/feed" class="btn secondary">Back to Feed</a>
          <button class="btn" @click="retakeQuiz">Retake Quiz</button>
        </div>
      </div>
      <div v-else class="card fade-in">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
          <div><h2>{{ quiz.title }}</h2><p class="muted" v-if="quiz.description">{{ quiz.description }}</p></div>
          <div v-if="quiz.is_timed && started" class="quiz-timer" :class="{ warning: timeRemaining <= 30 }">{{ formatTime(timeRemaining) }}</div>
        </div>
        <div v-if="!started" style="margin-top:20px;">
          <p>This quiz has <strong>{{ questions.length }}</strong> questions.</p>
          <p v-if="quiz.is_timed">Time limit: <strong>{{ formatTime(quiz.time_limit_seconds) }}</strong></p>
          <p v-else>Take your time - this quiz is untimed.</p>
          <button class="btn" @click="startQuiz" style="margin-top:12px;">Start Quiz</button>
        </div>
        <div v-else style="margin-top:20px;">
          <div class="quiz-progress">
            <div v-for="(q, idx) in questions" :key="q.id" class="quiz-progress-dot" :class="{ current: idx === currentQuestion, answered: answers[q.id] }"></div>
          </div>
          <div class="card" style="margin-top:16px;" v-if="currentQ">
            <h3>Question {{ currentQuestion + 1 }} of {{ questions.length }}</h3>
            <p style="font-size:1.1rem; margin:16px 0;">{{ currentQ.question }}</p>
            <div v-if="currentQ.question_image_url" style="margin-bottom:16px; text-align:center; background:var(--bg-skeleton-block); padding:10px; border-radius:12px;">
              <img :src="currentQ.question_image_url" :alt="'Question ' + (currentQuestion + 1)" style="max-width:100%; max-height:250px; border-radius:12px; object-fit:cover; display:block; margin:0 auto;" />
            </div>
            <div style="display:grid; gap:12px;" :style="{ gridTemplateColumns: (currentQ.option_a_image_url || currentQ.option_b_image_url) ? '1fr 1fr' : '1fr' }">
              <div v-for="opt in ['A','B']" :key="opt" class="quiz-option" :class="{ selected: answers[currentQ.id] === opt }" @click="selectAnswer(opt)" style="flex-direction:column; text-align:center;">
                <div class="quiz-option-label">{{ opt }}</div>
                <div v-if="currentQ['option_' + opt.toLowerCase() + '_image_url']" style="margin:8px 0;">
                  <img :src="currentQ['option_' + opt.toLowerCase() + '_image_url']" :alt="'Option ' + opt" style="width:100%; height:100px; object-fit:cover; border-radius:8px; display:block;" />
                </div>
                <div>{{ currentQ['option_' + opt.toLowerCase()] }}</div>
              </div>
            </div>
          </div>
          <div v-if="error" class="error" style="margin-top:12px; padding:12px; background:rgba(220,38,38,0.1); border-radius:8px;">{{ error }}</div>
          <div style="display:flex; justify-content:space-between; margin-top:16px;">
            <button class="btn secondary" @click="prevQuestion" :disabled="currentQuestion === 0">Previous</button>
            <button v-if="currentQuestion < questions.length - 1" class="btn" @click="nextQuestion">Next</button>
            <button v-else class="btn" @click="submitQuiz" :disabled="isSubmitting"><span class="spinner" v-if="isSubmitting"></span> Submit Quiz</button>
          </div>
        </div>
      </div>
    </section>
  `,
  setup() {
    const quiz = Vue.ref(null), questions = Vue.ref([]), answers = reactive({});
    const isLoading = Vue.ref(true), started = Vue.ref(false), currentQuestion = Vue.ref(0);
    const showResults = Vue.ref(false), results = Vue.ref(null), isSubmitting = Vue.ref(false);
    const timeRemaining = Vue.ref(0), timeTaken = Vue.ref(0), error = Vue.ref(null);
    let timerInterval = null, startTime = null;
    const scoreClass = computed(() => { if (!results.value) return ""; const p = results.value.percentage; return p >= 80 ? "excellent" : p >= 50 ? "good" : "poor"; });
    const currentQ = computed(() => questions.value?.[currentQuestion.value] || null);
    function formatTime(s) { return Math.floor(s / 60) + ":" + (s % 60).toString().padStart(2, "0"); }
    async function load() {
      isLoading.value = true; error.value = null;
      try { const d = await api.getQuiz(router.currentRoute.value.params.id); quiz.value = d.quiz; questions.value = d.questions; }
      catch (e) { error.value = e.message; } finally { isLoading.value = false; }
    }
    function startQuiz() {
      started.value = true; startTime = Date.now();
      if (quiz.value.is_timed) {
        timeRemaining.value = quiz.value.time_limit_seconds;
        timerInterval = setInterval(() => { timeRemaining.value -= 1; if (timeRemaining.value <= 0) { clearInterval(timerInterval); submitQuiz(); } }, 1000);
      }
    }
    function selectAnswer(opt) { answers[questions.value[currentQuestion.value].id] = opt; }
    function nextQuestion() { if (currentQuestion.value < questions.value.length - 1) currentQuestion.value += 1; }
    function prevQuestion() { if (currentQuestion.value > 0) currentQuestion.value -= 1; }
    async function submitQuiz() {
      if (!store.user) { error.value = "Login to submit quiz."; return; }
      if (timerInterval) clearInterval(timerInterval);
      isSubmitting.value = true; error.value = null;
      timeTaken.value = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;
      try {
        const plain = {}; for (const k in answers) plain[k] = answers[k];
        const d = await api.submitQuiz(quiz.value.id, { answers: plain, timeTakenSeconds: timeTaken.value });
        results.value = d; showResults.value = true; fireConfetti(); toast("Quiz completed!", "success");
      } catch (e) { error.value = e.message; } finally { isSubmitting.value = false; }
    }
    function retakeQuiz() {
      Object.keys(answers).forEach(k => delete answers[k]);
      currentQuestion.value = 0; started.value = false; showResults.value = false; results.value = null; timeTaken.value = 0;
    }
    onMounted(load);
    return { quiz, questions, answers, isLoading, started, currentQuestion, currentQ, showResults, results, isSubmitting, timeRemaining, timeTaken, error, scoreClass, formatTime, startQuiz, selectAnswer, nextQuestion, prevQuestion, submitQuiz, retakeQuiz };
  }
};

const routes = [
  { path: "/", component: LandingPage },
  { path: "/login", component: LoginPage },
  { path: "/feed", component: FeedPage },
  { path: "/poll/:id", component: PollPage },
  { path: "/quiz/:id", component: QuizPage },
  { path: "/profile", component: ProfilePage },
  { path: "/leaderboard", component: LeaderboardPage },
  { path: "/admin", component: AdminPage }
];

const router = createRouter({ history: createWebHashHistory(), routes });
const app = createApp(AppLayout);
app.use(router);
app.mount("#app");

if (window.io) {
  const socket = window.io(window.API_BASE);
  socket.on("poll:update", (updated) => {
    const exists = store.polls.some(p => p.id === updated.id);
    store.polls = exists ? store.polls.map(p => p.id === updated.id ? updated : p) : [updated, ...store.polls];
  });
}

let confettiCanvas, confettiCtx, confettiPieces = [];
function ensureConfettiCanvas() {
  if (confettiCanvas) return;
  confettiCanvas = document.createElement("canvas");
  confettiCanvas.id = "confetti-canvas";
  confettiCtx = confettiCanvas.getContext("2d");
  document.body.appendChild(confettiCanvas);
  resizeConfetti();
  window.addEventListener("resize", resizeConfetti);
}
function resizeConfetti() { if (!confettiCanvas) return; confettiCanvas.width = window.innerWidth; confettiCanvas.height = window.innerHeight; }
function fireConfetti() {
  ensureConfettiCanvas();
  const colors = ["#007aff", "#3399ff", "#66b2ff", "#99ccff", "#0a84ff", "#005bb5"];
  for (let i = 0; i < 90; i++) confettiPieces.push({ x: Math.random() * confettiCanvas.width, y: -20, size: 6 + Math.random() * 6, color: colors[Math.floor(Math.random() * colors.length)], speed: 2 + Math.random() * 3, drift: -1 + Math.random() * 2, rotation: Math.random() * Math.PI });
  if (!confettiCanvas.dataset.running) { confettiCanvas.dataset.running = "true"; requestAnimationFrame(runConfetti); }
}
function runConfetti() {
  if (!confettiCtx) return;
  confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  confettiPieces.forEach(p => { p.y += p.speed; p.x += p.drift; p.rotation += 0.03; confettiCtx.save(); confettiCtx.translate(p.x, p.y); confettiCtx.rotate(p.rotation); confettiCtx.fillStyle = p.color; confettiCtx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size); confettiCtx.restore(); });
  confettiPieces = confettiPieces.filter(p => p.y < confettiCanvas.height + 40);
  if (confettiPieces.length) requestAnimationFrame(runConfetti);
  else { delete confettiCanvas.dataset.running; confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height); }
}
