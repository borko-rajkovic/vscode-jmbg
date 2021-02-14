import { window, workspace } from 'vscode';

export function getDecorationTypeFromConfig() {
  const config = workspace.getConfiguration('vscode-jmbg');
  const borderColor = config.get<string>('borderColor');
  const borderWidth = config.get<string>('borderWidth');
  const borderStyle = config.get<string>('borderStyle');
  const decorationType = window.createTextEditorDecorationType({
    isWholeLine: false,
    borderWidth: `0 0 ${borderWidth} 0`,
    borderStyle: `${borderStyle}`,
    borderColor,
  });
  return decorationType;
}
