import { api } from "./api.js";

const { createApp, reactive, computed, onMounted } = Vue;
const { createRouter, createWebHashHistory } = VueRouter;

const store = reactive({
  user: JSON.parse(localStorage.getItem("user") || "null"),
  polls: [],
  loading: false,
  error: null
});

const MAX_IMAGE_BYTES = 1_000_000;

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Failed to read image file."));
    reader.readAsDataURL(file);
  });
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

async function refreshPolls() {
  store.loading = true;
  store.error = null;
  try {
    const polls = await api.getPolls();
    const seen = new Set();
    store.polls = polls.filter((poll) => {
      if (seen.has(poll.id)) {
        return false;
      }
      seen.add(poll.id);
      return true;
    });
  } catch (error) {
    store.error = error.message;
  } finally {
    store.loading = false;
  }
}

const AppLayout = {
  template: `
    <div>
      <header>
        <div class="container nav">
          <div class="nav-links">
            <a href="#/">This or That</a>
            <a href="#/feed">Feed</a>
            <a href="#/profile">Profile</a>
            <a v-if="store.user?.role === 'admin'" href="#/admin">Admin</a>
          </div>
          <div class="nav-links">
            <button
              class="theme-switch"
              :aria-pressed="theme === 'dark'"
              :aria-label="theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
              @click="toggleTheme"
            >
              <span class="icon sun" aria-hidden="true"></span>
              <span class="icon moon" aria-hidden="true"></span>
              <span class="switch-thumb" aria-hidden="true"></span>
              <span class="sr-only">{{ theme === "dark" ? "Light mode" : "Dark mode" }}</span>
            </button>
            <span v-if="store.user">{{ store.user.email }}</span>
            <button v-if="store.user" class="btn secondary" @click="logout">Logout</button>
            <a v-else href="#/login" class="btn">Login</a>
          </div>
        </div>
      </header>
      <router-view></router-view>
    </div>
  `,
  setup() {
    const theme = Vue.ref(localStorage.getItem("theme") || "light");

    function applyTheme(nextTheme) {
      theme.value = nextTheme;
      localStorage.setItem("theme", nextTheme);
      document.body.classList.toggle("theme-dark", nextTheme === "dark");
    }

    function toggleTheme() {
      applyTheme(theme.value === "dark" ? "light" : "dark");
    }

    onMounted(() => {
      applyTheme(theme.value);
    });

    return {
      store,
      theme,
      toggleTheme,
      logout() {
        clearSession();
      }
    };
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
          <p class="muted">Use the switch to toggle between login and signup.</p>
        </div>
        <div class="auth-tabs" role="tablist" aria-label="Authentication tabs">
          <button
            class="auth-tab"
            :class="{ active: !isSignup }"
            role="tab"
            :aria-selected="!isSignup"
            @click="setAuth(false)"
          >
            Login
          </button>
          <button
            class="auth-tab"
            :class="{ active: isSignup }"
            role="tab"
            :aria-selected="isSignup"
            @click="setAuth(true)"
          >
            Sign up
          </button>
        </div>
        <div v-if="!isSignup">
          <form @submit.prevent="login">
            <input v-model="loginForm.email" type="email" placeholder="Email" required autocomplete="email" />
            <input v-model="loginForm.password" type="password" placeholder="Password" required />
            <button class="btn" :disabled="authLoading">
              <span class="spinner" v-if="authLoading"></span>
              Login
            </button>
            <div class="error" v-if="error">{{ error }}</div>
          </form>
        </div>
        <div v-else>
          <form @submit.prevent="signup">
            <input v-model="signupForm.email" type="email" placeholder="Email" required autocomplete="email" />
            <input v-model="signupForm.password" type="password" placeholder="Password" required />
            <button class="btn secondary" :disabled="authLoading">
              <span class="spinner" v-if="authLoading"></span>
              Create account
            </button>
            <div class="error" v-if="error">{{ error }}</div>
          </form>
        </div>
      </div>
    </section>
  `,
  setup() {
    const loginForm = reactive({ email: "", password: "" });
    const signupForm = reactive({ email: "", password: "" });
    const error = computed(() => store.error);
    const isSignup = Vue.ref(false);
    const authLoading = Vue.ref(false);

    async function login() {
      store.error = null;
      authLoading.value = true;
      try {
        const data = await api.login(loginForm);
        setSession(data);
        fireConfetti();
        window.location.hash = "#/feed";
      } catch (err) {
        store.error = err.message;
      } finally {
        authLoading.value = false;
      }
    }

    async function signup() {
      store.error = null;
      authLoading.value = true;
      try {
        const data = await api.register(signupForm);
        setSession(data);
        fireConfetti();
        window.location.hash = "#/feed";
      } catch (err) {
        store.error = err.message;
      } finally {
        authLoading.value = false;
      }
    }

    function setAuth(value) {
      isSignup.value = value;
      store.error = null;
    }

    return { loginForm, signupForm, login, signup, error, isSignup, setAuth, authLoading };
  }
};

const FeedPage = {
  template: `
    <section class="section container">
      <div class="card">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
          <div>
            <h2>Voting feed</h2>
            <p class="muted">Vote once per poll. Results update live.</p>
          </div>
          <button class="btn" @click="openPublish">Publish poll</button>
        </div>
        <div v-if="store.loading" class="list" style="margin-top:16px;">
          <div v-for="n in 3" :key="n" class="card skeleton-card">
            <div class="skeleton-line"></div>
            <div class="poll-options">
              <div class="poll-option skeleton-block"></div>
              <div class="poll-option skeleton-block"></div>
            </div>
          </div>
        </div>
        <div class="error" v-if="store.error">{{ store.error }}</div>
        <div class="list" v-if="store.polls.length && !store.loading">
          <div v-for="poll in store.polls" :key="poll.id" class="card fade-in">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <h3>{{ poll.question }}</h3>
              <span class="tag">{{ poll.type }}</span>
            </div>
            <div class="poll-options">
              <div class="poll-option">
                <div><strong>A:</strong> {{ poll.optionA.text || "Image option" }}</div>
                <div v-if="poll.optionA.imageUrl" class="image-frame">
                  <img
                    :src="poll.optionA.imageUrl"
                    loading="lazy"
                    @load="$event.target.parentElement.classList.add('is-loaded')"
                    @error="$event.target.parentElement.classList.add('is-loaded')"
                  />
                </div>
                <button class="btn secondary" @click="castVote(poll.id, 'A')" :disabled="votingId === poll.id">
                  <span class="spinner" v-if="votingId === poll.id"></span>
                  Vote A
                </button>
                <div class="bar"><div class="bar-fill" :style="{ width: poll.percents.a + '%' }"></div></div>
                <div class="muted">{{ poll.percents.a }}% ({{ poll.votes.a }})</div>
              </div>
              <div class="poll-option">
                <div><strong>B:</strong> {{ poll.optionB.text || "Image option" }}</div>
                <div v-if="poll.optionB.imageUrl" class="image-frame">
                  <img
                    :src="poll.optionB.imageUrl"
                    loading="lazy"
                    @load="$event.target.parentElement.classList.add('is-loaded')"
                    @error="$event.target.parentElement.classList.add('is-loaded')"
                  />
                </div>
                <button class="btn secondary" @click="castVote(poll.id, 'B')" :disabled="votingId === poll.id">
                  <span class="spinner" v-if="votingId === poll.id"></span>
                  Vote B
                </button>
                <div class="bar"><div class="bar-fill" :style="{ width: poll.percents.b + '%' }"></div></div>
                <div class="muted">{{ poll.percents.b }}% ({{ poll.votes.b }})</div>
              </div>
            </div>
            <div class="vote-status" v-if="poll.userVote">You voted {{ poll.userVote }}</div>
            <div style="margin-top:10px;">
              <a class="btn secondary" :href="'#/poll/' + poll.id">View details</a>
            </div>
          </div>
        </div>
        <div v-else-if="!store.loading">No polls yet.</div>
      </div>

      <div v-if="showPublish" class="modal-backdrop" @click.self="closePublish">
        <div class="modal-card card modal-animate">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <h3>Publish a poll</h3>
            <button class="btn secondary" @click="closePublish">Close</button>
          </div>
          <form @submit.prevent="submitPoll">
            <input v-model="newPoll.question" placeholder="Question" required />
            <select v-model="newPoll.type">
              <option value="text-text">Text vs Text</option>
              <option value="image-image">Image vs Image</option>
              <option value="text-image">Text vs Image</option>
            </select>
            <input v-model="newPoll.optionAText" placeholder="Option A text" />
            <input v-model="newPoll.optionBText" placeholder="Option B text" />
            <input v-model="newPoll.optionAImageUrl" placeholder="Option A image url" />
            <input v-model="newPoll.optionBImageUrl" placeholder="Option B image url" />
            <input type="file" accept="image/*" @change="(e) => handleImageFile(e, 'optionAImageUrl')" />
            <input type="file" accept="image/*" @change="(e) => handleImageFile(e, 'optionBImageUrl')" />
            <input v-model="newPoll.endsAt" type="datetime-local" />
            <button class="btn" :disabled="isPublishing">
              <span class="spinner" v-if="isPublishing"></span>
              Publish poll
            </button>
          </form>
          <p class="muted" v-if="!store.user">Login to submit polls.</p>
        </div>
      </div>
    </section>
  `,
  setup() {
    const newPoll = reactive({
      question: "",
      type: "text-text",
      optionAText: "",
      optionBText: "",
      optionAImageUrl: "",
      optionBImageUrl: "",
      endsAt: ""
    });
    const showPublish = Vue.ref(false);
    const isPublishing = Vue.ref(false);
    const votingId = Vue.ref(null);

    async function castVote(pollId, option) {
      if (!store.user) {
        store.error = "Login to vote.";
        return;
      }
      try {
        votingId.value = pollId;
        const updated = await api.vote(pollId, option);
        store.polls = store.polls.map((poll) => (poll.id === updated.id ? updated : poll));
        fireConfetti();
      } catch (error) {
        store.error = error.message;
      } finally {
        votingId.value = null;
      }
    }

    async function submitPoll() {
      if (!store.user) {
        store.error = "Login to submit a poll.";
        return;
      }
      try {
        isPublishing.value = true;
        const payload = { ...newPoll, endsAt: newPoll.endsAt || null };
        await api.createPoll(payload);
        Object.assign(newPoll, {
          question: "",
          type: "text-text",
          optionAText: "",
          optionBText: "",
          optionAImageUrl: "",
          optionBImageUrl: "",
          endsAt: ""
        });
        store.error = "Poll published.";
        showPublish.value = false;
        await refreshPolls();
        fireConfetti();
      } catch (error) {
        store.error = error.message;
      } finally {
        isPublishing.value = false;
      }
    }

    onMounted(refreshPolls);

    function openPublish() {
      showPublish.value = true;
    }

    function closePublish() {
      showPublish.value = false;
    }

    async function handleImageFile(event, targetKey) {
      const file = event.target.files && event.target.files[0];
      if (!file) {
        return;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        store.error = "Image must be under 1 MB.";
        event.target.value = "";
        return;
      }
      try {
        newPoll[targetKey] = await readFileAsDataUrl(file);
      } catch (error) {
        store.error = error.message;
      }
    }

    return {
      store,
      newPoll,
      castVote,
      submitPoll,
      showPublish,
      openPublish,
      closePublish,
      isPublishing,
      votingId,
      handleImageFile
    };
  }
};

const PollPage = {
  template: `
    <section class="section container">
      <div v-if="isLoading" class="card skeleton-card">
        <div class="skeleton-line"></div>
        <div class="poll-options">
          <div class="poll-option skeleton-block"></div>
          <div class="poll-option skeleton-block"></div>
        </div>
      </div>
      <div class="card" v-if="poll">
        <div style="display:flex; justify-content:space-between;">
          <h2>{{ poll.question }}</h2>
          <span class="tag">{{ poll.type }}</span>
        </div>
        <div class="poll-options">
          <div class="poll-option">
            <div><strong>A:</strong> {{ poll.optionA.text || "Image option" }}</div>
            <div v-if="poll.optionA.imageUrl" class="image-frame">
              <img
                :src="poll.optionA.imageUrl"
                loading="lazy"
                @load="$event.target.parentElement.classList.add('is-loaded')"
                @error="$event.target.parentElement.classList.add('is-loaded')"
              />
            </div>
            <button class="btn secondary" @click="castVote('A')" :disabled="voting">
              <span class="spinner" v-if="voting"></span>
              Vote A
            </button>
            <div class="bar"><div class="bar-fill" :style="{ width: poll.percents.a + '%' }"></div></div>
            <div class="muted">{{ poll.percents.a }}% ({{ poll.votes.a }})</div>
          </div>
          <div class="poll-option">
            <div><strong>B:</strong> {{ poll.optionB.text || "Image option" }}</div>
            <div v-if="poll.optionB.imageUrl" class="image-frame">
              <img
                :src="poll.optionB.imageUrl"
                loading="lazy"
                @load="$event.target.parentElement.classList.add('is-loaded')"
                @error="$event.target.parentElement.classList.add('is-loaded')"
              />
            </div>
            <button class="btn secondary" @click="castVote('B')" :disabled="voting">
              <span class="spinner" v-if="voting"></span>
              Vote B
            </button>
            <div class="bar"><div class="bar-fill" :style="{ width: poll.percents.b + '%' }"></div></div>
            <div class="muted">{{ poll.percents.b }}% ({{ poll.votes.b }})</div>
          </div>
        </div>
        <div class="vote-status" v-if="poll.userVote">You voted {{ poll.userVote }}</div>
      </div>
      <div class="card" style="margin-top:20px;">
        <h3>Comments</h3>
        <form @submit.prevent="submitComment">
          <textarea v-model="commentDraft" rows="3" placeholder="Share your take..."></textarea>
          <button class="btn secondary">Post comment</button>
        </form>
        <div class="list" style="margin-top:16px;">
          <div v-for="item in comments" :key="item.id" class="card">
            <strong>{{ item.email }}</strong>
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
      if (!store.user) {
        store.error = "Login to vote.";
        return;
      }
      try {
        voting.value = true;
        const updated = await api.vote(poll.value.id, option);
        poll.value = updated;
        fireConfetti();
      } finally {
        voting.value = false;
      }
    }

    async function submitComment() {
      if (!store.user) {
        store.error = "Login to comment.";
        return;
      }
      if (!commentDraft.value.trim()) {
        return;
      }
      const saved = await api.addComment(poll.value.id, commentDraft.value.trim());
      comments.value.unshift({ ...saved, email: store.user.email });
      commentDraft.value = "";
    }

    onMounted(load);
    return { poll, comments, commentDraft, castVote, submitComment, isLoading, voting };
  }
};

const ProfilePage = {
  template: `
    <section class="section container grid two">
      <div class="card">
        <h2>Your profile</h2>
        <div v-if="profile">
          <div><strong>Email:</strong> {{ profile.email }}</div>
          <div><strong>Role:</strong> {{ profile.role }}</div>
          <div><strong>Member since:</strong> {{ new Date(profile.created_at).toLocaleDateString() }}</div>
        </div>
      </div>
      <div class="card">
        <h3>Voting history</h3>
        <div v-if="isLoading" class="list">
          <div v-for="n in 3" :key="n" class="card skeleton-card">
            <div class="skeleton-line"></div>
            <div class="skeleton-line short"></div>
          </div>
        </div>
        <div v-else class="list">
          <div v-for="item in history" :key="item.id" class="card">
            <div><strong>{{ item.question }}</strong></div>
            <div class="muted">Voted {{ item.option }} on {{ new Date(item.created_at).toLocaleString() }}</div>
          </div>
        </div>
      </div>
    </section>
  `,
  setup() {
    const profile = reactive({});
    const history = reactive([]);
    const isLoading = Vue.ref(true);

    async function load() {
      if (!store.user) {
        return;
      }
      isLoading.value = true;
      Object.assign(profile, await api.getMe());
      history.splice(0, history.length, ...(await api.getHistory()));
      isLoading.value = false;
    }

    onMounted(load);
    return { profile, history, isLoading };
  }
};

const AdminPage = {
  template: `
    <section class="section container grid two">
      <div class="card">
        <h2>Admin analytics</h2>
        <div v-if="analytics">
          <div>Users: {{ analytics.users }}</div>
          <div>Polls: {{ analytics.polls }}</div>
          <div>Votes: {{ analytics.votes }}</div>
          <div>Active polls: {{ analytics.activePolls }}</div>
        </div>
        <button class="btn secondary" @click="loadAnalytics">Refresh</button>
      </div>
      <div class="card">
        <h3>Users</h3>
        <div v-if="usersLoading" class="list">
          <div v-for="n in 3" :key="n" class="card skeleton-card">
            <div class="skeleton-line"></div>
            <div class="skeleton-line short"></div>
          </div>
        </div>
        <div v-else-if="usersError" class="error">{{ usersError }}</div>
        <div v-else-if="!users.length" class="muted">No users yet.</div>
        <div v-else class="list">
          <div v-for="user in users" :key="user.id" class="card">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <div>
                <strong>{{ user.email || "Unknown email" }}</strong>
                <div class="muted">
                  {{ user.role }} • Joined {{ new Date(user.created_at).toLocaleDateString() }}
                  • <span :class="user.banned ? 'error' : 'vote-status'">
                    {{ user.banned ? "Banned" : "Active" }}
                  </span>
                </div>
              </div>
              <button
                class="btn secondary"
                :disabled="banningId === user.id"
                @click="toggleBan(user)"
              >
                <span class="spinner" v-if="banningId === user.id"></span>
                {{ user.banned ? "Unban" : "Ban" }}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div class="card">
        <h3>Latest polls</h3>
        <div v-if="pollsLoading" class="list">
          <div v-for="n in 3" :key="n" class="card skeleton-card">
            <div class="skeleton-line"></div>
            <div class="skeleton-line short"></div>
          </div>
        </div>
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
        <h3>Ban / unban user</h3>
        <form @submit.prevent="banToggle">
          <input v-model="banForm.userId" placeholder="User ID" required />
          <select v-model="banForm.banned">
            <option :value="true">Ban</option>
            <option :value="false">Unban</option>
          </select>
          <button class="btn secondary">Apply</button>
        </form>
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
          <input v-model="newPoll.optionAText" placeholder="Option A text" />
          <input v-model="newPoll.optionBText" placeholder="Option B text" />
          <input v-model="newPoll.optionAImageUrl" placeholder="Option A image url" />
          <input v-model="newPoll.optionBImageUrl" placeholder="Option B image url" />
          <input type="file" accept="image/*" @change="(e) => handleImageFile(e, 'optionAImageUrl')" />
          <input type="file" accept="image/*" @change="(e) => handleImageFile(e, 'optionBImageUrl')" />
          <input v-model="newPoll.endsAt" type="datetime-local" />
          <button class="btn">Create approved poll</button>
        </form>
      </div>
    </section>
  `,
  setup() {
    const pending = reactive([]);
    const analytics = reactive({});
    const banForm = reactive({ userId: "", banned: true });
    const recentPolls = reactive([]);
    const pollsLoading = Vue.ref(false);
    const users = reactive([]);
    const usersLoading = Vue.ref(false);
    const usersError = Vue.ref(null);
    const newPoll = reactive({
      question: "",
      type: "text-text",
      optionAText: "",
      optionBText: "",
      optionAImageUrl: "",
      optionBImageUrl: "",
      endsAt: ""
    });
    const banningId = Vue.ref(null);

    async function loadPending() {
      pending.splice(0, pending.length, ...(await api.getPendingPolls()));
    }

    async function loadAnalytics() {
      Object.assign(analytics, await api.getAnalytics());
    }

    async function loadUsers() {
      usersLoading.value = true;
      usersError.value = null;
      try {
        const data = await api.getUsers();
        users.splice(0, users.length, ...data);
      } catch (error) {
        usersError.value = error.message;
      } finally {
        usersLoading.value = false;
      }
    }

    async function loadRecentPolls() {
      pollsLoading.value = true;
      try {
        const polls = await api.getPolls();
        recentPolls.splice(0, recentPolls.length, ...polls.slice(0, 6));
      } finally {
        pollsLoading.value = false;
      }
    }

    async function approve(id) {
      await api.approvePoll(id, "approved");
      await loadPending();
      await refreshPolls();
    }

    async function reject(id) {
      await api.approvePoll(id, "rejected");
      await loadPending();
    }

    async function remove(id) {
      await api.deletePoll(id);
      await loadPending();
      await refreshPolls();
    }

    async function banToggle() {
      await api.banUser(banForm.userId, banForm.banned);
      banForm.userId = "";
    }

    async function toggleBan(user) {
      const next = !user.banned;
      const previous = user.banned;
      banningId.value = user.id;
      user.banned = next;
      try {
        await api.banUser(user.id, next);
      } catch (error) {
        user.banned = previous;
        usersError.value = error.message;
      } finally {
        banningId.value = null;
      }
    }

    async function createPoll() {
      await api.createPoll({ ...newPoll, endsAt: newPoll.endsAt || null });
      Object.assign(newPoll, {
        question: "",
        type: "text-text",
        optionAText: "",
        optionBText: "",
        optionAImageUrl: "",
        optionBImageUrl: "",
        endsAt: ""
      });
      await refreshPolls();
      await loadRecentPolls();
    }

    async function handleImageFile(event, targetKey) {
      const file = event.target.files && event.target.files[0];
      if (!file) {
        return;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        store.error = "Image must be under 1 MB.";
        event.target.value = "";
        return;
      }
      try {
        newPoll[targetKey] = await readFileAsDataUrl(file);
      } catch (error) {
        store.error = error.message;
      }
    }

    onMounted(() => {
      loadPending();
      loadAnalytics();
      loadRecentPolls();
      loadUsers();
    });

    return {
      pending,
      analytics,
      banForm,
      newPoll,
      recentPolls,
      pollsLoading,
      users,
      usersLoading,
      usersError,
      banningId,
      approve,
      reject,
      remove,
      banToggle,
      toggleBan,
      loadAnalytics,
      createPoll,
      handleImageFile
    };
  }
};

const routes = [
  { path: "/", component: LandingPage },
  { path: "/login", component: LoginPage },
  { path: "/feed", component: FeedPage },
  { path: "/poll/:id", component: PollPage },
  { path: "/profile", component: ProfilePage },
  { path: "/admin", component: AdminPage }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes
});

const app = createApp(AppLayout);
app.use(router);
app.mount("#app");

if (window.io) {
  const socket = window.io(window.API_BASE);
  socket.on("poll:update", (updated) => {
    const exists = store.polls.some((poll) => poll.id === updated.id);
    store.polls = exists
      ? store.polls.map((poll) => (poll.id === updated.id ? updated : poll))
      : [updated, ...store.polls];
  });
}

let confettiCanvas;
let confettiCtx;
let confettiPieces = [];

function ensureConfettiCanvas() {
  if (confettiCanvas) {
    return;
  }
  confettiCanvas = document.createElement("canvas");
  confettiCanvas.id = "confetti-canvas";
  confettiCtx = confettiCanvas.getContext("2d");
  document.body.appendChild(confettiCanvas);
  resizeConfetti();
  window.addEventListener("resize", resizeConfetti);
}

function resizeConfetti() {
  if (!confettiCanvas) {
    return;
  }
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
}

function fireConfetti() {
  ensureConfettiCanvas();
  const colors = ["#60a5fa", "#34d399", "#f472b6", "#fbbf24", "#a78bfa"];
  for (let i = 0; i < 90; i += 1) {
    confettiPieces.push({
      x: Math.random() * confettiCanvas.width,
      y: -20,
      size: 6 + Math.random() * 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      speed: 2 + Math.random() * 3,
      drift: -1 + Math.random() * 2,
      rotation: Math.random() * Math.PI
    });
  }
  if (!confettiCanvas.dataset.running) {
    confettiCanvas.dataset.running = "true";
    requestAnimationFrame(runConfetti);
  }
}

function runConfetti() {
  if (!confettiCtx) {
    return;
  }
  confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  confettiPieces.forEach((piece) => {
    piece.y += piece.speed;
    piece.x += piece.drift;
    piece.rotation += 0.03;
    confettiCtx.save();
    confettiCtx.translate(piece.x, piece.y);
    confettiCtx.rotate(piece.rotation);
    confettiCtx.fillStyle = piece.color;
    confettiCtx.fillRect(-piece.size / 2, -piece.size / 2, piece.size, piece.size);
    confettiCtx.restore();
  });
  confettiPieces = confettiPieces.filter((piece) => piece.y < confettiCanvas.height + 40);
  if (confettiPieces.length) {
    requestAnimationFrame(runConfetti);
  } else {
    delete confettiCanvas.dataset.running;
    confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  }
}
