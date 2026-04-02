import apiClient from "../apiClient";

export const plaidService = {
    checkHealth: async () => {
        const response = await apiClient.get('/health');
        return response.data;
    },

    // Paso 1 de Plaid: Pedir el Link Token
    createLinkToken: async (userId: string) => {
        const response = await apiClient.post(`/v1/users/${userId}/plaid/link-token`);
        return response.data;
    },

    // Paso 3 de Plaid: Guardar la conexión
    exchangePublicToken: async (userId: string, publicToken: string) => {
        const response = await apiClient.post(`/v1/users/${userId}/plaid-item`, {
            public_token: publicToken,
        });
        return response.data;
    }
};