# Stage 1: Build stage
FROM maven:3.8.4-openjdk-17-slim AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline

COPY src ./src
RUN mvn package -DskipTests

# Stage 2: Runtime stage
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

# Create upload directory
RUN mkdir -p uploads

EXPOSE 8080

ENTRYPOINT ["java", "-Xms256m", "-Xmx400m", "-Dspring.profiles.active=prod", "-jar", "app.jar"]
