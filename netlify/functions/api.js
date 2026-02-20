export const handler = async (event, context) => {
    return {
        statusCode: 200,
        body: JSON.stringify({ message: "Task Platform API Active", timestamp: new Date() }),
    };
};
