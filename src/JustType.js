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
    this.value = '';
    this.timer = null;
    this.isMasked = false;
    this.isTextarea = this.element.tagName.toLowerCase() === 'textarea';
    
    if (!this.isTextarea) {
      this.originalType = this.element.type;
      this.originalReadOnly = this.element.readOnly;
      this.originalAutocomplete = this.element.autocomplete;
    } else {
      this.originalReadOnly = this.element.readOnly;
    }
    
    this.init();
  }

  init() {
    if (this.isTextarea) {
      this.element.classList.add('just-type-input', 'just-type-textarea');
    } else {
      this.element.type = 'text';
      this.element.autocomplete = 'off';
      this.element.readOnly = true;
      this.element.classList.add('just-type-input');
    }
    
    this.element.addEventListener('input', this.handleInput.bind(this));
    this.element.addEventListener('copy', this.handleCopy.bind(this));
    this.element.addEventListener('cut', this.handleCut.bind(this));
    this.element.addEventListener('paste', this.handlePaste.bind(this));
    this.element.addEventListener('contextmenu', this.handleContextMenu.bind(this));
    
    this.updateDisplay();
  }

  handleInput(e) {
    this.value = e.target.value;
    
    if (this.options.onInput) {
      this.options.onInput(this.value);
    }

    if (this.options.autoReset) {
      this.resetTimer();
    }
  }

  handleCopy(e) {
    e.preventDefault();
    const selection = window.getSelection();
    const selectedText = selection.toString();
    
    if (selectedText) {
      const realValue = this.isMasked ? this.getValue() : this.value;
      e.clipboardData.setData('text/plain', realValue);
    }
  }

  handleCut(e) {
    e.preventDefault();
    const selection = window.getSelection();
    const selectedText = selection.toString();
    
    if (selectedText) {
      const realValue = this.isMasked ? this.getValue() : this.value;
      e.clipboardData.setData('text/plain', realValue);
      const start = this.element.selectionStart;
      const end = this.element.selectionEnd;
      this.value = this.value.substring(0, start) + this.value.substring(end);
      this.updateDisplay();
    }
  }

  handlePaste(e) {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData('text/plain');
    const start = this.element.selectionStart;
    const end = this.element.selectionEnd;
    const selectedText = this.value.substring(start, end);
    
    this.value = this.value.substring(0, start) + text + this.value.substring(end);
    this.updateDisplay();
    
    if (this.options.onInput) {
      this.options.onInput(this.value);
    }
    
    if (this.options.autoReset) {
      this.resetTimer();
    }
  }

  handleContextMenu(e) {
    const selection = window.getSelection();
    const selectedText = selection.toString();
    
    if (!selectedText) {
      e.preventDefault();
    }
  }

  startTimer() {
    this.clearTimer();
    if (this.options.duration > 0) {
      this.timer = setTimeout(() => {
        this.mask();
        if (this.options.onExpire) {
          this.options.onExpire();
        }
      }, this.options.duration);
    }
  }

  resetTimer() {
    this.unmask();
    this.startTimer();
  }

  clearTimer() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  mask() {
    this.isMasked = true;
    this.updateDisplay();
  }

  unmask() {
    this.isMasked = false;
    this.updateDisplay();
  }

  updateDisplay() {
    if (this.isTextarea) {
      if (this.isMasked && this.options.maskType !== 'hidden') {
        this.element.style.webkitTextSecurity = 'disc';
      } else {
        this.element.style.webkitTextSecurity = 'none';
      }
      this.element.value = this.value;
    } else {
      if (this.isMasked) {
        const maskChar = MASK_TYPES[this.options.maskType] || MASK_TYPES.dot;
        if (this.options.maskType === 'hidden') {
          this.element.value = '';
        } else {
          this.element.value = maskChar.repeat(this.value.length);
        }
      } else {
        this.element.value = this.value;
      }
    }
  }

  getValue() {
    return this.value;
  }

  setValue(value) {
    this.value = value;
    this.resetTimer();
    this.updateDisplay();
  }

  reset() {
    this.resetTimer();
  }

  destroy() {
    this.clearTimer();
    this.element.removeEventListener('input', this.handleInput);
    this.element.removeEventListener('copy', this.handleCopy);
    this.element.removeEventListener('cut', this.handleCut);
    this.element.removeEventListener('paste', this.handlePaste);
    this.element.removeEventListener('contextmenu', this.handleContextMenu);
    
    if (this.isTextarea) {
      this.element.readOnly = this.originalReadOnly;
      this.element.style.webkitTextSecurity = 'none';
      this.element.classList.remove('just-type-input', 'just-type-textarea');
    } else {
      this.element.type = this.originalType;
      this.element.readOnly = this.originalReadOnly;
      this.element.autocomplete = this.originalAutocomplete;
      this.element.classList.remove('just-type-input');
    }
    
    this.element.value = this.value;
  }
}

export default JustType;
export { JustType, MASK_TYPES };
