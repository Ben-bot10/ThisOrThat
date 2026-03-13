import { api } from "./api.js";

const { createApp, reactive, computed, onMounted } = Vue;
const { createRouter, createWebHashHistory } = VueRouter;

const store = reactive({
  user: JSON.parse(localStorage.getItem("user") || "null"),
  polls: [],
  quizzes: [],
  loading: false,
  error: null,
  mode: "polls"
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

async function refreshQuizzes() {
  store.loading = true;
  store.error = null;
  try {
    store.quizzes = await api.getQuizzes();
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
            <span v-if="store.user">{{ store.user.name || store.user.username || store.user.email }}</span>
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
          <p class="muted">{{ isSignup ? "Fill in your details to get started." : "Login with your username or email." }}</p>
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
            <input v-model="loginForm.identifier" type="text" placeholder="Username or Email" required autocomplete="username" />
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
            <input v-model="signupForm.name" type="text" placeholder="Full Name" required />
            <input v-model="signupForm.username" type="text" placeholder="Username (letters, numbers, underscores)" required />
            <input v-model="signupForm.email" type="email" placeholder="Email" required autocomplete="email" />
            <input v-model="signupForm.age" type="number" placeholder="Age (optional)" min="1" max="150" />
            <input v-model="signupForm.password" type="password" placeholder="Password" required />
            <button class="btn" :disabled="authLoading">
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
    const loginForm = reactive({ identifier: "", password: "" });
    const signupForm = reactive({ name: "", username: "", email: "", age: "", password: "" });
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
        const payload = {
          name: signupForm.name,
          username: signupForm.username,
          email: signupForm.email,
          password: signupForm.password
        };
        if (signupForm.age) {
          payload.age = parseInt(signupForm.age, 10);
        }
        const data = await api.register(payload);
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
      <div class="mode-tabs">
        <button class="mode-tab" :class="{ active: store.mode === 'polls' }" @click="setMode('polls')">Polls</button>
        <button class="mode-tab" :class="{ active: store.mode === 'quizzes' }" @click="setMode('quizzes')">Quizzes</button>
      </div>

      <div class="card" v-if="store.mode === 'polls'">
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

      <div class="card" v-if="store.mode === 'quizzes'">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
          <div>
            <h2>Quiz Mode</h2>
            <p class="muted">Test your knowledge with two-option quizzes.</p>
          </div>
          <button class="btn" @click="openQuizCreate">Create Quiz</button>
        </div>
        <div v-if="store.loading" class="list" style="margin-top:16px;">
          <div v-for="n in 3" :key="n" class="card skeleton-card">
            <div class="skeleton-line"></div>
            <div class="skeleton-line short"></div>
          </div>
        </div>
        <div class="list" v-if="store.quizzes.length && !store.loading" style="margin-top:16px;">
          <div v-for="quiz in store.quizzes" :key="quiz.id" class="card quiz-card fade-in">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <h3>{{ quiz.title }}</h3>
              <span class="pill">{{ quiz.question_count }} questions</span>
            </div>
            <p class="muted" v-if="quiz.description">{{ quiz.description }}</p>
            <div style="display:flex; gap:8px; align-items:center; margin-top:8px;">
              <span class="tag" v-if="quiz.is_timed">Timed: {{ Math.floor(quiz.time_limit_seconds / 60) }}min</span>
              <span class="tag" v-else>Untimed</span>
              <span class="muted">by {{ quiz.creator_name || quiz.creator_username || "Anonymous" }}</span>
            </div>
            <div style="margin-top:12px;">
              <a class="btn" :href="'#/quiz/' + quiz.id">Take Quiz</a>
            </div>
          </div>
        </div>
        <div v-else-if="!store.loading" class="muted" style="margin-top:16px;">No quizzes yet. Be the first to create one!</div>
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

      <div v-if="showQuizCreate" class="modal-backdrop" @click.self="closeQuizCreate">
        <div class="modal-card card modal-animate">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <h3>Create a Quiz</h3>
            <button class="btn secondary" @click="closeQuizCreate">Close</button>
          </div>
          <form @submit.prevent="submitQuiz">
            <input v-model="newQuiz.title" placeholder="Quiz Title" required />
            <textarea v-model="newQuiz.description" placeholder="Description (optional)" rows="2"></textarea>
            <div style="display:flex; gap:12px; align-items:center;">
              <label style="display:flex; align-items:center; gap:6px;">
                <input type="checkbox" v-model="newQuiz.isTimed" />
                Timed Quiz
              </label>
              <input
                v-if="newQuiz.isTimed"
                v-model.number="newQuiz.timeLimitSeconds"
                type="number"
                placeholder="Time (seconds)"
                min="30"
                style="width:140px;"
              />
            </div>
            <div style="border-top:1px solid #fecaca; padding-top:12px; margin-top:8px;">
              <h4>Questions ({{ newQuiz.questions.length }})</h4>
              <div v-for="(q, idx) in newQuiz.questions" :key="idx" class="card" style="margin-bottom:12px;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                  <strong>Question {{ idx + 1 }}</strong>
                  <button type="button" class="btn secondary" @click="removeQuestion(idx)" v-if="newQuiz.questions.length > 1">Remove</button>
                </div>
                <input v-model="q.question" placeholder="Question text" required style="margin-top:8px;" />
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:8px;">
                  <input v-model="q.optionA" placeholder="Option A" required />
                  <input v-model="q.optionB" placeholder="Option B" required />
                </div>
                <div style="margin-top:8px;">
                  <label style="margin-right:16px;">
                    <input type="radio" :name="'correct-' + idx" value="A" v-model="q.correctOption" required /> A is correct
                  </label>
                  <label>
                    <input type="radio" :name="'correct-' + idx" value="B" v-model="q.correctOption" required /> B is correct
                  </label>
                </div>
              </div>
              <button type="button" class="btn secondary" @click="addQuestion">+ Add Question</button>
            </div>
            <button class="btn" :disabled="isCreatingQuiz" style="margin-top:12px;">
              <span class="spinner" v-if="isCreatingQuiz"></span>
              Create Quiz
            </button>
          </form>
          <p class="muted" v-if="!store.user">Login to create quizzes.</p>
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
    const newQuiz = reactive({
      title: "",
      description: "",
      isTimed: false,
      timeLimitSeconds: 300,
      questions: [{ question: "", optionA: "", optionB: "", correctOption: "A" }]
    });
    const showPublish = Vue.ref(false);
    const showQuizCreate = Vue.ref(false);
    const isPublishing = Vue.ref(false);
    const isCreatingQuiz = Vue.ref(false);
    const votingId = Vue.ref(null);

    function setMode(mode) {
      store.mode = mode;
      if (mode === "quizzes" && !store.quizzes.length) {
        refreshQuizzes();
      }
    }

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

    async function submitQuiz() {
      if (!store.user) {
        store.error = "Login to create a quiz.";
        return;
      }
      try {
        isCreatingQuiz.value = true;
        await api.createQuiz(newQuiz);
        Object.assign(newQuiz, {
          title: "",
          description: "",
          isTimed: false,
          timeLimitSeconds: 300,
          questions: [{ question: "", optionA: "", optionB: "", correctOption: "A" }]
        });
        showQuizCreate.value = false;
        await refreshQuizzes();
        fireConfetti();
      } catch (error) {
        store.error = error.message;
      } finally {
        isCreatingQuiz.value = false;
      }
    }

    function addQuestion() {
      newQuiz.questions.push({ question: "", optionA: "", optionB: "", correctOption: "A" });
    }

    function removeQuestion(idx) {
      newQuiz.questions.splice(idx, 1);
    }

    onMounted(() => {
      refreshPolls();
    });

    function openPublish() {
      showPublish.value = true;
    }

    function closePublish() {
      showPublish.value = false;
    }

    function openQuizCreate() {
      showQuizCreate.value = true;
    }

    function closeQuizCreate() {
      showQuizCreate.value = false;
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
      newQuiz,
      castVote,
      submitPoll,
      submitQuiz,
      addQuestion,
      removeQuestion,
      showPublish,
      showQuizCreate,
      openPublish,
      closePublish,
      openQuizCreate,
      closeQuizCreate,
      isPublishing,
      isCreatingQuiz,
      votingId,
      handleImageFile,
      setMode
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
        <div v-if="isLoading" class="list">
          <div class="skeleton-line"></div>
          <div class="skeleton-line short"></div>
          <div class="skeleton-line"></div>
        </div>
        <div v-else-if="profile.id">
          <div><strong>Name:</strong> {{ profile.name || "Not set" }}</div>
          <div><strong>Username:</strong> @{{ profile.username || "Not set" }}</div>
          <div><strong>Email:</strong> {{ profile.email }}</div>
          <div v-if="profile.age"><strong>Age:</strong> {{ profile.age }}</div>
          <div><strong>Role:</strong> {{ profile.role }}</div>
          <div><strong>Member since:</strong> {{ new Date(profile.created_at).toLocaleDateString() }}</div>
        </div>
        <div v-else class="muted">Login to view your profile.</div>
      </div>
      <div class="card">
        <h3>Voting history</h3>
        <div v-if="isLoading" class="list">
          <div v-for="n in 3" :key="n" class="card skeleton-card">
            <div class="skeleton-line"></div>
            <div class="skeleton-line short"></div>
          </div>
        </div>
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
        <div v-if="isLoading" class="list">
          <div v-for="n in 3" :key="n" class="card skeleton-card">
            <div class="skeleton-line"></div>
            <div class="skeleton-line short"></div>
          </div>
        </div>
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
      if (!store.user) {
        isLoading.value = false;
        return;
      }
      isLoading.value = true;
      try {
        const [me, votes, quizzes] = await Promise.all([
          api.getMe(),
          api.getHistory(),
          api.getQuizHistory()
        ]);
        Object.assign(profile, me);
        history.splice(0, history.length, ...votes);
        quizHistory.splice(0, quizHistory.length, ...quizzes);
      } catch (error) {
        store.error = error.message;
      } finally {
        isLoading.value = false;
      }
    }

    onMounted(load);
    return { profile, history, quizHistory, isLoading };
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
                <strong>{{ user.name || user.username || user.email || "Unknown" }}</strong>
                <div class="muted">
                  @{{ user.username || "no-username" }} • {{ user.email }}
                </div>
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

const QuizPage = {
  template: `
    <section class="section container">
      <div v-if="isLoading" class="card skeleton-card">
        <div class="skeleton-line"></div>
        <div class="skeleton-line short"></div>
        <div class="skeleton-block" style="margin-top:16px;"></div>
      </div>

      <div v-else-if="!quiz" class="card">
        <p class="error">Quiz not found.</p>
        <a href="#/feed" class="btn">Back to Feed</a>
      </div>

      <div v-else-if="showResults" class="card fade-in">
        <div class="score-display">
          <div class="score-number">{{ results.score }}/{{ results.totalQuestions }}</div>
          <div class="score-label">Questions Correct</div>
          <div class="score-percentage" :class="scoreClass">{{ results.percentage }}%</div>
        </div>
        <div v-if="quiz.is_timed && timeTaken" class="muted" style="text-align:center; margin-top:12px;">
          Completed in {{ formatTime(timeTaken) }}
        </div>
        <div class="list" style="margin-top:24px;">
          <h3>Review Answers</h3>
          <div v-for="(r, idx) in results.results" :key="r.questionId" class="card" :class="r.isCorrect ? 'quiz-option correct' : 'quiz-option incorrect'" style="cursor:default;">
            <div><strong>Q{{ idx + 1 }}:</strong> {{ questions[idx]?.question }}</div>
            <div class="muted">
              Your answer: {{ r.userAnswer || "No answer" }} |
              Correct: {{ r.correctAnswer }}
            </div>
          </div>
        </div>
        <div style="display:flex; gap:12px; margin-top:20px;">
          <a href="#/feed" class="btn secondary">Back to Feed</a>
          <button class="btn" @click="retakeQuiz">Retake Quiz</button>
        </div>
      </div>

      <div v-else class="card fade-in">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
          <div>
            <h2>{{ quiz.title }}</h2>
            <p class="muted" v-if="quiz.description">{{ quiz.description }}</p>
          </div>
          <div v-if="quiz.is_timed && started" class="quiz-timer" :class="{ warning: timeRemaining <= 30 }">
            {{ formatTime(timeRemaining) }}
          </div>
        </div>

        <div v-if="!started" style="margin-top:20px;">
          <p>This quiz has <strong>{{ questions.length }}</strong> questions.</p>
          <p v-if="quiz.is_timed">Time limit: <strong>{{ formatTime(quiz.time_limit_seconds) }}</strong></p>
          <p v-else>Take your time - this quiz is untimed.</p>
          <button class="btn" @click="startQuiz" style="margin-top:12px;">Start Quiz</button>
        </div>

        <div v-else style="margin-top:20px;">
          <div class="quiz-progress">
            <div
              v-for="(q, idx) in questions"
              :key="q.id"
              class="quiz-progress-dot"
              :class="{ current: idx === currentQuestion, answered: answers[q.id] }"
            ></div>
          </div>

          <div class="card" style="margin-top:16px;" v-if="currentQ">
            <h3>Question {{ currentQuestion + 1 }} of {{ questions.length }}</h3>
            <p style="font-size:1.1rem; margin:16px 0;">{{ currentQ.question }}</p>
            
            <div v-if="currentQ.question_image_url" style="margin-bottom:16px; text-align:center; background:#f0f0f0; padding:10px; border-radius:12px;">
              <img 
                :src="currentQ.question_image_url" 
                :alt="'Question ' + (currentQuestion + 1) + ' image'"
                style="max-width:100%; max-height:250px; border-radius:12px; object-fit:cover; display:block; margin:0 auto;"
              />
            </div>

            <div style="display:grid; gap:12px;" :style="{ gridTemplateColumns: (currentQ.option_a_image_url || currentQ.option_b_image_url) ? '1fr 1fr' : '1fr' }">
              <div
                class="quiz-option"
                :class="{ selected: answers[currentQ.id] === 'A' }"
                @click="selectAnswer('A')"
                style="flex-direction:column; text-align:center;"
              >
                <div class="quiz-option-label">A</div>
                <div v-if="currentQ.option_a_image_url" style="margin:8px 0;">
                  <img 
                    :src="currentQ.option_a_image_url"
                    alt="Option A"
                    style="width:100%; height:100px; object-fit:cover; border-radius:8px; display:block;"
                  />
                </div>
                <div>{{ currentQ.option_a }}</div>
              </div>
              <div
                class="quiz-option"
                :class="{ selected: answers[currentQ.id] === 'B' }"
                @click="selectAnswer('B')"
                style="flex-direction:column; text-align:center;"
              >
                <div class="quiz-option-label">B</div>
                <div v-if="currentQ.option_b_image_url" style="margin:8px 0;">
                  <img 
                    :src="currentQ.option_b_image_url"
                    alt="Option B"
                    style="width:100%; height:100px; object-fit:cover; border-radius:8px; display:block;"
                  />
                </div>
                <div>{{ currentQ.option_b }}</div>
              </div>
            </div>
          </div>

          <div v-if="error" class="error" style="margin-top:12px; padding:12px; background:rgba(220,38,38,0.1); border-radius:8px;">
            {{ error }}
          </div>

          <div style="display:flex; justify-content:space-between; margin-top:16px;">
            <button class="btn secondary" @click="prevQuestion" :disabled="currentQuestion === 0">Previous</button>
            <button v-if="currentQuestion < questions.length - 1" class="btn" @click="nextQuestion">Next</button>
            <button v-else class="btn" @click="submitQuiz" :disabled="isSubmitting">
              <span class="spinner" v-if="isSubmitting"></span>
              Submit Quiz
            </button>
          </div>
        </div>
      </div>
    </section>
  `,
  setup() {
    const quiz = Vue.ref(null);
    const questions = Vue.ref([]);
    const answers = reactive({});
    const isLoading = Vue.ref(true);
    const started = Vue.ref(false);
    const currentQuestion = Vue.ref(0);
    const showResults = Vue.ref(false);
    const results = Vue.ref(null);
    const isSubmitting = Vue.ref(false);
    const timeRemaining = Vue.ref(0);
    const timeTaken = Vue.ref(0);
    const error = Vue.ref(null);
    let timerInterval = null;
    let startTime = null;

    const scoreClass = computed(() => {
      if (!results.value) return "";
      const pct = results.value.percentage;
      if (pct >= 80) return "excellent";
      if (pct >= 50) return "good";
      return "poor";
    });

    const currentQ = computed(() => {
      if (!questions.value || questions.value.length === 0) return null;
      return questions.value[currentQuestion.value] || null;
    });

    function formatTime(seconds) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, "0")}`;
    }

    async function load() {
      isLoading.value = true;
      error.value = null;
      try {
        const data = await api.getQuiz(router.currentRoute.value.params.id);
        quiz.value = data.quiz;
        questions.value = data.questions;
      } catch (err) {
        error.value = err.message;
      } finally {
        isLoading.value = false;
      }
    }

    function startQuiz() {
      started.value = true;
      startTime = Date.now();
      if (quiz.value.is_timed) {
        timeRemaining.value = quiz.value.time_limit_seconds;
        timerInterval = setInterval(() => {
          timeRemaining.value -= 1;
          if (timeRemaining.value <= 0) {
            clearInterval(timerInterval);
            submitQuiz();
          }
        }, 1000);
      }
    }

    function selectAnswer(option) {
      answers[questions.value[currentQuestion.value].id] = option;
    }

    function nextQuestion() {
      if (currentQuestion.value < questions.value.length - 1) {
        currentQuestion.value += 1;
      }
    }

    function prevQuestion() {
      if (currentQuestion.value > 0) {
        currentQuestion.value -= 1;
      }
    }

    async function submitQuiz() {
      if (!store.user) {
        error.value = "Login to submit quiz.";
        return;
      }
      if (timerInterval) {
        clearInterval(timerInterval);
      }
      isSubmitting.value = true;
      error.value = null;
      timeTaken.value = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;
      try {
        const plainAnswers = {};
        for (const key in answers) {
          plainAnswers[key] = answers[key];
        }
        const data = await api.submitQuiz(quiz.value.id, {
          answers: plainAnswers,
          timeTakenSeconds: timeTaken.value
        });
        results.value = data;
        showResults.value = true;
        fireConfetti();
      } catch (err) {
        console.error("Submit quiz error:", err);
        error.value = err.message;
      } finally {
        isSubmitting.value = false;
      }
    }

    function retakeQuiz() {
      Object.keys(answers).forEach((key) => delete answers[key]);
      currentQuestion.value = 0;
      started.value = false;
      showResults.value = false;
      results.value = null;
      timeTaken.value = 0;
    }

    onMounted(load);

    return {
      quiz,
      questions,
      answers,
      isLoading,
      started,
      currentQuestion,
      currentQ,
      showResults,
      results,
      isSubmitting,
      timeRemaining,
      timeTaken,
      error,
      scoreClass,
      formatTime,
      startQuiz,
      selectAnswer,
      nextQuestion,
      prevQuestion,
      submitQuiz,
      retakeQuiz
    };
  }
};

const routes = [
  { path: "/", component: LandingPage },
  { path: "/login", component: LoginPage },
  { path: "/feed", component: FeedPage },
  { path: "/poll/:id", component: PollPage },
  { path: "/quiz/:id", component: QuizPage },
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
  const colors = ["#ef4444", "#f87171", "#fca5a5", "#dc2626", "#b91c1c", "#fecaca"];
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
