================================================================================
                         THIS OR THAT - WINDOWS GUIDE
================================================================================

A quiz and polling platform with real-time updates, user authentication,
and admin controls. Features both Poll mode (vote between options) and 
Quiz mode (timed/untimed quizzes with scoring).

================================================================================
                              QUICK START
================================================================================

FIRST TIME SETUP:
-----------------
1. Copy this entire folder to your computer (e.g., C:\ThisOrThat)

2. Double-click: setup-windows.bat
   - This will check for and help install required software:
     * Docker Desktop (for the database)
     * Node.js (for the backend server)
     * Python (for the frontend server)
   - Follow any prompts to complete installation
   - You may need to restart your computer after installing Docker

3. After setup completes, the app will start automatically!


SUBSEQUENT RUNS:
----------------
Just double-click: start.bat

The app will:
- Start Docker if needed
- Start the PostgreSQL database
- Start the backend server (port 3000)
- Start the frontend server (port 8000)
- Open your browser to http://localhost:8000


TO STOP THE APP:
----------------
Double-click: stop.bat
Or simply close the two server windows that opened.


================================================================================
                            TEST ACCOUNTS
================================================================================

You can log in with username OR email:

  ADMIN ACCOUNT:
    Username: admin
    Email:    admin@thisorthat.app
    Password: password

  USER ACCOUNTS:
    Username: alex      Email: alex@thisorthat.app     Password: password
    Username: jamie     Email: jamie@thisorthat.app    Password: password


================================================================================
                              FEATURES
================================================================================

POLL MODE:
  - Create polls with text or image options
  - Vote once per poll
  - See real-time results
  - Comment on polls

QUIZ MODE:
  - Create quizzes with multiple questions
  - Timed or untimed quizzes
  - Two options per question (A or B)
  - Score tracking and history
  - Review answers after completion

ADMIN PANEL (admin account only):
  - View analytics (users, polls, votes)
  - Manage users (ban/unban)
  - Approve/reject polls
  - Create polls directly


================================================================================
                           TROUBLESHOOTING
================================================================================

"Docker is not running":
  - Open Docker Desktop from Start Menu
  - Wait for it to fully start (whale icon in system tray stops animating)
  - Try running start.bat again

"Port already in use":
  - Run stop.bat to kill any existing servers
  - Or manually close any programs using ports 3000 or 8000

"Cannot connect to database":
  - Make sure Docker Desktop is running
  - Try: docker restart this-or-that-postgres
  - Then run start.bat again

"npm install fails":
  - Make sure you have internet connection
  - Try running as Administrator
  - Delete the backend\node_modules folder and try again

"Browser shows blank page":
  - Wait a few more seconds for servers to start
  - Check that both server windows are open and running
  - Try refreshing the page (F5)


================================================================================
                           MANUAL COMMANDS
================================================================================

If you prefer command line, open Command Prompt in this folder:

  Start PostgreSQL:
    docker start this-or-that-postgres

  Start Backend:
    cd backend
    npm run dev

  Start Frontend (in another terminal):
    python -m http.server 8000

  Reset Database:
    docker exec this-or-that-postgres psql -U postgres -d this_or_that -f /schema.sql
    docker exec this-or-that-postgres psql -U postgres -d this_or_that -f /seed.sql


================================================================================
                              FILE STRUCTURE
================================================================================

ThisOrThat/
├── setup-windows.bat    <- First-time setup (installs dependencies)
├── start.bat            <- Start the application
├── stop.bat             <- Stop all services
├── WINDOWS-README.txt   <- This file
│
├── index.html           <- Main HTML file
├── frontend/            <- Frontend code (Vue.js)
│   ├── app.js
│   ├── api.js
│   └── styles.css
│
├── backend/             <- Backend code (Node.js/Express)
│   ├── server.js
│   ├── package.json
│   ├── routes/
│   └── middleware/
│
└── db/                  <- Database files
    ├── schema.sql
    └── seed.sql


================================================================================
                               SUPPORT
================================================================================

If you encounter issues:
1. Make sure Docker Desktop is running
2. Try running stop.bat, then start.bat
3. Check that no other apps are using ports 3000 or 8000
4. Restart your computer and try again

================================================================================
