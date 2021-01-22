import { InvalidReason } from 'ts-jmbg';
import * as vscode from 'vscode';

export const isRangeSimplyCursorPosition = (range: vscode.Range): boolean => {
  return (
    range.start.line === range.end.line &&
    range.start.character === range.end.character
  );
};

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

export const parseErrorMessage = (message: InvalidReason): string => {
  switch (message) {
    case InvalidReason.NOT_STRING:
      return 'Not string';
    case InvalidReason.MUST_CONTAIN_EXACTLY_13_DIGITS:
      return 'Must contain exactly 13 digits';
    case InvalidReason.INVALID_DATE:
      return 'Invalid date';
    case InvalidReason.INVALID_CONTROL_NUMBER:
      return 'Invalid control number';
  }
};
