import * as vscode from 'vscode';

import { generateRandomCommand, validateCommand } from './commands';
import { SidebarProvider } from './SidebarProvider';

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand('vscode-jmbg.validate', validateCommand)
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      'vscode-jmbg.generate-random',
      generateRandomCommand
    )
  );

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      'vscode-jmbg-sidebar',
      new SidebarProvider(context.extensionUri),
      { webviewOptions: { retainContextWhenHidden: true } }
    )
  );
}

export function deactivate() {}
