# DIHCORD — Premium Discord-Inspired Communication Platform

DIHCORD is a fully functional, realtime communication platform built with React, TypeScript, Vite, Tailwind CSS, Framer Motion, Lucide React, and Convex.

## Features

- **Authentication**: Login, signup, logout with persistent sessions (scrypt password hashing)
- **Servers**: Create, join by invite, explore, leave, delete servers
- **Channels**: Text and voice channels with categories, positions, collapsible sections
- **Realtime Messaging**: Send, edit, delete messages with pagination, attachments (up to 5 per message)
- **Reactions**: Emoji reactions including custom server emojis
- **Replies**: Message quoting and threading
- **Friends**: Send, accept, decline friend requests; direct messages
- **Presence**: Online/idle/dnd/invisible/offline status with heartbeat
- **Notifications**: Mentions and friend requests with unread counts
- **Search**: Full-text message search across channels
- **Profile**: Custom avatars, display names, custom status, accent colors, themes, about-me, pronouns
- **Customization Studio**: 15 theme presets + custom theme editor, animated backgrounds (Aurora, Particles, Gradient)
- **Polls**: Create and vote on polls
- **Scheduled Messages**: Schedule messages for future delivery
- **Server Events**: Create and view server events
- **Moderation**: Role management, kick, moderation logs, user blocking
- **Voice/Video**: Architecture prepared for LiveKit integration

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Framer Motion, Lucide React, React Router v8
- **Backend**: Convex (database, realtime sync, authentication, file storage)
- **Icons**: Lucide React
- **Animations**: Framer Motion

## Deployment

DIHCORD is a single-page application (React Router SPA). You must configure your host to serve `index.html` for all routes.

### Vercel
Connect your GitHub repo to Vercel. Framework preset: **Vite**. Build command: `npm run build` (run in `dihcord/` directory). Output directory: `dihcord/dist`. A `vercel.json` is included for SPA fallback.

### Netlify
Connect your GitHub repo to Netlify. Build command: `npm run build` (run in `dihcord/` directory). Publish directory: `dihcord/dist`. A `_redirects` and `netlify.toml` are included for SPA fallback.

### Manual / Any Static Host
1. `cd dihcord && npm install`
2. `npm run build`
3. Deploy the `dist/` folder to your static host
4. Configure SPA fallback: all routes → `index.html`

### Convex Setup
1. Install Convex CLI: `npm install -g convex`
2. `nvex login`
3. `cd dihcord && npx convex init` (link to your Convex project)
4. `npx convex deploy` (push schema and functions)
5. Copy your Convex deployment URL to `dihcord/.env.local`:
   ```
   VITE_CONVEX_URL=https://your-deployment.convex.cloud
   ```

## Development

```bash
# Install dependencies
cd dihcord
npm install

# Start dev server
npm run dev   # http://localhost:1420/

# Type check
npx tsc --noEmit

# Lint
npm run lint

# Production build
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
dihcord/
├── src/
│   ├── main.tsx          # React entry with ConvexProvider, AuthProvider, ThemeProvider
│   ├── App.tsx           # React Router routes
│   ├── index.css         # Premium design system (CSS variables, animations)
│   ├── types/            # TypeScript type definitions
│   ├── contexts/         # Auth, UI, Theme providers
│   ├── lib/              # Convex client, utils, emojis, themes, voice
│   ├── components/
│   │   ├── ui/           # Button, Input, Modal, Avatar, EmojiPicker, EnhancedEmojiPicker
│   │   ├── layout/       # ServerSidebar, ChannelSidebar, HomeSidebar, MemberSidebar, UserPanel, AppShell
│   │   ├── chat/         # ChannelView, MessageList, MessageItem, Composer, ChatHeader, TypingIndicator, PollDisplay
│   │   ├── home/         # FriendsPage
│   │   ├── modals/       # ServerModals, UserModals, ProfileEditor, ServerEmojiManager, SearchModal
│   │   ├── customization/# ThemePicker
│   │   ├── settings/     # SettingsContent
│   │   └── animation/    # Framer Motion animation presets
│   └── pages/            # AuthPage
├── convex/               # Convex backend (schema + all functions)
├── vercel.json           # Vercel SPA config
├── netlify.toml          # Netlify SPA config
├── _redirects            # SPA fallback
└── package.json
```

## License

MIT