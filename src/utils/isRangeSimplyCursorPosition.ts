import * as vscode from 'vscode';

export const isRangeSimplyCursorPosition = (range: vscode.Range): boolean => {
  return (
    range.start.line === range.end.line &&
    range.start.character === range.end.character
  );
};
