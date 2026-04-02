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
        return Promise.reject(error);
    }
);

export default apiClient;