import http from 'http'
http.get('http://localhost:3000/api/jira/rest/api/2/issue/DTS-10391', (r) => {
  let d = ''
  r.on('data', c => d += c)
  r.on('end', () => {
    const j = JSON.parse(d)
    const f = j.fields
    for (const [k, v] of Object.entries(f)) {
      if (v && typeof v === 'object' && !Array.isArray(v) && 'displayName' in v) {
        console.log(`${k}: ${v.displayName}`)
      }
      if (Array.isArray(v) && v.length > 0 && v[0] && typeof v[0] === 'object' && 'displayName' in v[0]) {
        console.log(`${k}: [${v.map(u => u.displayName).join(', ')}]`)
      }
    }
  })
})
