# LayaWxCacheFromZip
使用zip压缩包的laya微信小游戏缓存解决方案
使用小游戏api下载压缩包并解压到客户端缓存的例子  

可以保持原本资源加载模式不变，测试真机可以离线加载所有资源  
在微信开发工具中offline模式会读取资源失败，这个问题是因为本地路径在真机下为wxfile://而模拟器中是http://  
http:// 的前缀和laya.wxmini.js中的逻辑冲突，有需要的请修改laya.wxmini.js文件
https://developers.weixin.qq.com/minigame/dev/tutorial/ability/file-system.html

这样做本身目的就是扔掉laya.wxmini.js的那一套缓存方案...  
因为laya的声音播放api无法在小游戏切回时继续播放，所以我的项目使用了微信的api  
所以需要给声音建立单独的缓存系统，扔掉了laya自带的缓存，所有文件都使用一套缓存逻辑

另外这样也一定程度简化了版本管理..不需要在用IDE的发布功能附加hash了
