# CodeHelper

CodeHelper is an AI-powered code analysis tool built with Flask and the Google Gemini API. It allows users to upload project files and receive professional README documentation, debugging analysis, and code improvement suggestions.

## Features

- **Multi-file Upload**: Support for uploading multiple source files, configurations, images, or videos for context.
- **Gemini AI Integration**: Leverages the `gemini-3-flash-preview` model for intelligent code review.
- **Interactive UI**: Drag-and-drop file interface with real-time file previews.
- **Automated Generation**:
    - **README.md**: Generates professional documentation based on code structure.
    - **Debugging**: Identifies potential bugs and provides fix suggestions.
    - **Improvements**: Suggests refactoring, performance optimizations, and best practices.
- **Markdown Rendering**: Results are rendered directly in the browser with syntax highlighting support.
- **Export**: Built-in functionality to download the generated `README.md`.

## Tech Stack

- **Backend**: Python, Flask
- **AI Engine**: `google-genai` (Google Gemini)
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Libraries**: `marked.js` (Markdown parsing)

## Installation

1. Ensure you have Python installed.
2. Install the required dependencies:
   ```bash
   pip install flask google-genai
   ```
3. Set up a Gemini API Key from Google AI Studio.

## Usage

1. Run the Flask application:
   ```bash
   python app.py
   ```
2. Open your browser and navigate to `http://127.0.0.1:5000`.
3. Enter your Google Gemini API Key.
4. Select the desired analysis options (README, Debug, Suggest).
5. Drag and drop your project files and click **Generate**.