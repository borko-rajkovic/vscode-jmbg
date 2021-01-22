import * as vscode from 'vscode';

import { generateRandomCommand, validateCommand } from './commands';

export function activate(context: vscode.ExtensionContext) {
  let validateCommandDisposable = vscode.commands.registerCommand(
    'vscode-jmbg.validate',
    validateCommand
  );

  context.subscriptions.push(validateCommandDisposable);

  let generateRandomCommandDisposable = vscode.commands.registerCommand(
    'vscode-jmbg.generate-random',
    generateRandomCommand
  );

  context.subscriptions.push(generateRandomCommandDisposable);
}

export function deactivate() {}
