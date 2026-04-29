import { useMutation } from '@tanstack/react-query'
import { wecomClient } from '@/lib/wecomClient'
import { useToast } from '@/context/ToastContext'
import { useI18n } from '@/context/I18nContext'
import type { WecomMessage } from '@/types/wecom'

export function useWecomSend() {
  const { showToast } = useToast()
  const { t } = useI18n()

  return useMutation({
    mutationFn: (message: WecomMessage) => wecomClient.send(message),
    onSuccess: () => {
      showToast({
        type: 'success',
        title: t('toast.pushSuccess'),
        description: t('toast.pushSuccessDesc'),
      })
    },
    onError: (error: Error) => {
      showToast({
        type: 'error',
        title: t('toast.pushFail'),
        description: error.message || t('toast.pushFailDesc'),
      })
    },
  })
}
