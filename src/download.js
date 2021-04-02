/**
 * 并发下载 
 */
import winConfig from './winConfig.js';
import log from 'electron-log';
import path from 'path';
import http from 'http';
import fs from 'fs';
import { ipcMain } from 'electron';
let isStop = null;
export default class Download extends winConfig {
	constructor(win, urls,pathStr,fileTitle,OrderNumber,paths,fileNamsNO) {
	  super();
		this.urls = urls;
		this.loadNum = 2;
		this.win = win;
		this.pathStr = pathStr;
		this.fileObj = {};
		this.downFileNum = 10;
		this.fileTitle = fileTitle
		this.OrderNumber = OrderNumber
		this.paths = paths
		this.fileNamsNO = fileNamsNO
	}
	
	/**
	 * 暂停下载
	 * @param {type} true 暂停  false启动
	 */
	Stop(type){
		if(type){
			isStop = true
		}else{
			isStop = false
		}
	}
	
	/**
	 * 启动下载
	 * 并发5次下载
	 */
	async start(num) {
		this.downFileNum = num;
		const dir = await this.createFolder(this.pathStr);
		let s = 0;
		for (let i = 0; i < this.urls.length; i++) {
            let name = this.splitFileName(this.urls[i]);
             //获取文件名
            let arrName = name.split('\\')
			let arrNameOk = arrName[arrName.length-1].split("&")[0]
			let arrName1 = arrName.slice(3)
			arrName1.pop()
			this.downloadImage(this.urls[i], arrNameOk, dir, i, this.win, this.fileObj,this.fileTitle,arrName,arrName1, (index, win, fileObj, name,OrderNumber) => {
				delete fileObj[name];
				s++;
				if (s >= this.urls.length) {
					// 下载完成
					//console.log('下载完成5588')
					win.webContents.send('down-success',name,OrderNumber);
				}
			})
		}
		
		
	}	
	async downloadImage(src, name, pathStr, index, win, fileObj,fileTitle,arrName,arrName1, callback) {
		let nameTitle = null
		let nameNew = null
		let out = null
		if(this.paths){
			if(this.fileNamsNO){
				if(arrName[3]){
					nameTitle = `${pathStr}/${fileTitle}/${arrName[3]}`
				}else{
					nameTitle = `${pathStr}/${fileTitle}/样片图片`
				}
				let arr = this.paths.split('\\')
				let arrs
				if(arr[1]){
					arrs = `${arr[0]}[${arr[1]}：${arr[2]}]`
				}else{
					arrs = `${arr[0]}`
				}
				
				nameNew = `${this.fileNamsNO}${arrs})${name}`
			}else{
				let arr = this.paths.split('\\')
				let arrs
				if(arr[1]){
					arrs = `${arr[0]}/${arr[1]}`
				}else{
					arrs = `${arr[0]}`
				}
				nameTitle = `${pathStr}/${fileTitle}/${arrName[3]}/${arrs}`
			}
			
		}else{
			
			nameTitle = `${pathStr}/${fileTitle}/${arrName1.join('/')}`
		}
		
		//创建文件夹
		await this.createFolder(nameTitle)
		if(this.fileNamsNO){
			out = fs.createWriteStream(path.join(nameTitle, nameNew));
		}else{
			out = fs.createWriteStream(path.join(nameTitle, name));
		}
        
        
		//win.webContents.send('msg', `${name}开始下载`);



		const req = http.get(src, (res) => {
			const len = parseInt(res.headers['content-length']) // 文件总长度
			
			fileObj[name] = {
				totalBytes: len,
				transferredBytes: 0
			}
			
			win.webContents.send('down-count');
			res.pipe(out);
			
			let cur = 0;
			res.on('data', (chunk) => {
				cur += chunk.length;
				// const progress = (100.0 * cur / len).toFixed(2) // 当前进度
				try {
					if (fileObj[name]) {
						fileObj[name].transferredBytes = cur;
					}
				} catch (e) {
					// win.webContents.send('down-msg-err', `${src},文件错误，${JSON.stringify(e)}`);
					log.debug(`${src},文件错误，${e}`);
				}
				win.webContents.send('down-msg', fileObj);
				
			});
			
			res.on('end', () => {
                if(isStop){
                    console.log('暂停个数'+index)
                }else{
                    callback(index, win, fileObj, name,this.OrderNumber)
                }
                
				
			}).on('error', (e) => {
				win.webContents.send('down-msg-err', `${src},文件错误，${JSON.stringify(e)}`);
				log.debug(`${src},文件错误，${e}`);
				callback(index, win, fileObj, name)
			});

		})

		req.on('error', (err) => {
			win.webContents.send('down-msg-err', `${src},文件错误，${JSON.stringify(err)}`);
			log.debug(`${err}`);
		})
	}
	/**
	 * 消息
	 */
	msg(msg) {
		console.log(msg)
	}
	
	/**
	 * 下载结束
	 */
	end() {
		
	}
	
	 // 组合缩略图本地文件名称
	 getLocaFileName(name) {
			let str = '';
			const str1 = `?x-oss-process=image/resize,w_80,h_80,limit_0`;
			const str2 = `?x-oss-process=image/resize,w_440,h_280,limit_0`;
			const str3 = `?x-oss-process=image/resize,w_2560,h_1440,limit_0`;
			const str5 = `?x-oss-process=image/format,webp`;
			if (name.indexOf(str1) >= 0) {
				
				// 缩略图
				let str4 = name.substring(0, name.indexOf(str1));
				let suffix = this.getSuffix(str4);
				str = `${str4.substring(0, str4.indexOf(suffix))}_x80${suffix}`;
			} else if (name.indexOf(str2) >= 0) {
				
				// 封面图
				let str4 = name.substring(0, name.indexOf(str2));
				let suffix = this.getSuffix(str4);
				str = `${str4.substring(0, str4.indexOf(suffix))}_x440${suffix}`;
			} else if (name.indexOf(str3) >= 0) {
				
				// 背景图
				let str4 = name.substring(0, name.indexOf(str3));
				let suffix = this.getSuffix(str4);
				str = `${str4.substring(0, str4.indexOf(suffix))}_x2560${suffix}`;
			} else if (name.indexOf(str5) >= 0) {
				
				// 其他图片全部转 webp格式
				let str4 = name.substring(0, name.indexOf(str5));
				let suffix = this.getSuffix(str4);
				str = `${str4.substring(0, str4.indexOf(suffix))}_xwebp.webp`;
			} else {
				str = name;
			}

			return str;
	 }
}