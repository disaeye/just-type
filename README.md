# JustType

A secure input component that masks characters after a configurable duration. Perfect for OTPs, verification codes, and sensitive data display.

## Features

- **Auto-mask**: Characters automatically hide after configurable duration (default: 3s)
- **Copy-safe**: Copying masked text returns the original value
- **Paste-safe**: Paste operations work with original values
- **Multiple mask types**: dot (●), square (□), block (■), triangle (▲), hidden
- **Zero dependencies**: Pure Vanilla JS
- **Universal**: Works with any HTML input element

## Demo

Live demo: https://just-type-demo.vercel.app

## Installation

### NPM

```bash
npm install just-type
```

### CDN

```html
<script src="https://cdn.jsdelivr.net/npm/just-type/dist/just-type.umd.js"></script>
```

## Usage

### ES Modules

```javascript
import JustType from 'just-type';

const input = new JustType('#myInput', {
  duration: 3000,      // Display duration in ms (default: 3000)
  maskType: 'dot',     // Mask type: dot/square/block/triangle/hidden
  onExpire: () => {},  // Callback when input expires
  onInput: (val) => {},// Callback on input
  autoReset: true      // Reset timer on input (default: true)
});

// Get the original value
const value = input.getValue();

// Destroy instance
input.destroy();

// Reset timer manually
input.reset();
```

### CDN (UMD)

```html
<input type="password" id="secureInput" placeholder="Enter code...">

<script src="https://cdn.jsdelivr.net/npm/just-type/dist/just-type.umd.js"></script>
<script>
  new JustType('#secureInput', {
    duration: 3000,
    maskType: 'dot'
  });
</script>
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `duration` | number | 3000 | Duration in ms before masking |
| `maskType` | string | 'dot' | Mask character: dot/square/block/triangle/hidden |
| `onExpire` | function | null | Called when input is masked |
| `onInput` | function | null | Called on input with current value |
| `autoReset` | boolean | true | Reset timer on each input |

## Methods

| Method | Description |
|--------|-------------|
| `getValue()` | Get the original unmasked value |
| `setValue(val)` | Set value and reset timer |
| `reset()` | Reset the expiration timer |
| `destroy()` | Remove all event listeners and restore input |

## Browser Support

- Chrome/Edge 80+
- Firefox 75+
- Safari 14+
- Modern browsers (ES6+)

## License

MIT
