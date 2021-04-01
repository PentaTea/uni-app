export function encodeQueryString(url: string) {
  if (typeof url !== 'string') {
    return url
  }
  const index = url.indexOf('?')
  if (index === -1) {
    return url
  }
  const query = url
    .substr(index + 1)
    .trim()
    .replace(/^(\?|#|&)/, '')
  if (!query) {
    return url
  }
  url = url.substr(0, index)
  const params: string[] = []
  query.split('&').forEach((param) => {
    const parts = param.replace(/\+/g, ' ').split('=')
    const key = parts.shift()
    const val = parts.length > 0 ? parts.join('=') : ''
    params.push(key + '=' + encodeURIComponent(val))
  })
  return params.length ? url + '?' + params.join('&') : url
}
