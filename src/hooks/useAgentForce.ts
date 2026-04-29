import { useCallback, useEffect, useRef, useState } from 'react'

// ============================================================
// AgentForce WebSocket — shared hook for simple text chat
// ============================================================

const WS_URL = 'wss://agentforce.item.pub/ws/open/chat'
const API_KEY = 'laf_8416833a931a7fc7a7078fad36aec10e'
const AGENT_ID = 'e4a00a96-b3e2-4b29-84b2-c62e5f9f4169'

const PING_INTERVAL_MS = 25_000
const RESPONSE_TIMEOUT_MS = 120_000

export interface UseAgentForceOptions {
  onMessage?: (content: string) => void
  onComplete?: (fullContent: string) => void
  onError?: (error: string) => void
}

export interface UseAgentForceReturn {
  sendMessage: (content: string) => void
  isConnected: boolean
  isLoading: boolean
  connect: () => void
  disconnect: () => void
}

export function useAgentForce(options: UseAgentForceOptions): UseAgentForceReturn {
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const wsRef = useRef<WebSocket | null>(null)
  const sessionIdRef = useRef<string | null>(null)
  const accumulatedContentRef = useRef('')
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingMessageRef = useRef<string | null>(null)

  // Keep callbacks in a ref so we don't re-create connect/disconnect on every render
  const optionsRef = useRef(options)
  optionsRef.current = options

  const clearPingInterval = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current)
      pingIntervalRef.current = null
    }
  }, [])

  const clearResponseTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  const disconnect = useCallback(() => {
    clearResponseTimeout()
    clearPingInterval()
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    setIsConnected(false)
    setIsLoading(false)
  }, [clearPingInterval, clearResponseTimeout])

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    const ws = new WebSocket(`${WS_URL}?api_key=${API_KEY}`)
    wsRef.current = ws

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          type: 'init',
          agent_id: AGENT_ID,
          session_id: sessionIdRef.current ?? undefined,
        }),
      )
    }

    ws.onmessage = (event: MessageEvent) => {
      let msg: Record<string, unknown>
      try {
        msg = JSON.parse(event.data as string)
      } catch {
        optionsRef.current.onError?.('Malformed response from AgentForce')
        return
      }

      switch (msg.type) {
        case 'connected':
          sessionIdRef.current = msg.session_id as string
          setIsConnected(true)
          // Start keepalive ping
          clearPingInterval()
          pingIntervalRef.current = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'ping' }))
            }
          }, PING_INTERVAL_MS)
          // Auto-send pending message if any
          if (pendingMessageRef.current) {
            const pending = pendingMessageRef.current
            pendingMessageRef.current = null
            accumulatedContentRef.current = ''
            setIsLoading(true)
            ws.send(JSON.stringify({ type: 'user_message', content: pending }))
            clearResponseTimeout()
            timeoutRef.current = setTimeout(() => {
              optionsRef.current.onError?.('AI response timeout, please retry')
              disconnect()
            }, RESPONSE_TIMEOUT_MS)
          }
          break

        case 'ping':
          ws.send(JSON.stringify({ type: 'pong' }))
          break

        case 'text':
          // Reset timeout on each chunk — response is actively streaming
          clearResponseTimeout()
          timeoutRef.current = setTimeout(() => {
            optionsRef.current.onError?.('AI response timeout, please retry')
            disconnect()
          }, RESPONSE_TIMEOUT_MS)
          accumulatedContentRef.current += msg.content as string
          optionsRef.current.onMessage?.(msg.content as string)
          break

        case 'done':
          clearResponseTimeout()
          setIsLoading(false)
          optionsRef.current.onComplete?.(accumulatedContentRef.current)
          accumulatedContentRef.current = ''
          break

        case 'error':
          clearResponseTimeout()
          setIsLoading(false)
          optionsRef.current.onError?.((msg.message as string) ?? 'Unknown error')
          accumulatedContentRef.current = ''
          break
      }
    }

    ws.onclose = () => {
      setIsConnected(false)
      clearPingInterval()
    }

    ws.onerror = () => {
      setIsConnected(false)
    }
  }, [clearPingInterval, clearResponseTimeout])

  const sendMessage = useCallback(
    (content: string) => {
      // If not connected, queue message and connect — it will auto-send on 'connected'
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        pendingMessageRef.current = content
        setIsLoading(true)
        connect()
        return
      }

      accumulatedContentRef.current = ''
      setIsLoading(true)

      wsRef.current.send(JSON.stringify({ type: 'user_message', content }))

      clearResponseTimeout()
      timeoutRef.current = setTimeout(() => {
        optionsRef.current.onError?.('AI response timeout, please retry')
        disconnect()
      }, RESPONSE_TIMEOUT_MS)
    },
    [clearResponseTimeout, disconnect, connect],
  )

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearResponseTimeout()
      clearPingInterval()
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [clearPingInterval, clearResponseTimeout])

  return { sendMessage, isConnected, isLoading, connect, disconnect }
}
