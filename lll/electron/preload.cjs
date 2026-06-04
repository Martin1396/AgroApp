const { contextBridge } = require('electron')

contextBridge.exposeInMainWorld('agroAppDesktop', {
  isDesktop: true,
})
