//文件读取
import { app } from 'electron'
import winConfig from "@/winConfig";
import {ipcMain, shell, dialog} from 'electron';
import path from 'path'//解析需要遍历的文件夹
import fs from 'fs';
import download from './download';
import {exec}  from 'child_process'
import os from 'os';

//全局参数
let  downImg = null;
export default class extends winConfig {
    constructor(pathStr,win,locPath){
        super();
        this.pathStr = pathStr
        this.win = win
        this.urlHttp = this.isDev();
        this.pasthOk = locPath
        
        this.filePath  = `${this.pasthOk}/tasklist`
       
        // this.fielWatch(this.filePath)

        //默认自动下载
        this.createFolder(`${this.filePath}Auto`).then(res=>{
            fs.writeFile(`${res}/autoDownLoad.json`, JSON.stringify('true'), (err) => {
                if (err) {
                    console.log(err)
                }
            })
        })

        //勾选记录写入文件
        ipcMain.on('autoDownLoad', (event, arg) => {
            this.createFolder(`${this.filePath}Auto`).then(res=>{
                fs.writeFile(`${res}/autoDownLoad.json`, JSON.stringify(arg), (err) => {
                    if (err) {
                        console.log(err)
                    }
                    event.sender.send('autoDownLoadSuccess', 'ok')
                })
            })
            
        })

        //勾选记录删除文件
        ipcMain.on('autoDownLoadDel', (event, arg) => {
            this.isFileIfFolder(`${this.filePath}Auto/autoDownLoad.json`).then(res=>{
                console.log(res);
                if(res){
                    fs.unlinkSync(`${this.filePath}Auto/autoDownLoad.json`)
                    event.sender.send('autoDownLoadDelSuccess', arg)
                }
            })
        })

        //寻找是否有自动下载文件 seekAutoDownLoad
        ipcMain.on('seekAutoDownLoad', (event, arg) => {
            this.getFiles(`${this.filePath}Auto`).then(res=>{
                //console.log(res);
                event.sender.send('seekAutoDownLoadSuccess', res)
            })
        })
        
        //开始查询文件
        ipcMain.on('synchronou', (event, arg) => {
            let _this = this
            this.fileDisplay(this.filePath).then(res=>{
                event.sender.send('absr', res,_this.filePath,_this.urlHttp)
            })
        })
       
        //删除文件
        ipcMain.on('delFie', (event, arg) => {
            console.log('渲染',arg);
            console.log(`${this.filePath}\\tasklist\\${arg}`)
            this.isFileIfFolder(`${this.filePath}/${arg}`).then(res=>{
                console.log(res);
                if(res){
                    fs.unlinkSync(`${this.filePath}/${arg}`)
                    event.sender.send('delFileSuccess', arg)
                }
            })
           
             
        })

        // f12
        ipcMain.on('F12', () => {
            this.win.webContents.openDevTools();
        })

         // 打开目录文件
        ipcMain.on('successFile', () => {
            shell.showItemInFolder(this.filePath)
        })

        // 弹窗文件夹选择
        ipcMain.on('onChangeFilePath', (event,filePath) => {
            dialog.showOpenDialog({
                properties: ['openFile','openDirectory'] // 可以选择文件且可以多选
                },(files)=> {
                
                if (files){// 如果有选中
                    let filePathName = `${files[0]}\\cacheFile`;
                    fs.writeFile(`${filePath}/cacheFilePath.json`, JSON.stringify(filePathName), (err) => {
                        if (err) {
                            console.log(err)
                        }
                        event.sender.send('onChangeFilePathSuccess', filePathName)
                    })
                }
            
            })
       })

        //窗口设置
        ipcMain.on('topSet', (event, arg) => {
           switch (arg) {
               case '最小化':
                   this.win.minimize()
                   break;
               case '最大化':
                if (this.win.isMaximized()) {
                    this.win.restore();
                } else {
                    this.win.maximize();
                }
                   break;
               case '退出':
                    if (os.type() == 'Darwin') {
                        this.win.minimize()
                    }else{
                        this.win.close()
                    }
                    //app.quit()
                   break;
               default:
                   break;
           }
        })

        //关机
        ipcMain.on('checkOutWindow', (event, arg) => {
            console.log(arg)
            exec('shutdown /s /t 0')
            event.sender.send('checkOutWindowSuccess', '成功关机')
        })

        //顶层窗口
        ipcMain.on('checkTop', (event, arg) => {
            this.win.setAlwaysOnTop(arg)
            event.sender.send('checkTopSuccess', '成功')
        })

        //请求接口写入文件
       ipcMain.on('getHttpImg', (event, arg) => {
          
            let {filePathName,fileTitle,fileID,arrImg,paths,fileNamsNO} = arg;
            downImg = new download(this.win,arrImg,filePathName,fileTitle,fileID,paths,fileNamsNO)
            downImg.start(1)
            //let arrs =["http://10.30.1.8:9200/fserver/IDownloadFile?keypath=5621002859025268634:\%E5%8E%9F%E7%89%87\201105015\201105015-01\%E6%AD%A3%E5%B8%B8(172)\%E5%BE%AE%E4%BF%A1%E6%88%AA%E5%9B%BE_20201103170651.png&photoType=1"]
            
            downImg.Stop(false)
            
            event.sender.send('httpImgSuccess', '获取成功')
             
        })
        
        //暂停下载
        ipcMain.on('setStop', (event, arg) => {
           if(!downImg) return 
            downImg.Stop(true)
            event.sender.send('setStopSuccess', '已暂停')
             
        })
       
       //渲染进程更新
       ipcMain.on('xuanran', (event, arg) => {
        console.log(arg)  // prints "ping"
        //this.fileDisplay(this.filePath);
        event.sender.send('updatas', '1')
    })
       
    }
    //读取所有文件返回数组
     fileDisplay(filePath){ 
       
       return  new Promise((resolve,reject)=>{
            let fileArray = []
            //根据文件路径读取文件，返回文件列表
            fs.readdir(filePath,function(err,files){
                if(err){
                    console.warn(err);
                    reject('失败')
                }else{
                    //遍历读取到的文件列表
                    if(files.length == 0){
                        resolve(fileArray)
                    }
                    files.forEach(function(filename){
                        //console.log(filename)
                        //获取当前文件的绝对路径
                        let filedir = path.join(filePath, filename);
                        //根据文件路径获取文件信息，返回一个fs.Stats对象
                        fs.stat(filedir,function(eror, stats){
                            if(eror){
                                console.warn('获取文件stats失败');
                                reject('获取文件失败')
                            }else{
                                let isFile = stats.isFile();//是文件
                                let isDir = stats.isDirectory();//是文件夹
                                if(isFile){
                                    //console.log(filedir);
                                        // 读取文件内容
                                    let content = fs.readFileSync(filedir, 'utf-8');
                                    fileArray.push(JSON.parse(content));
                                    if(files.length == fileArray.length){
                                        resolve(fileArray)
                                    }
                                   
                                }
                                if(isDir){
                                    this.fileDisplay(filedir);//递归，如果是文件夹，就继续遍历该文件夹下面的文件
                                }
                            }
                        })
                    });
                
                }
            });
         })
        
        
        

    }
    //判断是否开发环境
    isDev(){
        let urlHttps = null;
        if(process.env.NODE_ENV == 'production'){
            urlHttps = 'http://napi.lyfz.net/pro/api/'
        }else{
            urlHttps = 'http://192.168.5.220/dev/api/'
        }
        
        return urlHttps
    }
    
    //寻找本地路径
    isPathOk(){
        let pasthOk = ''
        if (os.type() == 'Windows_NT') {
            pasthOk = `${this.pathStr}/lyfz-erp/`;
        }
        if (os.type() == 'Darwin') {
            pasthOk = `${this.pathStr}/lyfz-erp.app/Contents`;
        }

        return pasthOk
    }
}