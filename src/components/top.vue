<template>
 <div class="box_top">
      <div class="topbar" style="-webkit-app-region: drag;-webkit-user-select: none;">
        <div class="logo fl">
            <span>利亚方舟下载器</span>
        </div>
        <div class="min_max_close fr" style="-webkit-app-region: no-drag;">
            <img src="../imgs/smo.png" id="min" alt="最小化" title="最小化" @click="onClickTop('最小化')">
            <img src="../imgs/big.png" id="max" alt="最大化" title="最大化" @click="onClickTop('最大化')">
            <img src="../imgs/off.png" id="close" alt="关闭" title="关闭" @click="onClickTop('退出')">
        </div>
     </div>
    </div>
</template>

<script>
  export default {
    data() {
      return {}
    },
    methods: {
      onClickTop(type){
        // if(type == '退出'){
        //    this.$confirm('此操作将关闭软件, 是否继续?', '提示', {
        //     confirmButtonText: '确定',
        //     cancelButtonText: '取消',
        //     type: 'warning'
        //   }).then(() => {
        //     this.$ipcRenderer.send('topSet', type);
        //   }).catch(() => {
                    
        //   });
        // }else{
        //   this.$ipcRenderer.send('topSet', type);
        // }
         this.$ipcRenderer.send('topSet', type);
          
      },
      onStopFile(type){
        this.$emit('stopFile',type)
      }
    },
    
    created() {
    }
  }
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="less">
.topbar{
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #409EFF;
  padding: 0 10px;
}
</style>
