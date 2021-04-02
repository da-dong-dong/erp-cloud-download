import {autoUpdater} from 'electron-updater';
import log from 'electron-log';
import {ipcMain} from 'electron';
import fs from 'fs';
import path from 'path';


export default class AppUpdate {
  constructor (win, feedUrl) {
    this.mainWindow = win;
    this.feedUrl = feedUrl;


    //设置更新包的地址
    autoUpdater.setFeedURL(this.feedUrl);
    autoUpdater.autoDownload = false;
    log.transports.file.level = "debug";
    // autoUpdater.checkForUpdatesAndNotify((e, o) => {
    //   console.log(e);
    //   console.log(o);
    // })
    autoUpdater.logger  = log;
    this.delFile();


    //监听升级失败事件
    autoUpdater.on('error',  (error) => {
      autoUpdater.logger.debug(error);
      this.sendUpdateMessage({
        cmd: 'error',
        message: error
      })
    });
    //监听开始检测更新事件
    autoUpdater.on('checking-for-update',  (message) => {
      this.sendUpdateMessage({
        cmd: 'checking-for-update',
        message: message
      })
    });
    //监听发现可用更新事件
    autoUpdater.on('update-available',  (message) => {
      console.log(1111);
      this.sendUpdateMessage({
        cmd: 'update-available',
        message: message
      })
    });
    //监听没有可用更新事件
    autoUpdater.on('update-not-available',  (message) => {
      console.log(333);
      this.sendUpdateMessage({
        cmd: 'update-not-available',
        message: message
      })
    });

    // 更新下载进度事件
    autoUpdater.on('download-progress',  (progressObj) => {
      console.log(444);
      this.sendUpdateMessage({
        cmd: 'download-progress',
        message: progressObj
      })
    });
    //监听下载完成事件
    autoUpdater.on('update-downloaded',  (event, releaseNotes, releaseName, releaseDate, updateUrl) => {
      this.sendUpdateMessage({
        cmd: 'update-downloaded',
        message: {
          releaseNotes,
          releaseName,
          releaseDate,
          updateUrl
        }
      })
      //退出并安装更新包
      autoUpdater.quitAndInstall();
    });

    //接收渲染进程消息，开始检查更新
    ipcMain.on("checkForUpdate", (e, arg) => {
      //执行自动更新检查
      autoUpdater.checkForUpdates();
    })


    ipcMain.on("start-update", (e, arg) => {
      //执行自动更新检查
      autoUpdater.downloadUpdate();
    })


  }

  /**
   * 删除本地已下载的文件
   */
  delFile() {
    let updaterCacheDirName = 'lyfz-erp-updater';
    const updatePendingPath = path.join(autoUpdater.app.baseCachePath, updaterCacheDirName, 'pending');
    log.debug(updatePendingPath)
    if (fs.existsSync(updatePendingPath)) {
      let files = fs.readdirSync(updatePendingPath);
      for (let i = 0; i < files.length; i++) {
        try {
          fs.unlinkSync(`${updatePendingPath}/${files[i]}`)
        } catch (e) {
          log.debug(e);
        }
      }
    } else {
      fs.mkdir(`${updatePendingPath}`, { recursive: true }, (err) => {
        if (err) {
          log.debug(err);
        }
      });
    }
    // try {
    //   fs.emptyDir(updatePendingPath)
    // } catch (e) {
    //   console.log(e);
    // }
  }
  //给渲染进程发送消息
  sendUpdateMessage(text) {
    console.log(text);
    this.mainWindow.webContents.send('update-app', text)
  }

}
