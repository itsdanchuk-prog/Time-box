FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
# This line installs the standard dependencies + the missing web ones
RUN npm install && npm install react-dom@19.1.0 react-native-web@^0.21.0 @expo/metro-runtime
COPY . .
EXPOSE 8081
# We force it to start in web mode non-interactively
CMD ["npx", "expo", "start", "--web", "--non-interactive"]
