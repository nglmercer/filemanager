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
class GridContainer extends HTMLElement {
  constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this.items = new Map(); // Usamos Map para mantener un registro de elementos con ID
      this.nextId = 1; // Counter para generar IDs únicos
      this.render();
  }

    render() {
      this.shadowRoot.innerHTML = /*html */`
          <style>
              :host {
                  display: block;
                  width: 100%;
              }
              :host(.dark-mode) {
                  background-color: #1a202c;
                  color: #f7fafc;
              }
              .container {
                  display: grid;
                  grid-template-columns: repeat(auto-fit, minmax(200px, auto));
                  gap: 1rem;
                  padding: 1rem;
              }
              .search-container {
                  padding: 1rem;
                  margin-bottom: 1rem;
              }
              input {
                  width: 100%;
                  padding: 0.5rem;
                  border: 1px solid #e2e8f0;
                  border-radius: 0.25rem;
                  margin-bottom: 1rem;
                  background-color: #ffffff;
                  color: #1a202c;
              }
              :host(.dark-mode) input {
                  background-color: #2d3748;
                  color: #f7fafc;
                  border: 1px solid #4a5568;
              }
              .grid-item {
                  background-color: #ffffff;
                  border: 1px solid #e2e8f0;
                  border-radius: 0.5rem;
                  padding: 1rem;
                  cursor: pointer;
                  transition: transform 0.2s, background-color 0.2s;
              }
              .grid-item:hover {
                  transform: scale(1.02);
              }
              :host(.dark-mode) .grid-item {
                  background-color: #2d3748;
                  border: 1px solid #4a5568;
              }
              .grid-item img, .grid-item video {
                  width: 100%;
                  height: auto;
                  object-fit: cover;
                  border-radius: 0.25rem;
                  margin-bottom: 0.5rem;
              }
              .hidden {
                  display: none !important;
              }
          </style>
          <div class="search-container">
              <input type="text" placeholder="Buscar elementos..." class="search-input">
          </div>
          <div class="container"></div>
      `;

      this.container = this.shadowRoot.querySelector('.container');
      this.searchInput = this.shadowRoot.querySelector('.search-input');

      this.searchInput.addEventListener('input', (e) => {
          this.filterItems(e.target.value);
      });
  }

  toggleDarkMode(isDark) {
    if (isDark) {
        this.classList.add('dark-mode');
    } else {
        this.classList.remove('dark-mode');
    }
  }

  filterItems(searchText) {
      this.items.forEach((itemData, id) => {
          const text = itemData.element.textContent.toLowerCase();
          const searchLower = searchText.toLowerCase();
          if (text.includes(searchLower)) {
              itemData.element.classList.remove('hidden');
          } else {
              itemData.element.classList.add('hidden');
          }
      });
  }

  // Método para añadir un nuevo elemento
  addItem(content, mediaUrl = '', mediaType = '', additionalData = {}) {
      const id = this._generateId();
      const item = document.createElement('div');
      item.className = 'grid-item';
      item.dataset.id = id;
      
      let mediaElement = '';
      if (mediaUrl) {
          if (mediaType.includes('video')) {
              mediaElement = `<video src="/media/${mediaUrl}" controls></video>`;
          } else {
              mediaElement = `<img src="/media/${mediaUrl}" alt="Item media">`;
          }
      }

      item.innerHTML = `
          ${mediaElement}
          <input class="content" value="${content}" readonly>
      `;

      item.addEventListener('click', () => {
          const detail = {
              id,
              content,
              mediaUrl,
              mediaType,
              additionalData,
          };
          
          const event = new CustomEvent('itemClick', {
              detail,
              bubbles: true,
              composed: true
          });
          this.dispatchEvent(event);
      });

      this.container.appendChild(item);
      this.items.set(id, {
          element: item,
          content,
          mediaUrl,
          mediaType
      });

      return id; // Retornamos el ID para referencia futura
  }

  // Método para limpiar todos los elementos
  clearAll() {
      this.container.innerHTML = '';
      this.items.clear();
      this.nextId = 1;
  }

  // Método para modificar un elemento específico
  updateItem(id, newContent, newMediaUrl = '', newMediaType = '') {
      const itemData = this.items.get(id);
      if (!itemData) {
          throw new Error(`No se encontró el elemento con ID: ${id}`);
      }

      let mediaElement = '';
      if (newMediaUrl) {
          if (newMediaType === 'video') {
              mediaElement = `<video src="${newMediaUrl}" controls></video>`;
          } else {
              mediaElement = `<img src="${newMediaUrl}" alt="Item media">`;
          }
      }

      itemData.element.innerHTML = `
          ${mediaElement}
          <div class="content">${newContent}</div>
      `;

      // Actualizar los datos almacenados
      itemData.content = newContent;
      itemData.mediaUrl = newMediaUrl;
      itemData.mediaType = newMediaType;
  }

  // Método para eliminar un elemento específico
  removeItem(id) {
      const itemData = this.items.get(id);
      if (!itemData) {
          throw new Error(`No se encontró el elemento con ID: ${id}`);
      }

      itemData.element.remove();
      this.items.delete(id);

      // Emitir evento de eliminación
      const event = new CustomEvent('itemRemoved', {
          detail: { id },
          bubbles: true,
          composed: true
      });
      this.dispatchEvent(event);
  }

  // Método para obtener todos los elementos
  getAllItems() {
      const items = {};
      this.items.forEach((value, key) => {
          items[key] = {
              content: value.content,
              mediaUrl: value.mediaUrl,
              mediaType: value.mediaType
          };
      });
      return items;
  }

  // Método privado para generar IDs únicos
  _generateId() {
      return `item-${this.nextId++}`;
  }
}

// Registrar el componente
customElements.define('grid-container', GridContainer);
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
                transition: all 0.3s ease;
                cursor: pointer;
            }
            .drop-area:hover, .drop-area:active {
                background-color: #f0f8ff;
                border-color: #666;
            }
            .drop-area.highlight {
                background-color: #f0f8ff;
            }
            input[type="file"] {
                display: none;
            }
            label {
                display: block;
                width: 100%;
                height: 100%;
                cursor: pointer;
            }
        `;

        const container = document.createElement('div');
        container.classList.add('drop-area');

        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.multiple = true;
        fileInput.id = 'fileInput';
        
        const label = document.createElement('label');
        label.htmlFor = 'fileInput';
        label.textContent = 'Arrastra y suelta archivos aquí o haz clic para seleccionar';

        fileInput.addEventListener('change', (e) => {
            const files = e.target.files;
            for (const file of files) {
                processDroppedFile(file, e);
                const event = new CustomEvent('DroppedFile', {
                    detail: { file },
                    bubbles: true,
                    composed: true
                });
                this.dispatchEvent(event);
            }
        });

        container.appendChild(label);
        container.appendChild(fileInput);
        
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
            const event = new CustomEvent('DroppedFile', {
              detail: { file },
              bubbles: true,
              composed: true
          });
          this.dispatchEvent(event);
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
 const themes = {
    default: {
      container: 'bg-gray-900/95 rounded-2xl p-6 shadow-xl',
      text: 'text-xl font-semibold text-gray-100',
      media: 'rounded-lg max-w-full',
      animation: 'slide-fade',
      layout: 'flex-col',
      textAnimation: 'text-pop'
    },
    neon: {
      container: 'bg-purple-900/90 rounded-xl p-6 shadow-[0_0_15px_rgba(147,51,234,0.5)] border border-purple-500',
      text: 'text-xl font-bold text-purple-100 drop-shadow-[0_0_5px_rgba(147,51,234,0.5)]',
      media: 'rounded-lg max-w-full border-2 border-purple-500',
      animation: 'bounce-fade',
      layout: 'flex-col-reverse',
      textAnimation: 'text-wave'
    },
    minimal: {
      container: 'bg-white/95 rounded-md p-4 shadow-sm',
      text: 'text-lg font-medium text-gray-800',
      media: 'rounded-md max-w-full',
      animation: 'slide-simple',
      layout: 'flex-row',
      textAnimation: 'text-pop'
    },
    gaming: {
      container: 'bg-red-600/95 rounded-3xl p-6 shadow-2xl border-2 border-yellow-400',
      text: 'text-2xl font-black text-yellow-300 uppercase',
      media: 'rounded-xl max-w-full border-2 border-yellow-400',
      animation: 'shake-fade',
      layout: 'flex-row-reverse',
      textAnimation: 'text-glitch'
    },
    retro: {
      container: 'bg-green-900/90 rounded-none p-6 border-4 border-green-400',
      text: 'text-2xl font-mono text-green-400',
      media: 'rounded-none border-4 border-green-400 max-w-full',
      animation: 'slide-fade',
      layout: 'flex-col',
      textAnimation: 'text-rotate'
    }
  };
  const animations = {
    'slide-fade': {
      enter: 'slideIn 2s ease-out, fadeIn 2s ease-out',
      exit: 'slideOut 2s ease-in, fadeOut 2s ease-in'
    },
    'bounce-fade': {
      enter: 'bounceIn 2s cubic-bezier(0.36, 0, 0.66, -0.56), fadeIn 2s ease-out',
      exit: 'bounceOut 2s cubic-bezier(0.34, 1.56, 0.64, 1), fadeOut 2s ease-in'
    },
    'slide-simple': {
      enter: 'slideIn 2s ease-out',
      exit: 'slideOut 2s ease-in'
    },
    'shake-fade': {
      enter: 'shakeIn 0.8s ease-out, fadeIn 2s ease-out',
      exit: 'shakeOut 0.8s ease-in, fadeOut 2s ease-in'
    }
  };

class DonationAlert extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this._theme = 'default';
    }
  
    static get observedAttributes() {
      return ['theme'];
    }
  
    attributeChangedCallback(name, oldValue, newValue) {
      if (name === 'theme' && oldValue !== newValue) {
        this._theme = newValue;
        this.render();
      }
    }
  
    set alert(value) {
      this._alert = value;
      this.render();
    }
  
    get alert() {
      return this._alert;
    }
  
    set theme(value) {
      if (themes[value]) {
        this.setAttribute('theme', value);
      }
    }
  
    get theme() {
      return this._theme;
    }
  
    connectedCallback() {
      const animation = animations[themes[this._theme].animation];
      this.style.animation = animation.enter;
    }
  
    disconnectedCallback() {
      const animation = animations[themes[this._theme].animation];
      this.style.animation = animation.exit;
    }
  
    animateText(text, animationClass) {
      return text.split('').map((char, i) => 
        char === ' ' 
          ? ' '
          : `<span class="text-animation ${animationClass}" style="animation-delay: ${i * 0.05}s">${char}</span>`
      ).join('');
    }
  
    renderMediaGrid(items, type, theme) {
      const isVideo = type === 'video';
      const columns = Math.min(items.length, 2);
  
      return `
        <div class="media-grid columns-${columns}">
          ${items.map(src => isVideo ? `
            <video autoplay loop muted class="media-item">
              <source src="${src}" type="video/mp4">
            </video>
          ` : `
            <img src="${src}" alt="Donation media" class="media-item" />
          `).join('')}
        </div>
      `;
    }
  
    renderContent(alert, theme) {
      switch (alert.type) {
        case 'multi-image':
          return this.renderMediaGrid(alert.images, 'image', theme);
        case 'video-grid':
          return this.renderMediaGrid(alert.videos, 'video', theme);
        case 'image-grid':
          return this.renderMediaGrid(alert.images, 'image', theme);
        case 'video-image':
          return `
            <div class="media-combo">
              <video autoplay loop muted class="media-item">
                <source src="${alert.video}" type="video/mp4">
              </video>
              <img src="${alert.image}" alt="Donation media" class="media-item" />
            </div>
          `;
        case 'image':
          return `<img src="${alert.content}" alt="Donation alert" class="media-item" />`;
        case 'video':
          return `
            <video autoplay loop muted class="media-item">
              <source src="${alert.content}" type="video/mp4">
            </video>
          `;
        case 'text':
        default:
          return `<div class="text-content">${this.animateText(alert.content, theme.textAnimation)}</div>`;
      }
    }
  
    render() {
      const alert = this._alert;
      if (!alert) return;
  
      const theme = themes[this._theme];
  
      this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: flex;
            position: fixed;
            align-items: center;
            justify-content: center;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 1000;
            pointer-events: none;
          }
        * {
          transition: all 0.2s ease-in-out;
        }
          .alert-container {
            max-width: 40rem;
            margin: 0 auto;
            padding: 1.5rem;
            border-radius: 1rem;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            background: ${theme.container.background || 'rgba(17, 24, 39, 0.95)'};
            border: ${theme.container.border || 'none'};
          }
  
          .content {
            display: flex;
            align-items: center;
            gap: 1rem;
            flex-direction: ${theme.layout.replace('flex-', '')};
          }
  
          .text-content {
            font-size: ${theme.text.size || '1.25rem'};
            font-weight: ${theme.text.weight || '600'};
            color: ${theme.text.color || '#f3f4f6'};
            font-family: ${theme.text.family || 'system-ui, -apple-system, sans-serif'};
          }
  
          .media-item {
            max-width: 100%;
            border-radius: ${theme.media.borderRadius || '0.5rem'};
            border: ${theme.media.border || 'none'};
          }
  
          .media-grid {
            display: grid;
            gap: 0.5rem;
          }
  
          .columns-2 {
            grid-template-columns: repeat(2, 1fr);
          }
  
          .media-combo {
            display: flex;
            gap: 0.5rem;
          }
  
          .media-combo .media-item {
            width: 50%;
          }
  
          .text-animation {
            display: inline-block;
          }
  
          /* Animation classes from style.css */
          @keyframes popIn {
            0% { transform: scale(0); opacity: 0; }
            70% { transform: scale(1.2); opacity: 0.7; }
            100% { transform: scale(1); opacity: 1; }
          }
  
          @keyframes waveY {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }
  
          @keyframes rotate {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
  
          @keyframes glitch {
            0% { transform: translate(0); }
            20% { transform: translate(-2px, 2px); }
            40% { transform: translate(-2px, -2px); }
            60% { transform: translate(2px, 2px); }
            80% { transform: translate(2px, -2px); }
            100% { transform: translate(0); }
          }
  
          .text-pop { animation: popIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) backwards; }
          .text-wave { animation: waveY 2s ease-in-out infinite; }
          .text-rotate { animation: rotate 2s linear infinite; }
          .text-glitch { animation: glitch 0.3s linear infinite; }
        </style>
  
        <div class="alert-container">
          <div class="content">
            ${this.renderContent(alert, theme)}
            ${alert.text ? `<div class="text-content">${this.animateText(alert.text, theme.textAnimation)}</div>` : ''}
          </div>
        </div>
      `;
    }
  }
  
  customElements.define('donation-alert', DonationAlert);