import { useMutation } from '@tanstack/react-query'
import { wecomClient } from '@/lib/wecomClient'
import { useToast } from '@/context/ToastContext'
import type { WecomMessage } from '@/types/wecom'

export function useWecomSend() {
  const { showToast } = useToast()

  return useMutation({
    mutationFn: (message: WecomMessage) => wecomClient.send(message),
    onSuccess: () => {
      showToast({
        type: 'success',
        title: '✅ 推送成功',
        description: '消息已发送至企业微信群',
      })
    },
    onError: (error: Error) => {
      showToast({
        type: 'error',
        title: '❌ 推送失败',
        description: error.message || '请检查企业微信 Webhook 配置',
      })
    },
  })
}
