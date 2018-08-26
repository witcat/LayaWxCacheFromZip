function boot() {
  //游戏初始化
  Laya.MiniAdpter.init()
  //关闭Laya的小游戏自动缓存
  Laya.MiniAdpter.autoCacheFile = false
  Laya.init(750, Laya.Browser.clientHeight * 2, Laya.WebGL);
  //设置cdn地址
  let baseURL = 'https://res.xxx.com/'
  //设置一个本地用户文件缓存目录
  //https://developers.weixin.qq.com/minigame/dev/tutorial/ability/file-system.html
  let cacheURL = wx.env.USER_DATA_PATH + '/cache/'
  //设置一个资源包的版本号，可以写死也可以联网热更新
  let bundleVer = '180826'
  // 组装资源包路径
  let bundleURI = wx.env.USER_DATA_PATH + '/bundle' + bundleVer + '.zip'
  //挂载对象
  Laya.ext = {}
  //手动资源分组
  Laya.ext.assetsGroup = {
    mode: 'interface',
    common: [
      'res/atlas/a.atlas',
    ],
    interface: [
      'res/atlas/b.atlas',
    ],
    game: [
      'res/atlas/c.atlas',
    ]
  }
  Laya.ext.sounds = {
    common: [
      'change',
      'decide',
    ],
    interface: [
      'close',
    ],
    game: [
      '808-bounce',
    ]
  }

  //因为laya的声音api无法在微信切出并返回时继续播放
  //声音全部使用小游戏api接管
  //https://developers.weixin.qq.com/minigame/dev/tutorial/ability/audio.html
  Laya.ext.wxSound = {
    soundCache: {
      common: {},
      interface: {},
      game: {},
      mp: []
    },
    preloadSounds(groupName) {
      let group = Laya.ext.sounds[groupName]
      let cache = this.soundCache[groupName]
      for (let i = 0; i < group.length; i++) {
        let sound = wx.createInnerAudioContext()
        sound.src = cacheURL + 'sound/' + group[i] + '.mp3'
        sound.volume = 1
        sound.autoplay = false
        cache[group[i]] = sound
      }
    },
    destroySounds(group) {
      let cache = this.soundCache[group]
      for (let i in cache) {
        cache[i].destroy()
      }
      this.soundCache[group] = {}
    },
    playSound(group, name) {
      let sound = this.soundCache[group][name]
      sound.seek(0)
      sound.play()
    },
    playMusic(group, name) {
      let sound = this.soundCache[group][name]
      sound.seek(0)
      sound.loop = true
      sound.volume = 0.6

      function playBgm() {
        sound.play()
      }
      sound.cb = playBgm
      wx.onShow(playBgm)
      sound.play()
    }
  }
  Laya.ext.wxSound.preloadSounds('common')
  Laya.ext.wxSound.preloadSounds('interface')

  //跟随4m代码包一起发布的资源文件
  let nativeResources = [
    'res/atlas/local.atlas'
  ]
  Laya.loader.load(nativeResources, Laya.Handler.create(this, async () => {
    //本地资源加载后创建一个资源加载等待页面
    let initialPage = new Laya.InitialPage()
    //资源包缓存主逻辑
    //https://developers.weixin.qq.com/minigame/dev/document/file/wx.getFileSystemManager.html
    let clientBundleVer = wx.getStorageSync('bundleVer')
    if (clientBundleVer == bundleVer) {
      console.log('素材包版本匹配');
    } else {
      let fs = wx.getFileSystemManager()
      let isCached = await new Promise((rs, rj) => {
        fs.access({
          path: bundleURI,
          success(evt) {
            console.log('素材包已下载')
            rs(true)
          },
          fail(evt) {
            console.log('素材包不存在')
            rs(false)
          }
        })
      })
      if (!isCached) {
        console.log('素材包已开始下载')
        await new Promise((rs, rj) => {
          wx.downloadFile({
            url: baseURL + 'zip/bundle' + bundleVer + '.zip',
            filePath: bundleURI,
            success(evt) {
              console.log('素材包下载完毕')
              rs()
            },
            fail(evt) {
              console.log('素材包下载取消')
              rj()
            }
          })
        })
      }
      let isDirExists = await new Promise((rs, rj) => {
        fs.access({
          path: cacheURL,
          success(evt) {
            console.log('缓存目录已存在')
            rs(true)
          },
          fail(evt) {
            console.log('缓存目录不存在')
            rs(false)
          }
        })
      })
      if (isDirExists) {
        console.log('删除旧的缓存文件')
        function cleanDir(target) {
          return new Promise(async(rs,rj)=>{
            let list = fs.readdirSync(target)
            for (let i = 0; i < list.length; i++) {
              if (list[i].includes('.')) {
                await new Promise((rs, rj) => {
                  fs.unlink({
                    filePath: target + list[i],
                    complete() {
                      rs()
                    }
                  })
                })
              } else {
                await cleanDir(target + list[i] + '/')
              }
            }
            fs.rmdirSync(target)
            rs()
          })
        }
        await cleanDir(cacheURL)
      }

      console.log('缓存目录已新建')
      fs.mkdirSync(cacheURL)
      await new Promise((rs, rj) => {
        fs.unzip({
          zipFilePath: bundleURI,
          targetPath: cacheURL,
          success() {
            console.log('资源包解压缩完毕')
            rs()
          },
          fail(err) {
            rj(err)
          }
        })
      })
      fs.unlink({
        filePath: bundleURI
      })
      wx.setStorageSync('bundleVer', bundleVer)
    }
    //此时修改basePath为本地的缓存路径
    //这时所有文件将从本地读取，这样做原因是laya.wxmini.js无法自动缓存除声音图片外的文件，
    //即使使用downloadfile缓存也无法通过loader加载
    //如果用微信本身的api播放声音，声音当然就无法自动缓存了。通过使用上述缓存方案可以统一缓存系统，两者api可以同时调用缓存的文件
    //总之就是在LayaLoader加载之前将素材转移到客户端，这样不用修改laya本身的文件，也解决了诸多问题
    Laya.URL.basePath = cacheURL
    Laya.loader.load(resources, Laya.Handler.create(this, () => {
      //后续游戏逻辑
    }))
  }))
}
boot()
