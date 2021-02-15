import * as vscode from 'vscode';
import { workspace } from 'vscode';
import { getNonce } from '../utils/getNonce';
import { getSelectedText } from '../utils/getSelectedText';
import { parseErrorMessage } from '../utils/parseErrorMessage';
import { validateJMBG, ValidationResult, decodeJMBG } from 'ts-jmbg';
import { getDecorationTypeFromConfig } from '../utils/getDecorationTypeFromConfig';
import { emptyMessage } from './message/emptyMessage';
import { IMessage } from '../interfaces/IMessage';
import { emptyDecoded } from './message/emptyDecoded';
import { createUriFactory } from '../utils/createUriFactory';
import { wait } from '../utils/wait';

export class SidebarProvider implements vscode.WebviewViewProvider {
  private _message: IMessage = emptyMessage;
  private _lastEditor: vscode.TextEditor;
  private _lastDecorationRange: { range: vscode.Range };
  private _pasteInProgress = false;

  private _decorationType = getDecorationTypeFromConfig();

  private _changeTextEditorSelectionSubscription: vscode.Disposable;
  private _changeActiveTextEditorSubscription: vscode.Disposable;
  private _changeConfigurationSubscription: vscode.Disposable;
  private _messageReceivedSubscription: vscode.Disposable;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  private _setAndSendMessage(message: IMessage, _view: vscode.WebviewView) {
    console.log('Send message', message);
    this._message = message;
    _view.webview.postMessage(this._message);
  }

  private _editorTextChanged(_view: vscode.WebviewView) {
    this._sendMessageToWebView(_view);
    this._setDecoration();
  }

  private _sendMessageToWebView(_view: vscode.WebviewView) {
    const editor = vscode.window.activeTextEditor;

    if (!editor) {
      this._setAndSendMessage(emptyMessage, _view);
      return;
    }

    const { document, selection } = editor;

    const { text } = getSelectedText(selection, document);

    if (!text) {
      this._setAndSendMessage(emptyMessage, _view);
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
      this._setAndSendMessage(message, _view);
      return;
    }

    const decoded = decodeJMBG(text);
    const message: IMessage = {
      text,
      valid: true,
      reason: null,
      decoded: { ...emptyDecoded, ...decoded },
    };
    this._setAndSendMessage(message, _view);
  }

  private _setDecoration() {
    const editor = vscode.window.activeTextEditor;

    if (!editor) {
      return;
    }

    const { document, selection } = editor;
    const { range } = getSelectedText(selection, document);
    const newDecoration = {
      range,
    };

    if (!this._decorationType) {
      this._decorationType = getDecorationTypeFromConfig();
    }

    editor.setDecorations(this._decorationType, [newDecoration]);
    this._lastEditor = editor;
    this._lastDecorationRange = newDecoration;
  }

  private _refreshDecoration() {
    const lastEditor = vscode.window.visibleTextEditors.find(
      (editor) => this._lastEditor === editor
    );

    if (
      !this._lastEditor ||
      !this._lastDecorationRange ||
      !lastEditor ||
      !this._decorationType
    ) {
      return;
    }

    this._lastEditor.setDecorations(this._decorationType, [
      this._lastDecorationRange,
    ]);
  }

  public resolveWebviewView(webviewView: vscode.WebviewView) {
    webviewView.webview.options = {
      // Allow scripts in the webview
      enableScripts: true,

      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    webviewView.onDidChangeVisibility(() => {
      if (webviewView.visible) {
        this._subscribeAllSubscribers(webviewView);
        this._editorTextChanged(webviewView);
      } else {
        this._disposeSubscribersAndDecoration();
      }
    });

    webviewView.onDidDispose(() => {
      this._disposeSubscribersAndDecoration();
    });

    this._subscribeToTextEditorSelectionChange(webviewView);
    this._subscribeToChangeActiveTextEditor(webviewView);
    this._subscribeToChangeConfiguration();
    this._subscribeToMessages(webviewView);

    this._editorTextChanged(webviewView);
  }

  private _subscribeAllSubscribers(webviewView: vscode.WebviewView) {
    this._subscribeToChangeActiveTextEditor(webviewView);
    this._subscribeToChangeConfiguration();
    this._subscribeToTextEditorSelectionChange(webviewView);
    this._subscribeToMessages(webviewView);
  }

  private _disposeSubscribersAndDecoration() {
    this._changeTextEditorSelectionSubscription.dispose();
    this._changeActiveTextEditorSubscription.dispose();
    this._changeConfigurationSubscription.dispose();
    this._messageReceivedSubscription.dispose();

    this._changeTextEditorSelectionSubscription = null;
    this._changeActiveTextEditorSubscription = null;
    this._changeConfigurationSubscription = null;
    this._messageReceivedSubscription = null;

    if (this._decorationType) {
      this._decorationType.dispose();
      this._decorationType = null;
    }
  }

  private _subscribeToMessages(webviewView: vscode.WebviewView) {
    this._messageReceivedSubscription = webviewView.webview.onDidReceiveMessage(
      async (data) => {
        switch (data.type) {
          case 'copy': {
            vscode.env.clipboard.writeText(
              JSON.stringify(this._message.decoded, null, 2)
            );
            break;
          }
          case 'sendToEditor': {
            this._changeTextEditorSelectionSubscription.dispose();
            this._changeTextEditorSelectionSubscription = null;

            const activeEditor = vscode.window.activeTextEditor;
            if (!activeEditor) {
              break;
            }

            this._pasteInProgress = true;

            activeEditor.edit(async (editBuilder) => {
              this._decorationType.dispose();
              this._decorationType = null;

              const currentLineEndPosition = activeEditor.document.lineAt(
                activeEditor.selection.active.line
              ).range.end;

              const activeLine = activeEditor.selection.active.line;
              const activeChar = activeEditor.selection.active.character;

              const currentLineEndCharacter = currentLineEndPosition.character;

              activeEditor.selections = [
                new vscode.Selection(
                  activeEditor.selection.active.with({
                    character: currentLineEndCharacter,
                  }),
                  activeEditor.selection.active.with({
                    character: currentLineEndCharacter,
                  })
                ),
              ];

              editBuilder.insert(
                currentLineEndPosition,
                '\n\n' + JSON.stringify(this._message.decoded, null, 2)
              );

              const newPosition: vscode.Position = new vscode.Position(
                activeLine,
                activeChar
              );

              // If we don't move it to next tick, it becomes unexpected,
              // because we need to allow onDidChangeTextEditorSelection to be
              // called and processed before following in code bellow
              await wait(100);

              this._subscribeToTextEditorSelectionChange(webviewView);

              this._pasteInProgress = false;

              activeEditor.selections = [
                new vscode.Selection(newPosition, newPosition),
              ];

              this._decorationType = getDecorationTypeFromConfig();
            });

            break;
          }
        }
      }
    );
  }

  private _subscribeToChangeConfiguration() {
    this._changeConfigurationSubscription = workspace.onDidChangeConfiguration(
      () => {
        //clear all decorations
        this._decorationType.dispose();
        this._decorationType = getDecorationTypeFromConfig();
        this._refreshDecoration();
      }
    );
  }

  private _subscribeToChangeActiveTextEditor(webviewView: vscode.WebviewView) {
    this._changeActiveTextEditorSubscription = vscode.window.onDidChangeActiveTextEditor(
      () => this._editorTextChanged(webviewView)
    );
  }

  private _subscribeToTextEditorSelectionChange(
    webviewView: vscode.WebviewView
  ) {
    this._changeTextEditorSelectionSubscription = vscode.window.onDidChangeTextEditorSelection(
      () => {
        console.log('onDidChangeTextEditorSelection');
        if (this._pasteInProgress) {
          return;
        }
        this._editorTextChanged(webviewView);
      }
    );
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    // Styles
    const createStyleUri = createUriFactory(
      this._extensionUri,
      ['media', 'css'],
      webview
    );

    const stylesResetUri = createStyleUri('reset.css');
    const stylesVSCodeUri = createStyleUri('vscode.css');
    const stylesMainUri = createStyleUri('main.css');
    const stylesHighlightUri = createStyleUri('gruvbox-dark.css');
    const stylesMaterial = createStyleUri('mat.light_blue-cyan.css');
    const fontMaterial = createStyleUri('font-material.css');

    // Scripts
    const createScriptUri = createUriFactory(
      this._extensionUri,
      ['media', 'js'],
      webview
    );

    const highlightScriptUri = createScriptUri('highlight.pack.js');
    const materialScriptUri = createScriptUri('material.min.js');
    const scriptUri = createScriptUri('main.js');

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
