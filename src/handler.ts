import { unzipSync } from 'fflate'

export async function handleRequest(
  event: FetchEvent,
  request: Request,
): Promise<Response> {
  const { searchParams } = new URL(request.url)
  const compressedURL = searchParams.get('decompress')

  if (request.method !== 'GET' || compressedURL == null) {
    return new Response('Unsupported', { status: 500 })
  }

  const cacheKey = new Request(compressedURL.toString(), request)
  const cache = caches.default

  let response = await cache.match(cacheKey)

  if (!response) {
    const zipFile = await fetch(compressedURL).then(
      (res) => res.arrayBuffer(),
      () => undefined,
    )

    if (zipFile == null) {
      return new Response(null, { status: 500 })
    }

    const unzipped = unzipSync(new Uint8Array(zipFile))
    const debFile = Object.keys(unzipped).filter((filename) =>
      filename.endsWith('.deb'),
    )[0]

    if (debFile == null) {
      return new Response(null, { status: 500 })
    }

    response = new Response(unzipped[debFile], {
      headers: {
        'Content-Disposition': `attachment; filename="${debFile}"`,
      },
      status: 200,
    })

    response.headers.append('Cache-Control', 'max-age=21600')

    event.waitUntil(cache.put(cacheKey, response.clone()))
  }

  return response
}
