# Fire Marshal Inspection Form

A lightweight web form to simulate a modernized digital Fire Marshal Inspection eform.

## Features

- Ontario Design System-based interface
- Dynamic form fields based on inspection type
- Inline validation and feedback
- Form data submitted to a local JSON-based backend
- Admin view to see and inspect submissions

## Tech Stack

- HTML / CSS / JavaScript (Vanilla JS)
- Node.js + Express
- Ontario Design System Web Components

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or newer recommended)

### Installation

1. Clone this repository or download the project files.
2. Navigate to the project folder:

   ```bash
   cd fire-marshal-form
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

### Running the App

Start the server:

```bash
npm start
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

- The main form is available at `/form.html`
- The admin panel is at `/admin.html`

## Notes

- Form submissions are saved to a local file called `submissions.json`.
- No actual database or authentication is implemented.
- This project is intended for demonstration and prototyping purposes.

