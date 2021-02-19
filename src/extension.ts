import * as vscode from 'vscode';

import { generateRandomCommand, validateCommand } from './commands';
import { RandomGeneratorSidebarProvider } from './sidebar/random-generator/RandomGeneratorSidebarProvider';
import { ValidationSidebarProvider } from './sidebar/validation/ValidationSidebarProvider';

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
      'vscode-jmbg-sidebar-validation',
      new ValidationSidebarProvider(context.extensionUri),
      { webviewOptions: { retainContextWhenHidden: true } }
    )
  );

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      'vscode-jmbg-sidebar-random-generator',
      new RandomGeneratorSidebarProvider(context.extensionUri),
      { webviewOptions: { retainContextWhenHidden: true } }
    )
  );
}

export function deactivate() {}
