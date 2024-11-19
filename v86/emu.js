// エミュレーターへのキーイベント送信を処理
let emulator = null;
const consoleElement = document.getElementById("console");
const progressBar = document.getElementById("progress-bar");

// コンソールにメッセージを表示
function logToConsole(message) {
  const timestamp = new Date().toISOString();
  consoleElement.textContent += `[${timestamp}] ${message}\n`;
  consoleElement.scrollTop = consoleElement.scrollHeight;
}

// イメージファイルのロード
async function loadImage(url) {
  logToConsole("Starting image load...");
  const response = await fetch(url);
  const reader = response.body.getReader();
  const contentLength = +response.headers.get("Content-Length");

  let receivedLength = 0;
  let chunks = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    chunks.push(value);
    receivedLength += value.length;

    // 進捗バー更新
    const percentage = Math.round((receivedLength / contentLength) * 100);
    progressBar.style.width = `${percentage}%`;
    logToConsole(`Loading: ${percentage}%`);
  }

  logToConsole("Image load complete.");
  return new Blob(chunks);
}

// エミュレーターの初期化
async function startEmulator(m, vm) {
  const imageBlob = await loadImage("https://sirokuma.cloudfree.jp/web/emu/hdd/win98.img");

  emulator = new V86Starter({
    wasm_path: "v86.wasm",
    memory_size: m * 1024 * 1024, // メモリサイズ
    vga_memory_size: vm * 1024 * 1024, // ビデオメモリサイズ
    screen_container: document.getElementById("screen"),
    bios: { url: "seabios.bin" },
    vga_bios: { url: "vgabios.bin" },
    hda: { buffer: await imageBlob.arrayBuffer() },
    autostart: true,
    log_level: 0,
    onload: function () {
      logToConsole("Emulator loaded and started.");
    },
    onerror: function (error) {
      logToConsole(`Error: ${error.message}`);
    },
  });

  return emulator;
}

// ソフトキーボードのキー配列（Windows標準レイアウト）
const keyboardLayout = [
  ['Esc', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'],
  ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', 'Backspace'],
  ['Tab', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '[', ']', '\\'],
  ['CapsLock', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';', '\'', 'Enter'],
  ['Shift', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '/', 'Shift'],
  ['Ctrl', 'Alt', 'Space', 'Alt', 'Ctrl', '←', '↑', '↓', '→']
];

// ソフトキーボードを生成する関数
function createKeyboard() {
  const keyboardContainer = document.getElementById("keyboard");

  keyboardLayout.forEach(row => {
    row.forEach(key => {
      const keyElement = document.createElement("div");
      keyElement.className = "key";
      keyElement.textContent = key;

      if (key === "Backspace" || key === "Enter" || key === "Tab" || key === "CapsLock" || key === "Shift" || key === "Space") {
        keyElement.classList.add("wide");
      }

      if (key === "Space") {
        keyElement.classList.add("space");
      }

      keyElement.addEventListener("click", () => {
        logToConsole(`Key pressed: ${key}`);
        if (emulator) {
          sendKeyToEmulator(key);
        }
      });

      keyboardContainer.appendChild(keyElement);
    });
  });
}

// キーをエミュレーターに送信する関数
function sendKeyToEmulator(key) {
  const keyMapping = {
    'Esc': 0x01, '`': 0x29, '1': 0x02, '2': 0x03, '3': 0x04, '4': 0x05, '5': 0x06, '6': 0x07, '7': 0x08, '8': 0x09, 
    '9': 0x0A, '0': 0x0B, '-': 0x0C, '=': 0x0D, 'Backspace': 0x0E, 'Tab': 0x0F, 'Q': 0x10, 'W': 0x11, 'E': 0x12, 
    'R': 0x13, 'T': 0x14, 'Y': 0x15, 'U': 0x16, 'I': 0x17, 'O': 0x18, 'P': 0x19, '[': 0x1A, ']': 0x1B, '\\': 0x2B,
    'CapsLock': 0x3A, 'A': 0x1E, 'S': 0x1F, 'D': 0x20, 'F': 0x21, 'G': 0x22, 'H': 0x23, 'J': 0x24, 'K': 0x25, 
    'L': 0x26, ';': 0x27, '\'': 0x28, 'Enter': 0x1C, 'Shift': 0x2A, 'Z': 0x2C, 'X': 0x2D, 'C': 0x2E, 'V': 0x2F,
    'B': 0x30, 'N': 0x31, 'M': 0x32, ',': 0x33, '.': 0x34, '/': 0x35, 'Ctrl': 0x1D, 'Alt': 0x38, 'Space': 0x39,
    '←': 0x4B, '↑': 0x48, '↓': 0x50, '→': 0x4D,
  };

  const scanCode = keyMapping[key];
  if (scanCode !== undefined) {
    emulator.keyboard_send_scancode(scanCode);
  }
}

// エミュレーター起動
createKeyboard();
function launchWin98() {
    var memInput = document.getElementById('mem').value;
    var vmemInput = document.getElementById('vmem').value;
    if(memInput === "") {memInput = 128;}
    if(vmemInput === "") {vmemInput = 6;}
    startEmulator(memInput, vmemInput)
}