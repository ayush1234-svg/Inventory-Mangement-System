FROM node:22-alpine

WORKDIR /app

# Copy server package definitions
COPY server/package*.json ./

# Install dependencies
RUN npm install

# Copy server code
COPY server/ ./

# Build TypeScript
RUN npm run build

# Expose default Hugging Face port 7860
ENV PORT=7860
EXPOSE 7860

CMD ["npm", "start"]
