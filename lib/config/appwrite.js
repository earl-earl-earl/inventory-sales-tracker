import { Client, Account, Databases } from 'appwrite';

export const client = new Client();

client
    .setEndpoint('https://sgp.cloud.appwrite.io/v1') // Copied from your screenshot
    .setProject('693816dc0037d5affc90');             // Copied from your screenshot

export const account = new Account(client);
export const databases = new Databases(client);