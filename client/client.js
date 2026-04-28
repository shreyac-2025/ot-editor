const COLORS = [
    { bg: '#3C3489', text: '#CECBF6' },
    { bg: '#085041', text: '#9FE1CB' },
    { bg: '#712B13', text: '#F5C4B3' },
    { bg: '#185FA5', text: '#B5D4F4' },
    { bg: '#854F0B', text: '#FAC775' },
  ]

  let socket = null
  let clientVersion = 0
  let lastValue = ''
  let myName = ''
  let myColor = null
  let totalOps = 0
  let totalTransforms = 0
  let clients = {}
  let typingTimer = null

  const editor = document.getElementById('editor')
  const overlay = document.getElementById('overlay')
  const spinner = document.getElementById('spinner')
  const overlayTitle = document.getElementById('overlay-title')
  const overlaySub = document.getElementById('overlay-sub')
  const nameWrap = document.getElementById('name-wrap')
  const nameInput = document.getElementById('name-input')
  const statusBadge = document.getElementById('status-badge')
  const feedEl = document.getElementById('feed')
  const typingStatus = document.getElementById('typing-status')

  function connect() {
    socket = new WebSocket('ws://localhost:3001')

    socket.onopen = () => {
      spinner.style.display = 'none'
      overlayTitle.textContent = 'Choose your name'
      overlaySub.textContent = 'to join the session'
      nameWrap.style.display = 'block'
      nameInput.focus()
    }

    socket.onclose = () => {
      statusBadge.textContent = 'disconnected'
      statusBadge.className = 'status-badge disconnected'
      overlay.style.display = 'flex'
      spinner.style.display = 'block'
      overlayTitle.textContent = 'Reconnecting...'
      overlaySub.textContent = 'ws://localhost:3001'
      nameWrap.style.display = 'none'
      setTimeout(connect, 2000)
    }

    socket.onerror = () => {
      overlayTitle.textContent = 'Cannot connect'
      overlaySub.textContent = 'Is server running on port 3001?'
      spinner.style.display = 'none'
    }

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data)

      if (data.type === 'init') {
        editor.value = data.doc
        lastValue = data.doc
        clientVersion = data.clientVersion
        updateStats()
        overlay.style.display = 'none'
        editor.focus()
      }

      if (data.type === 'op') {
        applyRemoteOp(data)
        clientVersion = data.clientVersion
        totalOps++
        if (data.transformed) totalTransforms++
        updateStats()
        addFeedItem(data)
        flashTyping(data.senderName || 'someone')
      }

      if (data.type === 'ack') {
        clientVersion = data.clientVersion
        totalOps++
        updateStats()
      }

      if (data.type === 'clients') {
        clients = data.clients || {}
        renderClients()
      }
    }
  }

  function joinSession() {
    myName = nameInput.value.trim() || 'anon'
    const idx = Math.floor(Math.random() * COLORS.length)
    myColor = COLORS[idx]
    socket.send(JSON.stringify({ type: 'join', name: myName, color: myColor }))
  }

  nameInput.addEventListener('keydown', e => { if (e.key === 'Enter') joinSession() })

  function applyRemoteOp(data) {
    const pos = data.pos
    if (data.actionType === 'insert') {
      editor.value = editor.value.slice(0, pos) + data.char + editor.value.slice(pos)
    } else if (data.actionType === 'delete') {
      editor.value = editor.value.slice(0, pos) + editor.value.slice(pos + 1)
    }
    lastValue = editor.value
    updateStats()
  }

  editor.addEventListener('input', () => {
    const newValue = editor.value
    for (let i = 0; i < Math.max(newValue.length, lastValue.length); i++) {
      if (newValue[i] !== lastValue[i]) {
        if (newValue.length > lastValue.length) {
          socket.send(JSON.stringify({
            type: 'op',
            actionType: 'insert',
            pos: i,
            char: newValue[i],
            clientVersion: clientVersion,
            senderName: myName
          }))
        } else {
          socket.send(JSON.stringify({
            type: 'op',
            actionType: 'delete',
            pos: i,
            clientVersion: clientVersion,
            senderName: myName
          }))
        }
        break
      }
    }
    lastValue = newValue
    updateStats()
  })

  function addFeedItem(data) {
    const isInsert = data.actionType === 'insert'
    const item = document.createElement('div')
    item.className = 'feed-item'

    const charDisplay = isInsert
      ? `<span class="feed-char">${escHtml(data.char)}</span>`
      : ''

    const who = data.senderName || 'remote'

    item.innerHTML = `
      <div class="feed-icon ${isInsert ? 'insert' : 'delete'}">${isInsert ? 'INS' : 'DEL'}</div>
      <div>
        <div class="feed-text">
          <strong style="color:var(--text)">${escHtml(who)}</strong>
          ${isInsert ? 'inserted ' + charDisplay : 'deleted'}
          at <span class="feed-pos">${data.pos}</span>
        </div>
        <span class="feed-time">${timeNow()}</span>
      </div>
    `
    feedEl.prepend(item)

    const items = feedEl.querySelectorAll('.feed-item')
    if (items.length > 30) items[items.length - 1].remove()
  }

  function flashTyping(name) {
    typingStatus.textContent = `${name} is editing...`
    clearTimeout(typingTimer)
    typingTimer = setTimeout(() => { typingStatus.textContent = '' }, 1500)
  }

  function renderClients() {
    const list = document.getElementById('clients-list')
    const avatarsEl = document.getElementById('avatars')
    list.innerHTML = ''
    avatarsEl.innerHTML = ''

    const entries = Object.entries(clients)
    document.getElementById('stat-users').textContent = entries.length

    entries.forEach(([id, c]) => {
      const initials = (c.name || '?').slice(0, 2).toUpperCase()
      const color = c.color || COLORS[0]

      const row = document.createElement('div')
      row.className = 'client-row'
      row.innerHTML = `
        <div class="avatar" style="background:${color.bg};color:${color.text}">${initials}</div>
        <span class="client-name">${escHtml(c.name || 'anon')}</span>
        <div class="client-dot"></div>
      `
      list.appendChild(row)

      const av = document.createElement('div')
      av.className = 'avatar'
      av.style.background = color.bg
      av.style.color = color.text
      av.title = c.name || 'anon'
      av.textContent = initials
      avatarsEl.appendChild(av)
    })
  }

  function updateStats() {
    document.getElementById('stat-ops').textContent = totalOps
    document.getElementById('stat-transforms').textContent = totalTransforms
    document.getElementById('stat-chars').textContent = editor.value.length
  }

  function timeNow() {
    const d = new Date()
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  function escHtml(str) {
    if (!str) return ''
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
  }

  connect()