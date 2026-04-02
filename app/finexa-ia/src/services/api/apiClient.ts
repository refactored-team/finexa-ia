import axios from 'axios';

const apiClient = axios.create({
    baseURL: process.env.EXPO_PUBLIC_API_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

// 2. Request Interceptor (Ideal para inyectar JWT Tokens en el futuro)
apiClient.interceptors.request.use(
    async (config) => {
        // Aquí, más adelante, puedes leer el token de Zustand o AsyncStorage
        // const token = await getAuthToken();
        // if (token) {
        //   config.headers.Authorization = `Bearer ${token}`;
        // }
        // #region agent log H1-baseurl-request
        fetch('http://127.0.0.1:7309/ingest/7e367ce2-2186-4cbf-b33d-a0b2606f148c', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Debug-Session-Id': 'f9f192',
            },
            body: JSON.stringify({
                sessionId: 'f9f192',
                location: 'src/services/api/apiClient.ts:13',
                message: 'axios request config',
                data: {
                    method: config?.method,
                    baseURL: config?.baseURL,
                    url: config?.url,
                    timeout: config?.timeout,
                },
                timestamp: Date.now(),
                runId: 'initial',
                hypothesisId: 'H1',
            }),
        }).catch(() => {});
        // #endregion

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 3. Response Interceptor (Manejo global de errores)
apiClient.interceptors.response.use(
    (response) => {
        // Todo salió bien (Status 2xx)
        return response;
    },
    (error) => {
        // Centralizar el manejo de errores (ej. si da 401, desloguear al usuario automáticamente)
        if (error.response) {
            console.error(`[API Error] ${error.response.status}:`, error.response.data);
        } else if (error.request) {
            console.error('[API Error] El servidor no responde. Verifica tu conexión.');
        }
        // #region agent log H2-error-details
        fetch('http://127.0.0.1:7309/ingest/7e367ce2-2186-4cbf-b33d-a0b2606f148c', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Debug-Session-Id': 'f9f192',
            },
            body: JSON.stringify({
                sessionId: 'f9f192',
                location: 'src/services/api/apiClient.ts:38',
                message: 'axios response error',
                data: {
                    message: error?.message,
                    code: error?.code,
                    isAxiosError: Boolean(error?.isAxiosError),
                    status: error?.response?.status,
                    baseURL: error?.config?.baseURL,
                    url: error?.config?.url,
                },
                timestamp: Date.now(),
                runId: 'initial',
                hypothesisId: 'H1/H2',
            }),
        }).catch(() => {});
        // #endregion

        return Promise.reject(error);
    }
);

export default apiClient;