// 公共函数方法
import fs from "fs";
import os from 'os';
import request from 'request'
import log from 'electron-log';
export default class WinConfig {
    constructor() {

    }
     /**
     * 封装HTTP请求
     * @param {url} 接口地址  
     * @param {method} 请求方式
     * @param {headers} 设置请求头（完整）
     */
   async httpRequest(url,method,qs){
        //let requestUrl = this.baseUrl + url;
        if(method == "get"){
            return new Promise((resolve,reject)=>{
                request({
                    url:url,
                    method:"GET",
                    qs
                },(err,res,body)=>{
                    if(err) return reject(err)
                    let data = JSON.parse(body)
                    resolve(data)
                })
            })
        }else if(method == 'head'){
            return new Promise((resolve,reject)=>{
                let timer = setTimeout(function(){
                    //timeout = true;
                    console.log('失败');
                    resolve('失败')
                    return false
                },1000);
                request({
                    url:url,
                    method:"HEAD",
                    headers
                },(err,res,body)=>{
                    clearTimeout(timer);//取消等待的超时
                    if(err) return reject(err)
                    resolve('成功')
                })
            })
        }
    }
    /**
     * 节流
     */
    throttle (func, delay = 500) {
        let isFlag = false
        return function(...args) {
          if (isFlag) return
          func.apply(this, args)
          isFlag = true
          setTimeout(() => {
            isFlag = false
          }, delay)
        } 
      }
   
    /**
     * 获取本地ip地址
     */
    getIPAdress() {
        let interfaces = os.networkInterfaces();
        for (let devName in interfaces) {
            let iface = interfaces[devName];
            for (let i = 0; i < iface.length; i++) {
                let alias = iface[i];
                if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
                    return alias.address;
                }
            }
        }
    }


    // 删除本地素材文件夹
    deleteall(path) {
        let files = [];
        if (fs.existsSync(path)) {
            files = fs.readdirSync(path);
            files.forEach(function (file) {
                let curPath = path + "/" + file;
                if (fs.statSync(curPath).isDirectory()) { // recurse
                    this.deleteall(curPath);
                } else { // delete file
                    try {
                        fs.unlinkSync(curPath);
                    } catch (e) {
                        console.log(e);
                    }
                }
            });
            try {
                fs.rmdirSync(path);
            } catch (e) {
                console.log(e);
            }

        }
    }

    /**
     * 判断文件夹是否为空
     * @param pathStr 路径
     */
    isFile(pathStr) {
        let files = fs.readdirSync(pathStr);
        return files.length >= 1;
    }

    /**
     * 获取指定文件夹的全部文件
     * @param pathStr 路径
     */
    getFiles(pathStr) {
        return new Promise((resolve, reject) => {
            this.isFileIfFolder(pathStr).then((bool) => {
                if (bool) {
                    fs.readdir(pathStr, (err, files) => {
                        resolve(files)
                    });
                } else {
                    resolve([])
                }
            })

        })
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
     * 创建文件夹，如果文件夹存在就跳过，不存在就创建
     * @param {string} path 路径
     */
    async createFolder(path) {
        return new Promise((resolve, reject) => {
            this.isFileIfFolder(`${path}`).then((bool) => {
                if (!bool) {
                    // 创建文件夹
                    fs.mkdir(`${path}`, {recursive: true, mode: '0777'}, (err) => {
                        if (!err) {
                            resolve(`${path}`);
                        } else {
                            log.error(`创建文件夹失败${JSON.stringify(err)}`)
                        }
                    });
                } else {
                    resolve(`${path}`);
                }
            });
        })
    }

    // 截取文件名
    splitFileName(text) {
        let str = text;
        let re = /(\/.*?(jpg|gif|png|bmp|mp4|jpeg|JPG|GIF|PNG|BMP|MP4|JPEG|tif|TIF|pcx|PCX|tga|THA|exif|EXIF|fpx|FPX|svg|SVG|psd|PSD|cdr|CDR|pcd|PCD|dxf|DXF|ufo|UFO|eps|EPS|ai|AI|raw|RAW|wmf|WMF|nef|rw2|dng|raw|cr2|arw|sr2|orf|pef|raf|x3f|NEF|RW2|DNG|RAW|CR2|ARW|SR2|ORF|PEF|RAF|X3F))/;
        let fileName = '';
        let name = '';
        let m = str.match(re)
        if (m[0]) {
            let str1 = m[0];
            fileName = m[0].substring(str1.lastIndexOf('/') + 1);
        }
        name = str.substring(str.indexOf(fileName));
        return name;
    }

    // 截取文件后缀
    getSuffix(str) {
        let s = '';
        try {
            s = /\.[^\.]+$/.exec(str)[0];
        } catch (e) {
            console.log(e);
        }
        return s;
    }
    /**
     * 数据值是否为空
     */
  isEmpty (d) {
    let bool = false;
    if (d === '') {
      bool = true;
      return bool;
    }
    if (d === null) {
      bool = true;
      return bool;
    }
    if (d === 'null') {
      bool = true;
      return bool;
    }
    if (d === undefined) {
      bool = true;
      return bool;
    }
    if (d === 'undefined') {
      bool = true;
      return bool;
    }
    if (d.length <= 0) {
      bool = true;
      return bool;
    }
    // if (this.verification(d, 'Object')) {
    //   if (Object.keys(d).length <= 0) {
    //     bool = true;
    //     return bool;
    //   }
    // }
    return bool;
  }
}