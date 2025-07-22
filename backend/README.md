# Fitochain Testnet Faucet - Backend

This directory contains the Node.js/Express backend server for the Fitochain Testnet Faucet. It handles API requests, rate limiting, and sending transactions on the Fitochain testnet.

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later recommended)
- [npm](https://www.npmjs.com/) (usually comes with Node.js)
- A Fitochain wallet address funded with testnet FITO to act as the faucet.

## Setup & Configuration

1.  **Install Dependencies**

    Navigate to this directory in your terminal and run:

    ```bash
    npm install
    ```

2.  **Create Environment File**

    Copy the example environment file to a new `.env` file. This file will hold your secret keys and is ignored by git.

    ```bash
    cp .env.example .env
    ```

3.  **Configure Environment Variables**

    Open the newly created `.env` file and fill in the required values:

    -   `FAUCET_PRIVATE_KEY`: **This is critical.** Enter the private key of the wallet you want to use for dispensing tokens. This wallet **must** be funded with testnet FITO for the faucet to work.
    -   `TESTNET_RPC_URL`: This is pre-filled with the Fitochain testnet RPC but can be changed if needed.

## Running the Server

1.  **Build the Code**

    First, you need to compile the TypeScript code into JavaScript.

    ```bash
    npm run build
    ```

2.  **Start the Server**

    Once the build is complete, you can start the server.

    ```bash
    npm start
    ```

    The server will start, and you should see a confirmation message in your console:
    `Faucet backend server running on port 8080`
    `Faucet wallet address: 0x...`

The backend is now running and ready to receive requests from the frontend application.
