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
    this.originalType = this.element.type;
    this.originalReadOnly = this.element.readOnly;
    this.originalAutocomplete = this.element.autocomplete;
    
    this.init();
  }

  init() {
    this.element.type = 'text';
    this.element.autocomplete = 'off';
    this.element.readOnly = true;
    this.element.classList.add('just-type-input');
    this.element.addEventListener('input', this.handleInput.bind(this));
    this.element.addEventListener('copy', this.handleCopy.bind(this));
    this.element.addEventListener('cut', this.handleCut.bind(this));
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
      this.value = this.value.substring(0, this.element.selectionStart) + 
                   this.value.substring(this.element.selectionEnd);
      this.updateDisplay();
    }
  }

  handleContextMenu(e) {
    const selection = window.getSelection();
    const selectedText = selection.toString();
    
    if (!selectedText) {
      e.preventDefault();
      this.handlePasteWithSelection(e);
    }
  }

  async handlePasteWithSelection(e) {
    try {
      const text = await navigator.clipboard.readText();
      const start = this.element.selectionStart;
      const end = this.element.selectionEnd;
      
      this.value = this.value.substring(0, start) + text + this.value.substring(end);
      this.updateDisplay();
      
      if (this.options.onInput) {
        this.options.onInput(this.value);
      }
      
      if (this.options.autoReset) {
        this.resetTimer();
      }
    } catch (err) {
      console.warn('Clipboard access denied');
    }
  }

  startTimer() {
    this.clearTimer();
    this.timer = setTimeout(() => {
      this.mask();
      if (this.options.onExpire) {
        this.options.onExpire();
      }
    }, this.options.duration);
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
    if (this.isMasked) {
      const maskChar = MASK_TYPES[this.options.maskType] || MASK_TYPES.dot;
      this.element.value = maskChar.repeat(this.value.length);
    } else {
      this.element.value = this.value;
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
    this.element.removeEventListener('contextmenu', this.handleContextMenu);
    this.element.type = this.originalType;
    this.element.readOnly = this.originalReadOnly;
    this.element.autocomplete = this.originalAutocomplete;
    this.element.classList.remove('just-type-input');
    this.element.value = this.value;
  }
}

export default JustType;
export { JustType, MASK_TYPES };
