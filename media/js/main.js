// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
(function () {
  const vscode = acquireVsCodeApi();

  const oldState = vscode.getState();

  document.getElementById('p1').innerHTML = oldState.message?.value.text || '';

  // Handle messages sent from the extension to the webview
  window.addEventListener('message', (event) => {
    const message = event.data; // The json data that the extension sent
    switch (message.type) {
      case 'selectedText':
        vscode.setState({ message });
        document.getElementById('p1').innerHTML = message.value.text;
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
