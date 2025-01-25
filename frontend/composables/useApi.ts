export const useApi = () => {
  const config = useRuntimeConfig()
  return {
    baseUrl: config.public.apiBaseUrl,
  }
}
