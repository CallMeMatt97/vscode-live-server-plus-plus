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

  // Show friendly notifications and surface errors to the user and logs
  try {
    liveServerPlusPlus.onServerError((err: any) => {
      console.error('LiveServer++ server error:', err);
      try {
        vscode.window.showErrorMessage(`Live Server++ error: ${err && err.message ? err.message : err}`);
      } catch (e) {
        /* ignore UI errors during activation */
      }
    });

    liveServerPlusPlus.onDidGoLive(() => {
      console.info('LiveServer++: server started');
      try {
        vscode.window.showInformationMessage('Live Server++ started');
      } catch (e) {}
    });

    liveServerPlusPlus.onDidGoOffline(() => {
      console.info('LiveServer++: server stopped');
      try {
        vscode.window.showInformationMessage('Live Server++ stopped');
      } catch (e) {}
    });
  } catch (e) {
    console.warn('Failed to attach LSPP event handlers', e);
  }

  const openServer = vscode.commands.registerCommand(getCmdWithPrefix('open'), async () => {
    try {
      liveServerPlusPlus.reloadConfig(getLSPPConfig());
      await liveServerPlusPlus.goLive();
    } catch (err) {
      console.error('Failed to start LiveServer++:', err);
      vscode.window.showErrorMessage(`Failed to start Live Server++: ${err && err.message ? err.message : err}`);
    }
  });

  const closeServer = vscode.commands.registerCommand(getCmdWithPrefix('close'), async () => {
    try {
      await liveServerPlusPlus.shutdown();
    } catch (err) {
      console.error('Failed to shutdown LiveServer++:', err);
      vscode.window.showErrorMessage(`Failed to stop Live Server++: ${err && err.message ? err.message : err}`);
    }
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
