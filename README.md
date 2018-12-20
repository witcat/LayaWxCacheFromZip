## 使用小游戏api下载压缩包并解压到客户端缓存的例子  

在laya 1.7中测试  
可以保持原本资源加载模式不变，测试真机可以离线加载所有资源  
在微信开发工具中offline模式会读取资源失败，这个问题可能是开发工具offline模式不能重定向的原因  
有需求的或许可以通过修改laya.wxmini.js文件修复

这样做本身目的就是扔掉laya.wxmini.js的那一套缓存方案...  
首先atlas等除了声音和图片以外的资源并不能正常的缓存后读取（即使通过手动调用downloadfile缓存  
而且laya的声音播放api无法在小游戏切回时继续播放，所以我的项目使用了小游戏的音频api，这样laya.wxmini.js将无法缓存声音素材    

综合以上原因，扔掉laya自带的缓存方案，手动创建一个缓存系统并管理。顺便统一了缓存系统，不管直接通过小游戏或laya的api都可以调用到缓存文件

另外这样也一定程度简化了版本管理..不需要在用IDE的发布功能附加hash了  

但这样有个问题是项目不能在浏览器环境调试了..可以用gulp等工具实时合并，直接扔掉ide在微信开发工具中调试  

> https://ldc.layabox.com/doc/?nav=zh-js-5-0-5  
 https://developers.weixin.qq.com/minigame/dev/tutorial/ability/file-system.html  
 https://github.com/witcat/gulpLayaairWxDemo
