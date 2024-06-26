# Reachinbox-assignment

## Overview

ReachInbox is a revolutionary AI-driven platform transforming cold outreach. This project automates the process of reading and categorizing unread emails from your Gmail account. It uses the Google Gmail API to read emails and classify them as "Interested", "Not Interested", or "More information" based on their content. Depending on the classification, an appropriate response is sent back to the sender.

## Getting Started

### Prerequisites

- Node.js installed on your machine
- Docker installed on your machine
- Google Cloud project with Gmail API enabled

### Installation

1. Clone the repository:
    ```sh
    git clone <repository-url>
    cd <repository-directory>
    ```

2. Install the dependencies:
    ```sh
    npm install
    ```

3. Create a `.env` file in the root directory and add your Google Client ID and Client Secret:
    ```env
    id=your-google-client-id
    secret=your-google-client-secret
    aisec=your-google-api-key
    ```

4. Start Redis using Docker:
    ```sh
    docker run -d -p 6379:6379 --name reachinbox-redis redis
    ```

### Running the Server

1. Start the server:
    ```sh
    npm run start
    ```

2. Open your browser and go to:
    ```
    http://localhost:3000/auth/google
    ```

3. Login with your Google account to grant access to your Gmail.

## Usage

After logging in with your Google account, the application will automatically check for unread emails, categorize them, and send appropriate responses based on the classification.

## Libraries Used

- **express**: A minimal and flexible Node.js web application framework that provides a robust set of features for web and mobile applications.
- **bullmq**: A powerful, modern library for creating background jobs and processing them with workers, backed by Redis.
- **googleapis**: Google's officially supported Node.js client library for using Google APIs.
- **express-session**: A session middleware for Express that allows you to manage user sessions.
- **dotenv**: A zero-dependency module that loads environment variables from a `.env` file into `process.env`.


