import { handleRequest } from './handler'

addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event, event.request))
})
