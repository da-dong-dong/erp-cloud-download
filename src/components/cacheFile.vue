<template>
    <div class="cacheBox">
        <span @click="onClickCacheFile" style="color:#409eff">缓存管理</span>
        <!-- 弹出框 -->
        <el-dialog title="缓存图片信息" :visible.sync="dialogVisible" width="650px" :before-close="handleClose">
            <div class="delDay">
                <el-input type="number" style="width:90px;margin-right:10px" v-model="delDay" placeholder="请输入内容"></el-input>天后删除
            </div>
            <div>
                <!-- 表格 -->
                <el-table :data="tableData" style="width: 100%" height="250">
                    <el-table-column prop="fileTime" label="日期" width="190"> 
                        <template slot-scope="scope">
                            <i class="el-icon-time"></i>
                            <span style="margin-left: 10px">{{ scope.row.fileTime | getLocalTime }}</span>
                        </template>
                    </el-table-column>
                    <el-table-column prop="title" label="id" width="150"> </el-table-column>
                    <el-table-column prop="cachPath" label="缓存路径" width="180"> </el-table-column>
                    <el-table-column label="操作">
                    <template slot-scope="scope">
                        <el-popconfirm confirm-button-text='确定' @confirm="handleDelete(scope.$index, scope.row)" cancel-button-text='不用了' icon="el-icon-info" icon-color="red"  title="确定删除吗？" >
                            <el-button size="mini" type="danger" slot="reference">删除</el-button>
                        </el-popconfirm>
                    </template>
                    </el-table-column>
                </el-table>
                <!-- 修改缓存路径 -->
                <div class="filesPath">
                    <p>当前缓存路径：{{cacheFilePath}}</p>
                    <el-button size="mini" type="danger" slot="reference" @click="onClickChangeFilePath">修改</el-button>
                </div>
            </div>
            <span slot="footer" class="dialog-footer">
                <el-button @click="dialogVisible = false">取 消</el-button>
                <el-button type="primary" @click="onDelTile">确 定</el-button>
            </span>
        </el-dialog>
    </div>
</template>

<script>
const fs = window.require('fs')
const path = window.require('path')
    export default {
        props:['filePathLocal'],
          filters:{
            getLocalTime(data){
                return new Date(parseInt(data)).toLocaleString().replace(/:\d{1,2}$/,' ');
            },
        },
        data(){
            return{
                dialogVisible:false,
                cacheFilePath:'',
                tableData: [],
                delDay:3
            }
        },
        mounted(){
            //this.timeDelFileDir()
        },
        methods:{
            // 获取值 ， 默认缓存路径 , 天数
            getFile(){
                // 盘符路径
                let cachPath = this.filePathLocal.replace('/tasklist','') + "/cacheFile"
                // 默认缓存文件
                let cachFile = `${cachPath}/cacheFile.json`
                // 读取文件内容
                let fileArr = JSON.parse(fs.readFileSync(cachFile, 'utf-8'));
                // 读取缓存文件内容
                let cacheFilePath = fs.readFileSync(`${cachPath}/cacheFilePath.json`, 'utf-8');
                this.tableData = fileArr
                console.log(fileArr)
                this.cacheFilePath = cacheFilePath
            },
            // 设置缓存路径
            onClickCacheFile(){
                // 盘符路径
                let cachPath = this.filePathLocal.replace('/tasklist','') + "/cacheFile"
                // 默认缓存文件
                let cachFile = `${cachPath}/cacheFile.json`
                // 默认缓存文件路径
                let cachFilePath = `${cachPath}/cacheFilePath.json`
                // 判断是否有文件
                this.isFileIfFolder(cachFile).then(res=>{
                    if(res){
                        this.getFile()
                    }else{
                        // 读取缓存文件路径
                        this.isFileIfFolder(cachFilePath).then(_=>{
                            let cacheFilePath = ''
                            if(_){
                                cacheFilePath = fs.readFileSync(cachFilePath, 'utf-8');
                            }else{
                                cacheFilePath = cachPath
                                // 写入文件内容
                                fs.writeFileSync(cachFilePath, JSON.stringify(cacheFilePath));
                            }
                            this.cacheFilePath = cacheFilePath
                        })
                        
                    }
                })
                
                this.dialogVisible = true
            },

            // 关闭弹窗
            handleClose(done) {
                done();
            },

            // 点击确定
            onDelTile(){
                
                let cachPath = this.filePathLocal.replace('/tasklist','') + "/cacheFile"
                // 默认缓存文件
                let delTileDayPath = `${cachPath}/delFileTime.json`
                // 写入文件内容
                fs.writeFile(delTileDayPath, JSON.stringify(this.delDay), (err) => {
                    if (err) {
                        console.log(err)
                    }
                    this.dialogVisible = false
                })
               
            },

            // 删除文件
            handleDelete(index, row) {
                let {title, cachPath:cachFilePath, fileTime} = row
                console.log(index, title);
                let tableData = this.tableData.filter(item=>item.title !== title)
                // 盘符路径
                let cachPath = this.filePathLocal.replace('/tasklist','') + "/cacheFile"
                // 默认缓存文件
                let cachFile = `${cachPath}/cacheFile.json`
                // 删除文件
                if(fileTime){
                    this.removeDir(`${cachFilePath}/${title}`)
                }
                // 写入文件内容
                fs.writeFile(cachFile, JSON.stringify(tableData), (err) => {
                    if (err) {
                        console.log(err)
                    }
                    this.tableData = tableData
                })
                
            },

            // 修改缓存路径
            onClickChangeFilePath(){
                // 盘符路径
                let cachPath = this.filePathLocal.replace('/tasklist','') + "/cacheFile"
                this.$ipcRenderer.send('onChangeFilePath',cachPath);
                this.$ipcRenderer.on('onChangeFilePathSuccess', (event, res) => {
                    this.$ipcRenderer.removeAllListeners(['onChangeFilePathSuccess'])
                    this.cacheFilePath = res
                })
            },

            // 同步删除文件夹
            removeDir(dir) {
                let files = fs.readdirSync(dir)
                for(var i=0;i<files.length;i++){
                    let newPath = path.join(dir,files[i]);
                    let stat = fs.statSync(newPath)
                    if(stat.isDirectory()){
                    //如果是文件夹就递归下去
                    this.removeDir(newPath);
                    }else {
                    //删除文件
                    fs.unlinkSync(newPath);
                    }
                }
                fs.rmdirSync(dir)//如果文件夹是空的，就将自己删除掉
            },

            // 定时删除
            timeDelFileDir(){
                // 盘符路径
                let cachPath = this.filePathLocal.replace('/tasklist','') + "/cacheFile"
                // 默认缓存文件
                let cachFile = `${cachPath}/cacheFile.json`
                let delTileDayPath = `${cachPath}/delFileTime.json`
                // 读取文件内容
                let fileArr = JSON.parse(fs.readFileSync(cachFile, 'utf-8'));
                // 查找是否有定时删除文件
                this.isFileIfFolder(delTileDayPath).then(res=>{
                    let delTileDay = this.delDay
                    let arr = []
                    if(res){
                        // 存在
                        // 读取文件内容
                        delTileDay = JSON.parse(fs.readFileSync(delTileDayPath, 'utf-8'));
                        this.delDay = delTileDay
                    }
                    for(let i=0;i<fileArr.length;i++){
                        //  一天的时间戳 86400000
                        let newTile = new Date().getTime()
                        // 当前时间 - 文件创建时间  >= 自定天数
                        if(newTile - fileArr[i].fileTime >= delTileDay * 86400000 && fileArr[i].fileTime){
                            // 删除文件
                            this.removeDir(`${fileArr[i].cachPath}/${fileArr[i].title}`)
                            arr.push(fileArr[i])
                        }
                        // 判断无图片删除
                        if(!fileArr[i].fileTime){
                            arr.push(fileArr[i])
                        }
                    }
                    let set=arr.map(item=>item.title)  
                    console.log(set) 
                    let tableData = fileArr.filter(item=>!set.includes(item.title)) 
                    // 写入文件内容
                    fs.writeFileSync(cachFile, JSON.stringify(tableData));
                    
                })
                
            },
            /**
             * 检查文件是否存在 / 文件夹
             * @param path 路径
             * @return {Promise<unknown>}
             */
            isFileIfFolder(path) {
                return new Promise((resolve) => {
                    fs.access(path, fs.constants.F_OK, (err) => {
                        resolve(err ? false : true)
                    });
                })
            }
                        
        },
        watch:{
            filePathLocal(){
                this.getFile()
                this.timeDelFileDir()
            }
        }
    }
</script>

<style lang="less" scoped>
.cacheBox{
    display: inline-block;
    margin-left: 10px;
    span{
        cursor: pointer;
    }
    .filesPath{
        margin-top: 20px;
        p{
            margin-bottom: 10px;
        }
    }
    .delDay{
        color: red;
    }
}
</style>