import handleResponse from "./handleResponse";

export async function request(url, method, headers, body) {
    headers = headers || {};

    if (process.env['NEXT_PUBLIC_ENV_TYPE'] === 'PROD') {
        headers['x-functions-key'] = process.env['NEXT_PUBLIC_FUNCTIONS_KEY']
    };

    const response = await fetch(url, {
        method,
        body: !['GET', 'DELETE'].includes(method) ? JSON.stringify(body) : undefined,
        headers
    });
    return await handleResponse(response);
}