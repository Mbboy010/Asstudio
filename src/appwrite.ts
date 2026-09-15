import { Client, Account, Databases, Storage, ID } from 'appwrite';

const client = new Client();

// Credentials extracted from your screenshots
const endpoint = 'https://nyc.cloud.appwrite.io/v1';
const projectId = '688cc8aa00395d9605a0';

client
    .setEndpoint(endpoint)
    .setProject(projectId);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

// Your Bucket ID (from the "As" bucket screenshot)
export const BUCKET_ID = '688cce34002223f15e42'; 

export { ID };
