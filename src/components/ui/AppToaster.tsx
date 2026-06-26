import { Toaster } from 'sonner'

/** Storefront + admin toast host with a high-contrast dismiss control. */
export function AppToaster() {
  return (
    <Toaster
      position="top-center"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast: 'astor-toast',
          closeButton: 'astor-toast-close',
        },
        closeButtonAriaLabel: 'Dismiss notification',
      }}
    />
  )
}
