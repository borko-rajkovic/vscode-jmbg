// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
(function () {
  const vscode = acquireVsCodeApi();

  const oldState = vscode.getState();

  document.getElementById('codeElement').innerText = oldState;

  // Handle messages sent from the extension to the webview
  window.addEventListener('message', (event) => {
    const message = event.data; // The json data that the extension sent
    vscode.setState(message);

    document.getElementById('codeElement').innerText = message;
  });

  document.getElementById('btnCopy').addEventListener('click', copyToClipboard);
  document.getElementById('btnGenerate').addEventListener('click', generate);
  document
    .getElementById('btnGenerateRandom')
    .addEventListener('click', generateInEditor);

  function copyToClipboard() {
    vscode.postMessage({
      type: 'copy',
      text: document.getElementById('codeElement').innerText,
    });
  }

  function generate() {
    vscode.postMessage({
      type: 'generate',
    });
  }

  function generateInEditor() {
    vscode.postMessage({
      type: 'generateInEditor',
    });
  }
})();
