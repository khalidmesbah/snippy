import { toast } from "sonner";

export const showNotification = {
  success: (message: string, description?: string) => {
    toast.success(message, {
      description,
      duration: 4000,
    });
  },

  error: (message: string, description?: string) => {
    toast.error(message, {
      description,
      duration: 6000,
    });
  },

  info: (message: string, description?: string) => {
    toast.info(message, {
      description,
      duration: 4000,
    });
  },

  warning: (message: string, description?: string) => {
    toast.warning(message, {
      description,
      duration: 5000,
    });
  },

  loading: (message: string) => {
    return toast.loading(message);
  },

  dismiss: (toastId: string | number) => {
    toast.dismiss(toastId);
  },
};

export const handleApiResponse = async <T>(
  apiCall: () => Promise<T>,
  successMessage: string,
  errorMessage: string = "An error occurred",
): Promise<T> => {
  try {
    const result = await apiCall();
    showNotification.success(successMessage);
    return result;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : errorMessage;
    showNotification.error(errorMessage, errorMsg);
    throw error;
  }
};

export const handleApiError = (
  error: unknown,
  defaultMessage: string = "An error occurred",
) => {
  const errorMsg = error instanceof Error ? error.message : defaultMessage;
  showNotification.error(defaultMessage, errorMsg);
};
