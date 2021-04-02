'use strict'

import { app, protocol, BrowserWindow, ipcMain, globalShortcut, Menu, remote,dialog,Tray, nativeImage} from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib';

import log from 'electron-log';
const isDevelopment = process.env.NODE_ENV !== 'production';

import path from 'path';
import AppUpdate from './update.js';
import winConfig from './winConfig.js';
import localConfig from './localConfig'
import fileRow from './fileRow'
import os from "os";
import fs from 'fs';

let downloadpath;//下载路径
let savepath; //保存路径
//托盘对象
let appTray = null 
let win = null;
export default class Background extends winConfig {
  constructor() {
    super();
    this.win = win;
    this.pathStr = '';
    this.locPath = '';
    this.animationWin = '';
    // 注册自定义本地请求协议
    protocol.registerSchemesAsPrivileged([
      { scheme: 'app', privileges: { secure: true, standard: true } }
    ])
    
    //判断关闭多个线程
    const gotTheLock = app.requestSingleInstanceLock()
 
    if (!gotTheLock) {
      app.quit()
     
    }else{
     // 创建窗口 
     app.on('second-instance', (event, commandLine, workingDirectory) => {
      // 当运行第二个实例时,将会聚焦到myWindow这个窗口
      if (win) {
        if (win.isMinimized()) win.restore()
        win.focus()

        win.show(); 
      win.setSkipTaskbar(false);
      }
    })
      app.on('ready', async () => {


        const clearObj = {
          storages: ['appcache', 'filesystem', 'indexdb', 'shadercache', 'websql', 'serviceworkers', 'cachestorage'],
        };

        if (app.getAppPath().indexOf('lyfz-erp') >= 0) {
          this.pathStr = app.getAppPath().slice(0, app.getAppPath().indexOf('lyfz-erp'));
        } else {
          this.pathStr = app.getAppPath().slice(0, app.getAppPath().indexOf('lyfz-erp'));
        }



        // 本地文件协议
        protocol.interceptFileProtocol('file',(request, callback) => {
              const url = request.url.substr(6)
              log.debug(`本地文件协议:${this.pathStr}/${url}`)
              callback({ path: path.normalize(`${this.pathStr}/${url}`) })
              // callback(fs.createReadStream(path.normalize(`${__dirname}/${url}`)))
            },
            error => {
              console.log(error)
            },
        )

        //本地路径：
              
        log.debug(`erp路径：${app.getPath('appData')}`)

        this.locPath = `${app.getPath('appData')}/lyfz-erp/actionJsonFile`
        

        log.debug(`本地路径：${this.pathStr}`)

        this.loadingWin();
        this.createWindow();
        
        //调用文件查询
        const fileRows = new fileRow(this.pathStr,this.win,this.locPath)

        

        // 注册打开调试快捷键
        globalShortcut.register('ctrl+d+b+n', () => {
          this.win.webContents.openDevTools();
        })

        // 注册刷新
        globalShortcut.register('ctrl+F5', () => {
          this.win.webContents.send('f5');
        })
        // 清除缓存
        this.win.webContents.session.clearStorageData(clearObj);

        // 全屏
        globalShortcut.register('ctrl+F10', () => {
          if (this.win.isFullScreen() || this.win.isSimpleFullScreen()) {
            this.win.setFullScreen(false);
            this.win.setSimpleFullScreen(false);
          } else {
            this.win.setFullScreen(true);
            this.win.setSimpleFullScreen(true);
          }
        })


        // 退出全屏
        globalShortcut.register('ctrl+ESC', () => {
          if (this.win.isFullScreen() || this.win.isSimpleFullScreen()) {
            this.win.setFullScreen(false);
            this.win.setSimpleFullScreen(false);
          } else {
            // win.webContents.send('esc');
          }

        })

      })

      // Quit when all windows are closed.
      app.on('window-all-closed', () => {
        // On macOS it is common for applications and their menu bar
        // to stay active until the user quits explicitly with Cmd + Q
        if (process.platform !== 'darwin') {
          app.quit()
          // this.win.minimize()
        }
      });

      // 获取是否全屏
      ipcMain.on('isFullScreen' , (e) => {
        e.returnValue = this.win.isFullScreen() || this.win.isSimpleFullScreen();
      });


      ipcMain.on('ddddd', () => {
        console.log(1111)
        appTray.destroy()
        app.quit()
      })

      // 设置全屏/不全屏
      ipcMain.on('setFullScreen' , (e, n) => {
        if (n === 1) {
          this.win.setFullScreen(true);
          this.win.setSimpleFullScreen(true);
        } else {
          this.win.setFullScreen(false);
          this.win.setSimpleFullScreen(false);
        }
      });




      // 渲染进程的一些配置
      ipcMain.on('config', (e, data) => {

      });

      ipcMain.on('reload', () => {
        app.relaunch();
        app.exit(0);
      })

      //主线程-渲染通讯
      
      ipcMain.on('synchronous', (event, arg) => {
        console.log(arg)  // prints "ping"
        event.returnValue = 'pong1'
      })
    
    }
  
  }

  createWindow() {
    Menu.setApplicationMenu(null);
    // Create the browser window.
    this.win = new BrowserWindow({
      minWidth: 516,
      minHeight: 384,
      width: 1024,
      height: 768,
      fullscreen: false,
      frame: false,//无边框窗口
      show: false, // 先隐藏
      webPreferences: {
        // Use pluginOptions.nodeIntegration, leave this alone
        // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
        nodeIntegration: true,
        nodeIntegrationInWorker: true,
        webSecurity: false
      },
    })
  win=this.win
    //系统托盘右键菜单
    let trayMenuTemplate = [
         {
             label: '退出',
             click: ()=>{
             
              //判断文件是否存在
              this.isFileIfFolder(`${this.locPath}/oneStart/ones.json`).then(res=>{
                if(res){
                    fs.unlinkSync(`${this.locPath}/oneStart/ones.json`)
                }
                if (os.type() == 'Windows_NT') {
                  win.destroy()
                }
                if (os.type() == 'Darwin') {
                  appTray.destroy()
                  app.quit()
                }
              })
              
             
             }
         }
    ];
    //系统托盘图标
    let iconPath = null
    if (os.type() == 'Windows_NT') {
      if(isDevelopment){
        iconPath = path.join(process.cwd(), 'public', 'icon.ico')
      }else{
        iconPath = path.join(`./`, 'public', 'icon.ico')
      }
      //后台启动展示
      //判断是否是第一次启动，查询文件
      fs.readdir(`${this.locPath}/oneStart`, (err, files) => {
        console.log(files.length)
        if(files.length==0){
          this.win.hide()
        }else{
          this.win.show();
          if (this.animationWin) {
            this.animationWin.destroy();
            this.animationWin = null;
          }
        }
      });
    }
    if (os.type() == 'Darwin') {
      iconPath = `${this.pathStr}lyfz-erp.app/Contents/cloudDownload/lyfz-erp-cloud-download.app/Contents/public/loca.png`

      iconPath = nativeImage.createFromPath(iconPath)
      
      //寻找文件找出路径
      //判断是否是第一次启动，查询文件
      fs.readdir(`${this.locPath}/oneStart`, (err, files) => {
        //兼容判断
        if(this.isEmpty(files)){
          this.win.minimize()
        }else{
          this.win.show();
          if (this.animationWin) {
            this.animationWin.destroy();
            this.animationWin = null;
          }
        }
      });
      //启动定时器
      this.setTimeKillChiled()
    }
    //实例化托盘
    appTray = new Tray(iconPath);

    //图标的上下文菜单
    const contextMenu = Menu.buildFromTemplate(trayMenuTemplate);

    //设置此图标的上下文菜单
    appTray.setContextMenu(contextMenu);
    
    //我们这里模拟桌面程序点击通知区图标实现打开关闭应用的功能
    appTray.on('click', ()=>{ 
      this.win.isVisible() ? this.win.hide() : this.win.show()
      this.win.isVisible() ?this.win.setSkipTaskbar(false):this.win.setSkipTaskbar(true);
    })
    

   

    //兼容苹果端右键
    if (os.type() == 'Darwin') {
      appTray.on('right-click', ()=>{ 
        this.win.isVisible() ? this.win.minimize() : this.win.show()
      })
    }
    
    ipcMain.on('download', (event, args) => {
      var arr=args.split("+");
        downloadpath=arr[0];
      savepath=arr[1];
        //下面这句会触发will-download事件
        this.win.webContents.downloadURL(downloadpath);
      })

    this.win.webContents.session.on('will-download', (event, item) => {
      //设置文件存放位置，如果用户没有设置保存路径，Electron将使用默认方式来确定保存路径（通常会提示保存对话框）
        item.setSavePath(savepath+item.getFilename())
        item.on('updated', (event, state) => {
          if (state === 'interrupted') {
           console.log('Download is interrupted but can be resumed')
          } else if (state === 'progressing') {
            if (item.isPaused()) {
            console.log('Download is paused')
            } else {
              console.log(`Received bytes: ${item.getReceivedBytes()}`)
            }
          }
        })
          item.once('done', (event, state) => {
            if (state === 'completed') {
              console.log('Download successfully')
            //回显 调用渲染进程方法
              this.win.webContents.send('downstate',1)
            } else {
              console.log(`Download failed: ${state}`)
            //回显 调用渲染进程方法
              this.win.webContents.send('downstate',0)
            }
        })
      })

    log.debug(process.env.WEBPACK_DEV_SERVER_URL, '当前环境')
    if (process.env.WEBPACK_DEV_SERVER_URL) {
      // 根页面
      this.win.loadURL(process.env.WEBPACK_DEV_SERVER_URL);
      // 内页
      // toolbarWindows.loadURL(
      //   process.env.WEBPACK_DEV_SERVER_URL + "#toolbar"
      // );
    } else {
      createProtocol("app");
      // 根页面
      this.win.loadURL("app://./index.html");
      // 内页
      // toolbarWindows.loadURL("app://./index.html#toolbar");
    }

    //this.win.webContents.openDevTools();
    
    if (process.env.BABEL_ENV === 'development') {
      this.win.webContents.openDevTools();
    }
    process.on('message', function (data) {
      console.log('父进程发送的 : ', data.toString());
      this.win.webContents.send('aaaaa',data)
    });
    this.win.on('closed', () => {
      this.win = null
    })
    //监听 关闭事件，阻止关闭程序
    this.win.on('close', (event) => { 
      if (os.type() == 'Darwin') {
        this.win.minimize()
      }else{
        this.win.hide(); 
        this.win.setSkipTaskbar(true);
        event.preventDefault();
      }
      
  });

    this.win.on('ready-to-show', () => {
      log.debug('隐藏加载窗口，托盘显示主窗口')
      if (this.animationWin) {
        this.animationWin.destroy();
        this.animationWin = null;
      }
      //this.win.show() // 初始化后再显示
    })
    //所有窗口关闭
    this.win.on('window-all-closed', () => {
      this.win.minimize()
    })
    // 调用自动更新
    const feedUrl = "https://storage.lyfz.net/client/";
    const appupdate = new AppUpdate(this.win, feedUrl);

    
  }
  /**
   * 创建一个启动窗口
   */
  loadingWin() {
    this.animationWin = new BrowserWindow({
      width: 800,
      height: 800,
      frame: false,
      transparent: true,
      webPreferences: {
        nodeIntegration: true
      }
    })

    log.debug(`当前系统类型${os.type}`)
    if (os.type() == 'Windows_NT') {
      this.animationWin.loadURL(`file://lyfz-erp-cloud-download/loading/index.html`)
    }

    if (os.type() == 'Darwin') {
      this.animationWin.loadURL(`file://lyfz-erp-cloud-download.app/Contents/loading/index.html`)
    }

    // animationWin.webContents.openDevTools();
    this.animationWin.setMenu(null)
  }

   /**
     * 检查文件是否存在 / 文件夹
     * @param path 路径
     * @return {Promise<unknown>}
     */
    isFileIfFolder(path) {
      return new Promise((resolve, reject) => {
          fs.access(path, fs.constants.F_OK, (err) => {
              resolve(err ? false : true)
          });
      })
  }

  /**
   * 每秒检查文件,杀死进程
   */
  setTimeKillChiled(){
    setInterval(() => {
      let killPath = `${this.locPath}/killChilder/killChilder.json`
      //判断文件是否存在
      this.isFileIfFolder(killPath).then(res=>{
        if(res){
          fs.unlinkSync(killPath)
          appTray.destroy()
          app.quit()
        }
      })
    }, 1000);
  }
}

new Background()