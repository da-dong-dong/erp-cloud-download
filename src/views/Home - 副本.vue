<template>
<div>
  <top @stopFile="stopFile" />
   <div class="file_box">
    <div class="file_setting">
      <div class="file_box_set">
         <div class="box_check">
           <el-button type="primary" @click="onClickForImg">全部开始</el-button>
          <el-button type="info" @click="onClickStopAll">全部暂停</el-button>
          <el-button type="primary" @click="onClickCheck">开始</el-button>
          <el-button type="info" @click="onClickStop">暂停</el-button>
          
          <el-button type="warning" @click="onClickAgain">重新开始任务</el-button>
          <el-button type="danger" @click="onClickDleFile">删除任务</el-button>
         </div>
          <div>
             <el-checkbox :value="autoDownLoad" @change="onClickAutoDownLoad">自动下载</el-checkbox>
             <el-checkbox v-model="outWindow">完成后关机</el-checkbox>
             <el-checkbox v-model="checked" @change="onClickTop">置顶</el-checkbox>
             <cacheFile :filePathLocal="filePathLocal" />
          </div>
      </div>
      
    </div>
   
     <div class="file_table" v-if="tableData!=null">
        <el-table
          ref="multipleTable"
          :data="tableData"
          style="width: 100%"
          @selection-change="handleSelectionChange"
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
            <template slot-scope="scope">{{scope.row.httpOK==1?(scope.row.inRun?scope.row.inRun:'未开始'):"服务器错误"}}</template>
          </el-table-column>
           <el-table-column
            label="进度报告"
            >
            <template slot-scope="scope">
              <p v-if="scope.row.fileImg">{{ scope.row.fileImg | reanLength}}/{{ scope.row.fileImg.length}}</p>
              <p v-else>0</p>
            </template>
          </el-table-column>
          <el-table-column
            label="创建时间" 
            >
            <template slot-scope="scope">{{ scope.row.jsonCreateTime | getLocalTime}}</template>
          </el-table-column>
          <el-table-column
            label="目标服务器"
            >  
            <template slot-scope="scope">{{ scope.row.serverName?scope.row.serverName:'123'}}</template>
          </el-table-column>
        </el-table>
     </div>
  </div>
</div>
 
</template>

<script>
// @ is an alias to /src
const fs = window.require('fs')
const path = window.require('path')
const crypto = window.require('crypto')
import top from '../components/top'
import cacheFile from '../components/cacheFile'
export default {
  components:{
    top,
    cacheFile
  },
  filters:{
    getLocalTime(data){
      return new Date(parseInt(data)/1000).toLocaleString().replace(/:\d{1,2}$/,' ');
    },
    //计算上传完成数量
    reanLength(data){
      let num = 0;
      data.map(item=>{
        if(item.isOK){
          num++
        }
      })
      return num
    }
  },
  name: 'Home',
  created(){
  
   //回调文件触发
    this.init();
    //寻找是否有自动下载文件
    this.seekAutoDownLoad()
  },
  mounted(){
    // 绑定键盘事件
    document.addEventListener("keydown", this.downFun, false);
    document.addEventListener("keyup", this.keyupFun, false);
  },
  data(){
    return{
      times:null,
      timeNun:0,
      arrnum:0,
      checked:true,//选中浮窗
      outWindow:false,//是否完成后关机
      autoDownLoad:false,//是否自动下载
      arra:['https://ss0.bdstatic.com/70cFuHSh_Q1YnxGkpoWK1HF6hhy/it/u=1568254360,2230157886&fm=26&gp=0.jpg','https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1605184667562&di=ccf99c786c52627839bb04f4bae7b3de&imgtype=0&src=http%3A%2F%2Fa3.att.hudong.com%2F61%2F98%2F01300000248068123885985729957.jpg'],
      tableData:[],
      backData:[],//备份数据
      timeFile:null,//每秒请求计时器
      types:['上传原片','下载原图','上传初修片','下载初修片','上传选修片','下载选修片','上传精修片','下载精修片','上传设计片','下载设计片','上传微视频','下载微视频','下载已选片','下载缓存','下载看板ok','下载待修改'],
      typeFile:['原片','原图','初修片','初修片','选修片','选修片','精修片','精修片','设计片','设计片','微视频','微视频','已选片','下载缓存','看板ok','待修改'],
      filePathLocal:null,//json文件路径
      urlHttp:null,//接口
      //计数器
      tiems:null,
      //监听计数器
      num:1,
      //文件类型
      ext2type:{
        "JPG":"image/jpeg",
        "jpg":"image/jpeg",
        "gif":"image/gif",
        "bmp":"image/bmp",
        "png":"image/png",
        "webp":"image/webp",
        "svg":"image/svg",
        "arw":"image/arw",
        "nef":"image/nef",
        "rw2":"image/rw2",
        "dng":"image/dng",
        "cr2":"image/cr2",
        "sr2":"image/sr2",
        "orf":"image/orf",
        "pef":"image/pef",
        "raf":"image/raf",
        "x3f":"image/x3f",
        "raw":"image/RAW",
        "mp4":"video/mp4",
        "mkv":"video/mkv",
        "mov":"video/mov",
        "avi":"video/avi",
        "flv":"video/flv",
        "rm":"video/rm",
        "mpg":"video/mpg",
      },
      // 选中的值
      checkData:[],
      checkDataBack:[],//备份
      //存储切片
      data: [],
      //http服务器
      httpPath:'',
      sotpAll:false
    }
  },
   methods: {
     downFun(e){
       let code = e.keyCode;
       // 打开控制台 ctrl + B
      if(e.ctrlKey && code === 66){
        this.$ipcRenderer.send('F12', "退出");
      }

      // 打开文件缓存路径 ctrl + P
      if(e.ctrlKey && code === 80){
        this.$ipcRenderer.send('successFile');
      }
     },

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
      requestGet({ url, method = "get", headers = {} }) {
        return new Promise(resolve => {
          let urls = url
          const xhr = new XMLHttpRequest();
          xhr.open(method, urls);
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
      //选中值tba
      onClickTab(val){
        //判断是否选中
        let arr = [];
       arr = this.checkData.concat(val)
          
         let set = new Set(arr)
          let Sets = Array.from(set);
          this.checkData = Sets
         
        
      },
      //关闭按钮写入文件，解决报错
      stopFile(type){
        //先全部暂停
        this.onClickStopAll()
        console.log(type)
        //循环写入文件
        for(let i=0;i<this.tableData.length;i++){
            this.wireFile(this.tableData[i].fileID,this.tableData[i])
        }
        this.$ipcRenderer.send('topSet', type);
      },
      //异步写入
      wireFile(id,str){
        console.log(str)
        return new Promise((resolve,rejcet)=>{
            fs.writeFile(`${this.filePathLocal}/${id}`, JSON.stringify(str), (err) => {
                if (err) {
                    rejcet(err)
                }
              resolve()
            })
        })
      },
      //删除任务
      onClickDleFile(){
        if(this.checkData.length==0){
          this.$message.error('请选择要重新开始的任务！')
        }else{
          for(let i=0;i<this.tableData.length;i++){
            for(let j=0;j<this.checkData.length;j++){
              if (this.tableData[i].fileID == this.checkData[j].fileID) {
                fs.unlinkSync(`${this.filePathLocal}/${this.checkData[j].fileID}`)
                console.log('删除哦ok')
                this.tableData.splice(i,1)
              }
            }
          }
          
        }
      },
      //重新开始任务
      onClickAgain(){
        if(this.checkData.length==0){
          this.$message.error('请选择要重新开始的任务！')
        }else{
          //标记
          for(let i=0;i<this.tableData.length;i++){
            for(let j=0;j<this.checkData.length;j++){
              if(this.tableData[i].fileID != this.checkData[j].fileID){
                //标记勾选的
                this.tableData[i].check = true
              }else{
                this.tableData[i].check = false
              }
            }
          }
          console.log('6666',this.tableData,this.checkData);
          //暂停，再更新
          for(let i=0;i<this.tableData.length;i++){
            let item = this.tableData[i];
            if(!item.check){
              if(item.fileImg){
                let num =0;
                for(let j=0;j<item.fileImg.length;j++){
                  if(!item.fileImg[j].isOK){
                    num++;
                  }
                  console.log(num)
                  if(num<=item.fileImg.length && num>0){
                    item.isStop = true,
                    item.inRun = "已暂停"
                  }
                  
                }
              }else{
                item.isStop = true,
                item.inRun = "已暂停";
              }
            }
          }
          for(let i=0;i<this.tableData.length;i++){
            for(let j=0;j<this.checkData.length;j++){
              if(this.tableData[i].fileID == this.checkData[j].fileID){
                  //替换重新开始
                  let arrs = JSON.parse(JSON.stringify(this.checkData[j]))
                  this.tableData.splice(i,1,arrs)
              }
            }
          }
    
         
          this.onClickCheck()
          console.log(this.checkData,'aaaasdfsd')
        }
      },
      //退出程序
      onClickTopOff(){
        this.$ipcRenderer.send('topSet', "退出");
      },
      //悬浮窗
      onClickTop(val){
        console.log(val);
         this.$ipcRenderer.send('checkTop', val)
         this.$ipcRenderer.on('checkTopSuccess', (event, res) => {
           this.$ipcRenderer.removeAllListeners(['checkTopSuccess'])
            console.log(res)
         })
      },
      //自动下载写入文件
      onClickAutoDownLoad(val){
        if(val){
          //写入文件
          this.$ipcRenderer.send('autoDownLoad', val)
          this.$ipcRenderer.on('autoDownLoadSuccess', (event, res) => {
            this.$ipcRenderer.removeAllListeners(['autoDownLoadSuccess'])
              console.log(res)
              this.autoDownLoad = val
          })
          
        }else{
          //删除文件
          this.$ipcRenderer.send('autoDownLoadDel', val)
          this.$ipcRenderer.on('autoDownLoadDelSuccess', (event, res) => {
            this.$ipcRenderer.removeAllListeners(['autoDownLoadDelSuccess'])
              console.log(res)
              this.autoDownLoad = val
          })
        }
      },
      //寻找自动下载文件
      seekAutoDownLoad(){
        this.$ipcRenderer.send('seekAutoDownLoad')
          this.$ipcRenderer.on('seekAutoDownLoadSuccess', (event, res) => {
            this.$ipcRenderer.removeAllListeners(['seekAutoDownLoadSuccess'])
              if(res.length>0){
                this.autoDownLoad = true
              }else{
                this.autoDownLoad = false
              }
               this.clearTimeData();
          })
      },
      //全部暂停
      onClickStopAll(type){
        //暂停数据
        let tableData = this.tableData
        //计算是否已上传
       if(type == '选中'){
          for(let i=0;i<tableData.length;i++){
            let item = tableData[i];
            if(!item.check){
              if(item.fileImg){
                let num =0;
                for(let j=0;j<item.fileImg.length;j++){
                  if(!item.fileImg[j].isOK){
                    num++;
                  }
                  console.log(num)
                  if(num<=item.fileImg.length && num>0){
                    item.isStop = true,
                    item.inRun = "已暂停"
                  }
                  
                }
              }else{
                item.isStop = true,
                item.inRun = "已暂停";
              }
            }
          }
       }else{
          for(let i=0;i<tableData.length;i++){
            let item = tableData[i];
              if(item.fileImg){
                let num =0;
                for(let j=0;j<item.fileImg.length;j++){
                  if(!item.fileImg[j].isOK){
                    num++;
                  }
                  console.log(num)
                  if(num<=item.fileImg.length && num>0){
                    item.isStop = true,
                    item.inRun = "已暂停"
                  }
                  
                }
              }else{
                item.isStop = true,
                item.inRun = "已暂停";
              }
          }
       }
        //暂停下载
        this.$ipcRenderer.send('setStop');
        this.tableData = JSON.parse(JSON.stringify(this.tableData));
        this.$set(this.tableData)
      },
      //循环上传数据
     async onClickForImg(type){
       let imgData = this.tableData
        
        if(type == '选中'){
          
          imgData.map(item=>{
            ///判断是否选中
            if(!item.check){
              item.isStop = false;
              if(item.inRun !="已完成"){
                item.inRun = "排队中"
              }
            }
          });
          for(let i=0;i<imgData.length;i++){
            //判断服务器是否正常，跳出本次循环
            if(imgData[i].httpOK ==1){
              //判断是否选中
              if(!imgData[i].check){
                //是否暂停下载
                if(!this.sotpAll){
                  if(!imgData[i].isStop){
                    //是否导出
                    if(imgData[i].out == '导出'){
                    await this.getImgContent(imgData[i])
                    }else{
                      await this.onClickHttp(imgData[i])
                        console.log('我是上传')
                      }
                  }
                }
              }
            }
          }
        }else{
            imgData.map(item=>{
            ///判断是否选中
            item.isStop = false;
            if(item.inRun !="已完成"){
              item.inRun = "排队中"
            }
          });
          for(let i=0;i<imgData.length;i++){
            //判断服务器是否正常，跳出本次循环
            if(imgData[i].httpOK ==1){
              //是否暂停下载
              if(!this.sotpAll){
                if(!imgData[i].isStop){
                  //是否导出
                  if(imgData[i].out == '导出'){
                  await this.getImgContent(imgData[i])
                  }else{
                    await this.onClickHttp(imgData[i])
                      console.log('我是上传')
                    }
                }
              }
              
            }
            //this.tableData = imgData;
          //this.$set(this.tableData)
          console.log('111',imgData,i)
          }
          console.log('ssss',this.tableData)
        }
        
        
      },
      // 选中下载
      onClickCheck(){
        if(this.checkData.length==0){
          this.$message.error('请选择任务！')
        }else{
          for(let i=0;i<this.tableData.length;i++){
            for(let j=0;j<this.checkData.length;j++){
              if(this.tableData[i].fileID != this.checkData[j].fileID){
                //标记勾选的
                this.tableData[i].check = true
              }else{
                  this.tableData[i].check = false
              }
            }
          }
          this.onClickForImg('选中');
          //备份多选值
          this.checkDataBack = JSON.parse(JSON.stringify(this.checkData))
        }
      },
      // 勾选值
      handleSelectionChange(val){
        console.log(val);
        this.checkData = JSON.parse(JSON.stringify(val));
       
      },
      //选中暂停
      onClickStop(){
        if(this.checkData.length==0){
          this.$message.error('请选择暂停任务！')
        }else{
          for(let i=0;i<this.tableData.length;i++){
            for(let j=0;j<this.checkData.length;j++){
              if(this.tableData[i].fileID != this.checkData[j].fileID){
                //标记勾选的
                this.tableData[i].check = true
              }else{
                this.tableData[i].check = false
              }
            }
          }
          this.onClickStopAll('选中')
        }
      },
      //获取http
      async onClickHttp(tableData){
        let num = 0;
        let fileID = ''
        //任务状态改变
        tableData.inRun = "正在进行"

        await this.putImg(tableData);
       

        for(let j=0;j<tableData.fileImg.length;j++){
          
           //是否暂停下载
            if(!tableData.isStop){
                //判断是否已经上传过的
                if(!tableData.fileImg[j].isOK){
                   await this.onClickFiles(tableData,tableData.fileImg[j])
                }
            }
         
        }
        //第一组循环完
        for(let i=0;i<tableData.fileImg.length;i++){
          if(tableData.fileImg[i].isOK){
            num++
          }
          if(num ==tableData.fileImg.length){
            tableData.inRun = '已完成'
          }
        }

        //删除
        for(let i=0;i<this.tableData.length;i++){
          if(this.tableData[i].inRun == "已完成"){
            fileID = this.tableData[i].fileID;
            //通知主线程删除
            this.$ipcRenderer.send('delFie', fileID);
            this.$ipcRenderer.on('delFileSuccess', (event, res) => {
              //删除表格
              this.$ipcRenderer.removeAllListeners(['delFileSuccess'])
              console.log(res)
              this.tableData.splice(i,1);
            })
          }
        }
        this.$set(this.tableData)
        console.log('是否完成', this.tableData);
        
      },
      //上传图片请求
      async putImg(tableData){
        let {OrderNumber,SubOrderNumber,ShootingName,ShootingID,ImportType,ImportPeople,ImportPeopleName,CustomerName,CustomerMobile,ImportStoreID,serverKey,httpPath} = tableData;
        let url = httpPath+'/fserver/UploadFileRequest'
        let newData = new Date().getTime()
        let nonce = Math.floor(Math.random(1)*10000)
        let sha1s = this.$sha1(`lyfz.net${newData}${nonce}`)
         const formData = new FormData();
            formData.append("OrderNumber", OrderNumber);
            formData.append("SubOrderNumber", SubOrderNumber);
            formData.append("ShootingName", ShootingName?ShootingName:'',);
            formData.append("ShootingID", ShootingID?ShootingID:'',);
            formData.append("ImportType", ImportType);
            formData.append("ImportPeople", ImportPeople);
            formData.append("ImportPeopleName", ImportPeopleName);
            formData.append("CustomerName", CustomerName);
            formData.append("ImportStoreID", ImportStoreID);
            formData.append("CustomerMobile", CustomerMobile);
            formData.append("importStatus", 0);
            
         await this.request({url,
          data:formData,
          headers:{

            "signature":sha1s,     
            "timestamp":newData,
            "nonce":nonce,
            "app_key":serverKey
          }
          }).then(res=>{
            tableData.ImportIdentity= JSON.parse(res.data).data
          })
      },
      //图片上传
       imgUp(file,filepath,md5,tableData,tableDataImg){
        
            return new Promise((resole,rejcet) =>{
              let {OrderNumber,SubOrderNumber,ShootingName,ShootingID,ImportType,ImportPeople,ImportPeopleName,CustomerName,CustomerMobile,ImportStoreID,serverKey,httpPath,ImportIdentity,filePathName} = tableData;
              let url = httpPath+'/fserver/uploadfile'
              let newData = new Date().getTime()
              let nonce = Math.floor(Math.random(1)*10000)
              let sha1s = this.$sha1(`lyfz.net${newData}${nonce}`)
              let formData = new FormData();
                  formData.append("file", file);
                  formData.append("OrderNumber", OrderNumber);
                  formData.append("SubOrderNumber", SubOrderNumber);
                  formData.append("ShootingName", ShootingName?ShootingName:'',);
                  formData.append("ShootingID", ShootingID?ShootingID:'',);
                  formData.append("ImportType", ImportType);
                  formData.append("ImportPeople", ImportPeople);
                  formData.append("ImportPeopleName", ImportPeopleName);
                  formData.append("CustomerName", CustomerName);
                  formData.append("ImportStoreID", ImportStoreID);
                  formData.append("CustomerMobile", CustomerMobile);
                  formData.append("importStatus", 0);
                  formData.append("CreatePreview", 1);
                  formData.append("ImportIdentity", ImportIdentity);
                  formData.append("selectDirPath", filePathName?filePathName:'');//文件目录路径
                  formData.append("fileFullName", filepath);
                  formData.append("SourceFileLength", file.size);
                  // formData.append("SourceFileMd5Value", md5);
                  // formData.append("FileStarPosition", 0);
               this.request({url,
                data:formData,
                headers:{
                  "signature":sha1s,     
                  "timestamp":newData,
                  "nonce":nonce,
                  "app_key":serverKey
                }
                }).then(res=>{
                  console.log(res);
                  tableDataImg.isOK = true; 
                  this.$set(this.tableData)
                  resole()
                }).catch(err=>{
                  rejcet(err)
                })
            })
         
       
      },
      //获取图片集合
     async getImgContent(tableData){

       await this.getDownHttp(tableData)
            console.log('是否好；了+++++++')
      },

       //获取下载地址(选片)
     async getDownHttpSelect(tableData){
        let {fileImg,filePathName,httpPath,OrderNumber,CustomerName,downType,fileID,SubOrderNumber,jsonCreateTime,CustomerMobile,FileNameContainsProductName,make,idImg,makeJson,SelectHTML} = tableData;
        let url = httpPath +'/fserver/IDownloadFile'
        let fileTitle
        // 判断是否样片导出
        if(httpPath){
          fileTitle =`${OrderNumber}(${CustomerName}_${this.typeFile[downType-1]})`
        }else{
          fileTitle =`${OrderNumber}(${CustomerName})`
        }
        
        let jsonParse ={
          fileImg,filePathName,url,fileTitle,fileID
        }
        //判断文件名是否包含文件夹
        if(FileNameContainsProductName){
          jsonParse.fileNamsNO = `${CustomerName}(`
        }
      
        //判断图片是否为空
        if(fileImg.length == 0){
          tableData.inRun = '无图片，请删除任务！'
          
        }else{
          //循环记录值
          for(let i=0;i<fileImg.length;i++){
            //是否暂停下载
            if(!tableData.isStop){
              //判断是否已经上传过的
                if(!fileImg.isOK){
                  let arrImg = []
                  if(httpPath){
                    arrImg.push(`${fileImg[i].filepath}&size=b`);
                  }else{
                    arrImg.push(`${fileImg[i].filepath}`);
                  }
                  //通知主线程获取图片
                  jsonParse.arrImg = arrImg
                  jsonParse.paths = fileImg[i].paths
                  this.$ipcRenderer.send('getHttpImg', jsonParse,)
                  await this.tiemImg()
                }
            }
          }
           // 判断是否样片导出
          if(httpPath){
            //写入文本
            let tiem = new Date(parseInt(jsonCreateTime)/1000).toLocaleString().replace(/:\d{1,2}$/,' ');
            let str = `【订单号】：${OrderNumber} 【客户姓名】：${CustomerName} 【联系电话】：${CustomerMobile} 【选片时间】：${tiem} \n 选片要求:  ${make} \n`
            let srtOk = ''
            //循环写入
            for(let t=0;t<makeJson.length;t++){
              let setStr = `【产品名称】: ${makeJson[t].name}        已选相片 ${idImg[makeJson[t].goodsId].length}张:，${idImg[makeJson[t].goodsId].join(", ")}\n数量：${makeJson[t].countNum}   P数：${makeJson[t].countP}   备注：${makeJson[t].remark?makeJson[t].remark:''}\n----------------------------------------------------------------------------------------------------------------------------\n`
              srtOk += setStr
            }
            str = str + srtOk
            fs.writeFile(`${filePathName}/${fileTitle}/${SubOrderNumber}/制品说明.txt`, str, (err) => {
                if (err) {
                    console.log(err)
                }
            })

            // 写入html制作单
            let headHTML = `<!DOCTYPE html> <head> <meta charset="utf-8"></head><style>.printingSub_container td,.printingSub_container th { padding: 5px 10px; border: 1px solid #DDD; }</style>${SelectHTML}`
            fs.writeFile(`${filePathName}/${fileTitle}/${SubOrderNumber}/制作单.html`, headHTML, (err) => {
                if (err) {
                    console.log(err)
                }
            })
          }
         
        }
        
      },

      //获取下载地址
     async getDownHttp(tableData){
        let {fileImg,filePathName,httpPath,OrderNumber,CustomerName,downType,fileID,ImportType,seeType,SubOrderNumber,CustomerMobile,customerInstructions,photoInstructions} = tableData;
        let url = httpPath +'/fserver/IDownloadFile'

        let fileTitle ='';
        if(downType!= 14){
          fileTitle = `${OrderNumber}(${CustomerName}_${this.typeFile[downType-1]})`
        }else{
          let ImportTypeArr = ['原片','初修片','初修片','精修片','设计片']
          let title = `${ImportTypeArr[ImportType]}`
          fileTitle = `${OrderNumber}(${title})`
        }
        let jsonParse ={
          fileImg,filePathName,url,fileTitle,fileID
        }
        
        //任务状态改变
        tableData.inRun = "正在进行"

        //选片判断
        if(downType == 13){
          this.getDownHttpSelect(tableData)
        }else{
          //判断图片是否为空
          if(fileImg.length == 0){
            tableData.inRun = '无图片，请删除任务！'
            
          }else{
            //循环记录值
            for(let i=0;i<fileImg.length;i++){
              let arrImg = []
              if(httpPath){
                arrImg.push(`${fileImg[i].filepath}&size=b`);
              }else{
                arrImg.push(`${fileImg[i].filepath}`);
              }
              //通知主线程获取图片
              jsonParse.arrImg = arrImg
              this.$ipcRenderer.send('getHttpImg', jsonParse,)
              await this.tiemImg()

            }
            // 判断是否看板导出
            if(seeType){
              //写入文本
              let str = `【订单号】：${OrderNumber} 【客户姓名】：${CustomerName} 【联系电话】：${CustomerMobile}  \n 客户说明:  ${customerInstructions} \n 相片说明:  ${photoInstructions} \n`
              
              fs.writeFile(`${filePathName}/${fileTitle}/${SubOrderNumber}/制品说明.txt`, str, (err) => {
                  if (err) {
                      console.log(err)
                  }
              })
            }
          }
        }
        
      },
      //延迟一个一个来
      async tiemImg(){
        return new Promise((resolve)=>{
          //完成
          this.$ipcRenderer.on('down-success', (event, arg,id) => {  
            this.$ipcRenderer.removeAllListeners(['down-success'])
           let tableData = this.tableData;
            for(let i=0;i<tableData.length;i++){
              let item = tableData[i]
              if(item.fileImg){
                
                for(let j=0;j<item.fileImg.length;j++){
                  if(item.fileID == id){
                    let nameArr
                    if(item.httpPath){
                      nameArr= item.fileImg[j].filepath.split('\\');
                    }else{
                      nameArr= item.fileImg[j].filepath.split('/');
                    } 
                    let name = nameArr[nameArr.length-1]
                    if(name == arg){
                      item.fileImg[j].isOK = true
                    }
                 
                   
                  }
                }
              }
            }
            for(let a=0;a<tableData.length;a++){
              let num = 0;
              let item = tableData[a]
              if(item.fileImg){
                for(let k=0;k<item.fileImg.length;k++){
                if(item.fileImg[k].isOK){
                  num++
                }
                 if(num == item.fileImg.length){
                      item.inRun = '已完成'
                       //通知主线程删除       
                       console.log(item,'删除啦！')
                       let successFile = this.filePathLocal.replace('/tasklist','') + "/successFile"
                      fs.writeFileSync(`${successFile}/${item.fileID}`, JSON.stringify(tableData));
                      // 判断是否是缓存图片
                      if(item.downType == 14){
                        // 盘符路径
                        let cachPath = this.filePathLocal.replace('/tasklist','') + "/cacheFile"
                        // 默认缓存文件
                        let cachFile = `${cachPath}/cacheFile.json`
                        let ImportType = ['原片','初修片','初修片','精修片','设计片']
                        let title = `${item['OrderNumber']}(${ImportType[item['ImportType']]})`
                        // 读取文件内容
                        let fileArr = JSON.parse(fs.readFileSync(cachFile, 'utf-8'));
                        // 判断添加文件路径
                        fileArr.map(item_=>{
                          let itmeTilte = item_.title
                          if(itmeTilte == title){
                            
                            let imgLenth = item.fileImg.length
                            let imgAll = item.fileImg
                            let imgItem=0
                            let fileSelectImg = []
                            for(;imgItem<imgLenth;imgItem++){
                              //获取文件名
                              let arrName = imgAll[imgItem]['filepath']
                              let index = arrName.lastIndexOf(item['OrderNumber']);
                              let arrPath = arrName.substring(index,arrName.length).replace(/\\/g,`/`);
                              fileSelectImg.push(`atom:${item['filePathName']}/${title}/${arrPath}`)
                            }
                            item_['fileTime'] = item.jsonCreateTime / 1000
                            item_['fileArr'] = fileSelectImg
                          }
                        })
                        // 写入文件
                        fs.writeFileSync(cachFile, JSON.stringify(fileArr));
                      }
                      this.$ipcRenderer.send('delFie', item.fileID);
                      this.$ipcRenderer.on('delFileSuccess', (event, res) => {
                         this.$ipcRenderer.removeAllListeners(['delFileSuccess'])
                         //删除表格
                         //tableData.splice(i,1);
                         const ress = res
                         for(let a=0;a<this.tableData.length;a++){
                           if(this.tableData[a]){
                             if(this.tableData[a].fileID == ress){
                               this.tableData.splice(a,1)
                             }
                           }
                         } 
                          this.$set(this.tableData)
                      })
                    }
              }
              }
              
            }
             resolve()
          }) 
        })
      },
      //删除json文件
      delFileJson(tableData){
        return new Promise((resolve)=>{
          let fileID = '';
          for(let i=0;i<tableData.length;i++){
            if(tableData[i].inRun == "已完成"){
              fileID = tableData[i].fileID;
              tableData.splice(i,1);
              //通知主线程删除
              this.$ipcRenderer.send('delFie', fileID);
              this.$ipcRenderer.on('delFileSuccess', (event, res) => {
                //删除表格
                this.$ipcRenderer.removeAllListeners(['delFileSuccess'])
                console.log(res)
               
              })
            }
          }
           resolve()
        })
        
      },
      onClickCS(){
        this.$ipcRenderer.send('synchronou', '来啦老弟66');
        this.$ipcRenderer.on('absr', (event, arg,paths,urlHttp) => {
          this.$ipcRenderer.removeAllListeners(['absr'])
          console.log(paths)
          this.urlHttp=urlHttp
          this.filePathLocal = paths
          this.fielWatch(paths)
          this.tableData = JSON.parse(JSON.stringify(arg))
          this.backData = JSON.parse(JSON.stringify(arg))
          if(this.autoDownLoad){
            console.log('sssssdfsd')
              this.onClickForImg()
          }
        })
      },

      //fs
      fsredFile(filePath){
        return new Promise((resolve,rejcet)=>{
            let extname = path.extname(filePath).substr(1);
            let basename = path.basename(filePath);
            fs.readFile(filePath, (err, data) => {
              if (err) {
                  rejcet(err);
              } else {
                  console.log(data);
                 
                  let md5= crypto.createHash('md5').update(data, 'utf8').digest('hex');
                  let file = new File([data],basename,{type:this.ext2type[extname]});
                  console.log(file,md5);
                  // //上传
                   resolve({file,md5})
              }
            });
          })
      },

      //获取fs文件路径生成file文件
      onClickFiles(tableData,tableDataImg){
        return new Promise((resolve,rejcet)=>{
            let filePath = tableDataImg.filepath;
            this.fsredFile(filePath).then(({md5,file}) => {
                this.imgUp(file,filePath,md5,tableData,tableDataImg).then(() => {
                  resolve()
                }).catch(() => {
                  rejcet()
                })
            });

         })
       
      },
      
      //buff转文件fiel
      buffAndFile(){

      },
      clearTimeData(){
        this.onClickCS();
        
      },
      //监听文件变化，通知线程更新数据
      fielWatch(filePath){
        //计时器每秒请求
        this.timeFile = setInterval(() => {
            this.fileDisplay(filePath)
        }, 1000);
        
      },
      //下载文件
      onClickDownLon(){
        // let arra =this.arra
        // //let a="";//需要下载文件的路径
        // var b="D:\\Users\\zdy\\Desktop\\imgs\\";//下载文件存放路径
        
        // //扩展，访问局域网内共享文件
        // //var c="file:\\xxx.xxx.x.xxx\\test\\1.txt"; 
        // for(let i=0;i<arra.length;i++){
        //   this.$ipcRenderer.send('download',arra[i]+"+"+b)
        // }
        
      },
      //回调监听

      init(){
          //监听main process里发出的message
          this.$ipcRenderer.on('downstate', (event, arg) => {
           console.log("下载状态：" + arg); 
           this.arrnum+=arg
          }) 


          //是否暂停
           this.$ipcRenderer.on('setStopSuccess', (event, arg) => {
           console.log( arg); 
          
           //this.arrnum+=arg
          }) 
      },

      //监听文件
       fileDisplay(filePath){
        
        let fileArray = []
        let _this = this
        //根据文件路径读取文件，返回文件列表
        fs.readdir(filePath,function(err,files){
            if(err){
                console.warn(err)
            }else{
                //遍历读取到的文件列表
                let fileLength = files.length
                files.forEach(function(filename){
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
                                  //循环判断是否存在任务
                                  if(_this.tableData.length == 0){
                                    _this.tableData = fileArray;
                                    _this.num = 1
                                    if(_this.autoDownLoad){
                                        _this.onClickForImg()
                                    }
                                  }else{
                                    //筛选去重
                                    let lowData = JSON.parse(JSON.stringify(_this.tableData))
                                    let okData = _this.getArrDifSameValue(lowData,fileArray)
                                    if(okData.length != 0){
                                      _this.tableData.push(...okData)
                                      if(_this.autoDownLoad){
                                        _this.onClickForImg()
                                      }
                                    }
                                    
                                  }
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


      },
      //对象找不同
      getArrDifSameValue(arr1,arr2){
        let result = [];
        for(let i = 0; i < arr2.length; i++){
            let obj = arr2[i];
            let id = obj.jsonCreateTime;
            let isExist = false;
            for(let j = 0; j < arr1.length; j++){
                let aj = arr1[j];
                let n = aj.jsonCreateTime;
                if(n == id){
                    isExist = true;
                    break;
                }
            }
            if(!isExist){
                result.push(obj);
            }
        }
        return result;
      }
    
    },
   
   watch:{
     tableData:{
      handler(newName) {
        console.log('我是watch',newName)
          this.tableData = newName;
          this.$set(this.tableData)
           //判断是否完成，删除json文件
        //this.delFileJson(this.tableData);
        //如果选中完成关机
        if(this.outWindow){
          if(newName.length == 0){
            console.log('我会关机哦！');
            this.$ipcRenderer.send('checkOutWindow','关机');
            this.$ipcRenderer.on('checkOutWindowSuccess', (event, res) => {
              console.log(res)
            })
          }
        }

        //自动下载
      },
      deep: true
     },
     autoDownLoad(news,lod){
       console.log('我是watch自动',news,lod)
     }
   },
    destroyed(){
      clearInterval(this.tiems);
      this.tiems = null
      clearInterval(this.timeFile)
      this.timeFile = null
      document.removeEventListener("keydown", this.downFun, false);
      document.removeEventListener("keyup", this.keyupFun, false);
    }
    
    

}
 
</script>
<style lang="less" scoped>
.top_file{
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.file_box{
  padding: 20px;
}
.file_setting{
}
.file_box_set{
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.box_check{
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
