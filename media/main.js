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

  document.body.addEventListener('onunload', onUnload);

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

  function onUnload() {
    debugger;
    vscode.postMessage({
      type: 'unloaded',
    });
  }
})();
