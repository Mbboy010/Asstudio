import { Client, Account, Databases, Storage, ID } from 'appwrite';

const client = new Client();

// Credentials extracted from your screenshots
const endpoint = 'https://fra.cloud.appwrite.io/v1';
const projectId = '6973a085002ce317bd37';

client
    .setEndpoint(endpoint)
    .setProject(projectId);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

// Your Bucket ID (from the "As" bucket screenshot)
export const BUCKET_ID = '6973a0bc003473012a5f'; 

export { ID };
