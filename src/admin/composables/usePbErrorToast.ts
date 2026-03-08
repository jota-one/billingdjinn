import { useToast } from 'primevue/usetoast'

type PbErrorFieldDetail = {
  code?: string
  message?: string
  params?: Record<string, any>
}

/**
 * Formats and shows PocketBase-style errors using PrimeVue toast.
 */
export default function usePbErrorToast() {
  const toast = useToast()

  function showPbError(e: any) {
    try {
      if (!e) return

      if (typeof e === 'string') {
        toast.add({ severity: 'error', summary: 'Erreur', detail: e, life: 8000 })
        return
      }

      const errObject = e?.response ?? e ?? {}
      const fieldData = errObject?.data as Record<string, PbErrorFieldDetail> | undefined

      const topMessage =
        errObject?.message ||
        (typeof e?.message === 'string' ? e.message : undefined) ||
        'Erreur serveur'

      const msg: string[] = []
      if (fieldData) {
        Object.entries(fieldData).forEach(([field, errVal]) => {
          let detail = ''
          if (errVal.message) {
            detail = errVal.message
            if (errVal.params?.file) detail += ` (${errVal.params.file})`
            if (errVal.code) detail += ` [${errVal.code}]`
          } else {
            try {
              detail = JSON.stringify(errVal)
            } catch (e: unknown) {
              detail = String(errVal as string)
            }
          }
          msg.push(`${field}: ${detail}`)
        })
      }

      const detail = msg.length ? `${topMessage}\n${msg.join('\n')}` : topMessage

      toast.add({
        severity: 'error',
        summary: 'Erreur serveur',
        detail,
        life: 8000,
      })
    } catch (err) {
      toast.add({
        severity: 'error',
        summary: 'Erreur',
        detail: 'Une erreur est survenue',
        life: 6000,
      })
      console.error('Failed to show Pb error toast', err, e)
    }
  }

  return { showPbError }
}
