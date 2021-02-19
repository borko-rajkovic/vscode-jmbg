import * as vscode from 'vscode';

import { createUriFactory } from '../../utils/createUriFactory';
import { getNonce } from '../../utils/getNonce';
import { generateRandomJMBG } from 'ts-jmbg';

export class RandomGeneratorSidebarProvider
  implements vscode.WebviewViewProvider {
  constructor(private readonly _extensionUri: vscode.Uri) {}

  public resolveWebviewView(webviewView: vscode.WebviewView) {
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(async (data) => {
      switch (data.type) {
        case 'copy': {
          vscode.env.clipboard.writeText(data.text);
          break;
        }
        case 'generate': {
          webviewView.webview.postMessage(generateRandomJMBG());
          break;
        }
      }
    });

    webviewView.webview.postMessage(generateRandomJMBG());
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    // Styles
    const createStyleUri = createUriFactory(
      this._extensionUri,
      ['media', 'randomGeneratorPage', 'css'],
      webview
    );

    const stylesResetUri = createStyleUri('reset.css');
    const stylesVSCodeUri = createStyleUri('vscode.css');
    const stylesMainUri = createStyleUri('main.css');
    const stylesMaterial = createStyleUri('mat.light_blue-cyan.css');
    const fontMaterial = createStyleUri('font-material.css');

    // Scripts
    const createScriptUri = createUriFactory(
      this._extensionUri,
      ['media', 'randomGeneratorPage', 'js'],
      webview
    );

    const materialScriptUri = createScriptUri('material.min.js');
    const scriptUri = createScriptUri('main.js');

    // Use a nonce to only allow a specific script to be run
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

      <script nonce="${nonce}" src="${materialScriptUri}"></script>
      <link rel="stylesheet" href="${stylesMaterial}" />
      <link rel="stylesheet" href="${fontMaterial}" />

      <title>JMBG</title>
    </head>

    <body class="paddingTop10">
      <div id="codeContainer">
        <div class="justify-center">
          <button id="btnGenerate" class="mdl-button mdl-js-button mdl-js-ripple-effect mdl-button--accent">
            <i class="material-icons mdc-button__icon" aria-hidden="true">refresh</i>
          </button>
          <div id="btnRefreshTooltip" class="mdl-tooltip" for="btnRefresh">Generate</div>
        </div>
        <pre id="preCode"><code id="codeElement" class="json">1234567890123</code></pre>
        <div class="justify-center">
          <button id="btnCopy" class="mdl-button mdl-js-button mdl-js-ripple-effect mdl-button--accent">
            <i class="material-icons mdc-button__icon" aria-hidden="true">content_copy</i>
          </button>
          <div id="btnCopyTooltip" class="mdl-tooltip" for="btnCopy">Copy</div>
        </div>
      </div>

      <button id="generateRandom">Generate new random JMBG</button>

      <script nonce="${nonce}" src="${scriptUri}"></script>
    </body>

    </html>
    `;
  }
}
