import './styles.css';

const MASK_TYPES = {
  dot: '●',
  square: '□',
  block: '■',
  triangle: '▲',
  hidden: ''
};

const DEFAULT_OPTIONS = {
  duration: 3000,
  maskType: 'dot',
  onExpire: null,
  onInput: null,
  autoReset: true
};

class JustType {
  constructor(selector, options = {}) {
    this.element = typeof selector === 'string' 
      ? document.querySelector(selector) 
      : selector;
    
    if (!this.element) {
      throw new Error(`Element not found: ${selector}`);
    }

    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.charTimes = [];
    this.timer = null;
    this.isTextarea = this.element.tagName.toLowerCase() === 'textarea';
    
    this.init();
  }

  init() {
    if (this.isTextarea) {
      this.setupTextareaMode();
    } else {
      this.setupInputMode();
    }
    
    this.element.addEventListener('input', this.handleInput.bind(this));
    this.element.addEventListener('keydown', this.handleKeyDown.bind(this));
    this.element.addEventListener('click', this.handleSelection.bind(this));
    this.element.addEventListener('keyup', this.handleSelection.bind(this));
    this.element.addEventListener('copy', this.handleCopy.bind(this));
    this.element.addEventListener('cut', this.handleCut.bind(this));
    this.element.addEventListener('paste', this.handlePaste.bind(this));
    this.element.addEventListener('contextmenu', this.handleContextMenu.bind(this));
    
    this.startTimer();
  }

  setupTextareaMode() {
    this.element.classList.add('just-type-input');
    this.element.classList.add('just-type-textarea');
    this.element.style.position = 'relative';
    this.element.style.zIndex = '2';
    this.element.style.background = 'transparent';
    this.element.style.color = 'transparent';
    this.element.style.caretColor = 'black';
    
    this.overlay = document.createElement('div');
    this.overlay.className = 'just-type-overlay';
    this.overlay.style.position = 'absolute';
    this.overlay.style.top = '0';
    this.overlay.style.left = '0';
    this.overlay.style.right = '0';
    this.overlay.style.bottom = '0';
    this.overlay.style.padding = this.element.style.padding || '16px';
    this.overlay.style.fontFamily = this.element.style.fontFamily || 'inherit';
    this.overlay.style.fontSize = this.element.style.fontSize || 'inherit';
    this.overlay.style.lineHeight = this.element.style.lineHeight || '1.8';
    this.overlay.style.whiteSpace = 'pre-wrap';
    this.overlay.style.wordBreak = 'break-word';
    this.overlay.style.overflow = 'hidden';
    this.overlay.style.pointerEvents = 'none';
    this.overlay.style.zIndex = '1';
    this.overlay.style.color = '#2d2d2d';
    this.overlay.style.background = this.element.style.background || '#ffffff';
    
    this.wrapper = document.createElement('div');
    this.wrapper.style.position = 'relative';
    this.wrapper.style.width = '100%';
    this.wrapper.style.height = '100%';
    
    this.element.parentNode.insertBefore(this.wrapper, this.element);
    this.wrapper.appendChild(this.element);
    this.wrapper.appendChild(this.overlay);
  }

  setupInputMode() {
    this.element.type = 'text';
    this.element.autocomplete = 'off';
    this.element.classList.add('just-type-input');
  }

  handleInput(e) {
    const newValue = e.target.value;
    const oldValue = this.getValue();
    
    if (newValue.length > oldValue.length) {
      const addedChars = newValue.length - oldValue.length;
      const now = Date.now();
      for (let i = 0; i < addedChars; i++) {
        this.charTimes.push(now);
      }
    } else if (newValue.length < oldValue.length) {
      this.charTimes = this.charTimes.slice(0, newValue.length);
    }
    
    if (this.options.onInput) {
      this.options.onInput(this.getValue());
    }
    
    this.startTimer();
    this.renderDisplay();
  }

  handleKeyDown(e) {
    if (e.key === 'Backspace' || e.key === 'Delete') {
      const start = this.element.selectionStart;
      const end = this.element.selectionEnd;
      if (end > start) {
        this.charTimes.splice(start, end - start);
      }
    }
  }

  handleSelection() {
    this.renderDisplay();
  }

  handleCopy(e) {
    const selectedText = this.getSelectedText();
    if (selectedText) {
      e.preventDefault();
      e.clipboardData.setData('text/plain', this.getValue());
    }
  }

  handleCut(e) {
    const selectedText = this.getSelectedText();
    if (selectedText) {
      e.preventDefault();
      e.clipboardData.setData('text/plain', this.getValue());
    }
  }

  handlePaste(e) {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData('text/plain');
    const start = this.element.selectionStart;
    const end = this.element.selectionEnd;
    
    const value = this.getValue();
    const newValue = value.substring(0, start) + text + value.substring(end);
    this.element.value = newValue;
    
    const now = Date.now();
    for (let i = 0; i < text.length; i++) {
      this.charTimes.splice(start + i, 0, now);
    }
    
    if (this.options.onInput) {
      this.options.onInput(this.getValue());
    }
    
    this.startTimer();
    this.renderDisplay();
  }

  handleContextMenu(e) {
    const selectedText = this.getSelectedText();
    if (!selectedText) {
      e.preventDefault();
    }
  }

  getSelectedText() {
    const start = this.element.selectionStart;
    const end = this.element.selectionEnd;
    return start !== end;
  }

  getValue() {
    return this.element.value;
  }

  startTimer() {
    this.clearTimer();
    if (this.options.duration > 0) {
      this.timer = setTimeout(() => {
        this.charTimes = this.charTimes.map(() => 0);
        this.renderDisplay();
        if (this.options.onExpire) {
          this.options.onExpire();
        }
      }, this.options.duration);
    }
  }

  clearTimer() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  renderDisplay() {
    const value = this.getValue();
    const selectionStart = this.element.selectionStart;
    const selectionEnd = this.element.selectionEnd;
    const now = Date.now();
    const duration = this.options.duration;
    const maskChar = MASK_TYPES[this.options.maskType] || MASK_TYPES.dot;
    
    if (this.isTextarea) {
      let displayHtml = '';
      for (let i = 0; i < value.length; i++) {
        const char = value[i];
        const charTime = this.charTimes[i] || 0;
        const isSelected = i >= selectionStart && i < selectionEnd;
        const isFresh = duration > 0 && (now - charTime < duration);
        
        if (isSelected || isFresh || charTime === 0) {
          displayHtml += this.escapeHtml(char);
        } else if (this.options.maskType === 'hidden') {
          displayHtml += '<span style="opacity:0">■</span>';
        } else {
          displayHtml += maskChar;
        }
      }
      
      this.overlay.innerHTML = displayHtml + '<br>';
    } else {
      let result = '';
      for (let i = 0; i < value.length; i++) {
        const char = value[i];
        const charTime = this.charTimes[i] || 0;
        const isSelected = i >= selectionStart && i < selectionEnd;
        const isFresh = duration > 0 && (now - charTime < duration);
        
        if (isSelected || isFresh || charTime === 0) {
          result += char;
        } else if (this.options.maskType === 'hidden') {
          result += '';
        } else {
          result += maskChar;
        }
      }
      this.element.value = result;
    }
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  setValue(value) {
    this.element.value = value;
    this.charTimes = [];
    const now = Date.now();
    for (let i = 0; i < value.length; i++) {
      this.charTimes.push(now);
    }
    this.startTimer();
    this.renderDisplay();
  }

  reset() {
    this.charTimes = this.charTimes.map(() => 0);
    this.startTimer();
    this.renderDisplay();
  }

  destroy() {
    this.clearTimer();
    this.element.removeEventListener('input', this.handleInput);
    this.element.removeEventListener('keydown', this.handleKeyDown);
    this.element.removeEventListener('click', this.handleSelection);
    this.element.removeEventListener('keyup', this.handleSelection);
    this.element.removeEventListener('copy', this.handleCopy);
    this.element.removeEventListener('cut', this.handleCut);
    this.element.removeEventListener('paste', this.handlePaste);
    this.element.removeEventListener('contextmenu', this.handleContextMenu);
    
    if (this.isTextarea && this.wrapper) {
      this.element.style.position = '';
      this.element.style.zIndex = '';
      this.element.style.background = '';
      this.element.style.color = '';
      this.element.style.caretColor = '';
      this.wrapper.parentNode.insertBefore(this.element, this.wrapper);
      this.wrapper.remove();
      this.element.classList.remove('just-type-input', 'just-type-textarea');
    } else {
      this.element.type = 'text';
      this.element.classList.remove('just-type-input');
    }
    
    this.element.value = this.getValue();
  }
}

export default JustType;
export { JustType, MASK_TYPES };
