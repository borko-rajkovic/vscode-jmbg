import * as vscode from 'vscode';

export const createUriFactory = (
  extensionUri: vscode.Uri,
  folders: string[],
  webview: vscode.Webview
) => (resource: string) =>
  webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, ...folders, resource));
