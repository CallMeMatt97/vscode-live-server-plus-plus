import * as vscode from 'vscode';
import { LiveServerPlusPlus } from '../core/LiveServerPlusPlus';
import { NotificationService } from './services/NotificationService';
import { fileSelector, setMIME } from './middlewares';
import { ILiveServerPlusPlusConfig } from '../core/types';
import { extensionConfig } from './utils/extensionConfig';
import { BrowserService } from './services/BrowserService';
import { workspaceUtils } from './utils/workSpaceUtils';
import { StatusbarService } from './services/StatusbarService';

export function activate(context: vscode.ExtensionContext) {
  const liveServerPlusPlus = new LiveServerPlusPlus(getLSPPConfig());

  liveServerPlusPlus.useMiddleware(fileSelector, setMIME);
  liveServerPlusPlus.useService(NotificationService, BrowserService, StatusbarService);

  const openServer = vscode.commands.registerCommand(getCmdWithPrefix('open'), () => {
    liveServerPlusPlus.reloadConfig(getLSPPConfig());
    liveServerPlusPlus.goLive();
  });

  const closeServer = vscode.commands.registerCommand(getCmdWithPrefix('close'), () => {
    liveServerPlusPlus.shutdown();
  });

  context.subscriptions.push(openServer);
  context.subscriptions.push(closeServer);
}

export function deactivate() {}

function getCmdWithPrefix(commandName: string) {
  return `extension.live-server++.${commandName}`;
}

function getLSPPConfig(): ILiveServerPlusPlusConfig {
  // Fallback when no workspace is open: use first workspace folder or process.cwd()
  const cwd =
    workspaceUtils.cwd ||
    (vscode.workspace && vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders[0]
      ? vscode.workspace.workspaceFolders[0].uri.fsPath
      : process.cwd());
  const LSPPconfig: ILiveServerPlusPlusConfig = { cwd };
  LSPPconfig.port = extensionConfig.port.get();
  LSPPconfig.subpath = extensionConfig.root.get();
  LSPPconfig.debounceTimeout = extensionConfig.timeout.get();
  LSPPconfig.indexFile = extensionConfig.indexFile.get();
  LSPPconfig.reloadingStrategy = extensionConfig.reloadingStrategy.get();
  return LSPPconfig;
}
