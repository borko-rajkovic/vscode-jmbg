// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
(function () {
  const emptyDecoded = {
    day: null,
    month: null,
    year: null,
    place: null,
    region: null,
    gender: null,
  };

  const emptyMessage = {
    text: null,
    valid: false,
    reason: null,
    decoded: emptyDecoded,
  };

  const vscode = acquireVsCodeApi();

  const oldState = vscode.getState();

  // Handle messages sent from the extension to the webview
  window.addEventListener('message', (event) => {
    const message = event.data; // The json data that the extension sent
    vscode.setState(message);
    setAndHighlightElement(message);
  });

  document.getElementById('btnCopy').addEventListener('click', copyToClipboard);

  document.getElementById('btnPaste').addEventListener('click', sendToEditor);

  document.getElementById('visitGithub').addEventListener('click', visitGithub);

  function copyToClipboard() {
    vscode.postMessage({
      type: 'copy',
    });
  }

  function sendToEditor() {
    vscode.postMessage({
      type: 'sendToEditor',
    });
  }

  function visitGithub() {
    vscode.postMessage({
      type: 'visitGithub',
    });
  }

  function getTextSummary(text) {
    if (!text) {
      return '';
    }

    let processed = text.replace(/\r?\n|\r/g, ' ');
    if (processed.length > 13) {
      processed = processed.substr(0, 13) + '...';
    }
    return processed;
  }

  function setValidationElement(element, valid, reason) {
    if (valid) {
      element.classList.add('mdl-color-text--green');
      element.classList.remove('mdl-color-text--red');
    } else {
      element.classList.add('mdl-color-text--red');
      element.classList.remove('mdl-color-text--green');
    }

    element.innerText = reason;
  }

  function setAndHighlightElement(message) {
    const { valid, reason, text, decoded } = message;

    document.getElementById('selectedText').innerText = getTextSummary(text);

    setValidationElement(
      document.getElementById('validationResult'),
      valid,
      reason
    );

    document.getElementById('codeElement').innerHTML = JSON.stringify(
      decoded,
      null,
      2
    );

    document.getElementById('btnCopy').disabled = !valid;
    document.getElementById('btnPaste').disabled = !valid;

    if (!valid) {
      document.getElementById('btnCopyTooltip').classList.remove('is-active');
      document.getElementById('btnPasteTooltip').classList.remove('is-active');
    } else {
      document.querySelectorAll('pre code').forEach((block) => {
        hljs.highlightBlock(block);
      });
    }
  }

  hljs.initHighlightingOnLoad();
  setAndHighlightElement(oldState || emptyMessage);
})();
