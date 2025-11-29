# FlagWise - Community Content Moderator

A full-stack application for moderating community content using AI-powered rule validation with Cerebras and Langchain.

## Features

- Create and manage communities
- Set custom rules for each community
- AI-powered message validation against community rules
- Real-time feedback on rule violations
- Modern React frontend for easy testing

## Tech Stack

### Backend
- NestJS
- TypeScript
- Langchain with Cerebras provider (llama3.1-8b model)
- In-memory data storage

### Frontend
- React
- TypeScript
- Vite

## Prerequisites

- Node.js (v18 or higher)
- npm
- Cerebras API key

## Setup

1. **Environment Variables**

   The `.env` file in the project root already contains the CEREBRAS_API_KEY. Make sure it's set correctly:
   ```
   CEREBRAS_API_KEY=your_cerebras_api_key_here
   ```

2. **Install Backend Dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install Frontend Dependencies**
   ```bash
   cd frontend
   npm install
   ```

## Running the Application

### Start Backend Server
```bash
cd backend
npm start
```
The backend will run on `http://localhost:3000`

### Start Frontend
```bash
cd frontend
npm run dev
```
The frontend will run on `http://localhost:5173`

## API Endpoints

### 1. Create Community
**POST** `/community`
```json
{
  "id": "tech-community",
  "rules": [
    "No hate speech",
    "No spam",
    "Be respectful to others"
  ]
}
```
Note: `rules` is optional. You can create a community without rules and set them later.

### 2. Get All Communities
**GET** `/community`

### 3. Get Community by ID
**GET** `/community/:id`

### 4. Set Community Rules
**POST** `/community/:id/rules`
```json
{
  "rules": [
    "No hate speech",
    "No spam",
    "Be respectful to others"
  ]
}
```

### 5. Check Message
**POST** `/community/:id/check`
```json
{
  "message": "This is a test message"
}
```

**Response:**
```json
{
  "isValid": true
}
```

or

```json
{
  "isValid": false,
  "violatedRule": "No hate speech"
}
```

## Usage Example

1. Open the frontend at `http://localhost:5173`
2. Create a new community by entering:
   - Community ID (required)
   - Initial rules (optional, one per line)
3. Select the community from the dropdown
4. View current rules or update them using the "Set/Update Rules" section
5. Enter a message to validate in the "Check Message" section
6. Click "Verify Message" to check if it violates any rules

## How It Works

The application uses Cerebras AI (via Langchain) to analyze messages against community rules. When you submit a message:

1. The message is sent to the backend along with the community ID
2. The backend retrieves the community rules
3. Langchain sends a prompt to the Cerebras AI model with the message and rules
4. The AI analyzes the message and determines if any rules are violated
5. The result is returned to the frontend with the validation status and violated rule (if any)

## Project Structure

```
FlagWise/
├── backend/
│   ├── src/
│   │   ├── cerebras/           # Cerebras/Langchain integration
│   │   ├── community/          # Community module
│   │   │   ├── dto/           # Data transfer objects
│   │   │   ├── entities/      # Entity definitions
│   │   │   ├── community.controller.ts
│   │   │   ├── community.service.ts
│   │   │   └── community.module.ts
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── App.tsx            # Main application component
│   │   ├── App.css            # Styles
│   │   └── main.tsx
│   ├── package.json
│   └── index.html
└── .env                        # Environment variables
```

## License

MIT
