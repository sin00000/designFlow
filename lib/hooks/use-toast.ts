import toast, { type ToastOptions } from 'react-hot-toast';

const defaultOptions: ToastOptions = {
  duration: 4000,
  style: {
    background: '#242424',
    color: '#ffffff',
    border: '1px solid #2a2a2a',
    borderRadius: '12px',
    fontSize: '14px',
    padding: '12px 16px',
  },
};

export function useToast() {
  const success = (message: string, options?: ToastOptions) => {
    return toast.success(message, {
      ...defaultOptions,
      ...options,
      iconTheme: {
        primary: '#22c55e',
        secondary: '#ffffff',
      },
    });
  };

  const error = (message: string, options?: ToastOptions) => {
    return toast.error(message, {
      ...defaultOptions,
      ...options,
      iconTheme: {
        primary: '#ef4444',
        secondary: '#ffffff',
      },
    });
  };

  const loading = (message: string, options?: ToastOptions) => {
    return toast.loading(message, {
      ...defaultOptions,
      ...options,
    });
  };

  const dismiss = (id?: string) => {
    if (id) {
      toast.dismiss(id);
    } else {
      toast.dismiss();
    }
  };

  const promise = <T>(
    promiseFn: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((err: any) => string);
    },
    options?: ToastOptions
  ) => {
    return toast.promise(promiseFn, messages, {
      ...defaultOptions,
      ...options,
    });
  };

  const info = (message: string, options?: ToastOptions) => {
    return toast(message, {
      ...defaultOptions,
      ...options,
      icon: 'ℹ️',
    });
  };

  return {
    success,
    error,
    loading,
    dismiss,
    promise,
    info,
    toast,
  };
}

export default useToast;
