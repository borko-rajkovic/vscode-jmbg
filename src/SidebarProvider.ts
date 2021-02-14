import * as vscode from 'vscode';
import { window, workspace } from 'vscode';
import { getNonce } from './getNonce';
import { getSelectedText, parseErrorMessage } from './utils';
import {
  validateJMBG,
  ValidationResult,
  decodeJMBG,
  PersonData,
} from 'ts-jmbg';

interface IMessage {
  text: string;
  valid: boolean;
  reason: string;
  decoded: PersonData;
}

// TODO on change visibility remove listener from events
// TODO on dispose remove decoration and other listeners

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

const emptyDecoded: PersonData = {
  day: null,
  month: null,
  year: null,
  place: null,
  region: null,
  gender: null,
};

export class SidebarProvider implements vscode.WebviewViewProvider {
  private message: IMessage = this.emptyMessage;
  private lastEditor: vscode.TextEditor;
  private lastDecorationRange: { range: vscode.Range };

  private decorationType = getDecorationTypeFromConfig();

  get emptyMessage(): IMessage {
    return {
      text: null,
      valid: false,
      reason: null,
      decoded: emptyDecoded,
    };
  }

  setAndSendMessage(message: IMessage, _view?: vscode.WebviewView) {
    this.message = message;
    _view?.webview.postMessage(this.message);
  }

  constructor(private readonly _extensionUri: vscode.Uri) {}

  private editorTextChanged(_view?: vscode.WebviewView) {
    const editor = vscode.window.activeTextEditor;

    if (!editor) {
      this.setAndSendMessage(this.emptyMessage, _view);
      return;
    }

    const { document, selection } = editor;

    const { text } = getSelectedText(selection, document);

    if (!text) {
      this.setAndSendMessage(this.emptyMessage, _view);
      return;
    }

    const validationResult: ValidationResult = validateJMBG(text);

    if (!validationResult.valid) {
      const message = {
        text,
        valid: false,
        reason: parseErrorMessage(validationResult.reason),
        decoded: emptyDecoded,
      };
      this.setAndSendMessage(message, _view);
    }

    const decoded = decodeJMBG(text);
    const message: IMessage = {
      text,
      valid: true,
      reason: null,
      decoded: { ...emptyDecoded, ...decoded },
    };
    this.setAndSendMessage(message, _view);
  }

  private setDecoration() {
    const editor = vscode.window.activeTextEditor;

    if (!editor) {
      return;
    }

    const { document, selection } = editor;
    const { range } = getSelectedText(selection, document);
    const newDecoration = {
      range,
    };

    editor.setDecorations(this.decorationType, [newDecoration]);
    this.lastEditor = editor;
    this.lastDecorationRange = newDecoration;
  }

  private refreshDecoration() {
    const lastEditor = vscode.window.visibleTextEditors.find(
      (editor) => this.lastEditor === editor
    );

    if (!this.lastEditor || !this.lastDecorationRange || !lastEditor) {
      return;
    }

    this.lastEditor.setDecorations(this.decorationType, [
      this.lastDecorationRange,
    ]);
  }

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
      console.log('onDidChangeTextEditorSelection');
      this.setDecoration();
      this.editorTextChanged(webviewView);
    });

    vscode.window.onDidChangeActiveTextEditor(() => {
      console.log('onDidChangeActiveTextEditor');
      this.editorTextChanged();
    });

    workspace.onDidChangeConfiguration(() => {
      //clear all decorations
      this.decorationType.dispose();
      this.decorationType = getDecorationTypeFromConfig();
      this.refreshDecoration();
    });

    webviewView.webview.options = {
      // Allow scripts in the webview
      enableScripts: true,

      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    this.editorTextChanged(webviewView);

    webviewView.webview.onDidReceiveMessage(async (data) => {
      switch (data.type) {
        case 'copy': {
          vscode.env.clipboard.writeText(
            JSON.stringify(this.message.decoded, null, 2)
          );
          break;
        }
        case 'sendToEditor': {
          const activeEditor = vscode.window.activeTextEditor;
          if (!activeEditor) {
            break;
          }

          activeEditor.edit((editBuilder) => {
            editBuilder.replace(
              activeEditor.selection,
              JSON.stringify(this.message.decoded, null, 2)
            );
          });

          break;
        }
      }
    });
  }

  private _styleUri(webview: vscode.Webview, resource: string) {
    return webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media', 'css', resource)
    );
  }

  private _scriptUri(webview: vscode.Webview, resource: string) {
    return webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media', 'js', resource)
    );
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    // Styles
    const stylesResetUri = this._styleUri(webview, 'reset.css');
    const stylesVSCodeUri = this._styleUri(webview, 'vscode.css');
    const stylesMainUri = this._styleUri(webview, 'main.css');
    const stylesHighlightUri = this._styleUri(webview, 'gruvbox-dark.css');
    const stylesMaterial = this._styleUri(webview, 'mat.light_blue-cyan.css');
    const fontMaterial = this._styleUri(webview, 'font-material.css');

    // Scripts
    const highlightScriptUri = this._scriptUri(webview, 'highlight.pack.js');
    const materialScriptUri = this._scriptUri(webview, 'material.min.js');
    const scriptUri = this._scriptUri(webview, 'main.js');

    // Use a nonce to only allow a specific script to be run.
    const nonce = getNonce();

    return `
    <!DOCTYPE html>
    <html lang="en">

    <head>
      <meta charset="UTF-8" />

      <!--
            Use a content security policy to only allow loading images from https or from our extension directory,
            and only allow scripts that have a specific nonce.
          -->
      <meta http-equiv="Content-Security-Policy"
        content="default-src 'none'; font-src ${webview.cspSource}; style-src ${webview.cspSource}; img-src ${webview.cspSource} https:; script-src 'nonce-${nonce}';" />

      <meta name="viewport" content="width=device-width, initial-scale=1.0" />

      <link href="${stylesResetUri}" rel="stylesheet" />
      <link href="${stylesVSCodeUri}" rel="stylesheet" />
      <link href="${stylesMainUri}" rel="stylesheet" />
      <link href="${stylesHighlightUri}" rel="stylesheet" />
      <script nonce="${nonce}" src="${highlightScriptUri}"></script>

      <script nonce="${nonce}" src="${materialScriptUri}"></script>
      <link rel="stylesheet" href="${stylesMaterial}" />
      <link rel="stylesheet" href="${fontMaterial}" />

      <title>JMBG</title>
    </head>

    <body>
      <h1 class="margin0">Title</h1>

      <p id="p1">Hello, I'm TEXT 1</p>

      <div id="codeContainer">
        <pre id="preCode"><code id="codeElement" class="json"></code></pre>
        <div>
          <div class="margin10">
            <button id="btnCopy" class="mdl-button mdl-js-button mdl-js-ripple-effect mdl-button--accent">
              <i class="material-icons mdc-button__icon" aria-hidden="true">content_copy</i>
            </button>
            <div id="btnCopyTooltip" class="mdl-tooltip" for="btnCopy">Copy</div>
          </div>
          <div class="margin10">
            <button id="btnPaste" class="mdl-button mdl-js-button mdl-js-ripple-effect mdl-button--accent">
              <i class="material-icons mdc-button__icon" aria-hidden="true">send</i>
            </button>
            <div id="btnPasteTooltip" class="mdl-tooltip" for="btnPaste">Send to editor</div>
          </div>
        </div>
      </div>

      <button id="copyText">Copy to clipboard</button>
      <button id="sendToEditor">Send to editor</button>

      <script nonce="${nonce}" src="${scriptUri}"></script>
    </body>

    </html>
    `;
  }
}
