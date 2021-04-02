import winConfig from "@/winConfig";
import log from 'electron-log';
import {ipcMain} from 'electron';
import fs from 'fs';
export default class extends winConfig {
    constructor(pathStr) {
        super();

        this.pathStr = pathStr;
        // 创建文件夹
        this.createFolder(`${this.pathStr}/tasklist`)
        //导入原片
        ipcMain.on('ImportOriginalFilm', (e, data) => {
            console.log(data)
            this.writeJsonFile(data, 1)
        })
        //导出原片
        ipcMain.on('ExportOriginalFilm', (e, data) => {
            this.writeJsonFile(data, 2)
        })

        //导入初修片
        ipcMain.on('ImportEarlyRepairFilm', (e, data) => {
            this.writeJsonFile(data, 3)
        })

        //导出初修片
        ipcMain.on('ExportEarlyRepairFilm', (e, data) => {
            this.writeJsonFile(data, 4)
        })
        //导入选修片
        ipcMain.on('ImportSelectEarlyRepairFilm', (e, data) => {
            this.writeJsonFile(data, 5)
        })
        //导出选修片
        ipcMain.on('ExportSelectEarlyRepairFilm', (e, data) => {
            this.writeJsonFile(data, 6)
        })
        //导入精修片
        ipcMain.on('ImportRefineFilm', (e, data) => {
            this.writeJsonFile(data, 7)
        })
        //导出精修片
        ipcMain.on('ExportRefineFilm', (e, data) => {
            this.writeJsonFile(data, 8)
        })
        //导入设计片
        ipcMain.on('ImportDesignFilm', (e, data) => {
            this.writeJsonFile(data, 9)
        })
        //导出设计片
        ipcMain.on('ExportDesignFilm', (e, data) => {
            this.writeJsonFile(data, 10)
        })
        //导入微视频
        ipcMain.on('ImportMicroVideoFilm', (e, data) => {
            this.writeJsonFile(data, 11)
        })
        //导出微视频
        ipcMain.on('ExportMicroVideoFilm', (e, data) => {
            this.writeJsonFile(data, 12)
        })
        //导出已选片
        ipcMain.on('ExportSelectFilm', (e, data) => {
            this.writeJsonFile(data, 13)
        })

    }

    /**
     * 写入json数据
     * @param {data}  erp端传过来的json数据
     * @param {type} 类型 1导入原片 2导出原片 3导入初修片 4导出初修片 5导入选修片 6导出选修片 7导入精修片 8导出精修片 9导入设计片 10导出设计片 11导入微视频 12导出微视频 13导出已选片
     */
    writeJsonFile(data, type) {
        let obj = JSON.parse(data);
        const time = new Date().getTime();
        obj['jsonCreateTime'] = time * 1000;
        obj['downType'] = type;
        fs.writeFile(`${this.pathStr}/tasklist/${time}.josn`, JSON.stringify(obj), (err) => {
            if (err) {
                log.debug(err)
            }
        })
    }

}