import { CoreOptions, RequestResponse } from 'request'

type FetchResponse = Response & {
  body: any
  headers: { [key: string]: string }
}

let fetchId = 0
const mainFetch = (url: string, options?: CoreOptions): Promise<FetchResponse> => {
  return new Promise((resolve, reject) => {
    if (url.startsWith('//')) {
      url = `https:${url}`
    }

    try {
      new URL(url)
    } catch (e) {
      reject(e)
      return
    }

    const requestId = fetchId++

    const handler = (event: MessageEvent) => {
      const { data } = event
      if (typeof data !== 'object') return
      if (data.type !== `metastream-fetch-response${requestId}`) return

      window.removeEventListener('message', handler, false)

      const { err, resp } = data.payload

      if (err) {
        reject(err)
        return
      }

      resolve(resp)
    }

    window.addEventListener('message', handler, false)
    window.postMessage(
      { type: 'metastream-fetch', payload: { requestId, url, options } },
      location.origin
    )
  })
}

export const fetchText = async <T = string>(
  url: string,
  options?: RequestInit
): Promise<[T, FetchResponse]> => {
  const resp = await mainFetch(url, options)
  return [resp.body, resp]
}

export const fetchResponse = async (url: string, options?: RequestInit): Promise<FetchResponse> => {
  const resp = await mainFetch(url, options)
  return resp
}