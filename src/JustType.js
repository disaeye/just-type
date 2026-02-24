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
    this.lastValue = '';
    this.cursorTimeout = null;
    this.isTextarea = this.element.tagName.toLowerCase() === 'textarea';
    
    this.init();
  }

  init() {
    this.element.classList.add('just-type-input');
    
    this.element.addEventListener('input', this.handleInput.bind(this));
    this.element.addEventListener('keydown', this.handleKeyDown.bind(this));
    this.element.addEventListener('click', () => setTimeout(() => this.updateMask(), 0));
    this.element.addEventListener('keyup', () => setTimeout(() => this.updateMask(), 0));
    this.element.addEventListener('copy', this.handleCopy.bind(this));
    this.element.addEventListener('cut', this.handleCut.bind(this));
    this.element.addEventListener('paste', this.handlePaste.bind(this));
    this.element.addEventListener('contextmenu', this.handleContextMenu.bind(this));
    
    this.charTimes = [];
    for (let i = 0; i < this.element.value.length; i++) {
      this.charTimes.push(0);
    }
    this.lastValue = this.element.value;
    
    this.startTimer();
    this.updateMask();
  }

  handleInput(e) {
    const newValue = e.target.value;
    const oldValue = this.lastValue;
    
    if (newValue.length > oldValue.length) {
      const addedChars = newValue.length - oldValue.length;
      const now = Date.now();
      const insertPos = oldValue.length;
      for (let i = 0; i < addedChars; i++) {
        this.charTimes.splice(insertPos + i, 0, now);
      }
    } else if (newValue.length < oldValue.length) {
      this.charTimes = this.charTimes.slice(0, newValue.length);
    }
    
    this.lastValue = newValue;
    
    if (this.options.onInput) {
      this.options.onInput(this.getValue());
    }
    
    this.startTimer();
    this.updateMask();
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
    
    const newValue = this.lastValue.substring(0, start) + text + this.lastValue.substring(end);
    this.element.value = newValue;
    
    const now = Date.now();
    for (let i = 0; i < text.length; i++) {
      this.charTimes.splice(start + i, 0, now);
    }
    
    this.lastValue = newValue;
    
    if (this.options.onInput) {
      this.options.onInput(this.getValue());
    }
    
    this.startTimer();
    this.updateMask();
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
        this.updateMask();
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

  updateMask() {
    const value = this.getValue();
    const selectionStart = this.element.selectionStart;
    const selectionEnd = this.element.selectionEnd;
    const now = Date.now();
    const duration = this.options.duration;
    const maskChar = MASK_TYPES[this.options.maskType] || MASK_TYPES.dot;
    
    let maskedValue = '';
    let realCaretPos = selectionStart;
    
    for (let i = 0; i < value.length; i++) {
      const charTime = this.charTimes[i] || 0;
      const isSelected = i >= selectionStart && i < selectionEnd;
      const isFresh = duration > 0 && (now - charTime < duration);
      
      if (isSelected || isFresh || charTime === 0) {
        maskedValue += value[i];
      } else if (this.options.maskType === 'hidden') {
        maskedValue += '\u200b';
      } else {
        maskedValue += maskChar;
      }
    }
    
    if (this.element.value !== maskedValue) {
      const caretPos = this.getCaretPosition(maskedValue, selectionStart, value);
      this.element.value = maskedValue;
      this.setCaretPosition(caretPos);
    }
  }

  getCaretPosition(maskedValue, originalCaret, originalValue) {
    let maskedCaret = 0;
    let realPos = 0;
    const now = Date.now();
    const duration = this.options.duration;
    
    while (realPos < originalCaret && realPos < originalValue.length) {
      const charTime = this.charTimes[realPos] || 0;
      const isFresh = duration > 0 && (now - charTime < duration);
      
      if (charTime === 0 || isFresh) {
        maskedCaret++;
      }
      realPos++;
    }
    
    return maskedCaret;
  }

  setCaretPosition(pos) {
    try {
      this.element.setSelectionRange(pos, pos);
    } catch (e) {}
  }

  setValue(value) {
    this.element.value = value;
    this.charTimes = [];
    const now = Date.now();
    for (let i = 0; i < value.length; i++) {
      this.charTimes.push(now);
    }
    this.lastValue = value;
    this.startTimer();
    this.updateMask();
  }

  reset() {
    this.charTimes = this.charTimes.map(() => 0);
    this.startTimer();
    this.updateMask();
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
    
    this.element.classList.remove('just-type-input');
    this.element.value = this.getValue();
  }
}

export default JustType;
export { JustType, MASK_TYPES };
