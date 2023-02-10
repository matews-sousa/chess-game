# Chess Game

A Chess Game application built with Typescript, React, TailwindCSS, Supabase and Chess.js.

## Demo

Use the project at https://chess-game-wine.vercel.app

## Features

- Sign Up with email and password
- Sign In with email and password
- Create a online game picking the color
- Join a room by ID
- View all games played by the user
- Play and chat in realtime with the oponent
- Resign the game
- Promote a piece picking between Bishop, Knight, Rook or Queen

## Tech Stack

- [Typescript](https://www.typescriptlang.org) as programming language
- [React](https://reactjs.org) as frontend library
- [Supabase](https://supabase.com) as BaaS (Backend as a Service)
- [Tailwind CSS](https://tailwindcss.com) for styling
- [Chess.js](https://github.com/jhlywa/chess.js) for validating piece movement and a game state
- [Chessboard.jsx](https://chessboardjsx.com) for displaying a Chessboard with pieces

## Run Locally

Clone the project

```bash
git clone https://github.com/matews-sousa/chess-game.git
cd chess-game
```

You can run the application using Docker with the following command:

```bash
docker-compose up
```

## Supabase configuration

Create a project at [Supabase](https://supabase.com) and create a table named "games" with the following structure (enable Realtime Database):

```
uuid: string - primary key
created_at: Date - default now
creator_id: string - referencing user
players: {}[] (array of json)
status: string - default as "waiting"
endOfGame: string
winner: string
position: string
history: string[]
```

Create a `.env.local` file and fill the values:

```
VITE_SUPABASE_URL=<your_supabase_url>
VITE_SUPABASE_KEY=<your_supabase_key>
```
