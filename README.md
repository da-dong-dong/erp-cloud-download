# 下载器
一个使用vue作为前端页面，通过electron集成方式的下载器
![erp-cloud-download text](https://github.com/da-dong-dong/erp-cloud-download/blob/master/MD_imgs/1.png)
``` javascript 
// background.js

}
```
##### 安装方式
yarn install
##### 运行方式
yarn run electron:serve
##### 打包方式
yarn run electron:build
## 必备知识
node.js  vue.js  electron 
### 1，background.js 主程序
##### 1，注册本地协议
``` javascript 
// background.js
// 本地文件协议
protocol.interceptFileProtocol('file',(request, callback) => {
        const url = request.url.substr(6)
        log.debug(`本地文件协议:${this.pathStr}/${url}`)
        callback({ path: path.normalize(`${this.pathStr}/${url}`) })
        //本地文件协议:D:\lyfz\aaa\erp-cloud-download\dist_electro//lyfz-erp-cloud-download/loading/index.html
        // callback(fs.createReadStream(path.normalize(`${__dirname}/${url}`)))
    },
    error => {
        console.log(error)
    },
)
}
```

##### 2，注册全局快捷键
``` javascript 
// background.js
// 注册打开调试快捷键
globalShortcut.register('ctrl+d+b+n', () => {
    this.win.webContents.openDevTools();
})
```

##### 3，是否启动多个线程
``` javascript 
// background.js
//判断关闭多个线程
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
    app.quit()
}else{
    // 你的程序
}
```

##### 4，托盘
``` javascript 
// background.js
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
```

##### 5，创建窗口
``` javascript 
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
```

#### 6，热更新
``` javascript 
import AppUpdate from './update.js';
// 调用自动更新
const feedUrl = "服务器地址";
const appupdate = new AppUpdate(this.win, feedUrl);
```

#### 7，fileRow 
1，文件查询
2，文件写入
3，托盘事件
4，监听回调事件

#### 8，并发下载
1，bagpipe模块
2，http模块请求数据
3，节流传递给渲染进程

### 目录结构
home.js 
项目时间不够充分，前端没有优化，没有进行模块化组件拆分，功能都可以正常使用
