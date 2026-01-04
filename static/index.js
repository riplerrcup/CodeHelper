const fileInput = document.getElementById('files');
const fileList = document.getElementById('file-list');
const submitBtn = document.getElementById('submitBtn');
const loader = document.getElementById('loader');
const responseDiv = document.getElementById('response');
const apiKeyInput = document.getElementById('api-key');

let selectedFiles = [];

const wrapper = document.querySelector('.file-input-wrapper');

['dragover', 'dragenter'].forEach(eventName => {
    wrapper.addEventListener(eventName, event => {
        event.preventDefault();
        wrapper.style.borderColor = '#4285f4';
    });
});

['dragleave', 'dragend', 'drop'].forEach(eventName => {
    wrapper.addEventListener(eventName, event => {
        event.preventDefault();
        wrapper.style.borderColor = '#aaa';
    });
});

wrapper.addEventListener('drop', event => {
    event.preventDefault();
    handleFiles({ target: { files: event.dataTransfer.files } });
});

fileInput.addEventListener('change', handleFiles);

function handleFiles(event) {
    const newFiles = Array.from(event.target.files);
    selectedFiles = [...selectedFiles, ...newFiles];
    renderFileList();
}

function downloadFile(content, filename, type = 'text/plain') {
    console.log("123")
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;

    link.style.display = 'none';
    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
}

function escapeQuotes(str) {
    return str.replace(/'/g, "\\'");
}

function renderFileList() {
    fileList.innerHTML = '';

    selectedFiles.forEach((file, index) => {
        const div = document.createElement('div');
        div.className = 'file-preview';

        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-file';
        removeBtn.textContent = '×';

        removeBtn.onclick = () => {
            selectedFiles.splice(index, 1);
            renderFileList();
        };

        if (file.type.startsWith('image/')) {
            const img = document.createElement('img');
            img.src = URL.createObjectURL(file);
            div.appendChild(img);
        } else if (file.type.startsWith('video/')) {
            const video = document.createElement('video');
            video.src = URL.createObjectURL(file);
            video.controls = true;
            video.muted = true;
            div.appendChild(video);
        } else {
            const icon = document.createElement('div');
            icon.textContent = '📄';
            icon.style.fontSize = '60px';
            div.appendChild(icon);
        }

        const name = document.createElement('div');
        name.textContent =
            file.name.length > 25
                ? file.name.substring(0, 25) + '...'
                : file.name;

        name.style.marginTop = '8px';
        name.style.fontSize = '12px';

        div.appendChild(name);
        div.appendChild(removeBtn);
        fileList.appendChild(div);
    });
}

document.getElementById('uploadForm').onsubmit = async event => {
    event.preventDefault();

    if (selectedFiles.length === 0) {
        alert('Please, attach at least one file');
        return;
    }

    if (!apiKeyInput.value.trim()) {
        alert('Please, enter your Gemini API key');
        return;
    }

    const selectedOptions = Array.from(
        document.querySelectorAll('.prompt_type:checked')
    ).map(cb => cb.value);

    if (selectedOptions.length === 0) {
        alert('Please, select at least one generation option');
        return;
    }

    const formData = new FormData();
    selectedFiles.forEach(file => formData.append('files', file));
    formData.append('api_key', apiKeyInput.value);
    selectedOptions.forEach(opt => formData.append('options', opt));

    responseDiv.innerHTML = '';
    loader.style.display = 'block';
    submitBtn.disabled = true;

    try {
        const res = await fetch('/upload', {
            method: 'POST',
            body: formData
        });

        const data = await res.json();

        if (data.error) {
            responseDiv.innerHTML = `
                <div class="response-section error">
                    <h3>Error</h3>
                    <pre>${data.error}</pre>
                </div>
            `;
            return;
        }

        if (data.readme) {
            const section = document.createElement('div');
            section.className = 'response-section';

            section.innerHTML = `
                <h3>
                    README.md
                    <button class="download-btn">⬇ Download</button>
                </h3>
                <pre></pre>
            `;

            const btn = section.querySelector('.download-btn');
            btn.addEventListener('click', () => {
                downloadFile(data.readme, 'README.md', 'text/plain;charset=utf-8');
            });

            section.querySelector('pre').innerHTML = marked.parse(data.readme)

            responseDiv.appendChild(section);
        }

        if (data.debug) {
            const section = document.createElement('div');
            section.className = 'response-section';

            section.innerHTML = `
                <h3>Debugging Help</h3>
                <pre>${marked.parse(data.debug)}</pre>
            `;
            responseDiv.appendChild(section);
        }

        if (data.suggest) {
            const section = document.createElement('div');
            section.className = 'response-section';

            section.innerHTML = `
                <h3>Improvement Suggestions</h3>
                <pre>${marked.parse(data.suggest)}</pre>
            `;
            responseDiv.appendChild(section);
        }
    } catch (err) {
        responseDiv.innerHTML = `
            <div class="response-section error">
                <h3>Network Error</h3>
                <pre>${err.message}</pre>
            </div>
        `;
    } finally {
        loader.style.display = 'none';
        submitBtn.disabled = false;
    }
};