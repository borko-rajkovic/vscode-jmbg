import * as vscode from 'vscode';
import { window, workspace } from 'vscode';
import { getNonce } from './getNonce';
import { getSelectedText } from './utils';

function editorTextChanged(_view?: vscode.WebviewView) {
  const editor = vscode.window.activeTextEditor;

  if (!editor) {
    _view?.webview.postMessage({ type: 'selectedText', value: '' });
    return;
  }

  const { document, selection } = editor;

  const { text } = getSelectedText(selection, document);
  _view?.webview.postMessage({ type: 'selectedText', value: text });
}

function getDecorationTypeFromConfig() {
  const config = workspace.getConfiguration('vscode-jmbg');
  const borderColor = config.get<string>('borderColor');
  const borderWidth = config.get<string>('borderWidth');
  const borderStyle = config.get<string>('borderStyle');
  const decorationType = window.createTextEditorDecorationType({
    isWholeLine: false,
    borderWidth: `0 0 ${borderWidth} 0`,
    borderStyle: `${borderStyle}`,
    borderColor,
  });
  return decorationType;
}

const decorationType = getDecorationTypeFromConfig();

export class SidebarProvider implements vscode.WebviewViewProvider {
  constructor(private readonly _extensionUri: vscode.Uri) {}

  public resolveWebviewView(webviewView: vscode.WebviewView) {
    console.log('resolveWebviewView');
    console.log('resolveWebviewView visible', webviewView.visible);

    webviewView.onDidChangeVisibility(() => {
      console.log('Visibility changed', webviewView?.visible);
    });

    webviewView.onDidDispose((e) => {
      console.log('Disposed changed', e);
    });

    vscode.window.onDidChangeTextEditorSelection(() => {
      const editor = vscode.window.activeTextEditor;

      if (!editor) {
        return;
      }

      const { document, selection } = editor;
      const { range } = getSelectedText(selection, document);
      const newDecoration = {
        range,
      };

      editor.setDecorations(decorationType, [newDecoration]);

      editorTextChanged(webviewView);
    });

    vscode.window.onDidChangeActiveTextEditor(() => {
      const editor = vscode.window.activeTextEditor;

      if (!editor) {
        webviewView?.webview.postMessage({ type: 'selectedText', value: '' });
        return;
      }
    });

    webviewView.webview.options = {
      // Allow scripts in the webview
      enableScripts: true,

      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    editorTextChanged(webviewView);

    webviewView.webview.onDidReceiveMessage(async (data) => {
      switch (data.type) {
        case 'copy': {
          vscode.env.clipboard.writeText(data.value);
          break;
        }
        case 'onInfo': {
          if (!data.value) {
            return;
          }
          vscode.window.showInformationMessage(data.value);
          break;
        }
        case 'onError': {
          if (!data.value) {
            return;
          }
          vscode.window.showErrorMessage(data.value);
          break;
        }
        case 'sendToEditor': {
          const activeEditor = vscode.window.activeTextEditor;
          if (activeEditor) {
            activeEditor.edit((editBuilder) => {
              editBuilder.replace(activeEditor.selection, data.value);
            });
          }
          break;
        }
      }
    });
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const stylesResetUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media', 'reset.css')
    );
    const stylesMainUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media', 'vscode.css')
    );

    const stylesHighlightUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media', 'gruvbox-dark.css')
    );

    const highlightScriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media', 'highlight.pack.js')
    );

    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js')
    );

    // Use a nonce to only allow a specific script to be run.
    const nonce = getNonce();

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">

      <!--
        Use a content security policy to only allow loading images from https or from our extension directory,
        and only allow scripts that have a specific nonce.
      -->
      <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; img-src ${webview.cspSource} https:; script-src 'nonce-${nonce}';">

      <meta name="viewport" content="width=device-width, initial-scale=1.0">

      <link href="${stylesResetUri}" rel="stylesheet">
      <link href="${stylesMainUri}" rel="stylesheet">
      <link href="${stylesHighlightUri}" rel="stylesheet" />
      <script nonce=${nonce} src="${highlightScriptUri}"></script>
      <script nonce=${nonce}>
        hljs.initHighlightingOnLoad();
      </script>

      <title>Cat Coding</title>
    </head>
    <body>
      <h1 id="lines-of-code-counter">0</h1>

      <p id="p1">Hello, I'm TEXT 1</p>

      

      <pre>
        <code class="json">
        <div nonce=${nonce} style="float: right;">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="black" width="18px" height="18px"><path d="M0 0h24v24H0z" fill="none"/><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
        </div>
        {
          "a": 2,
          "b": null,
          "c": "nesto",
          "d": undefined,
          "e": {
            "e1": 1
          },
          "f": [
            1,
            2,
            3,
            4
          ]
        }
        </code>
      </pre>

      <button id="copyText">Copy to clipboard</button>
      <button id="sendToEditor">Send to editor</button>

      <script nonce=${nonce} src="${scriptUri}"></script>
    </body>
    </html>`;
  }
}
