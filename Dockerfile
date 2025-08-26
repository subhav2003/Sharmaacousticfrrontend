FROM node:20

WORKDIR /app

# Copy only package files first (better layer caching)
COPY package*.json ./

RUN npm install

# Copy the rest of the app
COPY . .

# Build Nuxt for production
RUN npm run build

EXPOSE 3000

# Start Nuxt
CMD ["npm", "run", "start"]
