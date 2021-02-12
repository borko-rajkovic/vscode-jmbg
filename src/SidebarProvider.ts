import * as vscode from 'vscode';
import { window, workspace } from 'vscode';
import { getNonce } from './getNonce';
import { getSelectedText } from './utils';
import {
  validateJMBG,
  ValidationResult,
  decodeJMBG,
  PersonData,
} from 'ts-jmbg';

function editorTextChanged(_view?: vscode.WebviewView) {
  const editor = vscode.window.activeTextEditor;

  if (!editor) {
    _view?.webview.postMessage({
      type: 'selectedText',
      value: { text: null, validationResult: null },
    });
    return;
  }

  const { document, selection } = editor;

  const { text } = getSelectedText(selection, document);

  const validationResult: ValidationResult = validateJMBG(text);

  let decoded: PersonData;

  if (validationResult.valid) {
    decoded = decodeJMBG(text);
  }

  _view?.webview.postMessage({
    type: 'selectedText',
    value: { text, validationResult },
  });
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
        webviewView?.webview.postMessage({
          type: 'selectedText',
          value: { text: null, validationResult: null },
        });
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
    const stylesVSCodeUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media', 'vscode.css')
    );
    const stylesMainUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media', 'main.css')
    );

    const stylesHighlightUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media', 'gruvbox-dark.css')
    );

    const stylesMaterialComponentsWeb = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this._extensionUri,
        'media',
        'material-components-web.min.css'
      )
    );

    const stylesMaterialLightBlueCyan = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this._extensionUri,
        'media',
        'material.light_blue-cyan.min.css'
      )
    );

    const fontMaterial = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media', 'font-material.css')
    );

    const highlightScriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media', 'highlight.pack.js')
    );

    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js')
    );

    const materialScriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media', 'material.min.js')
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
      <meta http-equiv="Content-Security-Policy" content="default-src 'none'; font-src ${webview.cspSource}; style-src ${webview.cspSource}; img-src ${webview.cspSource} https:; script-src 'nonce-${nonce}';">

      <meta name="viewport" content="width=device-width, initial-scale=1.0">

      <link href="${stylesResetUri}" rel="stylesheet">
      <link href="${stylesVSCodeUri}" rel="stylesheet">
      <link href="${stylesMainUri}" rel="stylesheet">
      <link href="${stylesHighlightUri}" rel="stylesheet" />
      <script nonce=${nonce} src="${highlightScriptUri}"></script>

      <link href=${stylesMaterialComponentsWeb} rel="stylesheet"/>
      <script nonce=${nonce} src=${materialScriptUri}></script>
      <link rel="stylesheet" href=${stylesMaterialLightBlueCyan}/>
    <link
      rel="stylesheet"
      href=${fontMaterial}
    />

      <title>JMBG</title>
    </head>
    <body>
      <h1 id="lines-of-code-counter">0</h1>

      <p id="p1">Hello, I'm TEXT 1</p>

      <div
      id="codeContainer"
    >
      <pre id="preCode"
      ><code id="codeElement" class="json"></code></pre>
      <div>
        <div class="margin10">
          <button
            id="btnCopy"
            class="mdl-button mdl-js-button mdl-js-ripple-effect mdl-button--accent"
          >
            <i class="material-icons mdc-button__icon" aria-hidden="true"
              >content_copy</i
            >
          </button>
          <div class="mdl-tooltip" for="btnCopy">Copy</div>
        </div>
        <div class="margin10">
          <button
            id="btnPaste"
            class="mdl-button mdl-js-button mdl-js-ripple-effect mdl-button--accent"
          >
            <i class="material-icons mdc-button__icon" aria-hidden="true"
              >send</i
            >
          </button>
          <div class="mdl-tooltip" for="btnPaste">Send to editor</div>
        </div>
      </div>
    </div>

      <button id="copyText">Copy to clipboard</button>
      <button id="sendToEditor">Send to editor</button>

      <script nonce=${nonce} src="${scriptUri}"></script>
    </body>
    </html>`;
  }
}
