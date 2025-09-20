export default function handler(request) {
  const url = request.nextUrl.clone()

  // Redirecionar apex domain para www
  if (url.hostname === 'pedrotiagocontabilidade.com.br') {
    url.hostname = 'www.pedrotiagocontabilidade.com.br'
    return Response.redirect(url, 301)
  }

  // Headers de segurança avançados
  const response = new Response()
  response.headers.set('X-Pedro-Tiago-Status', 'PRO-ACTIVE')
  response.headers.set('X-Cache-Control', 'public, max-age=31536000')

  return response
}

export const config = {
  matcher: ['/', '/:path*']
}
