# SCU 4-Year Planner

A comprehensive web application for Santa Clara University (SCU) students to map out their academic journey. This tool helps students visualize their 4-year plan, track degree requirements, and prepare for graduation.

## Features

- **Personalized Onboarding**: Sign in with Google and set your major (e.g., Computer Science), minor, and starting term.
- **Interactive 4-Year Plan**: Drag-and-drop or search to add courses to specific years and terms (Fall, Winter, Spring, Summer).
- **Requirements Tracking**: Real-time progress monitoring for Major Core, General Education (Core), and Electives.
- **Course Search**: Quickly find SCU courses and view details directly within the planner.
- **Advisor Integration**: Tools for students to schedule advisor meetings and for advisors to review student plans.
- **Status Management**: Track courses as *Planned*, *In Progress*, or *Completed*.

## Tech Stack

- **Frontend**: React.js with Tailwind CSS
- **Routing**: React Router
- **Backend/Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (Google OAuth)
- **Design**: Material Design principles with custom "Stitch" aesthetics

## Project Structure

- `src/components/`: Modular UI components (Planner, Requirements, Onboarding, etc.)
- `src/services/`: Database and API interaction logic using Supabase
- `data/`: Local JSON data for course requirements and configurations
- `StitchDesign/`: Design specifications and reference screenshots

## Getting Started

### Prerequisites

- Node.js and npm
- A Supabase project (for database and auth)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd 4_year_planner
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Environment Variables:
   Create a `.env` file in the root directory and add your Supabase credentials:
   ```env
   REACT_APP_SUPABASE_URL=your-supabase-url
   REACT_APP_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. Run the development server:
   ```bash
   npm start
   ```
   Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

## Available Scripts

- `npm start`: Runs the app in development mode.
- `npm test`: Launches the test runner.
- `npm run build`: Builds the app for production.
- `npm run eject`: Removes the single build dependency (standard CRA eject).

## License

This project is developed for Santa Clara University students.
