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
    this.charData = [];
    this.timer = null;
    this.lastValue = '';
    this.cursorTimeout = null;
    this.isTextarea = this.element.tagName.toLowerCase() === 'textarea';
    
    this.init();
  }

  init() {
    this.setupOverlay();
    
    this.element.classList.add('just-type-input');
    this.element.parentElement.classList.add('just-type-wrapper');
    
    this.element.addEventListener('input', this.handleInput.bind(this));
    this.element.addEventListener('click', this.handleSelection.bind(this));
    this.element.addEventListener('keyup', this.handleSelection.bind(this));
    this.element.addEventListener('copy', this.handleCopy.bind(this));
    this.element.addEventListener('cut', this.handleCut.bind(this));
    this.element.addEventListener('paste', this.handlePaste.bind(this));
    this.element.addEventListener('contextmenu', this.handleContextMenu.bind(this));
    
    document.addEventListener('selectionchange', this.handleSelection.bind(this));
    
    this.syncChars();
    this.startTimer();
    this.render();
  }

  setupOverlay() {
    const wrapper = document.createElement('div');
    wrapper.className = 'just-type-overlay-wrapper';
    
    const styles = window.getComputedStyle(this.element);
    const overlay = document.createElement('div');
    overlay.className = 'just-type-overlay';
    
    overlay.style.fontFamily = styles.fontFamily;
    overlay.style.fontSize = styles.fontSize;
    overlay.style.lineHeight = styles.lineHeight;
    overlay.style.letterSpacing = styles.letterSpacing;
    overlay.style.padding = styles.padding;
    overlay.style.whiteSpace = styles.whiteSpace;
    overlay.style.wordBreak = styles.wordBreak;
    overlay.style.wordWrap = styles.wordWrap;
    
    this.element.parentNode.insertBefore(wrapper, this.element);
    wrapper.appendChild(this.element);
    wrapper.appendChild(overlay);
    
    this.overlay = overlay;
    this.wrapper = wrapper;
    
    this.element.classList.add('just-type-hidden-input');
  }

  syncChars() {
    const newText = this.element.value;
    if (newText === this.lastValue) return;

    const oldText = this.lastValue;
    
    let pre = 0;
    while (pre < oldText.length && pre < newText.length && oldText[pre] === newText[pre]) pre++;

    let oldEnd = oldText.length - 1;
    let newEnd = newText.length - 1;
    while (oldEnd >= pre && newEnd >= pre && oldText[oldEnd] === newText[newEnd]) {
      oldEnd--; newEnd--;
    }

    const delCount = oldEnd - pre + 1;
    if (delCount > 0) {
      for (let i = pre; i < pre + delCount; i++) {
        if (this.charData[i] && this.charData[i].timerId) {
          clearTimeout(this.charData[i].timerId);
        }
      }
      this.charData.splice(pre, delCount);
    }

    const insCount = newEnd - pre + 1;
    if (insCount > 0) {
      const toInsert = [];
      for (let i = pre; i <= newEnd; i++) {
        toInsert.push({ ch: newText[i], masked: false, timerId: null });
      }
      this.charData.splice(pre, 0, ...toInsert);
      
      for (let i = pre; i < pre + insCount; i++) {
        this.scheduleChar(i);
      }
    }

    this.lastValue = newText;
  }

  scheduleChar(idx) {
    const c = this.charData[idx];
    if (!c) return;
    if (c.timerId) clearTimeout(c.timerId);
    if (this.options.duration <= 0) return;
    
    c.timerId = setTimeout(() => {
      c.masked = true;
      c.timerId = null;
      this.render();
      if (this.charData.every(char => char.masked) && this.options.onExpire) {
        this.options.onExpire();
      }
    }, this.options.duration);
  }

  handleInput(e) {
    this.syncChars();
    
    if (this.options.onInput) {
      this.options.onInput(this.getValue());
    }
    
    this.startTimer();
    this.render();
  }

  handleSelection() {
    const start = this.element.selectionStart;
    const end = this.element.selectionEnd;
    
    const spans = this.overlay.querySelectorAll('.jt-char');
    spans.forEach((span, i) => {
      const c = this.charData[i];
      if (!c) return;
      
      const isMasked = c.masked;
      const isSelected = i >= start && i < end;
      
      if (isMasked && isSelected) {
        span.className = 'jt-char selected-reveal';
      } else if (isMasked) {
        span.className = `jt-char masked ${this.getModeClass()}`;
        span.dataset.glyph = this.getGlyph(c.ch);
      } else {
        span.className = 'jt-char';
      }
    });
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
    
    this.element.setRangeText(text, start, end, 'end');
    this.element.dispatchEvent(new Event('input'));
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

  getGlyph(ch) {
    const isSpace = ch === ' ';
    if (this.options.maskType === 'block') return isSpace ? '□' : '■';
    if (this.options.maskType === 'dot') return isSpace ? '○' : '●';
    if (this.options.maskType === 'square') return '□';
    if (this.options.maskType === 'triangle') return '▲';
    return '';
  }

  getModeClass() {
    return ` jt-mode-${this.options.maskType}`;
  }

  startTimer() {
    this.clearTimer();
    if (this.options.duration <= 0) return;
    
    this.charData.forEach((c, i) => {
      if (!c.masked && !c.timerId) {
        this.scheduleChar(i);
      }
    });
  }

  clearTimer() {
    this.charData.forEach(c => {
      if (c.timerId) {
        clearTimeout(c.timerId);
        c.timerId = null;
      }
    });
  }

  render() {
    let html = '';
    for (let i = 0; i < this.charData.length; i++) {
      const c = this.charData[i];
      if (c.ch === '\n') {
        html += '\n';
        continue;
      }

      const escaped = c.ch
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      if (c.masked) {
        const glyph = this.getGlyph(c.ch);
        html += `<span class="jt-char masked${this.getModeClass()}" data-i="${i}" data-glyph="${glyph}">${escaped}</span>`;
      } else {
        html += `<span class="jt-char" data-i="${i}">${escaped}</span>`;
      }
    }
    
    this.overlay.innerHTML = html;
    this.handleSelection();
  }

  setValue(value) {
    this.element.value = value;
    this.charData = [];
    for (let i = 0; i < value.length; i++) {
      this.charData.push({ ch: value[i], masked: false, timerId: null });
    }
    this.lastValue = value;
    this.startTimer();
    this.render();
  }

  reset() {
    this.charData.forEach(c => {
      if (c.timerId) {
        clearTimeout(c.timerId);
        c.timerId = null;
      }
      c.masked = false;
    });
    this.startTimer();
    this.render();
  }

  destroy() {
    this.clearTimer();
    this.element.removeEventListener('input', this.handleInput);
    this.element.removeEventListener('click', this.handleSelection);
    this.element.removeEventListener('keyup', this.handleSelection);
    this.element.removeEventListener('copy', this.handleCopy);
    this.element.removeEventListener('cut', this.handleCut);
    this.element.removeEventListener('paste', this.handlePaste);
    this.element.removeEventListener('contextmenu', this.handleContextMenu);
    document.removeEventListener('selectionchange', this.handleSelection);
    
    if (this.wrapper && this.element.parentNode === this.wrapper) {
      this.wrapper.parentNode.insertBefore(this.element, this.wrapper);
      this.wrapper.parentNode.removeChild(this.wrapper);
    }
    
    this.element.classList.remove('just-type-input', 'just-type-hidden-input');
  }
}

export default JustType;
export { JustType, MASK_TYPES };
