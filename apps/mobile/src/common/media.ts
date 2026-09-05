function chooseWithMedia(): Promise<string> {
  return new Promise((resolve, reject) => {
    uni.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (result) => result.tempFiles[0]?.tempFilePath ? resolve(result.tempFiles[0].tempFilePath) : reject(new Error('未选择图片')),
      fail: reject,
    })
  })
}

function chooseWithImage(): Promise<string> {
  return new Promise((resolve, reject) => {
    uni.chooseImage({
      count: 1,
      sourceType: ['album', 'camera'],
      success: (result) => result.tempFilePaths[0] ? resolve(result.tempFilePaths[0]) : reject(new Error('未选择图片')),
      fail: reject,
    })
  })
}

export async function chooseAvatar(): Promise<string | undefined> {
  try { return await chooseWithMedia() }
  catch {
    try { return await chooseWithImage() }
    catch { return undefined }
  }
}
