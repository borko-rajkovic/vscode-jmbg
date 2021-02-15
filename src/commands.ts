import { generateRandomJMBG, validateJMBG } from 'ts-jmbg';
import * as vscode from 'vscode';

import { getSelectedText } from './utils/getSelectedText';
import { parseErrorMessage } from './utils/parseErrorMessage';

export const validateCommand = () => {
  const editor = vscode.window.activeTextEditor;

  if (!editor) {
    vscode.window.showWarningMessage('Please select text in editor');
    return;
  }

  const { document, selections, selection } = editor;

  if (selections.length > 1) {
    vscode.window.showWarningMessage('Please use single selection');
    return;
  }

  const { text } = getSelectedText(selection, document);

  const validResult = validateJMBG(text);

  if (validResult.valid) {
    vscode.window.showInformationMessage(`${text} valid JMBG!`);
  } else {
    vscode.window.showErrorMessage(
      `${text} invalid JMBG! ${parseErrorMessage(validResult.reason!)}`
    );
  }
};

export const generateRandomCommand = async () => {
  const editor = vscode.window.activeTextEditor;

  if (!editor) {
    vscode.window.showWarningMessage('Please open editor');
    return;
  }

  const { selections } = editor;

  for (const selection of selections) {
    await editor.edit((editBuilder) => {
      editBuilder.replace(selection, generateRandomJMBG());
    });
  }
};
