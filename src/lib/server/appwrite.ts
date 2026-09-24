import { Client, Account } from 'node-appwrite'

function getAppwriteConfig() {
    const endpoint = process.env.APPWRITE_ENDPOINT
    const projectId = process.env.APPWRITE_PROJECT_ID
    const apiKey = process.env.APPWRITE_API_KEY

    if (!endpoint || !projectId || !apiKey) {
        throw new Error('Missing Appwrite server environment variables')
    }

    return {
        endpoint,
        projectId,
        apiKey,
    }
}

export function createAppwriteAdminClient() {
    const config = getAppwriteConfig()

    const client = new Client()
        .setEndpoint(config.endpoint)
        .setProject(config.projectId)
        .setKey(config.apiKey)

    return {
        client,
        account: new Account(client),
    }
}

export function createAppwriteSessionClient(sessionSecret: string) {
    const config = getAppwriteConfig()

    const client = new Client()
        .setEndpoint(config.endpoint)
        .setProject(config.projectId)
        .setSession(sessionSecret)

    return {
        client,
        account: new Account(client),
    }
}