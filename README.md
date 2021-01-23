# JMBG Extension for Visual Studio Code

![Visual Studio Marketplace Installs - Azure DevOps Extension](https://img.shields.io/visual-studio-marketplace/azure-devops/installs/total/borko-rajkovic.vscode-jmbg)

A wrapper around [ts-jmbg](https://github.com/borko-rajkovic/ts-jmbg) for Visual Studio Code.
Quickly check of string is valid JMBG and generate random JMBG in multi-cursor selections.

If only one word is selected, the `vscode-jmbg.validate` will validate string. If there is no selection, `vscode-jmbg.validate` will take current cursor word and validate string:

![JMBG Validation](https://raw.githubusercontent.com/borko-rajkovic/vscode-jmbg/main/images/validate.gif)

For each multi-cursor selection `vscode-jmbg.generate-random` will insert new random generated JMBG:

![Generate Random JMBG](https://raw.githubusercontent.com/borko-rajkovic/vscode-jmbg/main/images/generate-random.gif)

_Note:_ Please read the [documentation](https://code.visualstudio.com/Docs/editor/editingevolved) on how to use multiple cursors in Visual Studio Code.

## Install

Launch VS Code Quick Open (Ctrl/Cmd+P), paste the following command, and press enter.

```sh
ext install jmbg
```

## Commands

- `vscode-jmbg.validate`: Validate JMBG: Checks if selection is valid JMBG
- `vscode-jmbg.generate-random`: Generate random: Inserts random generated JMBG on each selection (multiple cursors can be used)

## Support

[Create an issue](https://github.com/borko-rajkovic/vscode-jmbg/issues)
