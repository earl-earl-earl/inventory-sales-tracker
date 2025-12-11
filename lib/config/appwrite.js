import { Client, Account, Databases } from 'appwrite';

export const client = new Client();

client
    .setEndpoint('https://sgp.cloud.appwrite.io/v1')
    .setProject('693816dc0037d5affc90');

export const account = new Account(client);
export const databases = new Databases(client);

// Database and Collection IDs
export const DATABASE_ID = "693818e8000bdb7d6add";
export const COLLECTIONS = {
  PRODUCTS: "products",
  SALES: "sales"
};