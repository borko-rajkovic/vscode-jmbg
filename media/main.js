// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
(function () {
  const vscode = acquireVsCodeApi();

  const oldState = vscode.getState();

  const counter = document.getElementById('lines-of-code-counter');
  console.log(oldState);
  let currentCount = (oldState && oldState.count) || 0;
  counter.textContent = currentCount;

  counter.textContent = currentCount++;

  // Update state
  vscode.setState({ count: currentCount });

  // Handle messages sent from the extension to the webview
  window.addEventListener('message', (event) => {
    const message = event.data; // The json data that the extension sent
    switch (message.type) {
      case 'refactor':
        currentCount = Math.ceil(currentCount * 0.5);
        counter.textContent = currentCount;
        break;
      case 'selectedText':
        document.getElementById('p1').innerHTML = message.value;
        break;
    }
  });

  document
    .getElementById('copyText')
    .addEventListener('click', copyToClipboard);

  document
    .getElementById('sendToEditor')
    .addEventListener('click', sendToEditor);

  function copyToClipboard() {
    var copyText = document.getElementById('p1');

    vscode.postMessage({
      type: 'copy',
      value: copyText.innerHTML,
    });
  }

  function sendToEditor() {
    var copyText = document.getElementById('p1');

    vscode.postMessage({
      type: 'sendToEditor',
      value: copyText.innerHTML,
    });
  }

  let counter2 = 0;

  function setAndHighlightElement() {
    const a = {
      a: counter2++,
      b: null,
      c: 'nesto',
      d: undefined,
      e: {
        e1: 1,
      },
      f: [1, 2, 3, 4],
    };

    const s = JSON.stringify(a, null, 2);

    document.getElementById('codeElement').innerHTML = s;

    document.querySelectorAll('pre code').forEach((block) => {
      hljs.highlightBlock(block);
    });
  }

  setAndHighlightElement();

  setInterval(() => {
    setAndHighlightElement();
  }, 200);
})();
