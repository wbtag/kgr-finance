export default async function handleResponse(response) {
    if (response.ok) {
        if (![201,204].includes(response.status)) {
            return await response.json();
        } else {
            return true
        }
    } else {
        const errorResponse = await response.json();
        return {
            error: {
                status: response.status,
                message: errorResponse.message
            }
        }
    }
}