import os
import json
from flask import Flask, render_template, request, jsonify, send_file
from google import genai
from google.genai.types import Schema, Type, GenerateContentConfig

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/styles.css', methods=['GET'])
def styles():
    return send_file("static/styles.css", mimetype='text/css')

@app.route('/index.js', methods=['GET'])
def index_scripts():
    return send_file("static/index.js", mimetype='application/javascript')

@app.route('/upload', methods=['POST'])
def upload():
    files = request.files.getlist('files')
    api_key = request.form.get('api_key')
    options = request.form.getlist('options')

    if not api_key:
        return jsonify({"error": "API key required"}), 400

    if not options:
        return jsonify({"error": "Select at least one option"}), 400

    if not files:
        return jsonify({"error": "No files uploaded"}), 400

    try:
        client = genai.Client(api_key=api_key)
        model_name = "gemini-3-flash-preview"

        uploaded_files = []
        temp_dir = "temp_uploads"
        os.makedirs(temp_dir, exist_ok=True)
        for file in files:
            if file.filename:
                temp_path = os.path.join(temp_dir, file.filename)
                file.save(temp_path)
                uploaded = client.files.upload(file=temp_path)
                uploaded_files.append(uploaded)
                os.remove(temp_path)

        response_schema = Schema(
            type=Type.OBJECT,
            properties={
                "readme": Schema(type=Type.STRING, description="Full README.md text", nullable=True),
                "debug": Schema(type=Type.STRING, description="Errors analysis and fix suggestions", nullable=True),
                "suggest": Schema(type=Type.STRING, description="Code improving suggestions", nullable=True),
            },
            required=[]
        )

        system_prompt = """
        You are a code review expert. Your task is to review the uploaded project files and return a response **IN JSON FORMAT ONLY**.

        Rules:
        - The response must be a valid JSON object and strictly conform to the provided JSON schema.
        - Keys allowed: only "readme", "debug", "suggest".
        - Include a key ONLY if the corresponding task was explicitly requested.
        - ONLY REQUESTED keys MUST be present in the JSON.
        - Values for requested keys MUST be non-empty strings.

        Accuracy and assumptions:
        - Write ONLY about information that can be confidently derived from the provided code and files.
        - DO NOT invent features, dependencies, configurations, or behaviors that are not clearly present in the codebase.
        - If some information is unknown or cannot be determined from the files, explicitly state this instead of guessing.
        - Never assume deployment environment, OS, cloud provider, or runtime unless explicitly defined in code.

        Dependencies and versions:
        - When describing dependencies or installation steps, list ONLY libraries that are directly imported or referenced in the code.
        - If exact library versions are not specified in the files (e.g. requirements.txt, pyproject.toml, package.json), do not mention library version

        Formatting rules:
        - Use Markdown for headings, lists, and inline code.
        - Do not include explanations, comments, or text outside of the JSON object.
        - Do not include trailing commas or invalid JSON.
        
        Sample response:
        {"readme": "# Project\nDescription...", "suggest": "- Use async...\n- Add type hints"}
        """

        contents = [system_prompt]

        task_instruction = "Complete the following tasks:\n"
        task_map = {
            "readme": "Create a complete, professional README.md.",
            "debug": "Find errors, bugs, potential problems, and suggest fixes.",
            "suggest": "Suggest improvements: refactoring, performance, readability, best practices."
        }

        for opt in options:
            if opt in task_map:
                task_instruction += f"- {task_map[opt]}\n"

        contents.append(task_instruction)

        for uf in uploaded_files:
            contents.append(uf)

        configuration = GenerateContentConfig(response_mime_type="application/json", response_schema=response_schema)

        response = client.models.generate_content(
            model=model_name,
            contents=contents,
            config=configuration
        )

        result_json = json.loads(response.text)

        return jsonify(result_json)

    except Exception as e:
        return jsonify({"error": f"Gemini error: {str(e)}"}), 500
    finally:
        pass

if __name__ == '__main__':
    app.run(
        debug=True,
        use_reloader=False
    )