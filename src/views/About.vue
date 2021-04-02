<template>
  <div class="file_box">
    <div class="file_setting">
      <el-button type="primary">按钮</el-button>
      <el-button type="primary" @click="onClickFiles">获取文件地址</el-button>
      <el-button type="primary" @click="onClickHttp">获取服务器地址</el-button>
    </div>
     <div class="file_table" v-if="tableData!=null">
        <el-table
          ref="multipleTable"
          :data="tableData"
          style="width: 100%"
         >
          <el-table-column
            type="selection"
            width="55">
          </el-table-column>
          <el-table-column
            label="订单号"
            width="120">
            <template slot-scope="scope">{{ scope.row.OrderNumber }}</template>
          </el-table-column>
          <el-table-column
           
            label="任务名称"
            width="120">
            <template slot-scope="scope">{{types[scope.row.downType-1]}} {{ scope.row.ShootingName }}</template>
          </el-table-column>
          <el-table-column
            label="任务状态"
            >
            <template >未开始</template>
          </el-table-column>
           <el-table-column
            label="进度报告"
            >
            <template slot-scope="scope">{{ scope.row.fileImg.length}}</template>
          </el-table-column>
          <el-table-column
            label="创建时间" 
            >
            <template slot-scope="scope">{{ scope.row.jsonCreateTime | getLocalTime}}</template>
          </el-table-column>
          <el-table-column
            label="目标服务器"
            >
            <template >江北店相片存储服务器</template>
          </el-table-column>
        </el-table>
        {{tableData[0] }}
     </div>
  </div>
</template>

<script>
// @ is an alias to /src
const fs = window.require('fs')
const path = window.require('path')
const LENGTH = 10; // 切片数量

export default {
  filters:{
    getLocalTime(data){
      return new Date(parseInt(data)/1000).toLocaleString().replace(/:\d{1,2}$/,' ');
    }
  },
  name: 'Home',
  created(){
   this.clearTimeData();
   
  },
  data(){
    return{
      tableData:null,
      types:['上传原片','下载原图','上传初修片','下载初修片','上传选修片','下载选修片','上传精修片','下载精修片','上传设计片','下载设计片','上传微视频','下载微视频','下载已选片'],
      UrlPath:null,//数据
      //计数器
      tiems:null,
      //监听计数器
      num:1,
      //文件类型
      ext2type:{
        "jpg":"image/jpeg",
        "gif":"image/gif",
        "bmp":"image/bmp",
        "png":"image/png",
        "webp":"image/webp",
        "svg":"image/svg"
      },
      //存储切片
      data: [],
      //http服务器
      httpPath:''
    }
  },
   methods: {

      //封装http请求
      request({ url, method = "post", data, headers = {} }) {
        return new Promise(resolve => {
          const xhr = new XMLHttpRequest();
          xhr.open(method, url);
          Object.keys(headers).forEach(key =>
            xhr.setRequestHeader(key, headers[key])
          );
          xhr.send(data);
          xhr.onload = e => {
            resolve({
              data: e.target.response
            });
          };
        });
      },
       //设置请求超时
      timeedGetText(url,timeout,callback){
        var request = new XMLHttpRequest();
        //var time = false;//是否超时
        var timer = setTimeout(function(){
            timeout = true;
            request.abort();//请求中止
            callback('失败');
        },timeout);
        request.open("GET",url);
        request.onreadystatechange = function(){
            if(request.readyState !==4)return true
            //忽略未完成的请求
            if(timeout) return;//忽略中止请求
            clearTimeout(timer);//取消等待的超时
            if(request.status === 200)
                callback(request.responseText);
        }
        request.send('aa');
      },
      requestGet({ url, method = "get", headers = {} }) {
        return new Promise(resolve => {
          const xhr = new XMLHttpRequest();
          xhr.open(method, url);
          Object.keys(headers).forEach(key =>
            xhr.setRequestHeader(key, headers[key])
          );
          xhr.send();
          xhr.onload = e => {
            resolve({
              data: e.target.response
            });
          };
        });
      },
      //获取http
      async onClickHttp(){
        let {ccId,ticket,PhotoServerStoreID} = this.tableData[0]
        console.log(ccId)
        let url = 'http://192.168.5.220/dev/api/base/picture/config/list'
        let headers ={
          "Accept-Language":"zh-CN,zh;q=0.9",
          "ccId":ccId,
          "ticket":ticket
        }
       await this.requestGet({url,headers}).then(res=>{
          let jsonData = JSON.parse(res.data);
          let data = jsonData.data.map(item=>{
            if(item.shopNo == PhotoServerStoreID){
              return item
            }
          })
          this.httpPath = data[0].intranetAddress
          this.tableData[0].serverKey = data[0].serverKey
        })
        console.log('111', this.httpPath)
        this.putImg(this.httpPath)
      },
      //上传图片请求
      putImg(httpPath){
        let {OrderNumber,SubOrderNumber,ShootingName,ShootingID,ImportType,ImportPeople,ImportPeopleName,CustomerName,CustomerMobile,ImportStoreID,serverKey} = this.tableData[0];
        let url = httpPath+'/fserver/UploadFileRequest'
        let newData = new Date().getTime()
        let nonce = Math.floor(Math.random(1)*10000)
        let sha1s = this.$sha1(`lyfz.net${newData}${nonce}`)
         const formData = new FormData();
            formData.append("OrderNumber", OrderNumber);
            formData.append("SubOrderNumber", SubOrderNumber);
            formData.append("ShootingName", ShootingName);
            formData.append("ShootingID", ShootingID);
            formData.append("ImportType", ImportType);
            formData.append("ImportPeople", ImportPeople);
            formData.append("ImportPeopleName", ImportPeopleName);
            formData.append("CustomerName", CustomerName);
            formData.append("ImportStoreID", ImportStoreID);
            formData.append("CustomerMobile", CustomerMobile);
            formData.append("importStatus", 0);
            
          this.request({url,
          data:formData,
          headers:{

            "signature":sha1s,     
            "timestamp":newData,
            "nonce":nonce,
            "app_key":serverKey
          }
          }).then(res=>{
            console.log(res)
          })
      },
      //生成文件切片
      createFileChunk(file, length = LENGTH) {
        const fileChunkList = [];
        const chunkSize = Math.ceil(file.size / length);
        let cur = 0;
        while (cur < file.size) {
          fileChunkList.push({ file: file.slice(cur, cur + chunkSize) });
          cur += chunkSize;
      }
        return fileChunkList;
      },

      // 上传切片
      async uploadChunks(files) {
        const requestList = this.data
          .map(({ chunk,hash }) => {
            const formData = new FormData();
            formData.append("chunk", chunk);
            formData.append("hash", hash);
            formData.append("filename", files.name);
            return { formData };
          })
        .map(async ({ formData }) =>
            this.request({
              url: "http://localhost:3000",
              data: formData
            })
          );
        await Promise.all(requestList); // 并发切片
      },

      //文件触发
      async handleUpload(files){
        if (!files) return;
          const fileChunkList = this.createFileChunk(files);
          this.data = fileChunkList.map(({ file },index) => ({
            chunk: file,
            hash: files.name + "-" + index // 文件名 + 数组下标
          }));
          await this.uploadChunks(files);
          // 合并切片
          await this.mergeRequest(files);
      },
      //f请求合并服务器
      async mergeRequest(files) {
        await this.request({
          url: "http://localhost:3000/merge",
          headers: {
            "content-type": "application/json"
          },
          data: JSON.stringify({
            filename: files.name
          })
        });
      },
      onClickCS(){
        this.$ipcRenderer.send('synchronou', '来啦老弟66');
        this.$ipcRenderer.on('absr', (event, arg,paths) => {
          this.fielWatch(paths)
          this.tableData = arg;
        })
      },
      //获取fs文件路径生成file文件
      onClickFiles(){
        let filePath = this.tableData[0].fileImg[0]
        let extname = path.extname(filePath).substr(1);
        let basename = path.basename(filePath);
        let buffer = fs.readFileSync(filePath);

        let file = new File(buffer,basename,{type:this.ext2type[extname]});
        console.log(file);

        //点击上传
        //this.handleUpload(file)
        
      },
      
      //buff转文件fiel
      buffAndFile(){

      },
      clearTimeData(){
        this.onClickCS();
        
      },
      //监听文件变化，通知线程更新数据
      fielWatch(filePath){
        
        fs.watch(filePath, (e,file)=>{
            if (file) {
                if(this.num == 1){
                  console.log('111');
                  //找寻文件
                  this.fileDisplay(filePath)
                  // //通知线程更新
                  // this.$ipcRenderer.send('xuanran', '渲染进程通知');
                  // this.$ipcRenderer.on('updatas', (event, arg) => {
                  //   console.log(arg)
                  //   this.num = arg
                  //   //重新更新
                  //   this.clearTimeData()
                  // })
                }
                this.num++; 
              }
        });
      },
       fileDisplay(filePath){
        
        let fileArray = []
        let _this = this
        //根据文件路径读取文件，返回文件列表
        fs.readdir(filePath,function(err,files){
            if(err){
                console.warn(err)
            }else{
                //遍历读取到的文件列表
                console.log(files.length)
                let fileLength = files.length
                files.forEach(function(filename){
                    console.log(filename)
                    //获取当前文件的绝对路径
                    let filedir = path.join(filePath, filename);
                    //根据文件路径获取文件信息，返回一个fs.Stats对象
                    fs.stat(filedir,function(eror, stats){
                        if(eror){
                            console.warn('获取文件stats失败');
                        }else{
                            let isFile = stats.isFile();//是文件
                            let isDir = stats.isDirectory();//是文件夹
                            if(isFile){
                                //console.log(filedir);
                                    // 读取文件内容
                                let content = fs.readFileSync(filedir, 'utf-8');
                                fileArray.push(JSON.parse(content))
                                if(fileArray.length == fileLength){
                                  _this.tableData = fileArray;
                                  _this.num = 1
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


    }
    },
   
    destroyed(){
      clearInterval(this.tiems);
      this.tiems = null
    }
    

}
</script>
<style lang="less" scoped>
.file_box{
  padding: 20px;
}
.file_setting{
  height: 80px;
  line-height: 80px;
}
</style>
