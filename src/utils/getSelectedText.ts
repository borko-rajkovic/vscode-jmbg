import * as vscode from 'vscode';
import { isRangeSimplyCursorPosition } from './isRangeSimplyCursorPosition';

/**
 * If there is no selected chars, take word from current position of the cursor
 */
export const getSelectedText = (
  selection: vscode.Selection,
  document: vscode.TextDocument
): { text: string; range: vscode.Range } => {
  let range = new vscode.Range(selection.start, selection.end);

  if (isRangeSimplyCursorPosition(selection)) {
    const rangeTest = document.getWordRangeAtPosition(selection.end);

    if (rangeTest) {
      range = rangeTest;
    }
  }

  return {
    text: document.getText(range),
    range,
  };
};
