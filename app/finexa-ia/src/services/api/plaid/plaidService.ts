import apiClient from "../apiClient";

export const plaidService = {
    checkHealth: async () => {
        const response = await apiClient.get('/ms-plaid/health');
        return response.data;
    },

    // Paso 1 de Plaid: Pedir el Link Token
    createLinkToken: async (userId: string) => {
        const response = await apiClient.post(
            `/ms-plaid/v1/users/${userId}/plaid/link-token`,
        );
        return response.data;
    },

    // Paso 3: el backend intercambia public_token en Plaid y persiste access_token (POST /plaid-item sin access_token).
    exchangePublicToken: async (userId: string, publicToken: string) => {
        const response = await apiClient.post(
            `/ms-plaid/v1/users/${userId}/plaid-item`,
            { public_token: publicToken },
        );
        return response.data;
    },

    getPlaidLinkStatus: async (userId: string): Promise<{ linked: boolean }> => {
        const response = await apiClient.get<{
            ok: boolean;
            data: { linked: boolean };
        }>(`/ms-plaid/v1/users/${userId}/plaid-item/status`);
        return { linked: Boolean(response.data?.data?.linked) };
    },
};