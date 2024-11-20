class DragAndDropComponent extends HTMLElement {
    constructor() {
        super();
        const shadow = this.attachShadow({ mode: 'open' });

        const style = document.createElement('style');
        style.textContent = `
            .drop-area {
                border: 2px dashed #ccc;
                border-radius: 10px;
                padding: 20px;
                text-align: center;
                color: #666;
                font-family: Arial, sans-serif;
                transition: background-color 0.3s ease;
            }
            .drop-area.highlight {
                background-color: #f0f8ff;
            }
        `;

        const container = document.createElement('div');
        container.classList.add('drop-area');
        container.textContent = 'Arrastra y suelta archivos aquí';

        shadow.appendChild(style);
        shadow.appendChild(container);

        this.setupDragAndDrop(container);
    }

    setupDragAndDrop(dropArea) {
        const preventDefaults = (e) => {
            e.preventDefault();
            e.stopPropagation();
        };

        const highlight = () => dropArea.classList.add('highlight');
        const unhighlight = () => dropArea.classList.remove('highlight');

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, preventDefaults, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            dropArea.addEventListener(eventName, highlight, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, unhighlight, false);
        });

        dropArea.addEventListener('drop', this.handleDrop.bind(this), false);
    }

    handleDrop(e) {
        const files = e.dataTransfer.files;
        for (const file of files) {
            processDroppedFile(file,e);
        }
    }
    
}
async function processDroppedFile(file,e) {
    if (file.path) {
        await processFileWithPath(file);
    } else {
        await processFileWithoutPath(file);
    }
}
async function processFileWithPath(file) {
    console.log('Archivo cargado:', file);
}
async function processFileWithoutPath(file) {
    if (electron && file){ 
        console.log(electron.showFilePath(file))
    } else {

    }
}
// Registrar el componente
customElements.define('drag-and-drop', DragAndDropComponent);
