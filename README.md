# Attune: Adaptive Chat Framework

A modern, responsive chat framework with an intelligent conversational engine built using Next.js, Shadcn UI, RxJS, and SQLite (via sql.js). Attune demonstrates how to build adaptive UIs that react to real-time events and persist data locally.

![Attune](https://github.com/sunnypatneedi/attune/raw/main/public/screenshot.png)

## Features

- 💬 **Conversational Interface**: Clean and intuitive chat UI with user and bot messages
- 🎨 **Adaptive Design**: UI components that react to events in real-time
- 🔄 **Event-Based Architecture**: Using RxJS for decoupled component communication
- 💾 **Local Persistence**: SQLite database in the browser using sql.js
- 🔄 **Cross-Tab Synchronization**: Chat state synced across multiple browser tabs
- 🌓 **Dark/Light Mode**: Toggle between dark and light themes

## Tech Stack

- **[Next.js](https://nextjs.org)**: React framework for server-rendered applications
- **[Shadcn UI](https://ui.shadcn.com)**: Beautiful, accessible UI components
- **[Tailwind CSS](https://tailwindcss.com)**: Utility-first CSS framework
- **[RxJS](https://rxjs.dev)**: Reactive programming library for event handling
- **[sql.js](https://github.com/sql-js/sql.js)**: SQLite compiled to WebAssembly
- **[TypeScript](https://www.typescriptlang.org)**: Typed JavaScript for better developer experience

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm 7.x or later

### Installation

1. Clone the repository:

```bash
git clone https://github.com/sunnypatneedi/attune.git
cd attune
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## How It Works

### Event-Based Architecture

The application uses an RxJS Subject as an event bus to facilitate communication between components. Key events include:

- User message events
- Bot response events
- Typing indicator events
- Theme change events

Components subscribe to these events to update their state and render accordingly.

### Local Database

Chat messages and user preferences are stored in a SQLite database running in the browser using sql.js. The database is:

- Initialized when the application loads
- Saved to localStorage periodically and on page unload
- Restored from localStorage when the application is re-opened

### Cross-Tab Synchronization

The application uses the BroadcastChannel API (with localStorage as a fallback) to synchronize chat state across multiple browser tabs. This ensures a consistent experience when the user has the application open in multiple windows.

## Project Structure

```
src/
├── app/                 # Next.js App Router
├── components/
│   ├── ui/              # Shadcn UI components
│   └── chat/            # Chat-specific components
└── lib/                 # Utility functions and core logic
    ├── database.ts      # SQLite database operations
    ├── event-bus.ts     # RxJS event system
    ├── use-event-bus.ts # React hooks for the event system
    └── conversation-engine.ts # Message processing logic
```

## Customization

### Conversation Engine

The conversation engine in `src/lib/conversation-engine.ts` can be enhanced with more sophisticated logic or integrated with external AI services like OpenAI's API.

### UI Components

Shadcn UI components can be customized by modifying their source code in the `src/components/ui` directory.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Shadcn UI](https://ui.shadcn.com) for the beautiful component library
- [sql.js](https://github.com/sql-js/sql.js) for bringing SQLite to the browser
- [RxJS](https://rxjs.dev) for the powerful reactive programming model

