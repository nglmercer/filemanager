class LocalStorageManager {
    constructor(key) {
        this.key = key;
        this.initializeStorage();
    }

    async initializeStorage() {
        try {
            const currentData = await this.getAll();
            if (!currentData.length) {
                await this.saveItems([]);
            }
        } catch (error) {
            this.handleError('Error initializing storage', error);
        }
    }

    // Método para crear una copia profunda de un objeto
    deepCopy(obj) {
        try {
            return JSON.parse(JSON.stringify(obj));
        } catch (error) {
            this.handleError('Error creating deep copy', error);
            return null;
        }
    }

    async add(item) {
        try {
            const items = await this.getAll();
            // Creamos una copia profunda del item antes de comparar
            const itemCopy = this.deepCopy(item);
            
            // Verificamos si ya existe un objeto similar
            const exists = items.some(existingItem => 
                this.areObjectsEqual(existingItem, itemCopy)
            );

            if (!exists) {
                // Guardamos la copia del objeto, no el original
                items.push(itemCopy);
                await this.saveItems(items);
                return true;
            }
            return false;
        } catch (error) {
            this.handleError('Error adding item', error);
        }
    }

    async remove(identifier) {
        try {
            const items = await this.getAll();
            const updatedItems = items.filter(item => 
                item.id !== identifier && item.name !== identifier
            );
            
            if (updatedItems.length !== items.length) {
                await this.saveItems(updatedItems);
                return true;
            }
            return false;
        } catch (error) {
            this.handleError('Error removing item', error);
        }
    }

    async get(identifier) {
        try {
            const items = await this.getAll();
            const item = items.find(item => 
                item.id === identifier || item.name === identifier
            );
            // Retornamos una copia profunda del item encontrado
            return item ? this.deepCopy(item) : null;
        } catch (error) {
            this.handleError('Error getting item', error);
        }
    }

    async getAll() {
        try {
            const items = localStorage.getItem(this.key);
            // Retornamos una copia profunda de todos los items
            return items ? this.deepCopy(JSON.parse(items)) : [];
        } catch (error) {
            this.handleError('Error getting all items', error);
        }
    }

    async saveItems(items) {
        try {
            // Creamos una copia profunda antes de guardar
            const itemsCopy = this.deepCopy(items);
            localStorage.setItem(this.key, JSON.stringify(itemsCopy));
        } catch (error) {
            this.handleError('Error saving items', error);
        }
    }

    async clear() {
        try {
            await this.saveItems([]);
        } catch (error) {
            this.handleError('Error clearing storage', error);
        }
    }

    async exists(item) {
        try {
            const items = await this.getAll();
            // Creamos una copia profunda del item antes de comparar
            const itemCopy = this.deepCopy(item);
            return items.some(existingItem => 
                this.areObjectsEqual(existingItem, itemCopy)
            );
        } catch (error) {
            this.handleError('Error checking existence', error);
        }
    }

    areObjectsEqual(obj1, obj2) {
        try {
            // Comparamos las representaciones JSON de los objetos
            return JSON.stringify(obj1) === JSON.stringify(obj2);
        } catch (error) {
            this.handleError('Error comparing objects', error);
            return false;
        }
    }

    handleError(message, error) {
        console.error(message, error);
        throw error;
    }
}

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
const filePaths = new LocalStorageManager('filePaths');
(async () => {
    const files = await filePaths.getAll();
    console.log(files);
   
    /*
    const galeriaElementos = document.querySelector('galeria-elementos');
    galeriaElementos.addEventListener('elemento-agregado', (e) => {
        console.log('Elemento agregado:', e.detail);
    });

    galeriaElementos.addEventListener('elemento-eliminado', (e) => {
        console.log('Elemento eliminado:', e.detail);
    });
    files.forEach(file => galeriaElementos.agregarElemento(file));
galeriaElementos.agregarElemento({
            nombre: 'archivo.txt',
            path: 'c:/user/example/archivo.txt',
            size: 123456,
            type: 'text/plain',
            lastModified: 1679488000000
        });
        galeriaElementos.agregarElemento({
            nombre: 'archivo.img',
            path: 'c:/user/example/archivo.img',
            size: 123456,
            type: 'image/webp',
            lastModified: 1679488000000
        });
        galeriaElementos.agregarElemento({
            nombre: 'video.mp4',
            path: 'c:/user/example/video.mp4',
            size: 9876543,
            type: 'video/mp4',
            lastModified: 1679488000000
        }); */
})();
async function processDroppedFile(file,e) {
    if (file.path) {
        await processFileWithPath(file);
    } else {
        await processFileWithoutPath(file);
    }
}
async function processFileWithPath(file) {
    console.log('Archivo cargado:', file);
    filePaths.add(parseFile(file));
    console.log(filePaths.getAll());
}
async function processFileWithoutPath(file) {
    console.log('processFileWithoutPath Archivo cargado:', file);
    if (electron && file){ 
        const filePath = electron.showFilePath(file);
        Object.assign(file, { path: filePath });
        filePaths.add(parseFile(file));
        const allFiles = await filePaths.getAll();
        console.log("processFileWithoutPath",allFiles, file);
    } else {    
        console.log('No se pudo obtener la ruta del archivo');
    }
}
function parseFile(file) {
    const filePath = file.path;
    return {
        nombre: file.name,
        path: filePath,
        size: file.size,
        type: file.type,
    };
}
// estructura de archivo
/* [{
    nombre: 'archivo.txt',
    path: 'c:/user/example/archivo.txt',
    size: 123456,
    type: 'text/plain',
    lastModified: 1679488000000
} 
{
    nombre: 'archivo.img',
    path: 'c:/user/example/archivo.img',
    size: 123456,
    type: 'image/webp',
    lastModified: 1679488000000
}]
*/
// Registrar el componente
customElements.define('drag-and-drop', DragAndDropComponent);
class GaleriaElementos extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        const template = document.getElementById('galeria-elementos-template');
        this.shadowRoot.appendChild(template.content.cloneNode(true));

        this.elementos = [];
        this.setupEventListeners();
    }

    setupEventListeners() {
        const searchBar = this.shadowRoot.querySelector('.search-bar');
        searchBar.addEventListener('input', () => this.filtrarElementos());

        this.shadowRoot.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-btn')) {
                const nombre = e.target.dataset.nombre;
                const id = e.target.dataset.id;
                this.borrarElemento(nombre, id);
            }
        });
    }

    agregarElemento(elemento) {
        this.elementos.push(elemento);
        this.renderizarElementos();

        // Disparar un evento personalizado cuando se agrega un elemento
        const event = new CustomEvent('elemento-agregado', {
            detail: { elemento },
            bubbles: true,
            composed: true
        });
        this.dispatchEvent(event);
    }

    borrarElemento(nombre, id) {
        this.elementos = this.elementos.filter(elem => elem.nombre !== nombre) || this.elementos.filter(elem => elem.id !== id);
        this.renderizarElementos();
        const event = new CustomEvent('elemento-eliminado', {
            detail: { id, nombre },
            bubbles: true,
            composed: true
        });
        this.dispatchEvent(event);
    }

    obtenerElementoPorNombre(nombre) {
        return this.elementos.find(elem => elem.nombre === nombre);
    }

    obtenerElementoPorId(id) {
        return this.elementos.find(elem => elem.id === id);
    }

    filtrarElementos() {
        const searchTerm = this.shadowRoot.querySelector('.search-bar').value.toLowerCase();
        const elementosFiltrados = this.elementos.filter(elem => 
            elem.nombre.toLowerCase().includes(searchTerm) ||
            elem.path.toLowerCase().includes(searchTerm)
        );
        this.renderizarElementos(elementosFiltrados);
    }

    renderizarElementos(elementos = this.elementos) {
        const gallery = this.shadowRoot.querySelector('.gallery');
        gallery.innerHTML = '';

        elementos.forEach(elem => {
            const item = document.createElement('div');
            item.className = 'item';

            const icon = this.getIconForType(elem.type, elem.path);
            const size = this.formatSize(elem.size);
            const date = new Date(elem.lastModified).toLocaleDateString('es-ES');

            item.innerHTML = `
                ${icon}
                <div class="item-name">${elem.nombre}</div>
                <div class="item-info">${size} - ${date}</div>
                <div class="item-tooltip">${elem.nombre}<br>${elem.path}</div>
                <button class="delete-btn" data-nombre="${elem.nombre}" data-id="${elem.id}">×</button>
            `;

            gallery.appendChild(item);
        });
    }

    getElementbyType(type, src) {
        const defaultsrc = '📄';
        const srcclean = src.replace('file://', '');
        const htmlelement = {
            'image': `<img src="/media/${srcclean}" alt="Imagen">`,
            'video': `<video src="/media/${srcclean}" alt="video" controls></video>`,
            'audio': `<audio src="/media/${srcclean}" alt="audio" controls></audio>`,
            'text': `<div class="item-icon">${defaultsrc}</div>`,
            'default': `<div class="item-icon">${defaultsrc}</div>`
        };

        if (!src || !type) return htmlelement['default'];
        
        // Verificar el tipo de archivo
        if (type.startsWith('image')) return htmlelement['image'];
        if (type.startsWith('video')) return htmlelement['video'];
        if (type.startsWith('audio')) return htmlelement['audio'];
        if (type.startsWith('text')) return htmlelement['text'];
        
        return htmlelement['default'];
    }

    getIconForType(type, src) {
        return this.getElementbyType(type, src);
    }

    formatSize(bytes) {
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        if (bytes === 0) return '0 Byte';
        const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
        return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
    }
}

customElements.define('galeria-elementos', GaleriaElementos);
class CustomModal extends HTMLElement {
    constructor() {
        super();
        this.isOpen = false;
        this.onOpenCallback = null;
        this.onCloseCallback = null;
        
        // Crear un shadow DOM para evitar conflictos de estilos
        this.attachShadow({ mode: 'open' });
        
        // Crear estructura base del modal
        const template = document.createElement('template');
        template.innerHTML = /*html */`
            <style>
       :host {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 1000;
            /* Agregamos la transición base */
            opacity: 0;
            transition: opacity 0.5s ease;
        }
        /* Cuando está visible */
        :host([visible]) {
            opacity: 1;
        }
        .modal-content {
            background: #1c1c1c;
            padding: 0.5rem;
            border-radius: 5px;
            position: relative;
            min-width: 300px;
            max-height: 95dvh;
            max-width: 800px;
            width: 80%;
            opacity: 0;
        }
        :host([visible]) .modal-content {
            transform: scale(1);
            opacity: 1;
        }
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }
                .close-button {
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    background-color: #dc3545;
                    width: 36px;
                    height: 36px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 14px;
                    padding: 0;
                    border-radius: 25%;
                }
                .close-button:hover {
                    background-color: #c82333;
                }
                .modal-body {
                    margin-top: 20px;
                }
                /* Slot styling */
                ::slotted(*) {
                    max-width: 100%;
                }
            </style>
            <div class="modal-overlay">
                <div class="modal-content">
                    <button class="close-button">&times;</button>
                    <div class="modal-body">
                        <slot></slot>
                    </div>
                </div>
            </div>
        `;

        // Agregar la estructura del modal al shadow DOM
        this.shadowRoot.appendChild(template.content.cloneNode(true));
        
        // Obtener referencias dentro del shadow DOM
        this.overlay = this.shadowRoot.querySelector('.modal-overlay');
        this.closeButton = this.shadowRoot.querySelector('.close-button');
        this.modalBody = this.shadowRoot.querySelector('.modal-body');
        
        this.setupEventListeners();
    }

    connectedCallback() {
        // No necesitamos hacer nada aquí ya que la estructura se crea en el constructor
    }

    setupEventListeners() {
        this.closeButton.addEventListener('click', () => this.close());
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.close();
            }
        });
    }

    open(onOpenCallback = null) {
        this.onOpenCallback = onOpenCallback;
        this.style.display = 'block';
        // Forzamos un reflow
        this.offsetHeight;
        this.setAttribute('visible', '');
        this.isOpen = true;
        
        if (this.onOpenCallback) {
            this.onOpenCallback();
        }
    }

    close(onCloseCallback = null) {
        this.onCloseCallback = onCloseCallback;
        this.style.display = 'none';
        this.isOpen = false;
        this.removeAttribute('visible');
        // Esperamos a que termine la animación
        setTimeout(() => {
            this.style.display = 'none';
            this.isOpen = false;
            if (this.onCloseCallback) {
                this.onCloseCallback();
            }
        }, 300); // Mismo tiempo que la transición
    }

    // Método mejorado para agregar contenido
    appendChild(element) {
        // Asegurarse de que el elemento se agregue al light DOM
        super.appendChild(element);
    }

    // Método para limpiar y establecer nuevo contenido
    setContent(content) {
        // Limpiar el contenido actual
        while (this.firstChild) {
            this.removeChild(this.firstChild);
        }

        // Agregar el nuevo contenido
        if (typeof content === 'string') {
            const div = document.createElement('div');
            div.innerHTML = content;
            this.appendChild(div);
        } else if (content instanceof Node) {
            this.appendChild(content);
        }
    }

    getContentContainer() {
        return this;
    }
}

// Registrar el componente
customElements.define('custom-modal', CustomModal);